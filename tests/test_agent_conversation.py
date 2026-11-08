import unittest
from backend.agent.agent import CourseAwareAgent

class TestAgentConversation(unittest.TestCase):
    def setUp(self):
        self.agent = CourseAwareAgent()

    def test_casual_greeting_intent(self):
        res = self.agent.run("hello")
        self.assertEqual(res["tool_data"].get("type"), "casual_greeting")
        self.assertGreater(len(res["final_answer"]), 10)
        # Ensure casual greeting does not have raw markdown asterisks
        self.assertNotIn("**", res["final_answer"])
        # Ensure it does NOT dump capabilities
        self.assertNotIn("Study Better AI Agent Capabilities", res["final_answer"])

    def test_capabilities_intent(self):
        res = self.agent.run("what can you do?")
        self.assertIn("Study Better AI Agent Capabilities", res["final_answer"])
        self.assertEqual(res["tool_data"].get("type"), "capabilities")

    def test_unknown_course_anti_hallucination(self):
        res = self.agent.run("What are the exam questions for BIO 101?")
        self.assertIn("Course Not Found in Knowledge Base", res["final_answer"])
        self.assertIn("Anti-Hallucination Policy", res["final_answer"])
        self.assertEqual(res["tool_data"].get("status"), "COURSE_NOT_FOUND")

    def test_grounded_answer_known_course(self):
        res = self.agent.run("Explain fixed partitions and internal fragmentation in CSC 321")
        self.assertIn("Grounded Academic Solution", res["final_answer"])
        self.assertGreater(len(res["citations"]), 0)

if __name__ == "__main__":
    unittest.main()
