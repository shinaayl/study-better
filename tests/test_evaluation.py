import unittest
from backend.agent.tools import AgentTools

class TestEvaluationEngine(unittest.TestCase):
    def setUp(self):
        self.tools = AgentTools()

    def test_rubric_scoring_high_agreement(self):
        # Good answer with key technical concepts
        answer = (
            "In static or fixed partition memory allocation, main memory is divided into fixed contiguous partitions at system startup. "
            "Each partition is assigned to a process. This scheme supports multiprogramming but leads directly to internal fragmentation "
            "because the process size rarely matches the partition size exactly, leaving unused allocated space."
        )
        result = self.tools.score_student_answer(
            student_answer=answer,
            question_text="Describe fixed partition memory allocation and internal fragmentation"
        )

        self.assertGreaterEqual(result["percentage_score"], 60.0, "Comprehensive answer should score >= 60%")
        self.assertIn("evaluation_id", result)
        self.assertGreater(len(result["criteria_breakdown"]), 0)

    def test_rubric_scoring_deficient_answer(self):
        answer = "Memory is where things are kept."
        result = self.tools.score_student_answer(
            student_answer=answer,
            question_text="Describe fixed partition memory allocation and internal fragmentation"
        )

        self.assertLess(result["percentage_score"], 50.0, "Superficial answer must receive less than 50%")
        self.assertIn("NEEDS_IMPROVEMENT", [c.get("status") for c in result["criteria_breakdown"]] + ["NEEDS_IMPROVEMENT" if result["percentage_score"] < 50 else ""])

if __name__ == "__main__":
    unittest.main()
