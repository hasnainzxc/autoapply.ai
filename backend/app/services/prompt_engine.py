"""
Prompt Engine — Structured AI prompting system for resume tailoring.

Inspired by career-ops prompting patterns:
- Banned words list to eliminate AI-slop
- Bullet format: Action + System + Metric
- NEVER invent skills — only reword existing with JD vocabulary
- JSON schema mode for guaranteed valid outputs
- Retry loop with LLM feedback
"""

import json
import re
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple


# ───────────────────────────────────────────
# BANNED WORDS — AI-slop phrases to remove
# ───────────────────────────────────────────

BANNED_WORDS = [
    "spearheaded",
    "seasoned",
    "results-driven",
    "dynamic",
    "synergy",
    "leveraged",
    "optimized",
    "robust",
    "cutting-edge",
    "game-changer",
    "thought leader",
    "deep dive",
    "passionate about",
    "proven track record",
    "extensive experience",
    "innovative solutions",
    "disruptive",
    "best-in-class",
    "end-to-end",
    "actionable insights",
    "drove",
    "championed",
    "empowered",
    "facilitated",
]

# ───────────────────────────────────────────
# BULLET FORMAT RULES
# ───────────────────────────────────────────

BULLET_FORMAT_RULES = """
BULLET FORMAT — Action + System + Metric:
Every achievement bullet MUST follow: [Action verb] [system/technology/process] [resulting metric/outcome].

GOOD examples:
- "Built RAG pipeline with Pinecone and LangChain, reducing query latency from 8s to 1.2s"
- "Deployed AI inference API on AWS ECS with Docker, handling 10k+ requests/day at 99.9% uptime"
- "Designed multi-agent orchestration with LangGraph, achieving 85% autonomous task completion"

BAD examples (vague):
- "Worked on AI systems"
- "Implemented machine learning solutions"
- "Led development of key features"

BAD examples (banned words):
- "Spearheaded the development of..."
- "Leveraged cutting-edge technology to..."
- "Drove synergies across..."
"""

# ───────────────────────────────────────────
# SENIOR ENGINEER TONE GUIDELINES
# ───────────────────────────────────────────

TONE_GUIDELINES = """
WRITING STYLE — Senior Engineer Tone:
1. Write like a senior engineer writing their own CV — NOT an HR person, NOT a recruiter.
2. Be precise. Use actual technology names, not buzzwords.
3. Quantify everything possible. If no metric available, describe the scale or impact concretely.
4. If the candidate's original writing is already strong and concrete, keep it as-is. 
   Only improve what's vague.
5. No exclamation marks. No marketing language. No "AI-slop".
6. Use active voice with strong verbs: built, deployed, designed, implemented, engineered.
7. Avoid passive: "was responsible for", "helped with", "contributed to".
"""

# ───────────────────────────────────────────
# CRITICAL RULES
# ───────────────────────────────────────────

CONTENT_PRESERVATION_RULES = """
CRITICAL — Content Integrity:
1. NEVER invent skills, technologies, or experience the candidate does not have.
2. NEVER change company names, job titles, or dates.
3. NEVER add fake metrics or made-up numbers.
4. PRESERVE ALL original skills and technologies exactly as listed.
5. ENHANCE existing achievements by:
   - Adding quantification where the original implies scale
   - Using JD vocabulary to describe existing experience (NOT adding new experience)
   - Improving bullet structure to Action+System+Metric format
6. When in doubt, keep the original wording. Better authentic than fabricated.
"""

KEYWORD_INTEGRATION_RULES = """
KEYWORD INTEGRATION — Ethical & Truth-Based:
- JD says "RAG pipelines" and CV says "LLM workflows with retrieval" → rewrite as "RAG pipeline design and LLM orchestration workflows"
- JD says "MLOps" and CV says "observability, evals, error handling" → rewrite as "MLOps: observability, evals, error handling, cost monitoring"
- JD says "Kubernetes" but CV mentions "Docker" only → mention Docker prominently but do NOT add Kubernetes as a skill
- JD says "stakeholder management" and CV says "worked with team" → rewrite as "stakeholder management across engineering, operations, and business"

NEVER add skills the candidate does not have. Only reword real experience using exact JD vocabulary.
"""

# ───────────────────────────────────────────
# OPENROUTER JSON MODE HELPER
# ───────────────────────────────────────────

OPENROUTER_JSON_MODE = {
    "response_format": {"type": "json_object"},
    "stop": None,
}

# ───────────────────────────────────────────
# PROMPT FILE LOADER
# ───────────────────────────────────────────

PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_prompt(filename: str, **kwargs) -> str:
    """Load prompt from markdown file and format with kwargs."""
    prompt_path = PROMPTS_DIR / filename
    with open(prompt_path, "r", encoding="utf-8") as f:
        template = f.read()
    if kwargs:
        template = template.format(**kwargs)
    return template


