import unittest
from backend.db.database import get_connection

class TestDatabaseIngestion(unittest.TestCase):
    def setUp(self):
        self.conn = get_connection()
        self.cursor = self.conn.cursor()

    def tearDown(self):
        self.conn.close()

    def test_courses_populated(self):
        self.cursor.execute("SELECT COUNT(*) FROM courses;")
        count = self.cursor.fetchone()[0]
        self.assertGreaterEqual(count, 10, "Should have at least 10 courses ingested")

    def test_past_questions_extracted(self):
        self.cursor.execute("SELECT COUNT(*) FROM past_questions;")
        count = self.cursor.fetchone()[0]
        self.assertGreaterEqual(count, 100, "Should have over 100 granular past questions parsed")

    def test_marking_criteria_extracted(self):
        self.cursor.execute("SELECT COUNT(*) FROM marking_scheme_criteria;")
        count = self.cursor.fetchone()[0]
        self.assertGreaterEqual(count, 300, "Should have granular point-by-point marking criteria steps")

    def test_document_chunks_vector_bridge(self):
        self.cursor.execute("SELECT COUNT(*) FROM document_chunks WHERE embedding_id IS NOT NULL;")
        count = self.cursor.fetchone()[0]
        self.assertGreaterEqual(count, 80, "Chunks must contain valid ChromaDB embedding_id vector pointers")

    def test_topic_frequencies_calculated(self):
        self.cursor.execute("SELECT COUNT(*) FROM topic_frequencies;")
        count = self.cursor.fetchone()[0]
        self.assertGreaterEqual(count, 10, "Topic frequency analytics table must be populated")

if __name__ == "__main__":
    unittest.main()
