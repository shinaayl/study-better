import json
import re
import os
import random
from typing import Dict, List, Any, Optional
from backend.agent.tools import AgentTools
from backend.agent.prompts import REACT_SYSTEM_PROMPT, GROUNDED_QA_PROMPT
import backend.config as cfg
from backend.db.database import get_connection

class CourseAwareAgent:
    def __init__(self):
        self.tools = AgentTools()

    def _call_gemini_llm(self, prompt: str) -> Optional[str]:
        api_key = (cfg.GEMINI_API_KEY or "").strip()
        if not api_key or api_key == "your_actual_key_here" or api_key.startswith("your_"):
            return None
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=cfg.DEFAULT_LLM_MODEL,
                contents=prompt
            )
            return response.text
        except Exception:
            return None

    def _call_openai_llm(self, prompt: str) -> Optional[str]:
        api_key = cfg.OPENAI_API_KEY
        if not api_key:
            return None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": REACT_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception:
            return None

    def _generate_flexible_conversational_reply(self, query: str, course_code: Optional[str] = None) -> str:
        """
        Dynamically generates natural, warm, and varied conversational responses.
        Uses connected LLM if available, or a rich randomized pool of context-sensitive replies.
        Guarantees no raw asterisks or repetitive robotic phrasing.
        """
        course_hint = f" The student is currently studying {course_code}." if course_code and course_code != "ALL_COURSES" else ""
        # 1. If LLM is active, generate a real natural conversation
        llm_prompt = (
            f"You are a warm, friendly, encouraging university academic tutor and study assistant (similar to ChatGPT or Claude).{course_hint}\n"
            f"The user says: \"{query}\"\n\n"
            f"Reply warmly, naturally, and conversationally in 1 or 2 friendly sentences. "
            f"Acknowledge them naturally, ask how their study session or revision is going, or ask what topic/question they would like to work on today. "
            f"Do NOT use markdown asterisks (no bold, no italics). Do NOT dump feature lists. Keep it warm, empathetic, and human."
        )
        if cfg.GEMINI_API_KEY:
            res = self._call_gemini_llm(llm_prompt)
            if res and res.strip():
                return res.replace("*", "").strip()
        if cfg.OPENAI_API_KEY:
            res = self._call_openai_llm(llm_prompt)
            if res and res.strip():
                return res.replace("*", "").strip()

        # 2. Dynamic, varied local response selection based on intent & randomness
        q_lower = query.lower()
        has_cc = bool(course_code and course_code != "ALL_COURSES")

        if any(p in q_lower for p in ["how are you", "how r u", "how is it going", "how do you do", "what's up", "whats up", "how have you been"]):
            if has_cc:
                options = [
                    f"I'm doing great, thank you for asking! Feeling ready to assist your {course_code} study session. How are your classes going today?",
                    f"Doing well, thanks for checking in! Excited to help you revise {course_code}. How is your day treating you so far?",
                    f"All good on my side, thanks! Ready to dive into some {course_code} questions whenever you are. How is your revision going?",
                    f"I'm doing wonderful, thanks! Ready to assist you with your {course_code} preparation. What topic shall we tackle first?",
                    f"Doing great and feeling energized! Hope your day is going smoothly. Ready to explore some {course_code} concepts together?"
                ]
            else:
                options = [
                    "I'm doing well, thank you for checking in! How are you holding up with your classes and studies today?",
                    "Doing great and feeling ready to assist! How has your day been treating you so far?",
                    "All good on my side, thanks! Excited to help you revise. What are you working on right now?",
                    "I'm doing well, thanks for asking! How is your study session shaping up today?",
                    "Feeling energized and ready to tackle some exam questions with you! How are you doing today?",
                    "I'm doing great! Hope your day is going smoothly. What course or topic are you focusing on?"
                ]
        elif "morning" in q_lower:
            if has_cc:
                options = [
                    f"Good morning! Hope you're starting the day feeling refreshed. Ready for some productive study on {course_code}?",
                    f"A very good morning to you! Welcome back. Which topic or past question in {course_code} should we kick off with today?",
                    f"Good morning! Great to see you early. How is your preparation for {course_code} going so far?",
                    f"Morning! Let's make today a productive study day. What concept or problem in {course_code} can I assist you with this morning?"
                ]
            else:
                options = [
                    "Good morning! Hope you're starting the day feeling refreshed. What course are we preparing for today?",
                    "A very good morning to you! Ready for a productive study session? Tell me which topic we should look at.",
                    "Morning! Great to see you early. Which past paper or course concept is on your agenda today?",
                    "Good morning! Let's make today a productive study day. What subject would you like to review first?"
                ]
        elif "afternoon" in q_lower:
            if has_cc:
                options = [
                    f"Good afternoon! Taking some dedicated time out to study {course_code}? What question or topic can I assist you with?",
                    f"Good afternoon! Hope your day is going smoothly. Ready to review some past papers or concepts for {course_code}?",
                    f"Hello, good afternoon! Welcome back. How is your revision for {course_code} shaping up today?",
                    f"Good afternoon! Always glad to study with you. What area of {course_code} shall we work through this afternoon?"
                ]
            else:
                options = [
                    "Good afternoon! Taking some time out to revise? What course or topic can I assist you with?",
                    "Good afternoon! Hope your day is going smoothly. Which exam question or subject would you like to review?",
                    "Hello, good afternoon! I'm right here whenever you want to work through a past paper or concept.",
                    "Good afternoon! Ready when you are. What course are you working on this afternoon?"
                ]
        elif "evening" in q_lower:
            if has_cc:
                options = [
                    f"Good evening! Putting in some evening revision time for {course_code}? Let me know which topic we are working through.",
                    f"Good evening! Hope you've had a productive day. Ready to work through an exam question for {course_code}?",
                    f"Evening! Wrapping up the day with some focused study on {course_code}? I am right here to help you work through it.",
                    f"Good evening! Let's get through some solid preparation for {course_code} tonight. What are we tackling?"
                ]
            else:
                options = [
                    "Good evening! Putting in some evening study time? Let me know which course we are working through.",
                    "Good evening! Wrapping up the day with some revision? I'm here to help you review any topics.",
                    "Evening! Hope you've had a productive day. Which exam question should we solve together tonight?",
                    "Good evening! Let's get through some solid preparation tonight. What are we tackling?"
                ]
        else: # "hi", "hello", "hey", "hiya", "howdy", etc.
            if has_cc:
                options = [
                    f"Hey there! Great to see you. How is your study session going? Ready to dive into some {course_code} revision?",
                    f"Hello! Welcome back. What topic, concept, or past exam question in {course_code} can we work on together today?",
                    f"Hi! Hope your day is going smoothly. How is your prep for {course_code} coming along?",
                    f"Hey! Always glad to study with you. What concept or problem in {course_code} should we tackle today?",
                    f"Hello there! Ready when you are. What area of {course_code} shall we explore today?",
                    f"Hi! Good to have you here. Let me know which {course_code} question or topic you want to dive into today."
                ]
            else:
                options = [
                    "Hey there! Great to see you. What course or exam question can we conquer together today?",
                    "Hello! Welcome in. Tell me what subject or question you're working on, and let's get into it.",
                    "Hi! Always glad to study with you. What topic are you preparing for right now?",
                    "Hey! Hope your study session is off to a great start. What would you like to explore?",
                    "Hello there! Ready when you are—what course or past paper are you looking at today?",
                    "Hi! Good to have you here. Let me know which course you'd like to dive into today.",
                    "Hey! Ready for some exam preparation? Drop any question or topic and let's break it down."
                ]

        return random.choice(options)

    def _format_offline_grounded_answer(self, course_code: Optional[str], query: str, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            c_tag = f"for **{course_code}**" if course_code else "in the verified course materials"
            return (
                f"### 🛡️ No Verified Departmental Materials Found\n\n"
                f"I am sorry, but I do not have the answer to that question {c_tag}.\n\n"
                f"**Anti-Hallucination Policy:**\n"
                f"To maintain academic integrity and prevent misinformation, Study Better only provides answers strictly grounded in official materials uploaded by your departmental lecturers. "
                f"If you are asking about a specific course, please mention the course code (e.g. `ECO 101`, `LAW 201`, `CSC 321`) or have your course lecturer upload the syllabus and marking scheme in the Ingestion Portal."
            )

        top_chunk = chunks[0]
        detected_cc = course_code or top_chunk.get("course_code") or top_chunk.get("metadata", {}).get("course_code", "Academic Memory")
        raw_text = top_chunk["text"]

        clean_lines = []
        for line in raw_text.split("\n"):
            line_str = line.strip()
            if not line_str:
                continue
            if any(h in line_str.lower() for h in ["university of ibadan", "b.sc. degree", "time allowed", "instructions:"]):
                continue
            clean_lines.append(line_str)

        body_text = "\n\n".join(clean_lines[:6]) if clean_lines else raw_text

        keywords = re.findall(r"\b[A-Za-z]{5,}\b", body_text)
        stopwords = {"which", "their", "there", "about", "would", "could", "should", "these", "those", "because", "question", "answer", "marks", "university"}
        important_terms = list(dict.fromkeys([k for k in keywords if k.lower() not in stopwords]))[:6]
        terms_str = ", ".join([f"**{t}**" for t in important_terms]) if important_terms else f"**{detected_cc} Core Terminology**"

        return (
            f"### 🎯 Grounded Academic Solution ({detected_cc})\n\n"
            f"#### 1. Direct Answer / Thesis:\n"
            f"Grounded directly in official departmental materials for **{detected_cc}**, this question addresses core curriculum principles evaluated in semester examinations:\n\n"
            f"{body_text}\n\n"
            f"---\n\n"
            f"#### 2. Step-by-Step Breakdown & Examiner Rubric:\n"
            f"- **Step 1 (Conceptual Definition)**: State the formal departmental definition precisely, avoiding colloquial paraphrasing.\n"
            f"- **Step 2 (Structural Breakdown / Derivation)**: Lay out the step-by-step technical mechanisms, diagrams, or intermediate formulas.\n"
            f"- **Step 3 (Analytical Synthesis & Application)**: Highlight trade-offs, edge cases, and practical real-world or architectural implications.\n\n"
            f"#### 3. Key Terminology Check:\n"
            f"Examiners allocate specific marks for canonical terms. Ensure your response includes:\n"
            f"- {terms_str}\n\n"
            f"#### 4. Common Pitfalls & Examiner Warnings:\n"
            f"- ⚠️ **Vague Descriptions**: Deductions occur when definitions lack canonical precision.\n"
            f"- ⚠️ **Missing Steps**: Full marks require explicit intermediate steps rather than jumping directly to final conclusions.\n\n"
            f"**Official Source:** {top_chunk.get('citation', f'[{detected_cc} Institutional Archive]')}"
        )

    def run(self, query: str, course_code: Optional[str] = None, student_id: str = "ui-cs-demo-matric-230880") -> Dict[str, Any]:
        """
        Executes the ReAct loop:
        Thought -> Action -> Action Input -> Observation -> Final Answer.
        Provides conversational intelligence, anti-hallucination verification, and 100% offline graceful degradation.
        """
        q_clean = query.strip()
        q_lower = q_clean.lower()
        q_words = re.sub(r"[^\w\s]", "", q_lower).strip()
        trace = []
        citations = []
        tool_data = None

        # 1. CASUAL GREETINGS & WELL-BEING INQUIRIES (Flexible, natural, friendly, no asterisks)
        greeting_starters = [
            "hi", "hello", "hey", "hiya", "howdy", "good morning", "good afternoon",
            "good evening", "good day", "greetings", "wassup", "what's up", "whats up",
            "yo", "sup"
        ]
        wellbeing_phrases = [
            "how are you", "how r u", "how is it going", "how are things",
            "how do you do", "hope you are well", "how is your day", "how are you doing"
        ]

        is_casual_greeting = False
        if any(q_words == g or q_words.startswith(g + " ") for g in greeting_starters):
            is_casual_greeting = True
        elif any(p in q_words for p in wellbeing_phrases):
            is_casual_greeting = True
        elif q_words in ["hi there", "hello there", "hey there", "hey friend", "hey agent", "good day"]:
            is_casual_greeting = True

        # Disqualify if it contains specific academic task terms
        if any(term in q_lower for term in ["explain", "define", "what is", "how does", "calculate", "describe", "differentiate", "mock exam", "heatmap", "past question", "marking scheme"]):
            is_casual_greeting = False

        if is_casual_greeting:
            reply = self._generate_flexible_conversational_reply(q_clean, course_code)

            return {
                "query": query,
                "course_code": course_code or "ALL_COURSES",
                "trace": [{
                    "thought": "The user engaged in casual greeting. Generated a flexible, natural conversational reply.",
                    "action": "flexible_greeting",
                    "action_input": {"greeting": q_clean},
                    "observation": "Returned dynamic, natural greeting."
                }],
                "final_answer": reply,
                "citations": [],
                "tool_data": {"type": "casual_greeting"}
            }

        # 2. CONVERSATIONAL PLEASANTRIES (Short, natural acknowledge, no asterisks)
        pleasantry_terms = [
            "thanks", "thank you", "thank u", "many thanks", "thanks a lot",
            "thank you so much", "thanks so much", "cheers", "awesome",
            "cool", "great", "ok", "okay", "got it", "perfect", "well done", "nice"
        ]
        is_pleasantry = any(q_words == p or q_words.startswith(p + " ") or q_words.endswith(" " + p) for p in pleasantry_terms)
        if any(term in q_lower for term in ["explain", "define", "what is", "how does", "calculate", "mock exam"]):
            is_pleasantry = False

        if is_pleasantry:
            pleasantry_options = [
                "You're very welcome! Feel free to ask about any course questions, past papers, or marking criteria whenever you are ready.",
                "Happy to help! Let me know which topic or question you'd like to work through next.",
                "Anytime! Whenever you're ready for another question or mock exam, just drop it here.",
                "Glad I could help! Good luck with your revision, and let me know if you need anything else."
            ]
            return {
                "query": query,
                "course_code": course_code or "ALL_COURSES",
                "trace": [{
                    "thought": "The user expressed pleasantry/thanks. Responding briefly and politely.",
                    "action": "pleasantry_reply",
                    "action_input": {"input": q_clean},
                    "observation": "Acknowledged user pleasantry."
                }],
                "final_answer": random.choice(pleasantry_options),
                "citations": [],
                "tool_data": {"type": "pleasantry"}
            }

        # 3. EXPLICIT CAPABILITY / HELP INQUIRY ("what can you do?", "help", "who are you")
        is_capabilities_query = bool(re.search(
            r"^\s*(what\s*(?:can|do)\s*you\s*do|who\s*are\s*you|what\s*are\s*you|introduce\s*yourself|help(?:\s*me)?|how\s*(?:does\s*this|do\s*you)\s*work|features)[\s\!\?\.]*$",
            q_lower
        )) or q_lower in ["help", "who are you", "what can you do", "features", "introduce yourself"]

        if is_capabilities_query:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT course_code, course_title, department FROM courses ORDER BY department, course_code;")
            all_courses = [dict(r) for r in cursor.fetchall()]
            conn.close()

            by_dept = {}
            for c in all_courses:
                dept = c.get("department") or "General Studies"
                by_dept.setdefault(dept, []).append(f"`{c['course_code']}` ({c['course_title']})")

            courses_summary = ""
            for dept, clist in by_dept.items():
                courses_summary += f"- **{dept}**: " + ", ".join(clist[:4])
                if len(clist) > 4:
                    courses_summary += f" *(+{len(clist)-4} more)*"
                courses_summary += "\n"

            cap_answer = (
                "### 👋 Study Better AI Agent Capabilities\n\n"
                "I am a universal, course-aware revision and examination preparation assistant built for higher institutions. Any academic department can upload past questions, marking schemes, and syllabus notes so students can study with grounded, reliable answers.\n\n"
                "#### 🎯 Key Features:\n"
                "- **Grounded Past Question Q&A**: Ask any conceptual or past examination question, answered strictly using official departmental marking schemes.\n"
                "- **Automated Rubric Scoring**: Submit your draft answers in the Rubric Scoring portal to get instant mark-by-mark grading and keyword feedback.\n"
                "- **Authentic Mock Exams**: Generate custom practice examination papers matching real degree exam structures.\n"
                "- **Topic Recurrence Heatmap**: Review which topics appear most frequently across sessions and see statistical overdue probabilities.\n"
                "- **Multi-Department Support**: Lecturers and administrators can upload any department's course materials in the Lecturer Ingestion portal.\n\n"
                f"#### 📚 Ingested Departmental Courses:\n{courses_summary}\n"
                "> 💡 *Tip: Feel free to ask any question about these courses or select one from the top bar to begin!*"
            )

            return {
                "query": query,
                "course_code": course_code or "ALL_COURSES",
                "trace": [{
                    "thought": "The user explicitly asked what I can do or requested help. I will provide a structured overview of all features and available courses.",
                    "action": "explain_capabilities",
                    "action_input": {"intent": "capabilities"},
                    "observation": f"Displayed capabilities and catalog of {len(all_courses)} courses."
                }],
                "final_answer": cap_answer,
                "citations": ["[Study Better Framework]"],
                "tool_data": {"type": "capabilities", "courses_count": len(all_courses)}
            }

        # 4. COURSE CODE DETECTION & ANTI-HALLUCINATION VERIFICATION
        c_matches = re.findall(r"\b([A-Za-z]{2,5})\s*([0-9]{3,4}[A-Za-z]?)\b", query)
        detected_code = None
        if c_matches:
            detected_code = f"{c_matches[0][0].upper()} {c_matches[0][1].upper()}"
        elif course_code:
            detected_code = course_code.strip().upper()

        if detected_code:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT course_code, course_title, department FROM courses WHERE UPPER(course_code) = ?;", (detected_code,))
            c_found = cursor.fetchone()

            if not c_found:
                cursor.execute("SELECT course_code, course_title, department FROM courses ORDER BY course_code LIMIT 8;")
                sample_courses = [dict(r) for r in cursor.fetchall()]
                conn.close()

                c_list_str = "\n".join([f"- **{c['course_code']}**: {c['course_title']} ({c['department']})" for c in sample_courses])

                unknown_answer = (
                    f"### ⚠️ Course Not Found in Knowledge Base: `{detected_code}`\n\n"
                    f"I currently do not have verified course materials, past examination questions, or marking schemes for **{detected_code}** in my repository.\n\n"
                    f"**🛡️ Anti-Hallucination Policy:**\n"
                    "As an authentic study agent, I refuse to fabricate or guess ungrounded answers when official departmental documents are not present.\n\n"
                    "#### 📤 How to add this course:\n"
                    f"You or your department can upload past questions, marking schemes, or lecture notes for **{detected_code}** in the **Knowledge Base & Ingestion** tab! The system will automatically index them for grounded Q&A, mock exams, and rubric grading.\n\n"
                    f"#### 📖 Available Courses You Can Ask About:\n"
                    f"{c_list_str}\n"
                )

                return {
                    "query": query,
                    "course_code": detected_code,
                    "trace": [{
                        "thought": f"The student inquired about {detected_code}. I verified with the database catalog that no materials exist for this course.",
                        "action": "verify_course_catalog",
                        "action_input": {"course_code": detected_code},
                        "observation": f"Course {detected_code} is absent from knowledge base. Enforcing anti-hallucination response."
                    }],
                    "final_answer": unknown_answer,
                    "citations": [],
                    "tool_data": {"status": "COURSE_NOT_FOUND", "course_code": detected_code}
                }
            conn.close()
            course_code = detected_code
        else:
            # No specific course code in query or parameters: search across all departmental memory
            course_code = None

        # 3. INTENT RECOGNITION (ReAct Pattern)
        if any(w in q_lower for w in ["mock exam", "mock", "practice exam", "practice test", "generate exam", "sample paper"]):
            if not course_code:
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT course_code, course_title FROM courses LIMIT 8;")
                available = [dict(r) for r in cursor.fetchall()]
                conn.close()
                course_list = ", ".join([f"`{c['course_code']}`" for c in available])
                return {
                    "query": query,
                    "course_code": "UNSPECIFIED",
                    "trace": [{
                        "thought": "Mock exam requested without specifying course code.",
                        "action": "prompt_course_specification",
                        "action_input": {"query": q_clean},
                        "observation": "Prompted user for course code."
                    }],
                    "final_answer": (
                        f"Which course would you like to generate a practice mock exam for? (Available: {course_list}). "
                        "Simply ask for example: *\"Generate a mock exam for CSC 321\"* or *\"Give me a mock exam for ECO 101\"*."
                    ),
                    "citations": [],
                    "tool_data": {"type": "prompt_course_selection"}
                }

            thought = f"The student wants to generate a mock examination paper for {course_code}. I will invoke the generate_mock_exam tool."
            action = "generate_mock_exam"
            action_input = {"course_code": course_code, "num_questions": 3}
            trace.append({"thought": thought, "action": action, "action_input": action_input})

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
            if not course_code:
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT course_code, course_title FROM courses LIMIT 8;")
                available = [dict(r) for r in cursor.fetchall()]
                conn.close()
                course_list = ", ".join([f"`{c['course_code']}`" for c in available])
                return {
                    "query": query,
                    "course_code": "UNSPECIFIED",
                    "trace": [{
                        "thought": "Heatmap requested without course code.",
                        "action": "prompt_course_specification",
                        "action_input": {"query": q_clean},
                        "observation": "Prompted user for course code."
                    }],
                    "final_answer": f"Which course would you like to view the topic recurrence heatmap for? (Available: {course_list}). For example: *\"Show topic heatmap for CSC 321\"*.",
                    "citations": [],
                    "tool_data": {"type": "prompt_course_selection"}
                }

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
            # 4. PAST QUESTION SEARCH & GROUNDED Q&A (Across entire memory if course not specified)
            target_desc = course_code if course_code else "entire university knowledge base"
            thought = f"Searching memory ({target_desc}) for past examination questions and official marking schemes matching: '{query}'."
            action = "search_past_questions"
            action_input = {"query": query, "course_code": course_code, "top_k": 3}
            trace.append({"thought": thought, "action": action, "action_input": action_input})

            observation = self.tools.search_past_questions(query=query, course_code=course_code, top_k=3)
            tool_data = observation
            chunks = observation["retrieved_chunks"]
            trace[-1]["observation"] = f"Retrieved {len(chunks)} relevant marking scheme / past paper chunks from memory."

            # If course_code was not passed, resolve from top retrieved chunk
            if not course_code and chunks:
                course_code = chunks[0].get("course_code") or chunks[0].get("metadata", {}).get("course_code")

            for c in chunks:
                if c.get("citation") and c["citation"] not in citations:
                    citations.append(c["citation"])

            context_text = self.tools.retriever.format_context_for_prompt(chunks)

            # Try LLM generation first if available
            llm_prompt = GROUNDED_QA_PROMPT.format(
                context=context_text,
                query=query,
                course_code=course_code or "Academic Repository"
            )
            llm_response = self._call_gemini_llm(llm_prompt) or self._call_openai_llm(llm_prompt)

            if llm_response:
                if "Grounded Academic Solution" not in llm_response:
                    final_answer = f"### 🎯 Grounded Academic Solution ({course_code or 'Verified Departmental Materials'})\n\n" + llm_response.lstrip()
                else:
                    final_answer = llm_response
            else:
                final_answer = self._format_offline_grounded_answer(course_code, query, chunks)

        return {
            "query": query,
            "course_code": course_code,
            "trace": trace,
            "final_answer": final_answer,
            "citations": citations,
            "tool_data": tool_data
        }
