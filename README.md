# CourseGPT: Course-Aware AI Study Agent

> **Development of a Course-Aware AI Study Agent for Computer Science Students**  
> Niched to the Department of Computer Science, Faculty of Computing, University of Ibadan  
> Final Year B.Sc. Computer Science Project (2024/2025 Session)

---

## Abstract
Undergraduate examination preparation in Nigerian tertiary institutions relies heavily on past questions, but students increasingly consult general-purpose Large Language Models (LLMs) that lack institutional memory. Generic LLMs are blind to departmental marking rubrics, lecturer-preferred terminologies, and historical question patterns, yielding superficially fluent answers that diverge from examiners’ expectations.

**CourseGPT** grounds exam preparation in an authentic multi-session institutional corpus across core Computer Science courses (CSC 101 through CSC 583). Its architecture integrates a dense Retrieval-Augmented Generation (RAG) pipeline in ChromaDB with an agentic ReAct loop coordinating past question retrieval, rubric-grounded answer grading, mock exam generation, topic recurrence analytics, and weakness diagnostics.

---

## Key Features

1. **ReAct Reasoning Agent**:
   - `Thought -> Action -> Observation` loop coordinating 5 autonomous tools.
   - Transparent reasoning trace displaying the agent's internal decisions.
   - Institutional citations linking every statement to official departmental documents.

2. **Automated Rubric Evaluation Engine**:
   - Compares student submissions point-by-point against official marking schemes.
   - Evaluates technical keyword presence and steps.
   - Generates quantitative marks and qualitative examiner feedback.

3. **Topic Frequency Heatmap & Overdue Analytics**:
   - Visualizes topic recurrence across examination sessions.
   - Computes statistical overdue probabilities to highlight topics likely to appear in upcoming exams.

4. **Mock Examination Generator**:
   - Generates authentic examination papers styled after official UI B.Sc. Degree papers.
   - Formatted with instructions, time allocations, and Bloom's cognitive taxonomy levels.

5. **Student Performance & Weak Area Diagnostics**:
   - Tracks longitudinal student attempts.
   - Flags vulnerable topics (< 65% average) and provides targeted study recommendations.

---

## Architecture & Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Backend Framework** | FastAPI (Python 3.14) | High throughput ASGI REST API (<3.8s latency SLA) |
| **Relational Database** | SQLite (SQLAlchemy ready) | Normalised 3NF schema (9 tables per Chapter 3 specs) |
| **Vector Database** | ChromaDB (`all-MiniLM-L6-v2`) | Dense embeddings with cosine similarity and UUID pointers |
| **Reasoning Engine** | ReAct Pattern | Multi-step agent loop with offline graceful degradation |
| **Frontend Framework** | React 18 + Vite + Tailwind CSS | Single-page application with responsive UI components |

---

## Project Structure

```
Final_Year_Project/
├── backend/
│   ├── api/
│   │   ├── main.py                  # FastAPI app & SPA static mount
│   │   ├── schemas.py               # Pydantic schemas
│   │   └── routers/
│   │       ├── agent.py             # ReAct chat & mock exam endpoints
│   │       ├── courses.py           # Catalog & past questions
│   │       ├── evaluation.py        # Rubric scoring & history
│   │       └── analytics.py         # Heatmap & weak area tracking
│   ├── agent/
│   │   ├── agent.py                 # ReAct reasoning loop
│   │   ├── prompts.py               # Grounding & evaluation prompts
│   │   └── tools.py                 # 5 agent tools
│   ├── pipeline/
│   │   ├── doc_parser.py            # .docx and .doc structured parser
│   │   ├── ingest.py                # Ingestion coordinator (DB + ChromaDB)
│   │   ├── retriever.py             # Dense RAG retriever with citations
│   │   └── vector_store.py          # ChromaDB manager
│   ├── db/
│   │   └── database.py              # Schema definition & connection pool
│   ├── config.py                    # Settings & directory paths
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # Chat, Evaluation, Heatmap, MockExam, Dashboard
│   │   ├── services/api.js          # REST client
│   │   ├── App.jsx                  # Main interface
│   │   └── index.css                # Tailwind styles
│   ├── dist/                        # Production build
│   └── package.json
├── final year pj data/              # 14 real UI CSC exam papers & marking guides
├── tests/
│   ├── test_ingest.py               # Database integrity tests
│   ├── test_retriever.py            # RAG latency & citation tests
│   ├── test_agent_tools.py          # Tool invocation tests
│   └── test_evaluation.py           # Rubric agreement tests
├── walkthrough.md                   # Complete local launch guide
└── README.md
```

---

## Running the Application

### Launch Server (Frontend + Backend on single port)
```bash
python -m backend.api.main
```
Open **`http://localhost:8000`** in your web browser.

### Run Test Suite
```bash
python -m unittest discover -s tests -p "test_*.py"
```
*(All 14 tests pass in ~4.6 seconds).*

---

## Academic Citation & Supervision
- **Project Supervisor:** S. O. Titiloye
- **Department:** Department of Computer Science, Faculty of Computing, University of Ibadan
- **Session:** 2024/2025 Academic Session
