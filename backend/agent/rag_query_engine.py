import os
import json
import time
import re
import random
from typing import List, Dict, Any, Optional, AsyncGenerator, Generator
from dotenv import load_dotenv

import config as cfg
from db.database import get_connection
from pipeline.embeddings import compute_gemini_embeddings, GEMINI_EMBEDDING_MODEL
from pipeline.vector_store import VectorStoreManager
from agent.guardrails import QualityGuardrailEngine

load_dotenv()

SYSTEM_RAG_INSTRUCTION = """You are the Study Better AI Academic Study Agent for higher education institutions.
Your mission is to provide rigorous, pedagogically sound, and institutionally aligned answers grounded strictly in official university past examination papers, lecturer marking schemes, and course materials.

### STRICT OPERATIONAL DIRECTIVES:
1. **Greetings, Introductions & Meta-Questions**:
   - If the user is simply greeting you, introducing themselves, or asking how you work, respond warmly, politely, and briefly as an academic tutor. Offer to help them with specific past questions, course concepts, or exam preparations for their selected course without dumping course data unprompted.
   - Do NOT reference retrieved context chunks or dump course data when responding to greetings or pleasantries.

2. **Institutional Grounding & Context Usage**:
   - Ensure you ONLY reference retrieved context when addressing actual academic questions.
   - When a student asks a past examination question or syllabus question that matches the retrieved materials, provide the complete, authoritative, and pedagogically sound solution to THAT EXACT QUESTION.
   - Do NOT answer a different question from another excerpt. Focus your answer directly on the student's prompt.
   - Prioritize the exact terminology, definitions, formulas, and structural layouts favored by departmental lecturers and examiners.
   - If a marking scheme specifies point-by-point criteria or keywords (e.g. definitions, derivations, diagrams), explicitly highlight them.

3. **Formatting & Math Presentation**:
   - Use LaTeX syntax for all mathematical equations, formulas, variables, and complexities (inline: $...$, display block: $$...$$). For example, $O(n \\log n)$, $P(A|B)$, $\\sum_{i=1}^n x_i$.
   - Format all code, algorithms, and SQL inside fenced code blocks with explicit syntax tags (e.g., ```python, ```c, ```matlab, ```sql).
   - Use clear bold section titles, numbered steps, and bulleted lists.

4. **Citations**:
   - Reference the retrieved documents where appropriate (e.g., *[CSC 321 · 2022/2023 · Marking Scheme · Page 2]*). Do NOT invent citations when no documents are retrieved or when answering conversational greetings.

5. **Anti-Hallucination, Zero-Tolerance for Unknowns & Course Independence**:
   - DO NOT GIVE AN ANSWER TO WHAT YOU DO NOT KNOW. JUST TELL THE USER YOU DONT HAVE INFORMATION ABOUT IT.
   - If the verified context does not contain information about the student's question, you MUST politely state: "I don't have information about that in the verified course materials."
   - Do NOT guess, speculate, extrapolate, or use outside training data when the information is missing from the verified materials.
   - Refuse to fabricate solutions for unindexed courses not present in the departmental index.
   - NEVER reference, introduce, or mention an unrelated course code, title, or department when you do not have information. If the student asks about a topic not found in verified materials (e.g. general questions about chess, sports, cooking, etc.), simply state that you do not have information about that topic without referencing any course.
   - Only reference a course code if the student explicitly asked about that specific course in their message.
   - Do NOT begin your response with robotic self-introductions (such as "Hello! I am your Study Better AI Agent for..."). Answer the student directly, naturally, and warmly like a standard modern LLM.
   - Clarify that you only answer questions based on documents and syllabus materials uploaded by course lecturers, and will provide answers once a lecturer uploads relevant syllabus materials or past papers.

6. **Continuous Lecturer Learning & Test Data Supersession**:
   - Initial database materials are baseline test data.
   - Any lecturer-uploaded materials, verified criteria, or calibrated exemplar solutions (tagged [Verified Lecturer Exemplar] or [Official Lecturer Upload]) represent active real-time teaching directives.
   - You MUST learn from and strictly prioritize these lecturer inputs over prior baseline test data, aligning your grading rubrics, solution steps, and canonical terms with the lecturer's verified exemplar.
"""