# ───────────────────────────────────────────
# SYSTEM PROMPT BUILDERS
# ───────────────────────────────────────────

def build_system_prompt(
    role: str,
    task_specific_rules: str,
    include_tone: bool = True,
    include_bullet_rules: bool = True,
    include_content_rules: bool = True,
    include_keyword_rules: bool = False,
) -> str:
    """Build a structured system prompt combining reusable rule blocks."""

    parts = [f"You are an expert {role}."]

    if include_tone:
        parts.append(TONE_GUIDELINES)

    if include_bullet_rules:
        parts.append(BULLET_FORMAT_RULES)

    if include_content_rules:
        parts.append(CONTENT_PRESERVATION_RULES)

    if include_keyword_rules:
        parts.append(KEYWORD_INTEGRATION_RULES)

    parts.append("\n--- TASK-SPECIFIC INSTRUCTIONS ---")
    parts.append(task_specific_rules)

    parts.append("\n--- FORMAT ---")
    parts.append("Return ONLY valid JSON. No markdown code blocks, no explanations outside the JSON.")

    return "\n\n".join(parts)


# ───────────────────────────────────────────
# OUTPUT VALIDATOR
# ───────────────────────────────────────────

class OutputValidator:
    """Validates LLM output against expected schema and content rules."""

    @staticmethod
    def extract_json(raw_response: str) -> Optional[str]:
        """Extract JSON from LLM response, handling markdown and malformed output."""
        text = raw_response.strip()

        # Remove markdown code blocks
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        # Try direct parse first
        try:
            json.loads(text)
            return text
        except json.JSONDecodeError:
            pass

        # Try regex extraction
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                json.loads(match.group())
                return match.group()
            except json.JSONDecodeError:
                pass

        return None

    @staticmethod
    def validate_no_banned_words(text: str) -> List[str]:
        """Check for banned AI-slop words. Returns list of found banned words."""
        found = []
        text_lower = text.lower()
        for word in BANNED_WORDS:
            if word.lower() in text_lower:
                found.append(word)
        return found

    @staticmethod
    def validate_json_schema(
        data: Dict[str, Any], required_fields: List[str]
    ) -> List[str]:
        """Check JSON has required top-level fields. Returns missing fields."""
        return [f for f in required_fields if f not in data]

    @staticmethod
    def build_feedback(
        raw_response: str,
        parse_error: Optional[str] = None,
        banned_words: Optional[List[str]] = None,
        missing_fields: Optional[List[str]] = None,
    ) -> Optional[str]:
        """Build feedback message for LLM retry. Returns None if no issues."""
        issues = []

        if parse_error:
            issues.append(f"JSON PARSE ERROR: {parse_error}")

        if banned_words:
            issues.append(
                f"BANNED WORDS FOUND: {', '.join(banned_words)}. "
                "Replace with concrete, specific language."
            )

        if missing_fields:
            issues.append(
                f"MISSING REQUIRED FIELDS: {', '.join(missing_fields)}. "
                "Include all required JSON fields."
            )

        if not issues:
            return None

        feedback = "Your previous output had issues. Fix them:\n\n"
        feedback += "\n".join(f"  - {issue}" for issue in issues)
        feedback += "\n\nProvide ONLY valid JSON with all required fields. "
        feedback += "Use concrete, specific language — no buzzwords."
        return feedback


# ───────────────────────────────────────────
# STEP 1: STRUCTURE EXTRACTION PROMPT
# ───────────────────────────────────────────

STRUCTURE_EXTRACTION_PROMPT = _load_prompt("structure_extraction.md")

# ───────────────────────────────────────────
# STEP 2: JOB ANALYSIS PROMPT
# ───────────────────────────────────────────

JOB_ANALYSIS_PROMPT = _load_prompt("job_analysis.md")

# ───────────────────────────────────────────
# STEP 3: MATCH CALCULATION PROMPT
# ───────────────────────────────────────────

MATCH_CALCULATION_PROMPT = _load_prompt("match_calculation.md")

# ───────────────────────────────────────────
# STEP 4: RESUME TAILORING PROMPT (THE MONEY STEP)
# ───────────────────────────────────────────

TAILORING_SYSTEM_PROMPT = _load_prompt(
    "tailoring_system.md",
    TONE_GUIDELINES=TONE_GUIDELINES,
    BULLET_FORMAT_RULES=BULLET_FORMAT_RULES,
    CONTENT_PRESERVATION_RULES=CONTENT_PRESERVATION_RULES,
    KEYWORD_INTEGRATION_RULES=KEYWORD_INTEGRATION_RULES,
)

TAILORING_USER_MESSAGE = _load_prompt("tailoring_user.md")
