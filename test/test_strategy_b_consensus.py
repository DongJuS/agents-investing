import types
import unittest

from src.agents.strategy_b_consensus import StrategyBConsensus


class StrategyBConsensusFallbackTest(unittest.IsolatedAsyncioTestCase):
    def _runner(self, threshold: float) -> StrategyBConsensus:
        runner = StrategyBConsensus.__new__(StrategyBConsensus)
        runner.consensus_threshold = threshold
        runner.claude = types.SimpleNamespace(is_configured=False)
        return runner

    async def test_synthesize_fallback_rejects_low_confidence(self) -> None:
        runner = self._runner(threshold=0.67)
        result = await runner._synthesize(
            ticker="005930",
            proposer={"signal": "BUY", "confidence": 0.61, "argument": "arg"},
            challenger1="c1",
            challenger2="c2",
            round_no=1,
        )
        self.assertEqual(result.signal, "HOLD")
        self.assertFalse(result.consensus_reached)
        self.assertEqual(result.no_consensus_reason, "confidence_below_threshold")

    async def test_synthesize_fallback_accepts_high_confidence(self) -> None:
        runner = self._runner(threshold=0.67)
        result = await runner._synthesize(
            ticker="005930",
            proposer={"signal": "SELL", "confidence": 0.81, "argument": "arg"},
            challenger1="c1",
            challenger2="c2",
            round_no=1,
        )
        self.assertEqual(result.signal, "SELL")
        self.assertTrue(result.consensus_reached)
        self.assertIsNone(result.no_consensus_reason)


if __name__ == "__main__":
    unittest.main()