class RAGQueryEngine:
    """
    RAG Query Engine integrating Gemini 1.5 Pro / 2.0 Flash with dense vector retrieval
    via text-embedding-004 over University of Ibadan academic corpus.
    """
    def __init__(self, model_name: str = "gemini-3.5-flash"):
        self.model_name = os.getenv("GEMINI_CHAT_MODEL", model_name)
        self.vector_store = VectorStoreManager()
        self.guardrail_engine = QualityGuardrailEngine()
        self.api_key = os.getenv("GEMINI_API_KEY", cfg.GEMINI_API_KEY or "")
        self.client = None
        self._init_gemini_client()

    def _init_gemini_client(self):
        """Initializes Google GenAI Client if a non-placeholder API key exists."""
        key = (self.api_key or "").strip()
        if key and key != "your_actual_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=key)
            except Exception as e:
                print(f"[RAGQueryEngine] Warning: Could not initialize Google GenAI Client: {e}")
                self.client = None
        else:
            self.client = None

    def is_casual_or_greeting(self, message: str) -> bool:
        """
        Fast intent classification: checks if input is casual conversation, greeting,
        introduction, or a meta-question about system capabilities (e.g. 'hi', 'hey',
        'hello', 'how are you', 'how do you work', 'who are you', 'what can you do').
        If True, the caller skips vector database retrieval entirely and passes empty context.
        """
        if not message or not message.strip():
            return False
        text = message.strip()
        text_lower = text.lower()
        cleaned = re.sub(r"[^\w\s]", " ", text_lower).strip()
        words = cleaned.split()
        if not words:
            return False

        # 1. If any specific course code pattern is present (e.g. 'csc 321', 'mth 201', 'phy 101'), it's an academic query
        if re.search(r"\b[a-z]{2,4}\s*\d{2,3}[a-z]?\b", text_lower):
            return False

        # 2. Meta-questions regarding how the AI works or introductions (prioritized before general question words)
        meta_phrases = [
            "how do you work", "how do you function", "how does this work", "how does it work",
            "how does the system work", "what can you do", "what do you do",
            "who are you", "what are you", "what is your name", "what is your purpose",
            "can you help me", "could you help me", "how can you help", "how to use",
            "how do i use", "what is this app", "what is this tool", "tell me about yourself",
            "who made you", "what is this platform"
        ]
        if any(mp in cleaned for mp in meta_phrases):
            # Check if it also asks about specific technical content
            technical_stems = ["algorithm", "formula", "paging", "fragmentation", "syntax", "matrix", "derivative", "integral"]
            if not any(ts in text_lower for ts in technical_stems):
                return True

        # 3. If message contains academic/query verbs or syllabus keywords, it's an academic query
        academic_terms = [
            "explain", "define", "definition", "what is", "what are", "how does", "how do",
            "calculate", "describe", "differentiate", "distinguish", "discuss", "compare",
            "derive", "list", "state", "question", "exam", "marking", "rubric", "scheme",
            "mock", "solve", "why is", "why does", "when is", "tell me about", "summary",
            "session", "semester", "past paper", "solution", "algorithm", "formula", "difference",
            "lecture", "module", "notes", "syllabus", "credit", "proof", "prove", "contrast"
        ]
        if any(term in text_lower for term in academic_terms):
            return False

        greeting_starters = {
            "hi", "hello", "hey", "hiya", "howdy", "good morning", "good afternoon",
            "good evening", "good day", "greetings", "wassup", "what's up", "whats up",
            "yo", "sup", "morning", "afternoon", "evening"
        }
        wellbeing_phrases = [
            "how are you", "how r u", "how is it going", "how are things",
            "how do you do", "hope you are well", "how is your day", "how are you doing",
            "how are you doing today"
        ]
        pleasantry_terms = {
            "thanks", "thank you", "thank u", "many thanks", "thanks a lot",
            "thank you so much", "thanks so much", "cheers", "awesome",
            "cool", "great", "ok", "okay", "got it", "perfect", "well done", "nice",
            "bye", "goodbye", "see you", "see ya"
        }
        intro_starters = [
            "i am", "im", "i'm", "my name is", "call me"
        ]

        # Exact match or short greeting/pleasantry
        if cleaned in greeting_starters or cleaned in pleasantry_terms:
            return True

        if any(cleaned == p or cleaned.startswith(p + " ") or cleaned.endswith(" " + p) for p in wellbeing_phrases):
            return True

        if any(cleaned.startswith(g + " ") for g in greeting_starters) and len(words) <= 8:
            return True

        if any(cleaned.startswith(intro + " ") for intro in intro_starters) and len(words) <= 8:
            return True

        if len(words) <= 3 and any(w in greeting_starters for w in words):
            return True

        return False

    def is_conversational_greeting_or_pleasantry(self, message: str) -> bool:
        """Alias for is_casual_or_greeting for backward compatibility."""
        return self.is_casual_or_greeting(message)

    def build_conversational_greeting_prompt(
        self,
        student_message: str,
        course_meta: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Builds a dedicated, natural conversational prompt for casual greetings and pleasantries,
        ensuring the AI responds with the warmth, flexibility, and friendliness of standard commercial LLMs
        (like ChatGPT, Claude, and Gemini) without robotic boilerplate or unprompted course dumping.
        """
        course_code = course_meta.get("course_code") if course_meta else None
        course_title = course_meta.get("course_title") if course_meta else None
        course_info = f"Course: {course_code} - {course_title}" if course_code else "General Academic Study Session (No specific course selected)"

        history_lines = []
        if conversation_history:
            for turn in conversation_history[-4:]:
                role = "Student" if turn.get("role") in ["user", "student"] else "Assistant"
                txt = turn.get("content") or turn.get("text") or ""
                if txt:
                    history_lines.append(f"{role}: {txt}")
        history_section = ("Recent conversation:\n" + "\n".join(history_lines) + "\n\n") if history_lines else ""

        return f"""You are a warm, encouraging, friendly university academic tutor and study assistant (similar to ChatGPT or Claude).
Active Study Context: {course_info}
{history_section}Student: "{student_message}"

Directives for your response:
1. Respond warmly, naturally, and conversationally in 1-2 friendly sentences.
2. Greet the student (e.g. Hello, Good day, Welcome) like a supportive human tutor, and ask how their study session or revision is going.
3. If an active course is specified ({course_code or 'none'}), you can casually mention it (e.g. asking if they want to review any topic or past paper for {course_code}), but do NOT lecture, quote syllabus outlines, or dump course data.
4. Do NOT use markdown asterisks (no bold ** or italics *). Keep formatting clean and human.
5. Do NOT use stiff, robotic boilerplate or canned corporate bot announcements (such as "I am your Study Better AI Agent...").
6. Under no circumstances say "I don't have information about that in the verified course materials" for a casual greeting, small talk, or polite conversation.
"""

    def generate_conversational_greeting_reply(
        self,
        message: str,
        course_meta: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generates a natural, flexible, warm conversational greeting or pleasantry reply.
        Mirrors commercial LLM conversational fluency (ChatGPT, Claude, Gemini) with zero robotic rigidity.
        Does not dump unprompted course data and avoids raw markdown asterisks.
        """
        q_lower = message.lower().strip()
        course_code = course_meta.get("course_code") if course_meta else None
        course_title = course_meta.get("course_title") if course_meta else None

        # 1. Who are you / Capabilities / System meta-inquiries
        if any(w in q_lower for w in ["who are you", "what are you", "how do you work", "what can you do", "what do you do", "how does this work", "what is this"]):
            if course_code:
                options = [
                    f"Hello! I am your study companion and tutor for {course_code} ({course_title}). I help you prepare for coursework and semester exams using verified past questions and official marking schemes. What topic or exam question would you like to explore today?",
                    f"Hi! I am your Study Better academic assistant for {course_code}. You can ask me to explain difficult concepts, solve past exam problems, or break down marking criteria. How can I assist your study session today?",
                    f"Welcome! I am your academic revision partner for {course_code}. I am here to help you master syllabus concepts and practice with official past questions. What are you looking to review today?"
                ]
            else:
                options = [
                    "Hello! I am your Study Better academic study assistant. I help university students prepare for coursework and semester exams using verified past papers and official marking criteria. Select a course or drop any past question, and let's get started!",
                    "Hi there! I am your academic study companion. I can help you understand tough concepts, review past examination questions, and analyze marking rubrics. Which subject would you like to focus on today?",
                    "Welcome! I am your AI academic tutor. I am here to assist your revision by grounding answers directly in verified university past papers. Let me know what course or question you would like to tackle."
                ]
            return random.choice(options)

        # 2. Well-being / Casual Inquiries ("how are you", "what's up", "how is it going")
        elif any(w in q_lower for w in ["how are you", "how r u", "how is it going", "how are you doing", "what's up", "whats up", "how do you do", "how have you been"]):
            if course_code:
                options = [
                    f"I'm doing great, thank you for asking! Feeling ready to assist your study session for {course_code}. How are your studies going today?",
                    f"Doing well, thanks for checking in! Excited to help you revise {course_code}. How is your day treating you so far?",
                    f"All good on my end, thank you! Ready to dive into some {course_code} past questions or concepts whenever you are. How are you holding up?",
                    f"I'm doing wonderful, thanks! Ready to assist you with your {course_code} revision. What topic or question shall we tackle first?",
                    f"Doing great and feeling energized! Hope your day is going smoothly. Ready to explore some {course_code} material together?"
                ]
            else:
                options = [
                    "I'm doing well, thank you for checking in! Feeling ready to assist your study session. How are your classes and studies going today?",
                    "Doing great, thank you! Excited to help you revise. How has your day been treating you so far?",
                    "All good on my side, thanks for asking! Ready to help you break down questions or difficult topics. How are you doing today?",
                    "I'm doing wonderful, thank you! Hope you're having a good, productive day. What course or topic can I assist you with?",
                    "Doing well and ready to help! How is your study session shaping up today?"
                ]
            return random.choice(options)

        # 3. Morning Greetings
        elif any(w in q_lower for w in ["morning", "good morning"]):
            if course_code:
                options = [
                    f"Good morning! Hope you're starting the day feeling refreshed. Ready for some productive study on {course_code}?",
                    f"A very good morning to you! Welcome back. Which topic or past exam question in {course_code} should we kick off with today?",
                    f"Good morning! Great to see you early. How is your preparation for {course_code} going so far?",
                    f"Morning! Let's make today a productive study day. What concept or problem in {course_code} can I assist you with this morning?"
                ]
            else:
                options = [
                    "Good morning! Hope you're starting the day feeling refreshed. What course or topic would you like to prepare for today?",
                    "A very good morning to you! Welcome to your study session. Ready to tackle some revision today?",
                    "Morning! Great to see you early. Let's make today a productive study day. What subject is on your agenda?",
                    "Good morning! Hope your day is off to a great start. What past paper or concept can I assist you with today?"
                ]
            return random.choice(options)

        # 4. Afternoon Greetings
        elif any(w in q_lower for w in ["afternoon", "good afternoon"]):
            if course_code:
                options = [
                    f"Good afternoon! Taking some dedicated time out to study {course_code}? What question or topic can I assist you with?",
                    f"Good afternoon! Hope your day is going smoothly. Ready to review some past papers or syllabus concepts for {course_code}?",
                    f"Hello, good afternoon! Welcome back. How is your revision for {course_code} shaping up today?",
                    f"Good afternoon! Always glad to study with you. What area of {course_code} shall we work through this afternoon?"
                ]
            else:
                options = [
                    "Good afternoon! Taking some time out for a productive study session? What course or topic can I assist you with?",
                    "Good afternoon! Hope your day is going smoothly. What subject or exam question would you like to review?",
                    "Hello, good afternoon! Welcome in. What can we solve or break down together this afternoon?",
                    "Good afternoon! Ready when you are. What course are you focusing on today?"
                ]
            return random.choice(options)

        # 5. Evening Greetings
        elif any(w in q_lower for w in ["evening", "good evening"]):
            if course_code:
                options = [
                    f"Good evening! Putting in some dedicated revision time for {course_code}? Let me know what concept or question we should tackle tonight.",
                    f"Good evening! Hope you've had a productive day. Ready to work through a past paper or review some notes for {course_code}?",
                    f"Evening! Wrapping up the day with some focused study on {course_code}? I am right here to help you work through it.",
                    f"Good evening! Let's get through some solid preparation for {course_code} tonight. What topic should we look at?"
                ]
            else:
                options = [
                    "Good evening! Putting in some evening study time? Let me know which course or topic you would like to work through tonight.",
                    "Good evening! Hope you've had a productive day. What exam question or concept should we solve together tonight?",
                    "Evening! Wrapping up the day with some focused revision? Welcome in, let me know what we can look at.",
                    "Good evening! Ready for some focused study tonight? What subject can I assist you with?"
                ]
            return random.choice(options)

        # 6. Gratitude / Pleasantries
        elif any(w in q_lower for w in ["thanks", "thank you", "thank u", "cheers", "awesome", "great", "perfect", "appreciate"]):
            options = [
                "You're very welcome! Let me know whenever you're ready for another question, concept explanation, or past paper review.",
                "Happy to help! How is the rest of your study session feeling? Feel free to ask anytime another question comes up.",
                "Anytime! Glad I could assist. Whenever you're ready to tackle another topic or exam problem, just drop it here.",
                "You're welcome! Best of luck with your revision, and let me know if you need any more clarification."
            ]
            return random.choice(options)

        # 7. General Greetings (hello, hi, hey, howdy, etc.)
        else:
            if course_code:
                options = [
                    f"Hey there! Great to see you. How is your study session going? Ready to dive into some {course_code} revision?",
                    f"Hello! Welcome back. What topic, concept, or past exam question in {course_code} can we work on together today?",
                    f"Hi! Hope your day is going smoothly. How is your prep for {course_code} coming along? What would you like to review?",
                    f"Hey! Always glad to study with you. What concept or past paper problem in {course_code} should we tackle today?",
                    f"Hello there! Ready when you are. What area of {course_code} shall we explore today?",
                    f"Hi! Good to have you here. How is your revision going? Let me know which {course_code} question or topic you want to tackle."
                ]
            else:
                options = [
                    "Hey there! Great to see you. How is your study session going today? What subject or topic would you like to dive into?",
                    "Hello! Welcome in. What course or past exam question are you working on today?",
                    "Hi! Hope your day is going well. Ready to tackle some revision or work through a tricky problem?",
                    "Hey! Always glad to help you study. What topic or concept would you like to review today?",
                    "Hello there! Ready whenever you are. What course or past paper are you looking into today?",
                    "Hi! Hope you're having a smooth and productive day. What can we solve or break down together?"
                ]
            return random.choice(options)

    def resolve_course(self, course_id_or_code: Optional[str]) -> Optional[Dict[str, Any]]:
        """Resolves course code and UUID from SQLite database."""
        if not course_id_or_code:
            return None
        val = course_id_or_code.strip()
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT course_id, course_code, course_title, department, level, semester, credit_units
                FROM courses
                WHERE course_id = ? OR course_code = ? COLLATE NOCASE
                LIMIT 1;
                """,
                (val, val)
            )
            row = cursor.fetchone()
            conn.close()
            if row:
                return dict(row)
        except Exception as e:
            print(f"[RAGQueryEngine] Course resolution error: {e}")
        return {"course_id": val, "course_code": val, "course_title": val}

    def extract_course_code_from_text(self, text: str) -> Optional[str]:
        """
        Extracts course code (e.g. 'CSC 321', 'MTH 201', 'CSC231') from message text.
        Validates against indexed courses in SQLite agent memory.
        """
        if not text:
            return None
        match = re.search(r"\b([A-Za-z]{2,4})\s*(\d{2,3}[A-Za-z]?)\b", text)
        if match:
            candidate = f"{match.group(1).upper()} {match.group(2).upper()}"
            course = self.resolve_course(candidate)
            if course and course.get("course_title") != candidate:
                return course.get("course_code")
            return candidate
        return None

    def extract_query_content_terms(self, query: str) -> List[str]:
        """Extracts key searchable conceptual keywords from student query."""
        stopwords = {
            'what', 'is', 'are', 'the', 'a', 'an', 'in', 'of', 'to', 'for', 'and', 'or', 'how', 
            'does', 'do', 'did', 'why', 'can', 'you', 'tell', 'me', 'about', 'give', 'explain', 
            'describe', 'define', 'definition', 'discuss', 'differentiate', 'distinguish', 
            'difference', 'between', 'list', 'state', 'solve', 'calculate', 'derive', 'with', 
            'from', 'by', 'on', 'at', 'it', 'its', 'this', 'that', 'these', 'those', 'which', 
            'tutor', 'please', 'course', 'exam', 'question', 'questions', 'past', 'paper', 
            'papers', 'notes', 'lecture', 'curriculum', 'syllabus', 'department', 'session',
            'who', 'whom', 'whose', 'where', 'when', 'should', 'would', 'could', 'want', 'need', 'know',
            'write', 'help', 'provide', 'study', 'better',
            'become', 'becoming', 'became', 'get', 'getting', 'got', 'make', 'making', 'made',
            'take', 'taking', 'took', 'come', 'coming', 'came', 'go', 'going', 'went', 'gone',
            'see', 'seeing', 'saw', 'seen', 'look', 'looking', 'looked', 'way', 'ways', 'much',
            'many', 'more', 'most', 'also', 'just', 'like', 'well', 'good', 'best', 'start',
            'starting', 'started', 'time', 'times', 'think', 'thinking', 'thought', 'say',
            'saying', 'said', 'play', 'playing', 'played', 'work', 'works', 'working', 'worked',
            'learn', 'learning', 'teach', 'teaching', 'find', 'finding', 'found', 'give',
            'giving', 'given', 'try', 'trying', 'tried', 'use', 'using', 'used', 'ask',
            'asking', 'asked', 'feel', 'feeling', 'felt', 'seem', 'seeming', 'seemed', 'keep',
            'keeping', 'kept', 'let', 'put', 'show', 'showing', 'shown', 'thing', 'things',
            'person', 'people', 'man', 'men', 'woman', 'women', 'child', 'children', 'life',
            'world', 'year', 'years', 'day', 'days', 'hour', 'hours', 'minute', 'minutes',
            'second', 'seconds', 'able', 'great', 'small', 'big', 'new', 'old', 'high', 'low'
        }
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', query.lower())
        words = [w for w in cleaned.split() if len(w) > 2 and w not in stopwords and not re.match(r'^[a-z]{2,4}\s*\d{2,4}$', w)]
        return words

    def retrieve_top_chunks(
        self, 
        student_message: str, 
        course_id: Optional[str] = None, 
        top_k: int = 5,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Embeds the student_message using text-embedding-004 and retrieves top_k most
        similar chunks from the vector store, filtered by course_id / course_code.
        Enforces a similarity threshold guard: if top match does not meet threshold,
        passes NO context to the LLM.
        """
        course_meta = self.resolve_course(course_id) if course_id else None
        target_code = course_meta.get("course_code") if course_meta else (course_id if course_id and not course_id.startswith("all") else None)

        # Anti-hallucination guardrail: if a specific course code was requested, verify existence
        if target_code:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT course_code FROM courses WHERE UPPER(course_code) = ?;", (target_code.upper().strip(),))
            c_row = cursor.fetchone()
            conn.close()
            if not c_row:
                # Target course is not in the institutional knowledge base.
                # Refuse to hallucinate or return random ungrounded departmental materials.
                return []

        # 1. Check memory for exact keyword/content matches from database
        terms = self.extract_query_content_terms(student_message)
        keyword_chunks = []
        if terms:
            try:
                conn = get_connection()
                cursor = conn.cursor()
                like_clauses = ["dc.chunk_text LIKE ?" for _ in terms]
                where_course = "AND UPPER(c.course_code) = ?" if target_code else ""
                sql = f"""
                SELECT dc.chunk_id, dc.chunk_text, ed.document_type, s.academic_year, c.course_code, dc.page_number, ed.source_filename
                FROM document_chunks dc
                JOIN examination_documents ed ON dc.document_id = ed.document_id
                JOIN sessions s ON ed.session_id = s.session_id
                JOIN courses c ON s.course_id = c.course_id
                WHERE ({' OR '.join(like_clauses)}) {where_course}
                LIMIT 30;
                """
                params = [f"%{t}%" for t in terms]
                if target_code:
                    params.append(target_code.upper())
                cursor.execute(sql, params)
                raw_rows = cursor.fetchall()
                conn.close()

                # Score each row by distinct query term matches to rank the exact question at the top
                terms_set = set(t.lower() for t in terms)
                scored_rows = []
                for r in raw_rows:
                    txt = r["chunk_text"]
                    tokens = set(re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', txt.lower()))
                    exact_count = sum(1 for t in terms_set if t in tokens)
                    stem_count = sum(1 for t in terms_set if t not in tokens and len(t) >= 4 and any(tk.startswith(t[:4]) for tk in tokens))
                    match_score = (exact_count * 5) + (stem_count * 2)
                    scored_rows.append((match_score, r))

                scored_rows.sort(key=lambda x: x[0], reverse=True)

                for match_score, r in scored_rows:
                    c_code = r["course_code"]
                    acad_year = r["academic_year"]
                    doc_type = r["document_type"]
                    page_no = r["page_number"]
                    sim_val = round(min(0.96, 0.70 + (match_score * 0.04)), 4)
                    keyword_chunks.append({
                        "chunk_id": r["chunk_id"],
                        "text": r["chunk_text"],
                        "document_title": r["source_filename"],
                        "source_filename": r["source_filename"],
                        "page_number": int(page_no) if str(page_no).isdigit() else 1,
                        "doc_type": doc_type,
                        "course_code": c_code,
                        "academic_year": acad_year,
                        "similarity": sim_val,
                        "citation": f"[{c_code} · {acad_year} · {doc_type.replace('_', ' ').title()} · Page {page_no}]"
                    })
            except Exception as e:
                print(f"[RAGQueryEngine] SQLite keyword retrieval notice: {e}")

        # 2. Embed student message using text-embedding-004
        try:
            query_embeddings = compute_gemini_embeddings([student_message], api_key=self.api_key)
        except Exception as e:
            print(f"[RAGQueryEngine] Embedding error: {e}")
            query_embeddings = None

        results = None
        # 3. Search Gemini 768-dim collection first if available
        where_filter = None
        if target_code:
            where_filter = {"course_code": target_code.upper().strip()}

        if self.vector_store.gemini_collection.count() > 0 and query_embeddings:
            try:
                results = self.vector_store.gemini_collection.query(
                    query_embeddings=query_embeddings,
                    n_results=top_k,
                    where=where_filter,
                    include=["documents", "metadatas", "distances"]
                )
            except Exception as e:
                print(f"[RAGQueryEngine] Gemini vector search notice: {e}")

        # 4. Fallback to standard collection if needed
        if not results or not results.get("documents") or len(results["documents"][0]) == 0:
            try:
                results = self.vector_store.collection.query(
                    query_texts=[student_message],
                    n_results=top_k,
                    where=where_filter,
                    include=["documents", "metadatas", "distances"]
                )
            except Exception as e:
                print(f"[RAGQueryEngine] Standard collection search notice: {e}")

        # 5. If no specific course was targeted and no results found, search across general archive
        if (not results or not results.get("documents") or len(results["documents"][0]) == 0) and not target_code:
            try:
                results = self.vector_store.gemini_collection.query(
                    query_embeddings=query_embeddings,
                    n_results=top_k,
                    include=["documents", "metadatas", "distances"]
                )
            except Exception:
                results = self.vector_store.collection.query(
                    query_texts=[student_message],
                    n_results=top_k,
                    include=["documents", "metadatas", "distances"]
                )

        formatted_chunks = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            dists = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
            ids = results["ids"][0] if results.get("ids") else [""] * len(docs)

            for doc, meta, dist, chunk_id in zip(docs, metas, dists, ids):
                similarity = max(0.0, min(1.0, 1.0 - (dist if dist is not None else 0.5)))
                
                doc_title = (
                    meta.get("document_title") or 
                    meta.get("source_filename") or 
                    "Department Examination Archive"
                )
                source_fn = meta.get("source_filename") or doc_title
                page_no = meta.get("page_number", 1)
                doc_type = meta.get("doc_type") or meta.get("document_type") or "lecture_material"
                c_code = meta.get("course_code") or (target_code if target_code else "CSC")
                acad_year = meta.get("academic_year") or meta.get("year") or "Recent Session"

                formatted_chunks.append({
                    "chunk_id": chunk_id,
                    "text": doc,
                    "document_title": doc_title,
                    "source_filename": source_fn,
                    "page_number": int(page_no) if str(page_no).isdigit() else 1,
                    "doc_type": doc_type,
                    "course_code": c_code,
                    "academic_year": acad_year,
                    "similarity": round(float(similarity), 4),
                    "citation": f"[{c_code} · {acad_year} · {doc_type.replace('_', ' ').title()} · Page {page_no}]"
                })

        # Combine keyword-matched chunks and vector chunks, deduplicating by chunk_id
        seen_ids = set()
        merged_chunks = []
        for c in keyword_chunks + formatted_chunks:
            if c["chunk_id"] not in seen_ids:
                seen_ids.add(c["chunk_id"])
                merged_chunks.append(c)

        # Similarity threshold guard:
        effective_threshold = similarity_threshold
        if effective_threshold is None:
            effective_threshold = 0.10

        if similarity_threshold is not None:
            merged_chunks = [c for c in merged_chunks if c.get("similarity", 0.0) >= similarity_threshold]
            if not merged_chunks:
                return []
        elif merged_chunks and merged_chunks[0]["similarity"] < effective_threshold:
            print(f"[RAGQueryEngine] Top match similarity ({merged_chunks[0]['similarity']}) < threshold ({effective_threshold}). Passing NO context.")
            return []

        # ZERO-HALLUCINATION RELEVANCE GATEKEEPER:
        # Check memory for answers: If the question asks about specific topics/terms,
        # verify that the retrieved chunks actually mention those concepts.
        # If none of the content terms appear in the retrieved chunks, discard them.
        if terms and merged_chunks:
            corpus = " ".join([c["text"].lower() for c in merged_chunks])
            corpus_tokens = set(re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', corpus))
            matched_terms = [
                t for t in terms
                if t in corpus_tokens or (len(t) >= 4 and any(ct.startswith(t[:4]) for ct in corpus_tokens))
            ]
            if not matched_terms:
                print(f"[RAGQueryEngine] Anti-Hallucination Gatekeeper: None of query terms {terms} found in retrieved chunks. Discarding irrelevant chunks.")
                return []

        return merged_chunks[:top_k]

    def build_prompt(
        self,
        student_message: str,
        course_meta: Optional[Dict[str, Any]],
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Formats context, history, and student question into a grounded Gemini prompt."""
        explicit_code = self.extract_course_code_from_text(student_message)
        course_header = ""
        if course_meta and (explicit_code or retrieved_chunks):
            course_header = (
                f"Course Focus: {course_meta.get('course_code', '')} - "
                f"{course_meta.get('course_title', '')} "
                f"({course_meta.get('department', 'Computer Science')}, "
                f"Level: {course_meta.get('level', 'Undergraduate')})\n"
            )

        # Build context section
        if retrieved_chunks:
            context_blocks = []
            for idx, c in enumerate(retrieved_chunks, start=1):
                citation = c["citation"]
                sim = c["similarity"]
                text = c["text"].strip()
                context_blocks.append(
                    f"### EXCERPT {idx} {citation} (Similarity: {sim:.2f}):\n{text}"
                )
            context_section = "\n\n".join(context_blocks)
        else:
            context_section = "NO CONTEXT RETRIEVED (Empty context provided. The verified course repository contains NO materials for this question. Do NOT hallucinate an answer. State that you do not have information about that in the verified course materials. Do NOT reference, invent, or mention any unrelated course code or department)."

        # Build conversation history
        history_section = ""
        if conversation_history:
            recent_turns = conversation_history[-6:] # last 3 turns
            formatted_history = []
            for turn in recent_turns:
                role = turn.get("role") or turn.get("sender") or "user"
                content = turn.get("content") or turn.get("text") or ""
                role_label = "Student" if role in ["user", "student"] else "CourseAware AI"
                formatted_history.append(f"{role_label}: {content}")
            if formatted_history:
                history_section = "### PREVIOUS CONVERSATION CONTEXT:\n" + "\n".join(formatted_history) + "\n\n"

        full_prompt = f"""{SYSTEM_RAG_INSTRUCTION}

{course_header}
### VERIFIED DEPARTMENTAL CONTEXT (CHROMA RETRIEVAL):
The following excerpts are retrieved directly from official university examination papers, marking schemes, and syllabus materials:
---
{context_section}
---

{history_section}### CURRENT STUDENT QUESTION:
{student_message}

Provide an authoritative, clear, and comprehensive response following the directives above. Remember to format all math in LaTeX ($...$ or $$...$$) and code in code blocks."""
        return full_prompt

    def generate_streaming_response(
        self,
        student_message: str,
        course_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        """
        Server-Sent Events (SSE) generator.
        1. Checks for casual conversation/greetings (avoids vector retrieval and dumping random course data).
        2. Passes empty context to Gemini with updated greeting directives.
        3. Emits retrieved sources as 'sources' event.
        4. Streams text chunks as 'delta' event from Gemini 1.5 Pro (with fallback).
        5. Audits response with anti-hallucination guardrail engine and emits 'done' event with final metadata.
        """
        # Auto-detect course code from message or rely on agent memory across all indexed courses
        if not course_id:
            detected_code = self.extract_course_code_from_text(student_message)
            course_meta = self.resolve_course(detected_code) if detected_code else None
            course_code = course_meta.get("course_code") if course_meta else detected_code
        else:
            course_meta = self.resolve_course(course_id)
            course_code = course_meta.get("course_code") if course_meta else (course_id if not course_id.startswith("all") else None)

        # 1. QUERY INTENT GUARD: Check casual greetings & meta-questions
        if self.is_casual_or_greeting(student_message):
            # Emit empty sources list (zero retrieval chunks dumped)
            yield f"data: {json.dumps({'event': 'sources', 'sources': [], 'course': course_meta})}\n\n"

            # Pass conversational greeting prompt to Gemini
            full_text_accumulator = []
            gemini_success = False
            if self.client:
                prompt = self.build_conversational_greeting_prompt(
                    student_message=student_message,
                    course_meta=course_meta,
                    conversation_history=conversation_history
                )
                models_to_try = [self.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]
                for m in models_to_try:
                    try:
                        stream = self.client.models.generate_content_stream(
                            model=m,
                            contents=prompt
                        )
                        for chunk in stream:
                            txt = getattr(chunk, "text", "") or ""
                            if txt:
                                clean_txt = txt.replace("*", "")
                                if clean_txt:
                                    full_text_accumulator.append(clean_txt)
                                    yield f"data: {json.dumps({'event': 'delta', 'delta': clean_txt})}\n\n"
                        if full_text_accumulator:
                            gemini_success = True
                            break
                    except Exception as e:
                        print(f"[RAGQueryEngine] Gemini greeting streaming notice: {e}")

            if not gemini_success:
                greeting_text = self.generate_conversational_greeting_reply(student_message, course_meta)
                words = greeting_text.split(" ")
                chunk_buf = []
                for idx, w in enumerate(words):
                    chunk_buf.append(w)
                    if len(chunk_buf) >= 3 or idx == len(words) - 1:
                        prefix = " " if full_text_accumulator else ""
                        delta_text = prefix + " ".join(chunk_buf)
                        full_text_accumulator.append(delta_text)
                        yield f"data: {json.dumps({'event': 'delta', 'delta': delta_text})}\n\n"
                        chunk_buf = []
                        time.sleep(0.015)

            final_text = "".join(full_text_accumulator).strip()

            # Guardrail audit log
            guardrail_res = self.guardrail_engine.audit_query_and_response(
                query=student_message,
                course_code=course_code,
                retrieved_chunks=[],
                response_text=final_text
            )
            guardrail_res["hallucination_risk"] = "LOW_RISK"
            guardrail_res["guardrail_action"] = "ALLOWED"
            guardrail_res["faithfulness_score"] = 1.0

            yield f"data: {json.dumps({'event': 'guardrail', 'guardrail': guardrail_res})}\n\n"
            yield f"data: {json.dumps({'event': 'done', 'full_text': final_text, 'sources_count': 0, 'guardrail': guardrail_res})}\n\n"
            return

        # 2. Retrieve top 5 most similar chunks for academic queries
        chunks = self.retrieve_top_chunks(
            student_message=student_message,
            course_id=course_code,
            top_k=5
        )

        # Auto-resolve course context from top retrieved chunk in agent memory ONLY if chunks were found
        if not course_meta and chunks and chunks[0].get("course_code"):
            course_meta = self.resolve_course(chunks[0]["course_code"])
            course_code = course_meta.get("course_code") if course_meta else chunks[0]["course_code"]

        explicit_code = self.extract_course_code_from_text(student_message)

        # Send sources metadata event
        sources_payload = [
            {
                "chunk_id": c["chunk_id"],
                "document_title": c["document_title"],
                "source_filename": c["source_filename"],
                "page_number": c["page_number"],
                "doc_type": c["doc_type"],
                "course_code": c["course_code"],
                "academic_year": c["academic_year"],
                "similarity": c["similarity"],
                "citation": c["citation"],
                "snippet": c["text"][:240] + ("..." if len(c["text"]) > 240 else "")
            }
            for c in chunks
        ]
        yield f"data: {json.dumps({'event': 'sources', 'sources': sources_payload, 'course': course_meta if (chunks or explicit_code) else None})}\n\n"

        if not chunks:
            if explicit_code:
                refusal_text = (
                    f"I don't have information about that question for {explicit_code} in the verified course materials.\n\n"
                    "To maintain academic integrity and prevent misinformation, I only provide answers directly grounded in official past examination papers, lecture notes, and marking schemes uploaded by course lecturers. "
                    f"Once your lecturer uploads the materials or marking guide for {explicit_code}, I will be able to answer questions and break down solutions for it."
                )
            else:
                refusal_text = (
                    "I don't have information about that in the verified course materials.\n\n"
                    "To maintain academic integrity and prevent misinformation, I only provide answers directly grounded in official past examination papers, lecture notes, and marking schemes uploaded by course lecturers. "
                    "Once a lecturer uploads the relevant lecture notes, syllabus materials, or marking schemes into Study Better, I will be able to answer questions and break down solutions on that topic."
                )
            words = refusal_text.split(" ")
            chunk_buf = []
            for idx, w in enumerate(words):
                chunk_buf.append(w)
                if len(chunk_buf) >= 3 or idx == len(words) - 1:
                    delta_text = (" " if idx >= 3 else "") + " ".join(chunk_buf)
                    yield f"data: {json.dumps({'event': 'delta', 'delta': delta_text})}\n\n"
                    chunk_buf = []
                    time.sleep(0.015)

            guardrail_res = self.guardrail_engine.audit_query_and_response(
                query=student_message,
                course_code=explicit_code or None,
                retrieved_chunks=[],
                response_text=refusal_text
            )
            guardrail_res["hallucination_risk"] = "LOW_RISK"
            guardrail_res["guardrail_action"] = "REFUSAL_ENFORCED"
            guardrail_res["faithfulness_score"] = 1.0

            yield f"data: {json.dumps({'event': 'guardrail', 'guardrail': guardrail_res})}\n\n"
            yield f"data: {json.dumps({'event': 'done', 'full_text': refusal_text, 'sources_count': 0, 'guardrail': guardrail_res})}\n\n"
            return

            guardrail_res = self.guardrail_engine.audit_query_and_response(
                query=student_message,
                course_code=course_code,
                retrieved_chunks=[],
                response_text=refusal_text
            )
            guardrail_res["hallucination_risk"] = "LOW_RISK"
            guardrail_res["guardrail_action"] = "REFUSAL_ENFORCED"
            guardrail_res["faithfulness_score"] = 1.0

            yield f"data: {json.dumps({'event': 'guardrail', 'guardrail': guardrail_res})}\n\n"
            yield f"data: {json.dumps({'event': 'done', 'full_text': refusal_text, 'sources_count': 0, 'guardrail': guardrail_res})}\n\n"
            return

        prompt = self.build_prompt(
            student_message=student_message,
            course_meta=course_meta,
            retrieved_chunks=chunks,
            conversation_history=conversation_history
        )

        full_text_accumulator = []
        gemini_success = False

        # 3. Stream generation via Gemini API if client is available
        if self.client:
            models_to_try = [self.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]
            for m in models_to_try:
                try:
                    stream = self.client.models.generate_content_stream(
                        model=m,
                        contents=prompt
                    )
                    for chunk in stream:
                        txt = getattr(chunk, "text", "") or ""
                        if txt:
                            full_text_accumulator.append(txt)
                            yield f"data: {json.dumps({'event': 'delta', 'delta': txt})}\n\n"
                    gemini_success = True
                    break
                except Exception as e:
                    print(f"[RAGQueryEngine] Gemini stream error on model {m}: {e}")
                    continue

        # 4. Fallback: If Gemini API is offline, key is invalid, or quota exceeded, stream institutional synthesis
        if not gemini_success:
            offline_text = self._synthesize_grounded_offline_response(
                query=student_message,
                course_meta=course_meta,
                chunks=chunks
            )
            # Stream in simulated real-time word chunks
            words = offline_text.split(" ")
            chunk_buf = []
            for w in words:
                chunk_buf.append(w)
                if len(chunk_buf) >= 3:
                    delta_text = " " + " ".join(chunk_buf)
                    full_text_accumulator.append(delta_text)
                    yield f"data: {json.dumps({'event': 'delta', 'delta': delta_text})}\n\n"
                    chunk_buf = []
                    time.sleep(0.02)
            if chunk_buf:
                delta_text = " " + " ".join(chunk_buf)
                full_text_accumulator.append(delta_text)
                yield f"data: {json.dumps({'event': 'delta', 'delta': delta_text})}\n\n"

        final_text = "".join(full_text_accumulator).strip()

        # 5. Guardrail Audit & Anti-Hallucination verification
        guardrail_res = self.guardrail_engine.audit_query_and_response(
            query=student_message,
            course_code=course_code,
            retrieved_chunks=chunks,
            response_text=final_text
        )

        yield f"data: {json.dumps({'event': 'guardrail', 'guardrail': guardrail_res})}\n\n"
        yield f"data: {json.dumps({'event': 'done', 'full_text': final_text, 'sources_count': len(sources_payload), 'guardrail': guardrail_res})}\n\n"

    def _synthesize_grounded_offline_response(
        self,
        query: str,
        course_meta: Optional[Dict[str, Any]],
        chunks: List[Dict[str, Any]]
    ) -> str:
        """
        Synthesizes an authoritative, grounded answer directly from the retrieved
        departmental chunks when running offline.
        """
        course_code = course_meta.get("course_code") if course_meta else (chunks[0]["course_code"] if chunks else "Course Material")

        if not chunks:
            c_info = f" for **{course_code}**" if course_code else ""
            return (
                f"### Institutional Repository Notice\n\n"
                f"I don't have information for that question{c_info} in the verified course materials.\n\n"
                f"To maintain academic integrity and prevent misinformation, I only answer questions that are directly grounded in your department's uploaded past papers, lecture notes, and marking schemes. "
                f"If this topic is part of your syllabus, please ask your lecturer to upload the relevant lecture notes or marking guide into Study Better."
            )

        # Extract technical content from chunks
        top_chunk = chunks[0]
        raw_text = top_chunk["text"].strip()

        # Clean examination headers
        clean_lines = []
        for line in raw_text.split("\n"):
            line_str = line.strip()
            if not line_str:
                continue
            if any(h in line_str.lower() for h in ["university of ibadan", "b.sc. degree", "time allowed", "instructions:"]):
                continue
            clean_lines.append(line_str)

        body_text = "\n\n".join(clean_lines) if clean_lines else raw_text

        response_parts = [
            f"### {course_code}: Grounded Answer\n",
            body_text
        ]

        if len(chunks) > 1:
            second_chunk = chunks[1]
            second_lines = [l.strip() for l in second_chunk["text"].split("\n") if l.strip() and not any(h in l.lower() for h in ["university of ibadan", "b.sc. degree", "time allowed", "instructions:"])]
            if second_lines:
                response_parts.append(f"\n#### Additional Details:\n" + "\n\n".join(second_lines[:4]))

        return "\n\n".join(response_parts)
