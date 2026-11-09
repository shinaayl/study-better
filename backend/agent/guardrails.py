import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

from db.database import get_connection

COMMON_STOPWORDS = {
    "about", "above", "after", "again", "against", "all", "also", "among", "and", "another",
    "any", "are", "because", "been", "before", "being", "below", "between", "both", "but",
    "by", "can", "could", "did", "does", "doing", "down", "during", "each", "few", "for",
    "from", "further", "had", "has", "have", "having", "here", "how", "into", "its", "itself",
    "just", "more", "most", "must", "not", "off", "once", "only", "other", "our", "ours",
    "out", "over", "own", "same", "should", "some", "such", "than", "that", "the", "their",
    "theirs", "them", "then", "there", "these", "they", "this", "those", "through", "too",
    "under", "until", "very", "was", "were", "what", "when", "where", "which", "while",
    "who", "whom", "why", "will", "with", "would"
}

REFUSAL_INDICATORS = [
    "do not have verified",
    "course not found in knowledge base",
    "refuse to fabricate",
    "no verified past examination",
    "no direct departmental document",
    "absent from knowledge base",
    "please upload",
    "institutional repository notice",
    "academic repository notice",
    "materials do not specify the explicit marking rubric",
    "anti-hallucination policy",
    "do not have information about",
    "don't have information about",
    "dont have information about",
    "do not have information",
    "don't have information",
    "dont have information",
    "do not have the answer",
    "don't have the answer"
]

