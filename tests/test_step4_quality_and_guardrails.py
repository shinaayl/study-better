import unittest
import json
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.agent.rag_query_engine import RAGQueryEngine
from backend.agent.guardrails import QualityGuardrailEngine
from backend.pipeline.vector_store import VectorStoreManager
from backend.db.database import get_connection

class TestStep4QualityControlAndGuardrails(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.rag_engine = RAGQueryEngine()
        self.guardrails = QualityGuardrailEngine()

    def test_conversational_greetings_do_not_trigger_document_retrieval(self):
        """
        Verify that greetings ('hi', 'hello', 'good morning', etc.)
        do NOT trigger vector retrieval and do NOT dump random course data.
        """
        greetings = ["hi", "hello", "good morning", "Hey tutor, how are you?"]

        for greeting in greetings:
            self.assertTrue(
                self.rag_engine.is_conversational_greeting_or_pleasantry(greeting),
                f"Failed to identify '{greeting}' as a conversational greeting."
            )

            # Test via POST /api/chat/query non-streaming
            res = self.client.post("/api/chat/query", json={
                "student_message": greeting,
                "course_id": "CSC 321",
                "stream": False
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "success")

            # CRITICAL: sources must be empty list (no random course chunks dumped)
            self.assertEqual(
                len(data["sources"]), 0,
                f"Expected 0 sources for greeting '{greeting}', but got {len(data['sources'])}"
            )

            # Answer must be a friendly greeting without technical dumps
            answer = data["answer"].lower()
            self.assertTrue(
                any(term in answer for term in ["hello", "morning", "welcome", "study", "assist", "good", "hey", "revision"]),
                f"Greeting answer was not conversational: {data['answer']}"
            )
            # Must not contain random syllabus chunk dumps
            self.assertNotIn("fixed partitions", answer)
            self.assertNotIn("internal fragmentation", answer)

    def test_streaming_greeting_sse_emits_empty_sources(self):
        """Verify SSE streaming for greetings emits empty sources array."""
        res = self.client.post("/api/chat/query", json={
            "student_message": "Good morning!",
            "course_id": "CSC 321",
            "stream": True
        })
        self.assertEqual(res.status_code, 200)
        lines = [l.strip() for l in res.text.split("\n") if l.strip().startswith("data: ")]
        
        # First event is sources
        first_event = json.loads(lines[0][6:])
        self.assertEqual(first_event["event"], "sources")
        self.assertEqual(len(first_event["sources"]), 0)

    def test_anti_hallucination_refusal_for_unindexed_course(self):
        """Verify system enforces anti-hallucination refusal when course is not in repository."""
        query = "Explain quantum cryptography algorithms in BIO 999"
        res = self.client.post("/api/chat/query", json={
            "student_message": query,
            "course_id": "BIO 999",
            "stream": False
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        # When unindexed course has 0 chunks, sources must be empty and refusal triggered
        self.assertEqual(len(data["sources"]), 0)
        self.assertTrue(
            "notice" in data["answer"].lower() or 
            "not found" in data["answer"].lower() or
            "integrity" in data["answer"].lower() or
            "anti-hallucination" in data["answer"].lower()
        )
        self.assertIn("guardrail", data)
        self.assertEqual(data["guardrail"]["guardrail_action"], "REFUSAL_ENFORCED")

    def test_grounding_and_faithfulness_scoring_on_academic_query(self):
        """Verify faithfulness scoring and low hallucination risk on grounded question."""
        query = "Explain fixed partitions and internal fragmentation in CSC 321"
        res = self.client.post("/api/chat/query", json={
            "student_message": query,
            "course_id": "CSC 321",
            "stream": False
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data["sources"]), 0)
        self.assertIn("guardrail", data)
        
        guardrail = data["guardrail"]
        self.assertIn("faithfulness_score", guardrail)
        self.assertGreaterEqual(guardrail["faithfulness_score"], 0.40)
        self.assertIn(guardrail["hallucination_risk"], ["LOW_RISK", "MODERATE_RISK"])
        self.assertIn("log_id", guardrail)

        # Verify entry exists in SQLite guardrail_logs
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardrail_logs WHERE log_id = ?;", (guardrail["log_id"],))
        log_row = cur.fetchone()
        conn.close()
        self.assertIsNotNone(log_row)

    def test_guardrail_logs_and_metrics_endpoints(self):
        """Verify GET /api/guardrails/logs and GET /api/guardrails/metrics."""
        # 1. Logs
        logs_res = self.client.get("/api/guardrails/logs?limit=5")
        self.assertEqual(logs_res.status_code, 200)
        logs_data = logs_res.json()
        self.assertIn("logs", logs_data)
        self.assertIn("total_count", logs_data)

        # 2. Metrics
        metrics_res = self.client.get("/api/guardrails/metrics")
        self.assertEqual(metrics_res.status_code, 200)
        metrics = metrics_res.json()
        self.assertEqual(metrics["status"], "healthy")
        self.assertIn("total_audits", metrics)
        self.assertIn("hallucination_prevention_rate", metrics)
        self.assertIn("risk_breakdown", metrics)
        self.assertIn("actions_breakdown", metrics)
        self.assertIn("feedback_summary", metrics)

    def test_lecturer_feedback_submission_and_listing(self):
        """Verify submitting positive feedback and reporting hallucination."""
        # Submit positive feedback
        res_pos = self.client.post("/api/feedback/submit", json={
            "lecturer_email": "prof.ade@ui.edu.ng",
            "lecturer_name": "Prof. Ade",
            "course_code": "CSC 321",
            "target_type": "qa_answer",
            "query_text": "What is paging?",
            "ai_response": "Paging is a memory management scheme...",
            "rating": 5,
            "faithfulness_score": 0.95,
            "is_hallucination": False,
            "feedback_notes": "Excellent alignment with past question marking guide."
        })
        self.assertEqual(res_pos.status_code, 200)
        self.assertEqual(res_pos.json()["status"], "success")

        # Submit flagged hallucination
        res_flag = self.client.post("/api/feedback/submit", json={
            "lecturer_email": "examiner@cs.ui.edu.ng",
            "lecturer_name": "Dr. Examiner",
            "course_code": "CSC 321",
            "target_type": "qa_answer",
            "query_text": "Calculate page table size",
            "ai_response": "The formula assumes 128KB offset...",
            "rating": 2,
            "faithfulness_score": 0.30,
            "is_hallucination": True,
            "feedback_notes": "Calculation omitted the 2-level page directory lookup required by UI marking scheme."
        })
        self.assertEqual(res_flag.status_code, 200)
        data_flag = res_flag.json()
        self.assertEqual(data_flag["record_status"], "flagged")

        # List feedback
        list_res = self.client.get("/api/feedback/list?status=flagged")
        self.assertEqual(list_res.status_code, 200)
        flagged_items = list_res.json()["feedback"]
        self.assertTrue(any(f["feedback_id"] == data_flag["feedback_id"] for f in flagged_items))

    def test_lecturer_calibration_loop_indexes_exemplar_in_knowledge_base(self):
        """
        Verify the complete Lecturer Calibration Loop:
        1. Submit initial review.
        2. Lecturer provides authoritative corrected model answer via /calibrate.
        3. Status becomes 'calibrated'.
        4. Exemplar is embedded and indexed in ChromaDB vector store.
        5. Future vector search retrieves the calibrated exemplar.
        """
        # Step 1: Submit feedback to calibrate
        submit_res = self.client.post("/api/feedback/submit", json={
            "lecturer_email": "dr.babatunde@cs.ui.edu.ng",
            "lecturer_name": "Dr. Babatunde",
            "course_code": "CSC 321",
            "target_type": "qa_answer",
            "query_text": "Explain why TLB miss penalty is significant in virtual memory",
            "ai_response": "TLB miss means looking up memory.",
            "rating": 2,
            "is_hallucination": True,
            "feedback_notes": "Needs exact CPU cycle penalty and multi-level page table walk details."
        })
        self.assertEqual(submit_res.status_code, 200)
        feedback_id = submit_res.json()["feedback_id"]

        # Step 2: Lecturer executes calibration with gold-standard solution
        gold_solution = (
            "Official UI Marking Criteria for TLB Miss Penalty (5 Marks):\n"
            "1. TLB hit provides 1-cycle retrieval of physical frame address.\n"
            "2. TLB miss incurs memory hierarchy overhead requiring a multi-level page table walk (2-4 memory accesses).\n"
            "3. Effective Access Time (EAT) formula: EAT = hit_ratio * (tlb_time + mem_time) + (1 - hit_ratio) * (tlb_time + 2 * mem_time).\n"
            "4. Penalty context: memory bus latency causes 50-200 CPU cycles of delay."
        )

        calib_res = self.client.post(f"/api/feedback/{feedback_id}/calibrate", json={
            "corrected_answer": gold_solution,
            "lecturer_name": "Dr. Babatunde",
            "lecturer_email": "dr.babatunde@cs.ui.edu.ng"
        })
        self.assertEqual(calib_res.status_code, 200)
        self.assertEqual(calib_res.json()["calibrated_status"], "calibrated")

        # Step 3: Verify the calibrated exemplar is searchable in VectorStore
        vm = VectorStoreManager()
        results = vm.search(
            query="Explain why TLB miss penalty is significant in virtual memory",
            course_code="CSC 321",
            top_k=3
        )
        self.assertTrue(len(results) > 0)
        
        # Verify calibrated content is retrieved
        calibrated_found = any(
            "TLB miss incurs memory hierarchy overhead" in r.get("text", "") or
            r.get("metadata", {}).get("doc_type") == "lecturer_calibrated_exemplar"
            for r in results
        )
        self.assertTrue(calibrated_found, "Calibrated lecturer exemplar was not retrieved from vector store.")

    def test_query_intent_and_meta_questions_guard(self):
        """
        Verify that greetings, introductions, and meta-questions ('how do you work', etc.)
        are classified as casual intent, skipping vector store retrieval and returning sources: [].
        Also verify that academic queries starting with greetings correctly query the vector store.
        """
        meta_queries = [
            "how do you work",
            "what can you do?",
            "who are you",
            "how does this work",
            "i am a 300 level student"
        ]
        for q in meta_queries:
            self.assertTrue(
                self.rag_engine.is_casual_or_greeting(q),
                f"Expected '{q}' to be classified as casual / meta-question."
            )
            # POST to chat endpoint: sources must be empty
            res = self.client.post("/api/chat/query", json={
                "student_message": q,
                "course_id": "CSC 321",
                "stream": False
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(len(data["sources"]), 0, f"Expected 0 sources for meta-query '{q}'")
            # Answer should introduce or explain agent role without dumping course documents
            self.assertNotIn("fixed partitions", data["answer"].lower())

        # Academic query with greeting starter must NOT be treated as purely casual
        academic_q = "Hello tutor, can you explain fixed partitions in CSC 321?"
        self.assertFalse(
            self.rag_engine.is_casual_or_greeting(academic_q),
            "Academic question with greeting must proceed to vector retrieval."
        )
        res_acad = self.client.post("/api/chat/query", json={
            "student_message": academic_q,
            "course_id": "CSC 321",
            "stream": False
        })
        self.assertEqual(res_acad.status_code, 200)
        self.assertGreater(len(res_acad.json()["sources"]), 0)

    def test_similarity_threshold_guard(self):
        """
        Verify that if top match does not meet the similarity threshold,
        NO context (empty chunks) is passed to the LLM.
        """
        # 1. When high threshold (e.g. 0.99) is enforced, no chunks are returned
        chunks_strict = self.rag_engine.retrieve_top_chunks(
            student_message="Explain fixed partitions in CSC 321",
            course_id="CSC 321",
            similarity_threshold=0.99
        )
        self.assertEqual(len(chunks_strict), 0, "Expected empty chunks when similarity < 0.99 threshold")

        # 2. When authentic query meets baseline threshold, chunks are returned
        chunks_normal = self.rag_engine.retrieve_top_chunks(
            student_message="Explain fixed partitions and internal fragmentation in CSC 321",
            course_id="CSC 321"
        )
        self.assertGreater(len(chunks_normal), 0, "Expected chunks for authentic academic query")

    def test_gemini_system_prompt_rules(self):
        """
        Verify that SYSTEM_RAG_INSTRUCTION contains the strict rule for greetings
        and requires referencing retrieved context only for actual academic questions.
        """
        from backend.agent.rag_query_engine import SYSTEM_RAG_INSTRUCTION
        from backend.agent.prompts import GROUNDED_QA_PROMPT

        # 1. Check greeting rule in SYSTEM_RAG_INSTRUCTION
        self.assertIn("respond warmly, politely, and briefly as an academic tutor", SYSTEM_RAG_INSTRUCTION)
        self.assertIn("without dumping course data unprompted", SYSTEM_RAG_INSTRUCTION)
        self.assertIn("ONLY reference retrieved context when addressing actual academic questions", SYSTEM_RAG_INSTRUCTION)

        # 2. Check GROUNDED_QA_PROMPT
        self.assertIn("respond warmly, politely, and briefly as an academic tutor", GROUNDED_QA_PROMPT)
        self.assertIn("without dumping course data unprompted", GROUNDED_QA_PROMPT)
        self.assertIn("ONLY reference retrieved context when addressing actual academic questions", GROUNDED_QA_PROMPT)

if __name__ == "__main__":
    unittest.main()

