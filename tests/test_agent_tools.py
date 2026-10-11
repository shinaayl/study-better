import unittest
from backend.agent.tools import AgentTools

class TestAgentTools(unittest.TestCase):
    def setUp(self):
        self.tools = AgentTools()

    def test_search_past_questions(self):
        res = self.tools.search_past_questions("scientific programming matlab", course_code="CSC 231")
        self.assertIn("retrieved_chunks", res)
        self.assertGreater(len(res["retrieved_chunks"]), 0)

    def test_generate_mock_exam(self):
        exam = self.tools.generate_mock_exam("CSC 321", num_questions=3)
        self.assertEqual(len(exam["questions"]), 3)
        self.assertEqual(exam["institution"], "University of Ibadan")
        self.assertIn("TIME ALLOWED", exam["instructions"])

    def test_show_topic_heatmap(self):
        heatmap = self.tools.show_topic_heatmap("CSC 321")
        self.assertGreater(len(heatmap["topics"]), 0)
        top_topic = heatmap["topics"][0]
        self.assertIn("overdue_probability", top_topic)
        self.assertGreaterEqual(top_topic["overdue_probability"], 0.0)
        self.assertLessEqual(top_topic["overdue_probability"], 1.0)

    def test_flag_weak_areas(self):
        res = self.tools.flag_weak_areas(student_id="ui-cs-demo-matric-230880")
        self.assertIn("weak_topics", res)
        self.assertIn("total_evaluations_completed", res)

if __name__ == "__main__":
    unittest.main()
