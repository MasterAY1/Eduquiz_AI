import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.quiz import QuizAttempt, Question, Quiz
from app.schemas.analytics import PerformanceReport, TopicPerformance, PastQuestionIntelligence
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AnalyticsService:

    async def get_performance_report(
        self, db: AsyncSession, user_id: uuid.UUID, subject: str
    ) -> PerformanceReport:
        # Fetch all quiz attempts for the user in the given subject
        result = await db.execute(
            select(QuizAttempt)
            .join(Quiz)
            .filter(QuizAttempt.user_id == user_id, Quiz.subject == subject)
            .options(selectinload(QuizAttempt.quiz).selectinload(Quiz.questions))
        )
        attempts = result.scalars().all()

        topic_stats = {}  # topic -> {"correct": int, "total": int}
        total_score = 0.0
        total_max_score = 0.0

        for attempt in attempts:
            if attempt.score is not None:
                total_score += float(attempt.score)
                total_max_score += float(attempt.max_score or 1.0)

            # Analyze per-question feedback
            feedback = attempt.ai_feedback or {}
            for q in attempt.quiz.questions:
                q_id_str = str(q.id)
                topic = q.topic_reference or "General"
                if topic not in topic_stats:
                    topic_stats[topic] = {"correct": 0, "total": 0}
                
                if q_id_str in feedback:
                    topic_stats[topic]["total"] += 1
                    if feedback[q_id_str].get("correct") is True:
                        topic_stats[topic]["correct"] += 1

        topics_performance = []
        weaknesses = []
        strengths = []

        for topic, stats in topic_stats.items():
            if stats["total"] == 0:
                continue
            
            success_rate = (stats["correct"] / stats["total"]) * 100
            is_weakness = success_rate < 50.0

            topics_performance.append(
                TopicPerformance(
                    topic=topic,
                    total_attempts=stats["total"],
                    success_rate=round(success_rate, 2),
                    is_weakness=is_weakness,
                )
            )

            if is_weakness:
                weaknesses.append(topic)
            elif success_rate >= 75.0:
                strengths.append(topic)

        overall_score = (total_score / total_max_score) * 100 if total_max_score > 0 else 0.0

        return PerformanceReport(
            subject=subject,
            overall_score=round(overall_score, 2),
            topics=sorted(topics_performance, key=lambda x: x.success_rate),
            weaknesses=weaknesses,
            strengths=strengths,
        )

    async def get_past_question_intelligence(
        self, db: AsyncSession, user_id: uuid.UUID, subject: str
    ) -> PastQuestionIntelligence:
        from app.models.document import Document
        from app.ai.router import ModelRouter

        # Fetch past questions for the user and subject
        result = await db.execute(
            select(Document).filter(
                Document.user_id == user_id,
                Document.subject == subject,
                Document.category == "past_question"
            )
        )
        documents = result.scalars().all()

        if not documents:
            return PastQuestionIntelligence(
                subject=subject,
                frequently_repeated_topics=[],
                likely_exam_areas=["Not enough data yet. Upload past questions."],
                revision_recommendations=[]
            )

        # Aggregate the subtopics from the parsed past questions
        all_topics = {}
        for doc in documents:
            if doc.topics:
                for t in doc.topics:
                    all_topics[t] = all_topics.get(t, 0) + 1

        if not all_topics:
            return PastQuestionIntelligence(
                subject=subject,
                frequently_repeated_topics=[],
                likely_exam_areas=[],
                revision_recommendations=[]
            )

        # Sort topics by frequency
        sorted_topics = sorted(all_topics.items(), key=lambda x: x[1], reverse=True)
        top_topics = [t[0] for t in sorted_topics[:10]]

        # Use AI Router to generate revision recommendations based on the top topics
        router = ModelRouter()
        messages = [{
            "role": "user", 
            "content": f"The most frequently repeated topics in {subject} past questions are: {', '.join(top_topics)}. "
                       "As an expert Nigerian teacher, list 3 likely exam areas and 3 revision recommendations for students based on this data. "
                       "Format as JSON with keys 'likely_exam_areas' (list of strings) and 'revision_recommendations' (list of strings)."
        }]
        ai_resp = await router.chat(messages=messages)
        
        # Parse JSON
        import json
        import re
        try:
            text = re.sub(r"```json\s*", "", ai_resp)
            text = re.sub(r"```\s*", "", text)
            parsed = json.loads(text.strip())
            likely_areas = parsed.get("likely_exam_areas", [])
            recommendations = parsed.get("revision_recommendations", [])
        except Exception:
            likely_areas = ["Unable to extract likely areas from AI response."]
            recommendations = ["Unable to extract recommendations from AI response."]

        return PastQuestionIntelligence(
            subject=subject,
            frequently_repeated_topics=top_topics,
            likely_exam_areas=likely_areas,
            revision_recommendations=recommendations
        )

analytics_service = AnalyticsService()
