# AI Study Agent: Course-Aware Exam Revision & Evaluation Framework

> **Universal Multi-Department Academic Study Agent & Rubric Evaluation Engine**  
> Grounded in authentic past examination papers, departmental marking schemes, and syllabus guides  
> Built as an institutional framework customizable for any department and institution.

---

## Abstract
Undergraduate examination preparation relies heavily on past questions and marking guides, but students increasingly consult general-purpose Large Language Models (LLMs) that lack institutional memory. Generic LLMs are blind to departmental marking rubrics, lecturer-preferred terminologies, and historical question patterns, yielding superficially fluent answers that diverge from examiners’ expectations.

**AI Study Agent** grounds exam preparation in authentic multi-session institutional corpora. It is a universal framework that any department (Computer Science, Economics, Law, Engineering, Sciences, etc.) or university can deploy by uploading their course materials, past questions, and marking guides. Its architecture integrates a dense Retrieval-Augmented Generation (RAG) pipeline in ChromaDB with an agentic ReAct loop coordinating past question retrieval, rubric-grounded answer grading, mock exam generation, topic recurrence analytics, weakness diagnostics, and document ingestion.

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

6. **Anti-Hallucination Quality Guardrails**:
   - Conversational greeting interception (zero document chunk dumps, `sources: []`).
   - Catalog verification ensuring safe refusals when unindexed courses are queried.
   - Grounding and faithfulness audit scores logged to SQLite `guardrail_logs`.

7. **Lecturer Feedback Loop & Model Calibration**:
   - Student and lecturer rating (1-5 stars) and hallucination reporting.
   - Lecturer calibration workflow upserting gold-standard answers into ChromaDB (`lecturer_calibrated_exemplar`).

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
│   │       ├── auth.py              # RBAC & Google OAuth authentication
│   │       ├── chat.py              # SSE Streaming RAG chat & citations
│   │       ├── courses.py           # Catalog & document management
│   │       ├── evaluation.py        # Rubric scoring & history
│   │       ├── feedback.py          # Lecturer feedback & calibration
│   │       └── analytics.py         # Heatmap & weak area tracking
│   ├── agent/
│   │   ├── agent.py                 # ReAct reasoning loop
│   │   ├── guardrails.py            # Quality control & anti-hallucination engine
│   │   ├── prompts.py               # Grounding & evaluation prompts
│   │   ├── rag_query_engine.py      # Greeting interception & RAG query synthesis
│   │   └── tools.py                 # 5 agent tools
│   ├── pipeline/
│   │   ├── chunker.py               # Semantic chunking
│   │   ├── doc_parser.py            # .docx, .doc, .pdf, .txt, .md structured parser
│   │   ├── ingest.py                # Ingestion coordinator (DB + ChromaDB)
│   │   ├── retriever.py             # Dense RAG retriever with citations
│   │   └── vector_store.py          # ChromaDB manager
│   ├── db/
│   │   └── database.py              # Schema definition & connection pool
│   ├── config.py                    # Settings & directory paths
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # ChatInterface, EvaluationPortal, LecturerDashboard, etc.
│   │   ├── services/api.js          # REST client with SSE streaming
│   │   ├── App.jsx                  # Main interface
│   │   └── index.css                # Tailwind styles
│   ├── dist/                        # Production build
│   └── package.json
├── final year pj data/              # 14 real UI CSC exam papers & marking guides
├── tests/
│   ├── test_auth_rbac.py            # Step 1: RBAC & authentication
│   ├── test_step2_lecturer_upload.py # Step 2: Upload & document management
│   ├── test_step3_rag_chat.py       # Step 3: Streaming chat & citations
│   ├── test_step4_quality_and_guardrails.py # Step 4: Quality & guardrails
│   └── ...                          # Ingestion, retriever, tools & rubric evaluation
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
*(All 41 unit tests pass across all modules).*

---

## Academic Citation & Supervision
- **Project Supervisor:** S. O. Titiloye
- **Department:** Department of Computer Science, Faculty of Computing, University of Ibadan
- **Session:** 2024/2025 Academic Session
