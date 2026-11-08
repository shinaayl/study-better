import unittest
import os
import json
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.agent.rag_query_engine import RAGQueryEngine
from backend.pipeline.embeddings import compute_gemini_embeddings, EMBEDDING_DIM
from backend.pipeline.vector_store import VectorStoreManager

class TestStep3RAGQueryAndChat(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.rag_engine = RAGQueryEngine()

    def test_gemini_client_configuration_and_env(self):
        """Verify Gemini API client configuration, reading from environment without hardcoding."""
        self.assertIn("gemini", self.rag_engine.model_name)
        # Verify API key is read from environment / config
        expected_key = os.getenv("GEMINI_API_KEY", "")
        self.assertEqual(self.rag_engine.api_key, expected_key)

    def test_text_embedding_004_and_top5_retrieval(self):
        """Verify text-embedding-004 embedding and retrieval of top 5 chunks filtered by course_id."""
        query = "Explain fixed partitions and internal fragmentation in CSC 321"
        chunks = self.rag_engine.retrieve_top_chunks(query, course_id="CSC 321", top_k=5)

        self.assertLessEqual(len(chunks), 5)
        self.assertGreater(len(chunks), 0)

        # Inspect top chunk attributes
        top = chunks[0]
        self.assertIn("chunk_id", top)
        self.assertIn("document_title", top)
        self.assertIn("page_number", top)
        self.assertIn("doc_type", top)
        self.assertIn("course_code", top)
        self.assertIn("similarity", top)
        self.assertIn("citation", top)
        self.assertEqual(top["course_code"], "CSC 321")
        self.assertGreaterEqual(top["page_number"], 1)

    def test_chat_query_sse_streaming_endpoint(self):
        """Verify POST /api/chat/query returns SSE stream with sources and deltas."""
        payload = {
            "student_message": "What is Context Switching and why is it considered overhead?",
            "course_id": "CSC 321",
            "conversation_history": [
                {"role": "user", "content": "Hello Tutor"},
                {"role": "assistant", "content": "Welcome to CSC 321 study assistant."}
            ],
            "stream": True
        }

        response = self.client.post("/api/chat/query", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            response.headers.get("content-type", "").startswith("text/event-stream")
        )

        body_text = response.text
        self.assertIn("data: ", body_text)
        self.assertIn('"event": "sources"', body_text)
        self.assertIn('"event": "delta"', body_text)
        self.assertIn('"event": "done"', body_text)

        # Parse first line to verify sources payload
        lines = [line.strip() for line in body_text.split("\n") if line.strip().startswith("data: ")]
        self.assertGreater(len(lines), 2)
        first_event = json.loads(lines[0][6:])
        self.assertEqual(first_event["event"], "sources")
        self.assertIn("sources", first_event)
        self.assertGreater(len(first_event["sources"]), 0)
        
        # Verify source metadata
        first_source = first_event["sources"][0]
        self.assertIn("document_title", first_source)
        self.assertIn("page_number", first_source)
        self.assertIn("similarity", first_source)

    def test_chat_query_sync_non_streaming(self):
        """Verify non-streaming POST /api/chat/query returns complete JSON response."""
        payload = {
            "student_message": "Explain fixed partitions in CSC 321",
            "course_id": "CSC 321",
            "conversation_history": [],
            "stream": False
        }

        response = self.client.post("/api/chat/query", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("answer", data)
        self.assertIn("sources", data)
        self.assertGreater(len(data["sources"]), 0)
        self.assertTrue(len(data["answer"]) > 20)

    def test_chat_query_empty_message_validation(self):
        """Verify empty message validation."""
        response = self.client.post("/api/chat/query", json={"student_message": "   "})
        self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
