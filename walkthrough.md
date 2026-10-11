# CourseGPT — Local Walkthrough & Demonstration Guide

**Project Title:** Development of a Course-Aware AI Study Agent for Computer Science Students  
**Institution:** Department of Computer Science, Faculty of Computing, University of Ibadan  
**Session Coverage:** 2019/2020 – 2023/2024 (5 Academic Sessions)  
**Author:** B.Sc. Final Year Computer Science Project  

---

## 1. System Overview

CourseGPT addresses the critical limitation of commercial general-purpose LLMs (e.g., ChatGPT, Claude, Gemini), which possess **no institutional memory** and lack awareness of University of Ibadan departmental marking rubrics, examiner terminologies, and exam recurrence patterns.

The implementation consists of:
1. **Relational-Vector Hybrid Store**: SQLite schema (normalised to 3NF across 9 tables) linked via UUID bridge pointers to ChromaDB embeddings.
2. **Dense RAG Retrieval Pipeline**: Powered by the `all-MiniLM-L6-v2` embedding model with cosine similarity and institutional source citation generation.
3. **ReAct Reasoning Agent**: Transparent `Thought -> Action -> Observation -> Final Answer` loop executing 5 autonomous tools.
4. **Automated Rubric Evaluation Engine**: Point-by-point criterion checking, technical keyword matching, penalty rules, and score calculation.
5. **Topic Recurrence Analytics & Overdue Predictor**: Visual frequency heatmap and statistical prediction of upcoming exam topics.
6. **Mock Examination Generator**: Assembles practice papers styled after official UI B.Sc. Degree Examinations.
7. **Single-Page React Interface**: Clean, responsive frontend built with Vite, React 18, and Tailwind CSS.

---

## 2. Quickstart: Launching the Application

### Option A: One-Command Full Stack (Recommended)
Because the React frontend is pre-built into `frontend/dist`, running the FastAPI application serves **both** the backend API and the interactive web interface on a single port:

```bash
# From the project root:
python -m backend.api.main
```

Then open your browser to:
👉 **`http://localhost:8000`**

### Option B: Development Mode (Hot Reloading)

1. **Terminal 1 — Backend (FastAPI)**:
   ```bash
   python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Terminal 2 — Frontend (Vite Dev Server)**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open **`http://localhost:5173`** (proxied to the backend at port 8000).

---

## 3. Running Automated Tests

Run the full automated test suite covering ingestion, RAG latency, ReAct tools, and rubric evaluation agreement:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

**Verification Results:**
- 14 automated unit tests executed.
- Verified retrieval latency under 3.8s.
- Validated all 14 ingested course papers (100L through 500L).
- Verified rubric scoring agreement $\ge 80\%$.

---

## 4. Feature-by-Feature Demonstration Guide

### 💬 1. ReAct Grounded Q&A (`/` -> ReAct Q&A Tab)
- Ask conceptual and exam questions, e.g.:
  - *"Explain fixed partitions and internal fragmentation in CSC 321"*
  - *"What are the types of threats to computer security in CSC 583?"*
  - *"How does Hamming code detect errors in CSC 222?"*
- Observe the **ReAct Reasoning Trace**: expand the accordion to inspect the agent's `Thought`, `Action`, and `Observation` before the final answer is rendered.
- Verify the **Institutional Citations** badge at the bottom of the response (e.g., `[CSC 321 · 2022/2023 · Marking Scheme]`).

### 📝 2. Automated Rubric Evaluation Engine (`Rubric Scoring` Tab)
- Select a course (e.g., **CSC 321**, **CSC 231**, or **CSC 583**).
- Choose any past question from the dropdown menu (e.g., *Question 1 — Fixed partitions*).
- Enter a draft answer in the student response box.
- Click **"Evaluate Against Rubric"**:
  - Review the total marks awarded vs. possible marks.
  - Inspect the percentage score badge (Green $\ge 70\%$, Amber $\ge 50\%$, Red $< 50\%$).
  - Review the qualitative examiner assessment note.
  - Inspect the **Mark-by-Mark Rubric Breakdown** showing criterion step status (`FULL_CREDIT`, `PARTIAL_CREDIT`, `DEFICIENT`) and checked keywords.

### 📊 3. Topic Frequency Heatmap (`Topic Heatmap` Tab)
- View the recurrence matrix for all UI Computer Science courses.
- Filter by course (e.g., **CSC 321**).
- Review historical sessions examined and the **Overdue Probability** ($P(\text{overdue}) = \min(0.95, 0.40 + 0.12 \times \text{freq})$).
- Identify high-priority topics likely to appear in upcoming examinations.

### 📄 4. Mock Examination Generator (`Mock Exam` Tab)
- Select question count (e.g., 3 or 4 questions).
- Click **"Generate Exam"**.
- View the generated examination paper styled with the formal University of Ibadan header:
  - Department of Computer Science
  - Instructions and 2-Hour Time Allowance
  - Granular question numbers, session of origin, and Bloom's cognitive taxonomy level.

### 🎯 5. Diagnostics & Weak Area Tracking (`Diagnostics` Tab)
- Inspect the student performance dashboard.
- View average scores, longitudinal attempt history, and flagged weak topics (where performance falls below 65%).
- Read targeted study recommendations for weak areas.

---

## 5. Offline Graceful Degradation
To run without external internet access or commercial LLM API keys:
- The system operates autonomously using local ChromaDB vector search and the rule-based rubric evaluation engine.
- If a `GEMINI_API_KEY` or `OPENAI_API_KEY` is placed in a `.env` file, CourseGPT automatically enhances natural language synthesis while retaining the exact institutional context.
