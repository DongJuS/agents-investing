import types
import unittest

from src.llm.gemini_client import GeminiClient


class GeminiClientCircuitBreakerTest(unittest.IsolatedAsyncioTestCase):
    def _build_client(self, side_effect: Exception) -> GeminiClient:
        GeminiClient._global_quota_exhausted = False
        client = GeminiClient.__new__(GeminiClient)
        client.model = "gemini-1.5-pro"
        client.api_key = "dummy"
        client.cli_timeout_seconds = 10
        client._cli_command = []
        client._quota_exhausted = False
        client._model = types.SimpleNamespace(
            generate_content=lambda prompt: (_ for _ in ()).throw(side_effect),
        )
        return client

    async def test_quota_error_opens_circuit(self) -> None:
        client = self._build_client(RuntimeError("RESOURCE_EXHAUSTED: quota exceeded"))

        with self.assertRaises(RuntimeError):
            await client.ask("hello")
        self.assertFalse(client.is_configured)

        with self.assertRaises(RuntimeError):
            await client.ask("hello again")

    async def test_non_quota_error_keeps_client_available(self) -> None:
        client = self._build_client(RuntimeError("temporary backend error"))

        with self.assertRaises(RuntimeError):
            await client.ask("hello")
        self.assertTrue(client.is_configured)


if __name__ == "__main__":
    unittest.main()
