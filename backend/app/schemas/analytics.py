from typing import List

from pydantic import BaseModel


class TopicPerformance(BaseModel):
    topic: str
    total_attempts: int
    success_rate: float
    is_weakness: bool


class PerformanceReport(BaseModel):
    subject: str
    overall_score: float
    topics: List[TopicPerformance]
    weaknesses: List[str]
    strengths: List[str]


class PastQuestionIntelligence(BaseModel):
    subject: str
    frequently_repeated_topics: List[str]
    likely_exam_areas: List[str]
    revision_recommendations: List[str]
