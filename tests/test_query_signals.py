import json
import tempfile
import unittest
from pathlib import Path


from scripts.query_signals import QueryError, query_signals


class QuerySignalsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.data_dir = Path(self.temp_dir.name)
        snapshot = {
            "snapshot_date": "2026-01-02",
            "signals": [
                {
                    "id": "signal-b",
                    "source": [{"published_at": "2026-01-01"}],
                    "action": [{"priority": "low"}],
                },
                {
                    "id": "signal-a",
                    "source": [{"published_at": "2026-01-02"}],
                    "action": [{"priority": "high"}],
                },
            ],
        }
        (self.data_dir / "2026-01-02.json").write_text(
            json.dumps(snapshot), encoding="utf-8"
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_selects_requested_date_count_and_order(self) -> None:
        result = query_signals(self.data_dir, "2026-01-02", 1, "priority")

        self.assertEqual(result["snapshot_date"], "2026-01-02")
        self.assertEqual(result["count"], 1)
        self.assertEqual(result["order"], "priority")
        self.assertEqual(result["signals"][0]["id"], "signal-a")

    def test_uses_newest_snapshot_when_date_is_omitted(self) -> None:
        later = {"snapshot_date": "2026-01-03", "signals": [{"id": "signal-c"}]}
        (self.data_dir / "2026-01-03.json").write_text(
            json.dumps(later), encoding="utf-8"
        )

        result = query_signals(self.data_dir, None, 1, "input")

        self.assertEqual(result["snapshot_date"], "2026-01-03")
        self.assertEqual(result["signals"][0]["id"], "signal-c")

    def test_rejects_a_count_larger_than_available_signals(self) -> None:
        with self.assertRaisesRegex(QueryError, "tiene 2"):
            query_signals(self.data_dir, "2026-01-02", 3, "input")


if __name__ == "__main__":
    unittest.main()
