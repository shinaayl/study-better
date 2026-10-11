import json
import re
import os
from typing import Dict, List, Any, Optional
from backend.agent.tools import AgentTools
from backend.agent.prompts import REACT_SYSTEM_PROMPT, GROUNDED_QA_PROMPT
from backend.config import GEMINI_API_KEY, OPENAI_API_KEY, DEFAULT_LLM_MODEL

class CourseAwareAgent:
    def __init__(self):
        self.tools = AgentTools()
        self.gemini_key = GEMINI_API_KEY
        self.openai_key = OPENAI_API_KEY

    def _call_gemini_llm(self, prompt: str) -> Optional[str]:
        if not self.gemini_key:
            return None
        try:
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            response = client.models.generate_content(
                model=DEFAULT_LLM_MODEL,
                contents=prompt
            )
            return response.text
        except Exception as e:
            return None

    def _call_openai_llm(self, prompt: str) -> Optional[str]:
        if not self.openai_key:
            return None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": REACT_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return None

    def run(self, query: str, course_code: Optional[str] = None, student_id: str = "ui-cs-demo-matric-230880") -> Dict[str, Any]:
        """
        Executes the ReAct loop:
        Thought -> Action -> Action Input -> Observation -> Final Answer.
        Provides 100% offline graceful degradation if external LLM APIs are unavailable.
        """
        q_lower = query.lower()
        trace = []
        citations = []
        tool_data = None

        # Detect Course Code from query if not explicitly passed
        if not course_code:
            c_match = re.search(r"csc\s*(\d{3})", query, re.IGNORECASE)
            if c_match:
                course_code = f"CSC {c_match.group(1)}"
            else:
                course_code = "CSC 321"

        # --- STEP 1: Intent Analysis & Tool Selection (Reasoning) ---
        if any(w in q_lower for w in ["mock exam", "mock", "practice exam", "practice test", "generate exam", "sample paper"]):
            thought = f"The student wants to generate a mock examination paper for {course_code}. I will invoke the generate_mock_exam tool."
            action = "generate_mock_exam"
            action_input = {"course_code": course_code, "num_questions": 3}
            trace.append({"thought": thought, "action": action, "action_input": action_input})

            # Execute Action
            observation = self.tools.generate_mock_exam(course_code=course_code, num_questions=3)
            tool_data = observation
            trace[-1]["observation"] = f"Generated mock examination for {course_code} containing {len(observation['questions'])} past questions (Total Marks: {observation['total_marks']})."

            final_answer = (
                f"### 📝 {observation['institution']} — {observation['department']}\n"
                f"**Course:** {observation['course_code']} ({observation['course_title']})\n"
                f"**Instructions:** {observation['instructions']}\n"
                f"**Total Marks:** {observation['total_marks']}\n\n"
                "Here is your structured practice paper compiled from authentic past examination sessions:\n\n"
            )
            for idx, q in enumerate(observation["questions"], 1):
                final_answer += f"**Question {idx} ({q['question_number']}) — [{q['total_marks']} Marks]** (Session: {q.get('academic_year', 'Historical')})\n"
                final_answer += f"*{q['question_text']}*\n"
                final_answer += f"> **Focus Topic:** `{q['topic_tag']}` | **Bloom's Cognitive Level:** `{q['bloom_level']}`\n\n"

            citations.append(f"[{course_code} Historical Examinations Archive]")

        elif any(w in q_lower for w in ["heatmap", "frequency", "likely to appear", "likely", "overdue", "topic trends", "recurrence"]):
            thought = f"The student is inquiring about examination patterns, topic frequency, or likely-to-appear questions for {course_code}. I will invoke show_topic_heatmap."
            action = "show_topic_heatmap"
            action_input = {"course_code": course_code}
            trace.append({"thought": thought, "action": action, "action_input": action_input})

            observation = self.tools.show_topic_heatmap(course_code=course_code)
            tool_data = observation
            trace[-1]["observation"] = f"Retrieved historical topic frequencies for {len(observation['topics'])} topics in {course_code}."

            final_answer = (
                f"### 📊 Historical Exam Pattern Analysis for {course_code}\n\n"
                f"Based on historical recurrence patterns across departmental sessions, here are the topic trends and predicted overdue likelihoods:\n\n"
            )
            for t in observation["topics"]:
                prob_pct = int(t["overdue_probability"] * 100)
                final_answer += f"- **{t['topic_name']}**\n"
                final_answer += f"  - Sessions Examined: `{t['sessions_examined']}` | Last Appeared: `{t['last_session_appeared']}`\n"
                final_answer += f"  - Overdue Probability: **{prob_pct}%** (Likely to appear in upcoming exams)\n"

            final_answer += "\n> 💡 *Recommendation: Prioritize topics with an overdue probability > 60% and cross-reference them with the official marking guides.*"
            citations.append(f"[{course_code} Examination Topic Recurrence Database]")

        elif any(w in q_lower for w in ["weak area", "weaknesses", "struggling", "diagnose", "my score", "flag weak"]):
            thought = "The student wants to review their performance diagnostics and weak areas. I will invoke flag_weak_areas."
            action = "flag_weak_areas"
            action_input = {"student_id": student_id, "course_code": course_code}
            trace.append({"thought": thought, "action": action, "action_input": action_input})

            observation = self.tools.flag_weak_areas(student_id=student_id, course_code=course_code)
            tool_data = observation
            trace[-1]["observation"] = f"Found {len(observation['weak_topics'])} topics flagged for review out of {observation['total_evaluations_completed']} attempts."

            final_answer = f"### 🎯 Performance Diagnostic & Weak Area Flagging\n\n"
            if observation["weak_topics"]:
                final_answer += "Here are the topics where your recent rubric evaluation scores fall below the 65% proficiency benchmark:\n\n"
                for w in observation["weak_topics"]:
                    final_answer += f"- **{w['topic']}** (Average: `{w['average_score']}%` over {w['attempts']} attempts)\n"
                    final_answer += f"  - Status: **{w['status']}**\n"
                    final_answer += f"  - Action: {w['recommendation']}\n\n"
            else:
                final_answer += (
                    "No critical weak areas flagged yet! You have either scored above 65% across evaluated topics or have not yet submitted attempts. "
                    "Submit answers in the Evaluation Portal to generate personalized diagnostic tracking."
                )
            citations.append("[Student Evaluation Performance Records]")

        else:
            # Past Question Search and Grounded Q&A
            thought = f"The student is asking a course-specific conceptual or exam question. I will search the departmental knowledge base using search_past_questions for {course_code}."
            action = "search_past_questions"
            action_input = {"query": query, "course_code": course_code, "top_k": 3}
            trace.append({"thought": thought, "action": action, "action_input": action_input})

            observation = self.tools.search_past_questions(query=query, course_code=course_code, top_k=3)
            tool_data = observation
            trace[-1]["observation"] = f"Retrieved {len(observation['retrieved_chunks'])} relevant marking scheme / past paper chunks."

            chunks = observation["retrieved_chunks"]
            for c in chunks:
                if c.get("citation") and c["citation"] not in citations:
                    citations.append(c["citation"])

            # Formulate grounded response
            context_text = self.tools.retriever.format_context_for_prompt(chunks)

            # Try LLM generation first if available
            llm_prompt = GROUNDED_QA_PROMPT.format(
                context=context_text,
                query=query,
                course_code=course_code
            )
            llm_response = self._call_gemini_llm(llm_prompt) or self._call_openai_llm(llm_prompt)

            if llm_response:
                final_answer = llm_response
            else:
                # Deterministic Grounded Synthesis (Offline Graceful Degradation)
                if chunks:
                    top_chunk = chunks[0]
                    final_answer = (
                        f"### Grounded Response ({course_code})\n\n"
                        f"Based on the official University of Ibadan departmental records:\n\n"
                        f"{top_chunk['text']}\n\n"
                        f"**Examiner Expectations & Marking Scheme Alignment:**\n"
                        f"- Answers must demonstrate exact institutional technical terminology.\n"
                        f"- For full marks, ensure definitions, mathematical formulations, and step-by-step reasoning are presented in order.\n\n"
                        f"**Source Document:** {top_chunk.get('citation', '[UI CSC Knowledge Base]')}"
                    )
                else:
                    final_answer = (
                        f"I could not locate a direct past question matching '{query}' in {course_code}. "
                        "Try querying another course code or viewing the Topic Frequency Heatmap for common exam themes."
                    )

        return {
            "query": query,
            "course_code": course_code,
            "trace": trace,
            "final_answer": final_answer,
            "citations": citations,
            "tool_data": tool_data
        }
