import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.base import DocumentAnalysis, EvaluationResult, QuizQuestion
from app.ai.router import ModelRouter
from app.services.quota_manager import quota_manager


class TestModelRouter(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        # Reset QuotaManager state before each test
        quota_manager.reset_in_memory_quotas()
        quota_manager._bootstrapped = True  # Avoid DB bootstrap in tests

    def tearDown(self):
        quota_manager.reset_in_memory_quotas()

    @patch("app.ai.router.AsyncSessionLocal")
    @patch("app.ai.router.get_provider_for_model")
    async def test_router_selects_tier_1_model(self, mock_get_provider, mock_session_local):
        # Setup mock session
        mock_db = AsyncMock()
        mock_session_local.return_value.__aenter__.return_value = mock_db

        # Setup mock provider for gemini-3.1-flash-lite
        mock_provider = MagicMock()
        mock_provider.analyze_document = AsyncMock(
            return_value=DocumentAnalysis(
                subject="Maths",
                detected_level="jss",
                topics=["Algebra"],
                subtopics={},
                summary="Algebra notes.",
            )
        )
        mock_get_provider.return_value = mock_provider

        router = ModelRouter()
        
        # Act
        result = await router.analyze_document(text="Solve for x.")

        # Assert
        self.assertEqual(result.subject, "Maths")
        mock_get_provider.assert_called_with("gemini-3.1-flash-lite")
        mock_provider.analyze_document.assert_called_once_with("Solve for x.", "sss", "en")

    @patch("app.ai.router.AsyncSessionLocal")
    @patch("app.ai.router.get_provider_for_model")
    async def test_router_failover_gemini_to_deepseek(self, mock_get_provider, mock_session_local):
        # Setup mock session
        mock_db = AsyncMock()
        mock_session_local.return_value.__aenter__.return_value = mock_db

        # Setup providers
        # First candidate: gemini-3.1-flash-lite -> fails
        # Second candidate: deepseek-v4 -> succeeds
        mock_gemini = MagicMock()
        mock_gemini.analyze_document = AsyncMock(side_effect=Exception("Rate limit exceeded"))
        
        mock_deepseek = MagicMock()
        mock_deepseek.analyze_document = AsyncMock(
            return_value=DocumentAnalysis(
                subject="History",
                detected_level="sss",
                topics=["Nigeria"],
                subtopics={},
                summary="History notes.",
            )
        )

        def side_effect(model_name):
            if model_name == "gemini-3.1-flash-lite":
                return mock_gemini
            elif model_name == "deepseek-v4":
                return mock_deepseek
            raise ValueError(f"Unexpected model: {model_name}")

        mock_get_provider.side_effect = side_effect

        router = ModelRouter()

        # Act
        result = await router.analyze_document(text="History of Nigeria.")

        # Assert
        self.assertEqual(result.subject, "History")
        # Assert that both models were requested
        mock_get_provider.assert_any_call("gemini-3.1-flash-lite")
        mock_get_provider.assert_any_call("deepseek-v4")
        
        # Verify cool-down was applied to gemini-3.1-flash-lite
        self.assertIn("gemini-3.1-flash-lite", quota_manager.cool_downs)
        self.assertNotIn("deepseek-v4", quota_manager.cool_downs)

    def test_quota_manager_rpm_exhaustion(self):
        model = "gemini-2.5-flash"
        
        # RPM limit for gemini-2.5-flash is 5
        # Let's verify we can use it 5 times
        for _ in range(5):
            self.assertTrue(quota_manager.can_use_model(model, 1000))
            quota_manager.reserve_quota(model, 1000)
            
        # The 6th check should fail (since 5 active requests are running/reserved)
        self.assertFalse(quota_manager.can_use_model(model, 1000))

    def test_quota_manager_cool_down(self):
        model = "gemini-3.5-flash"
        self.assertTrue(quota_manager.can_use_model(model, 1000))
        
        # Put on cool-down
        quota_manager.set_cool_down(model, 10)
        
        # Check should fail now
        self.assertFalse(quota_manager.can_use_model(model, 1000))


if __name__ == "__main__":
    unittest.main()