class QualityGuardrailEngine:
    """
    Automated Quality Control and Anti-Hallucination Guardrail Engine.
    Evaluates grounding, computes faithfulness scores against retrieved institutional chunks,
    classifies hallucination risk, enforces refusals, and records complete audit logs.
    """
    def __init__(self):
        pass

    def is_anti_hallucination_refusal(self, response_text: str) -> bool:
        """Determines whether the generated response is an anti-hallucination refusal or notice."""
        txt = response_text.lower()
        return any(indicator in txt for indicator in REFUSAL_INDICATORS)

    def extract_content_words(self, text: str) -> List[str]:
        """Extracts informative content words from text, stripping punctuation and stopwords."""
        # Clean markdown, latex and numbers
        cleaned = re.sub(r"\$+[^\$]+\$+", " ", text) # remove math
        cleaned = re.sub(r"```[\s\S]*?```", " ", cleaned) # remove code blocks
        words = re.findall(r"\b[A-Za-z0-9_\-]{3,}\b", cleaned.lower())
        scaffolding_terms = {
            "examiner", "requirements", "definition", "framework", "analysis", "marking", "rubric",
            "citations", "department", "curriculum", "official", "examination", "principles",
            "checklist", "mathematical", "rigor", "stating", "algorithms", "complexity",
            "always", "write", "latex", "sourced", "papers", "based", "archive", "schemes",
            "answer", "question", "core", "criteria", "expectations", "step", "steps", "sure",
            "clearly", "define", "terms", "show", "intermediate", "here", "following", "overview",
            "excerpts", "retrieved", "aligned", "grounded", "recent", "session"
        }
        return [w for w in words if w not in COMMON_STOPWORDS and w not in scaffolding_terms]

    def extract_key_phrases(self, text: str) -> List[str]:
        """Extracts technical bi-grams and key phrases from response."""
        content_words = self.extract_content_words(text)
        phrases = []
        for i in range(len(content_words) - 1):
            w1 = content_words[i]
            w2 = content_words[i + 1]
            if len(w1) > 2 and len(w2) > 2:
                phrases.append(f"{w1} {w2}")
        return phrases

    def compute_faithfulness_score(
        self,
        response_text: str,
        retrieved_chunks: List[Dict[str, Any]],
        is_refusal: bool = False
    ) -> float:
        """
        Computes a normalized faithfulness/grounding score (0.0 to 1.0)
        measuring how reliably the generated response is anchored in the retrieved context.
        """
        if is_refusal:
            # Safe refusal is completely faithful to anti-hallucination guardrails
            return 1.0

        if not retrieved_chunks:
            # If no context exists and it is not a refusal, hallucination probability is maximal
            return 0.15

        # Aggregate context corpus
        context_parts = []
        for c in retrieved_chunks:
            t = c.get("text", "") or ""
            context_parts.append(t.lower())
        corpus = " ".join(context_parts)
        corpus_words = set(re.findall(r"\b[A-Za-z0-9_\-]{3,}\b", corpus))

        # 1. Content words grounding (exact match or stem/subword overlap)
        resp_words = self.extract_content_words(response_text)
        if not resp_words:
            return 0.85

        grounded_words = sum(
            1 for w in resp_words 
            if w in corpus or any(w in cw or cw in w for cw in corpus_words)
        )
        word_grounding_ratio = grounded_words / max(1, len(resp_words))

        # 2. Key phrase grounding (collocations / domain terms)
        resp_phrases = self.extract_key_phrases(response_text)
        phrase_grounding_ratio = 1.0
        if resp_phrases:
            grounded_phrases = sum(1 for p in resp_phrases if p in corpus)
            phrase_grounding_ratio = grounded_phrases / max(1, len(resp_phrases))

        lexical_grounding = 0.60 * word_grounding_ratio + 0.40 * phrase_grounding_ratio

        # 3. Factor in retrieval similarity confidence
        max_sim = 0.0
        for c in retrieved_chunks:
            sim = float(c.get("similarity", 0.0) or 0.0)
            if sim > max_sim:
                max_sim = sim

        # Formula: weighted combination of lexical claim overlap and retrieval vector confidence
        raw_score = 0.35 * max_sim + 0.65 * lexical_grounding
        return round(float(max(0.0, min(1.0, raw_score))), 4)

    def classify_hallucination_risk(
        self,
        faithfulness_score: float,
        max_similarity: float,
        chunks_count: int,
        is_refusal: bool = False
    ) -> str:
        """
        Classifies risk into LOW_RISK, MODERATE_RISK, or HIGH_RISK.
        """
        if is_refusal:
            return "LOW_RISK"

        if chunks_count == 0:
            return "HIGH_RISK"

        # If faithfulness is genuinely low (< 0.35), high risk of hallucination
        if faithfulness_score < 0.35:
            return "HIGH_RISK"

        # If both faithfulness and similarity are strong
        if faithfulness_score >= 0.60 and (max_similarity >= 0.35 or chunks_count >= 2):
            return "LOW_RISK"

        # Moderate risk when faithfulness is established
        if faithfulness_score >= 0.38:
            return "LOW_RISK" if max_similarity >= 0.50 else "MODERATE_RISK"

        return "MODERATE_RISK"

    def determine_guardrail_action(
        self,
        hallucination_risk: str,
        is_refusal: bool = False,
        has_citations: bool = True
    ) -> str:
        """
        Determines the protective action taken by the guardrail.
        Actions: 'REFUSAL_ENFORCED', 'ALLOWED', 'CITATION_ATTACHED', 'FLAGGED'.
        """
        if is_refusal:
            return "REFUSAL_ENFORCED"

        if hallucination_risk == "HIGH_RISK":
            return "FLAGGED"

        if hallucination_risk == "LOW_RISK":
            return "CITATION_ATTACHED" if has_citations else "ALLOWED"

        return "CITATION_ATTACHED"

    def log_audit_record(
        self,
        query_text: str,
        course_code: Optional[str],
        chunks_count: int,
        max_similarity: float,
        faithfulness_score: float,
        hallucination_risk: str,
        guardrail_action: str
    ) -> str:
        """
        Persists an audit entry into the SQLite guardrail_logs table.
        """
        log_id = str(uuid.uuid4())
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO guardrail_logs (
                    log_id, query_text, course_code, retrieved_chunks_count,
                    max_similarity, faithfulness_score, hallucination_risk,
                    guardrail_action, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    log_id,
                    query_text[:500],
                    (course_code or "UNSPECIFIED").strip().upper(),
                    int(chunks_count),
                    float(max_similarity),
                    float(faithfulness_score),
                    hallucination_risk,
                    guardrail_action,
                    datetime.now(timezone.utc).isoformat()
                )
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[QualityGuardrailEngine] Logging error: {e}")
        return log_id

    def audit_query_and_response(
        self,
        query: str,
        course_code: Optional[str],
        retrieved_chunks: List[Dict[str, Any]],
        response_text: str
    ) -> Dict[str, Any]:
        """
        Performs end-to-end quality control and anti-hallucination verification,
        saving the audit trace to guardrail_logs and returning actionable metrics.
        """
        is_refusal = self.is_anti_hallucination_refusal(response_text)
        chunks_count = len(retrieved_chunks)

        max_sim = 0.0
        for c in retrieved_chunks:
            s = float(c.get("similarity", 0.0) or 0.0)
            if s > max_sim:
                max_sim = s

        faithfulness = self.compute_faithfulness_score(
            response_text=response_text,
            retrieved_chunks=retrieved_chunks,
            is_refusal=is_refusal
        )

        risk = self.classify_hallucination_risk(
            faithfulness_score=faithfulness,
            max_similarity=max_sim,
            chunks_count=chunks_count,
            is_refusal=is_refusal
        )

        has_citations = bool(retrieved_chunks and any(c.get("citation") for c in retrieved_chunks))
        action = self.determine_guardrail_action(
            hallucination_risk=risk,
            is_refusal=is_refusal,
            has_citations=has_citations
        )

        log_id = self.log_audit_record(
            query_text=query,
            course_code=course_code,
            chunks_count=chunks_count,
            max_similarity=max_sim,
            faithfulness_score=faithfulness,
            hallucination_risk=risk,
            guardrail_action=action
        )

        return {
            "log_id": log_id,
            "query": query,
            "course_code": course_code or "UNSPECIFIED",
            "retrieved_chunks_count": chunks_count,
            "max_similarity": round(max_sim, 4),
            "faithfulness_score": round(faithfulness, 4),
            "hallucination_risk": risk,
            "guardrail_action": action,
            "is_refusal": is_refusal,
            "passed": risk != "HIGH_RISK"
        }

    def verify_course_exists(self, course_code: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Verifies if a course exists in the institutional database."""
        if not course_code:
            return False, None
        code = course_code.strip().upper()
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT course_id, course_code, course_title, department, level FROM courses WHERE UPPER(course_code) = ? LIMIT 1;",
                (code,)
            )
            row = cursor.fetchone()
            conn.close()
            if row:
                return True, dict(row)
        except Exception as e:
            print(f"[QualityGuardrailEngine] Course verification error: {e}")
        return False, None
