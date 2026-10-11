import unittest
import time
from backend.pipeline.retriever import CourseRetriever

class TestCourseRetriever(unittest.TestCase):
    def setUp(self):
        self.retriever = CourseRetriever()

    def test_semantic_retrieval_and_latency(self):
        start_time = time.time()
        results = self.retriever.retrieve("fixed partitions internal fragmentation", course_code="CSC 321", top_k=3)
        latency = time.time() - start_time

        self.assertLess(latency, 3.8, f"Retrieval latency ({latency:.2f}s) must satisfy Chapter 3 SLA of < 3.8s")
        self.assertGreater(len(results), 0, "Retriever must return relevant chunks from ChromaDB")

    def test_institutional_citation_formatting(self):
        results = self.retriever.retrieve("Matlab matrix operations", course_code="CSC 231", top_k=1)
        self.assertGreater(len(results), 0)
        top = results[0]
        self.assertIn("citation", top)
        self.assertTrue("CSC 231" in top["citation"] or "CSC" in top["citation"])
        self.assertIn("File:", top["citation"])

    def test_filtered_retrieval(self):
        results = self.retriever.retrieve("Hamming code error detection", course_code="CSC 222", top_k=2)
        for r in results:
            self.assertEqual(r["metadata"]["course_code"], "CSC 222")

if __name__ == "__main__":
    unittest.main()
