import uuid
from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import asyncio

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
import jinja2

from app.models.prompt import AIPrompt
from app.utils.logger import get_logger

logger = get_logger(__name__)

DEFAULT_SYSTEM_PERSONA = """You are an experienced teacher and lecturer with strong subject expertise.
Your communication style must be professional, clear, educational, confident, structured, respectful, and encouraging.
Prioritize accuracy, clarity, and learning."""

DEFAULT_PROMPTS = {
    "system_persona": DEFAULT_SYSTEM_PERSONA,
    "document_analysis": """You are an expert educational curriculum analyser.
{% if language == 'en' %}
Analyze the following document text and extract metadata in English.
{% else %}
Analyze the following document text and extract metadata in {{ language }}.
{% endif %}

{{ system_persona }}

Extract the following details from the text:
1. "subject": The main academic subject (e.g., Mathematics, Biology, History, Zoology).
2. "detected_level": The target educational level (e.g., Primary, JSS, SSS, Polytechnic, University).
3. "topics": A list of main topics covered in the text.
4. "subtopics": A dictionary mapping each main topic to a list of subtopics.
5. "summary": A concise educational summary of the content (3-5 sentences).

Document Text:
{{ text }}

Return ONLY a raw JSON object with the exact keys: 'subject', 'detected_level', 'topics', 'subtopics', 'summary'.
Do not include any markdown formatting (like ```json), no explanations, just the JSON string.""",
    "quiz_generation": """You are an expert educational quiz generator.
{% if language == 'en' %}
Write all questions and answers in English.
{% else %}
Write all questions and answers in {{ language }}.
{% endif %}

{{ system_persona }}

Generate questions based on the educational content provided below.

Subject: {{ subject }}
Educational Level: {{ level }}
Difficulty: {{ difficulty }}

Educational Content:
{{ context }}

Return ONLY a valid JSON array of question objects.""",
    "tutor_chat": """{{ system_persona }}

{% if language != 'en' %}
Please communicate primarily in {{ language }}.
{% endif %}

CRITICAL INSTRUCTION: You MUST explain concepts in a natural, human, and highly understanding manner. 
Use layman's terms, avoid big grammar or overly complex academic jargon unless specifically asked. 
Be an empathetic, explanatory, and understanding tutor. Keep your explanations simple and relatable.

You are tutoring a student based on their uploaded study materials.
Use the following extracted context from their document to answer their question:

Document Context:
{{ context }}""",
}


_PROMPT_CACHE: Dict[Tuple[str, Optional[str]], Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 300


class PromptService:
    def __init__(self):
        # Initialize Jinja2 environment
        # We use strict_undefined to catch missing variables early
        self.jinja_env = jinja2.Environment(
            loader=jinja2.BaseLoader(),
            undefined=jinja2.StrictUndefined,
            trim_blocks=True,
            lstrip_blocks=True
        )

    async def get_active_prompt(
        self, db: AsyncSession, category: str, target_model: Optional[str] = None
    ) -> AIPrompt:
        """Fetch the active prompt for a category and model, with fallback to generic model."""
        cache_key = (category, target_model)
        now = datetime.now()

        # Check cache
        if cache_key in _PROMPT_CACHE:
            entry = _PROMPT_CACHE[cache_key]
            if entry["expires"] > now:
                return entry["prompt"]

        # If not in cache, fetch from DB
        # Try to find a model-specific active prompt first
        query = select(AIPrompt).filter(
            AIPrompt.category == category,
            AIPrompt.is_active == True
        )
        
        result = await db.execute(query)
        active_prompts = result.scalars().all()

        if not active_prompts:
            if category in DEFAULT_PROMPTS:
                logger.warning(f"No active prompt in DB for category '{category}'. Using built-in default.")
                fallback = AIPrompt(
                    id=uuid.uuid4(),
                    name=f"default_{category}",
                    category=category,
                    template=DEFAULT_PROMPTS[category],
                    description="Built-in fallback prompt",
                    is_active=True,
                    version=1,
                    variant="default",
                )
                return fallback
            raise ValueError(f"No active prompt found for category '{category}'")

        # Select the best prompt: Model specific > Generic (target_model IS NULL)
        selected_prompt = None
        for p in active_prompts:
            if target_model and p.target_model == target_model:
                selected_prompt = p
                break
            if p.target_model is None:
                selected_prompt = p

        if not selected_prompt:
            # Fallback to the first one available
            selected_prompt = active_prompts[0]

        # Update cache
        _PROMPT_CACHE[cache_key] = {
            "prompt": selected_prompt,
            "expires": now + timedelta(seconds=CACHE_TTL_SECONDS)
        }

        return selected_prompt

    async def get_formatted_prompt(
        self, db: AsyncSession, category: str, target_model: Optional[str] = None, **kwargs
    ) -> Tuple[str, uuid.UUID, int, str]:
        """
        Retrieves the active prompt, renders it with Jinja2, and returns:
        (rendered_text, prompt_id, prompt_version, prompt_variant)
        """
        # Fetch the system persona to inject into every prompt
        try:
            persona_prompt = await self.get_active_prompt(db, category="system_persona")
            persona_text = persona_prompt.template
        except ValueError:
            logger.warning("System persona prompt not found. Proceeding without global persona.")
            persona_text = ""

        # Fetch the target prompt
        prompt = await self.get_active_prompt(db, category, target_model)

        # Merge persona into kwargs
        kwargs["system_persona"] = persona_text

        # Render template
        try:
            template = self.jinja_env.from_string(prompt.template)
            rendered = template.render(**kwargs)
        except jinja2.TemplateError as e:
            logger.error(f"Jinja2 rendering error for prompt '{category}': {str(e)}")
            raise ValueError(f"Failed to render prompt '{category}': {str(e)}")

        return rendered, prompt.id, prompt.version, prompt.variant

    async def invalidate_cache(self, category: str, target_model: Optional[str] = None):
        """Invalidates the cache for a specific prompt or all prompts if arguments are omitted."""
        if category and target_model:
            _PROMPT_CACHE.pop((category, target_model), None)
            _PROMPT_CACHE.pop((category, None), None) # Invalidate generic fallback too
        elif category:
            keys_to_delete = [k for k in _PROMPT_CACHE.keys() if k[0] == category]
            for k in keys_to_delete:
                del _PROMPT_CACHE[k]
        else:
            _PROMPT_CACHE.clear()

    async def rollback_prompt(self, db: AsyncSession, prompt_id: uuid.UUID) -> AIPrompt:
        """Rolls back an active prompt by deactivating all in its category/model and activating the target."""
        # 1. Fetch the target prompt
        target = await db.get(AIPrompt, prompt_id)
        if not target:
            raise ValueError("Prompt ID not found for rollback.")

        # 2. Deactivate all others in the same category and target_model
        await db.execute(
            update(AIPrompt)
            .where(
                AIPrompt.category == target.category,
                AIPrompt.target_model == target.target_model,
                AIPrompt.id != target.id
            )
            .values(is_active=False)
        )

        # 3. Activate the target
        target.is_active = True
        await db.commit()
        await db.refresh(target)

        # 4. Invalidate cache
        await self.invalidate_cache(target.category, target.target_model)

        return target


prompt_service = PromptService()
