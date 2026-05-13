"""Summary persistence for Diplomacy AI agents — cross-turn memory."""
import json
from pathlib import Path
from typing import Optional


# Schema version — bump if format changes
SUMMARY_SCHEMA = "1.0"


class SummaryManager:
    """Manages per-country summary JSON files on disk.

    Each country gets one file: summaries/{country}.json
    Wiped at game start, updated after each turn's resolution.
    """

    DEFAULT_MAX_TURN_HISTORY = 4

    REQUIRED_FIELDS = {
        "country": str,
        "last_updated": str,
        "alliances": list,
        "deals": list,
        "betrayals": list,
        "long_term_plan": str,
        "turn_history": list,
    }

    def __init__(self, summaries_dir: str):
        self.dir = Path(summaries_dir)
        self.dir.mkdir(parents=True, exist_ok=True)

    def _path(self, country: str) -> Path:
        return self.dir / f"{country}.json"

    def load(self, country: str) -> Optional[dict]:
        """Load a country's summary. Returns None if no file exists."""
        path = self._path(country)
        if not path.exists():
            return None
        with open(path) as f:
            return json.load(f)

    def save(self, country: str, summary: dict):
        """Save a country's summary to disk. Caps turn_history and validates."""
        if not self.validate(summary):
            raise ValueError(f"Summary for {country} failed validation: {list(self.REQUIRED_FIELDS.keys())}")
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

    def validate(self, summary: dict) -> bool:
        """Check that a summary dict has all required fields with correct types."""
        if not isinstance(summary, dict):
            return False
        for field, expected_type in self.REQUIRED_FIELDS.items():
            if field not in summary:
                return False
            if not isinstance(summary[field], expected_type):
                return False
        return True

    def generate_summary(self, llm, model, country, country_name, persona,
                         system_prompt, turn_label, board_state,
                         resolution_text, chat_log, previous_summary=None,
                         fallback_model=None) -> Optional[dict]:
        """Generate an updated summary for one country via LLM."""
        previous_json = ""
        if previous_summary:
            previous_json = json.dumps(previous_summary, indent=2)

        prompt = f"""You are {country_name}. Update your strategic summary after this turn's resolution.

YOUR PERSONA:
{persona}

CURRENT BOARD STATE:
{board_state}

THIS TURN'S RESOLUTION (what actually happened):
{resolution_text}

THIS TURN'S NEGOTIATION CHAT LOG:
{chat_log if chat_log else "(no messages this turn)"}

PREVIOUS SUMMARY (from prior turns):
{previous_json if previous_json else "(this is the first turn — no prior summary)"}

---

Produce an UPDATED summary in this exact JSON format:

{{{{
  "country": "{country}",
  "last_updated": "{turn_label} (after resolution)",
  "alliances": [
    {{{{"country": "...", "status": "active|broken|tentative",
      "since_turn": "...", "notes": "..."}}}}
  ],
  "deals": [
    {{{{"country": "...", "deal": "...", "my_part": "...",
      "turn_made": "...", "status": "pending|fulfilled|betrayed"}}}}
  ],
  "betrayals": [
    {{{{"country": "...", "incident": "...", "turn": "..."}}}}
  ],
  "long_term_plan": "2-3 sentence strategic vision",
  "turn_history": [
    {{{{"turn": "...", "summary": "1-2 sentence summary of that turn's key events"}}}}
  ]
}}}}

RULES:
- ALLIANCES: Record every active pact, tentative understanding, or broken alliance.
- DEALS: Record specific agreements (e.g., support coordination). Mark fulfilled if the other party did their part, betrayed if they didn't, pending if outcome is unknown.
- BETRAYALS: Record when another power breaks a deal or attacks unexpectedly.
- LONG_TERM_PLAN: Your current strategic vision. Be honest — this is private memory only you see.
- TURN_HISTORY: Append one new entry for this turn. Keep only the last 4 entries from the previous summary — drop older history to stay within limits.

Respond with ONLY the JSON object — no markdown, no explanation."""

        response = llm.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            system=system_prompt,
            temperature=0.5,
            max_tokens=2000,
            fallback_model=fallback_model,
        )

        if not response:
            return None

        summary = self._parse_json_response(response)
        if summary:
            return self._cap_turn_history(summary)
        return None

    def _parse_json_response(self, text: str) -> Optional[dict]:
        """Extract a JSON object from LLM response text."""
        if not text:
            return None
        text = text.strip()
        # Strip markdown code fences
        for prefix in ["```json", "```"]:
            if text.startswith(prefix):
                text = text[len(prefix):]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                break
        # Find JSON object
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                parsed = json.loads(text[start:end+1])
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass
        return None

    def _cap_turn_history(self, summary: dict, max_turns: int = None) -> dict:
        """Truncate turn_history to at most max_turns, keeping most recent."""
        if max_turns is None:
            max_turns = self.DEFAULT_MAX_TURN_HISTORY
        history = summary.get("turn_history", [])
        if len(history) > max_turns:
            summary = dict(summary)
            summary["turn_history"] = history[-max_turns:]
        return summary