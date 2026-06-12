"""Router for system-wide AI metrics, diagnostics, and quota management."""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_active_user, get_db
from app.models.security_and_metrics import AIUsageLog, ModelUsageStat
from app.models.prompt import AIPrompt, PromptMetric
from app.models.user import User
from app.services.quota_manager import quota_manager
import uuid

router = APIRouter()


@router.get("/model-status")
async def get_model_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed real-time health, quota, and latency stats for all active AI models."""
    # Ensure quota manager is bootstrapped
    await quota_manager.ensure_bootstrapped(db)

    today = date.today()

    # 1. Fetch today's database stats for all models
    stmt = select(ModelUsageStat).where(ModelUsageStat.date == today)
    res = await db.execute(stmt)
    db_stats = {s.model_name: s for s in res.scalars().all()}

    models_status = {}
    total_tokens_today = 0

    for model_name, limits in quota_manager.LIMITS.items():
        qm_quota = quota_manager.get_remaining_quota(model_name)
        db_stat = db_stats.get(model_name)

        success_rate = 100.0
        avg_latency = 0.0

        if db_stat:
            total_reqs = db_stat.successful_requests + db_stat.failed_requests
            if total_reqs > 0:
                success_rate = round((db_stat.successful_requests / total_reqs) * 100.0, 1)
            avg_latency = float(db_stat.average_response_time_ms)
            total_tokens_today += db_stat.tokens_used

        models_status[model_name] = {
            "status": qm_quota["status"],
            "remaining_rpd": qm_quota["remaining_rpd"],
            "used_rpd": qm_quota["used_today"],
            "limit_rpd": qm_quota["limit_rpd"],
            "success_rate": success_rate,
            "avg_latency_ms": round(avg_latency, 1),
        }

    # 2. Query fallback counts (failed requests) from last 24h
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    fallback_stmt = select(func.count()).select_from(AIUsageLog).where(
        AIUsageLog.status == "failed",
        AIUsageLog.created_at >= twenty_four_hours_ago
    )
    fallback_res = await db.execute(fallback_stmt)
    active_fallbacks = fallback_res.scalar() or 0

    return {
        "models": models_status,
        "active_fallbacks_last_24h": active_fallbacks,
        "total_tokens_consumed_today": total_tokens_today,
    }


@router.post("/reset-quotas")
async def reset_quotas(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Resets all sliding windows, cool-downs, and deletes today's usage stat counters in the DB."""
    # Reset in-memory metrics
    quota_manager.reset_in_memory_quotas()

    # Clear today's database stats to allow fresh tests
    today = date.today()
    await db.execute(delete(ModelUsageStat).where(ModelUsageStat.date == today))
    await db.commit()

    return {"message": "In-memory quotas reset and today's usage logs cleared successfully."}

@router.get("/prompts")
async def get_prompts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all AI prompts."""
    stmt = select(AIPrompt).order_by(AIPrompt.name, AIPrompt.version.desc())
    res = await db.execute(stmt)
    prompts = res.scalars().all()
    
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "category": p.category,
            "target_model": p.target_model,
            "version": p.version,
            "variant": p.variant,
            "is_active": p.is_active,
            "description": p.description,
            "created_at": p.created_at,
        }
        for p in prompts
    ]

from pydantic import BaseModel
class PromptCreate(BaseModel):
    name: str
    category: str
    target_model: str | None = None
    version: int = 1
    variant: str = "control"
    template: str
    description: str | None = None

@router.post("/prompts")
async def create_prompt(
    data: PromptCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new AI prompt or version."""
    new_prompt = AIPrompt(
        name=data.name,
        category=data.category,
        target_model=data.target_model,
        version=data.version,
        variant=data.variant,
        template=data.template,
        description=data.description,
        is_active=False  # new prompts must be manually activated
    )
    db.add(new_prompt)
    await db.flush()
    
    # Initialize metrics for the new prompt
    metric = PromptMetric(prompt_id=new_prompt.id)
    db.add(metric)
    
    await db.commit()
    return {"message": "Prompt created successfully", "id": str(new_prompt.id)}

@router.put("/prompts/{prompt_id}/activate")
async def activate_prompt(
    prompt_id: uuid.UUID,
    is_active: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a prompt's active status."""
    stmt = select(AIPrompt).where(AIPrompt.id == prompt_id)
    res = await db.execute(stmt)
    prompt = res.scalar_one_or_none()
    
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    prompt.is_active = is_active
    await db.commit()
    return {"message": f"Prompt {prompt_id} active status set to {is_active}"}
