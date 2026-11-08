import unittest
import os
import tempfile
from fastapi.testclient import TestClient
from backend.api.main import app
from backend.db.database import get_connection, init_db
from backend.pipeline.chunker import chunk_text_overlapping, extract_pages
from backend.pipeline.embeddings import compute_gemini_embeddings, EMBEDDING_DIM
from backend.pipeline.vector_store import VectorStoreManager

class TestStep2IngestionPipeline(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = TestClient(app)
        self.conn = get_connection()
        auth_res = self.client.post("/api/auth/complete-onboarding", json={
            "email": "dr.smith@maths.ui.edu.ng",
            "name": "Dr. Smith",
            "role": "lecturer",
            "department": "Mathematics",
            "institution": "University of Ibadan"
        })
        self.token = auth_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        self.conn.close()

    def test_course_creation_api(self):
        """Test lecturer course creation (e.g. MTH 201 - Linear Algebra)"""
        payload = {
            "course_code": "MTH 201",
            "course_title": "Linear Algebra and Matrices",
            "department": "Mathematics",
            "level": 200,
            "semester": "First Semester",
            "credit_units": 3
        }
        res = self.client.post("/api/courses/create", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["course_code"], "MTH 201")

        # Verify persisted in database
        cursor = self.conn.cursor()
        cursor.execute("SELECT course_title, department, level FROM courses WHERE course_code = 'MTH 201';")
        row = cursor.fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row["course_title"], "Linear Algebra and Matrices")
        self.assertEqual(row["department"], "Mathematics")
        self.assertEqual(row["level"], 200)

    def test_chunking_exact_800_overlap_150_parameters(self):
        """Verify overlapping chunking with exact 800 token size and 150 token overlap"""
        # Create 1200 words across 2 pages
        page1_words = ["vector"] * 700
        page2_words = ["matrix"] * 500
        pages = [
            {"page_number": 1, "text": " ".join(page1_words)},
            {"page_number": 2, "text": " ".join(page2_words)}
        ]

        chunks = chunk_text_overlapping(
            pages,
            chunk_size=800,
            overlap=150,
            metadata_base={
                "course_id": "MTH 201",
                "document_title": "Linear_Algebra_Notes.txt",
                "doc_type": "lecture_note",
                "year": "2023"
            }
        )

        self.assertGreaterEqual(len(chunks), 2)
        for c in chunks:
            self.assertIn("course_id", c)
            self.assertIn("document_title", c)
            self.assertIn("doc_type", c)
            self.assertIn("page_number", c)
            self.assertIn("token_count", c)
            self.assertLessEqual(c["token_count"], 800)
            self.assertEqual(c["course_id"], "MTH 201")
            self.assertEqual(c["doc_type"], "lecture_note")

    def test_gemini_768_dim_embeddings(self):
        """Verify dense vector computation produces 768-dimensional normalized vectors"""
        texts = [
            "Orthogonal diagonalization and eigenvalues of symmetric matrices.",
            "Markov chains and steady-state vector probability distributions."
        ]
        vectors = compute_gemini_embeddings(texts)
        self.assertEqual(len(vectors), 2)
        self.assertEqual(len(vectors[0]), 768)
        self.assertEqual(len(vectors[1]), 768)

        # Check normalization (norm ~ 1.0)
        norm = sum(x * x for x in vectors[0]) ** 0.5
        self.assertAlmostEqual(norm, 1.0, places=3)

    def test_document_upload_and_chunk_inspection(self):
        """Test document upload with metadata tags (doc_type: marking_scheme, year: 2023)"""
        # Create sample TXT course material
        sample_text = (
            "MTH 201 LINEAR ALGEBRA 2023/2024 SESSION\n"
            "QUESTION 1 (10 marks)\n"
            "Define the null space and range of a linear transformation T: V -> W.\n"
            "Marking Criteria:\n"
            "Definition of null space kernel with vector elements (5 marks)\n"
            "Definition of range image subspace (5 marks)\n\n"
            "--- Page 2 ---\n"
            "QUESTION 2 (10 marks)\n"
            "State the Rank-Nullity Theorem and calculate dimension.\n"
        )
        
        with tempfile.NamedTemporaryFile("w+", suffix="_MTH201_Exam.txt", delete=False) as f:
            f.write(sample_text)
            temp_path = f.name

        try:
            with open(temp_path, "rb") as upload_file:
                res = self.client.post(
                    "/api/courses/upload",
                    headers=self.headers,
                    data={
                        "course_code": "MTH 201",
                        "course_title": "Linear Algebra",
                        "department": "Mathematics",
                        "level": 200,
                        "semester": "First Semester",
                        "year": "2023",
                        "doc_type": "marking_scheme"
                    },
                    files={"file": (os.path.basename(temp_path), upload_file, "text/plain")}
                )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "success")
            doc_id = data["document"]["id"]
            ingest_doc_id = data["ingestion_stats"]["document_id"]

            # Verify chunks endpoint returns page_number and tokens
            chunks_res = self.client.get(f"/api/courses/documents/{ingest_doc_id}/chunks")
            self.assertEqual(chunks_res.status_code, 200)
            cdata = chunks_res.json()
            self.assertGreater(cdata["total_chunks"], 0)
            first_chunk = cdata["chunks"][0]
            self.assertIn("page_number", first_chunk)
            self.assertIn("token_count", first_chunk)
            self.assertIn("chunk_text", first_chunk)

            # Clean up document
            del_res = self.client.delete(f"/api/courses/documents/{ingest_doc_id}")
            self.assertEqual(del_res.status_code, 200)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

if __name__ == "__main__":
    unittest.main()
