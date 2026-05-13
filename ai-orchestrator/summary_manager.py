"""Summary persistence for Diplomacy AI agents — cross-turn memory."""
import json
from pathlib import Path


# Schema version — bump if format changes
SUMMARY_SCHEMA = "1.0"


class SummaryManager:
    """Manages per-country summary JSON files on disk.

    Each country gets one file: summaries/{country}.json
    Wiped at game start, updated after each turn's resolution.
    """

    DEFAULT_MAX_TURN_HISTORY = 8

    def __init__(self, summaries_dir: str):
        self.dir = Path(summaries_dir)
        self.dir.mkdir(parents=True, exist_ok=True)

    def _path(self, country: str) -> Path:
        return self.dir / f"{country}.json"

    def load(self, country: str):
        """Load a country's summary. Returns None if no file exists."""
        path = self._path(country)
        if not path.exists():
            return None
        with open(path) as f:
            return json.load(f)

    def save(self, country: str, summary: dict):
        """Save a country's summary to disk. Caps turn_history."""
        summary = self._cap_turn_history(summary)
        with open(self._path(country), "w") as f:
            json.dump(summary, f, indent=2)

    def delete(self, country: str):
        """Remove one country's summary file."""
        path = self._path(country)
        if path.exists():
            path.unlink()

    def wipe_all(self):
        """Remove ALL summary files (called at game start)."""
        for path in self.dir.glob("*.json"):
            path.unlink()

    def _cap_turn_history(self, summary: dict, max_turns: int = None) -> dict:
        """Truncate turn_history to at most max_turns, keeping most recent."""
        if max_turns is None:
            max_turns = self.DEFAULT_MAX_TURN_HISTORY
        history = summary.get("turn_history", [])
        if len(history) > max_turns:
            summary = dict(summary)
            summary["turn_history"] = history[-max_turns:]
        return summary