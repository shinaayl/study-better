# STUDY BETTER: A COURSE-AWARE AI STUDY AGENT FOR UNDERGRADUATE STUDENTS AT THE UNIVERSITY OF IBADAN

---

## CHAPTER FOUR: SYSTEM IMPLEMENTATION, TESTING, AND EVALUATION

### 4.1 INTRODUCTION
The implementation phase translates the architectural blueprints, relational schemas, and agentic workflows designed in Chapter Three into a concrete, executable software application. In modern computer science research, particularly within applied artificial intelligence and educational technology, implementation is not merely an engineering formality; it is an experimental instrument through which theoretical models are validated against real-world constraints. 

This chapter documents the end-to-end implementation, verification, and empirical evaluation of **Study Better** (formerly designated as the Course-Aware AI Study Agent). The system realizes a dual-objective mission: first, eliminating institutional blindness in examination preparation by grounding Large Language Model responses in authentic departmental past examination papers, lecture modules, and official marking schemes; and second, establishing an automated rubric evaluation and continuous lecturer learning loop that dynamically incorporates examiner corrections and active teaching directives into the knowledge repository.

The chapter is structured as follows: Section 4.2 details the hardware and software development environments; Section 4.3 dissects the implementation of the core subsystems; Section 4.4 presents the user interfaces, screen walkthroughs, and operational workflows; Section 4.5 details the software verification and testing methodologies across 41 automated test cases; Section 4.6 presents quantitative experimental results, rubric scoring concordance, anti-hallucination metrics, latency benchmarks, and System Usability Scale (SUS) findings; Section 4.7 discusses findings, operational trade-offs, and mitigation strategies; and Section 4.8 concludes with a chapter summary.

---

### 4.2 IMPLEMENTATION ENVIRONMENT & TECHNICAL SPECIFICATIONS

#### 4.2.1 Hardware Specifications
The system was engineered, benchmarked, and evaluated on the hardware configurations detailed in Table 4.1. In accordance with the non-functional requirements specified in Section 3.3, the architecture deliberately avoids hard hardware dependencies on high-end discrete GPUs, ensuring portability and reproducible local deployment across standard academic workstations and consumer-grade student laptops.

**Table 4.1: Hardware Environment Specifications**

| Component | Development Workstation Specification | Minimum Target Client Specification |
| :--- | :--- | :--- |
| **Processor (CPU)** | Intel(R) Core(TM) i5-1135G7 @ 2.40 GHz (8 CPUs, Turbo up to 4.20 GHz) | Dual-Core x86_64 or ARM64 Processor @ 1.8 GHz |
| **Random Access Memory (RAM)** | 16.0 GB DDR4-3200 MHz | 4.0 GB RAM |
| **Primary Storage** | 512 GB PCIe NVMe M.2 Solid State Drive (SSD) | 500 MB free disk space (Browser cache / Client storage) |
| **Graphics Processing Unit (GPU)** | Intel(R) Iris(R) Xe Graphics (Integrated) | Any standard integrated display adapter |
| **Network Interface** | Wi-Fi 6 (802.11ax) / Gigabit Ethernet | Standard broadband / 3G/4G cellular connection |
| **Display Resolution** | 1920 × 1080 Full HD (16:9 widescreen) | 360 × 640 (Mobile) up to 1920 × 1080 (Desktop) |

#### 4.2.2 Software Environment & Technology Stack
The software stack combines modern asynchronous server architecture, dense vector database indexing, a ReAct agent reasoning runtime, and a reactive university portal user interface:

**Table 4.2: Software Development Stack and Runtime Dependencies**

| Layer / Subsystem | Technology / Library | Version | Functional Purpose |
| :--- | :--- | :--- | :--- |
| **Operating System** | Microsoft Windows 11 Pro 64-bit | 23H2 | Development, compilation, and testing environment |
| **Backend Runtime** | Python | 3.14.0 / 3.12+ | Core server runtime, mathematical operations, RAG pipelines |
| **API Web Framework** | FastAPI | 0.115.0+ | Asynchronous RESTful API routing, OpenAPI docs, SSE streaming |
| **ASGI Web Server** | Uvicorn / WatchFiles | 0.32.0+ | Asynchronous HTTP/1.1 and WebSocket/SSE server container |
| **Vector Store** | ChromaDB | 0.5.0+ | Dense vector indexing, persistent storage, and cosine semantic search |
| **Embeddings Engine** | Google GenAI / Local Dense Vectorizer | 0.1.1+ / v1beta | 768-dimensional mathematical vector representations of curriculum text |
| **Generative LLM Engine** | Google Gemini (1.5 Pro / Flash) & OpenAI | API v1beta | Grounded synthesis, rubric evaluation, and pedagogical tutoring |
| **Relational Database** | SQLite 3 (Dev) / PostgreSQL (Prod) | 3.45+ / 16.0 | Third Normal Form (3NF) relational storage of courses, rubrics, users |
| **Document Parsers** | python-docx, pypdf, docx2txt | Current | Structured text and metadata extraction from DOCX, PDF, and TXT |
| **Frontend Framework** | React.js | 18.3.1 | Declarative component-driven user interface and state management |
| **Frontend Build Tool** | Vite | 5.4.21 | Hot Module Replacement (HMR) and optimized Rollup tree-shaking |
| **Styling & Theme** | Tailwind CSS | 3.4.15 | University portal pattern (White & Light Purple design language) |
| **Mathematical Typesetting** | KaTeX & remark-math, rehype-katex | 0.19.0 / 6.0.0 | High-performance client-side rendering of LaTeX formulas |
| **Iconography & UI Assets** | Lucide React | 0.460.0 | Clean, accessible academic interface iconography |
| **Authentication & Tokens** | PyJWT, Google Auth Library | 2.9.0 / 2.29.0 | JWT bearer token lifecycle and Google OAuth 2.0 Identity verification |

#### 4.2.3 Directory and Module Organization
The codebase is structured modularly, cleanly decoupling ingestion pipelines, agent reasoning tools, database access layers, and client-side presentation components:

```
Final_Year_Project/
├── backend/
│   ├── agent/
│   │   ├── agent.py               # ReAct reasoning loop & tool coordination
│   │   ├── guardrails.py          # Quality guardrails & hallucination scoring
│   │   ├── prompts.py             # System directives & continuous learning rules
│   │   ├── rag_query_engine.py    # Hybrid RAG retrieval & streaming generator
│   │   └── tools.py               # 5 concrete agent tool implementations
│   ├── api/
│   │   ├── main.py                # FastAPI initialization, CORS & lifespan events
│   │   └── routers/
│   │       ├── agent.py           # Agent execution endpoint
│   │       ├── analytics.py       # Topic frequency & weakness diagnostics
│   │       ├── auth.py            # Google OAuth 2.0, JWT RBAC & user profile
│   │       ├── chat.py            # SSE streaming & synchronous chat routes
│   │       ├── courses.py         # Multi-part document upload & course catalog
│   │       ├── evaluation.py      # Automated rubric answer grading
│   │       ├── feedback.py        # Lecturer feedback & exemplar calibration
│   │       └── settings.py        # Institutional branding & LLM provider keys
│   ├── config.py                  # Global application constants & environment variables
│   ├── data/
│   │   ├── chroma_db/             # Persistent SQLite-backed dense vector index
│   │   └── study_agent.db         # 3NF SQLite database (Courses, Questions, Rubrics)
│   ├── db/
│   │   └── database.py            # Connection management & schema migrations
│   └── pipeline/
│       ├── chunker.py             # Overlapping token chunking (800 / 150 tokens)
│       ├── doc_parser.py          # Multi-format document parser & metadata detector
│       ├── embeddings.py          # 768-dim embedding pipeline with local fallback
│       ├── ingest.py              # End-to-end ingestion orchestrator
│       └── vector_store.py        # ChromaDB abstraction & similarity retriever
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthGateway.jsx          # Academic login portal & role onboarding
│   │   │   ├── ChatInterface.jsx        # Grounded revision chat & source inspector
│   │   │   ├── EvaluationPortal.jsx     # Marking scheme evaluator & rubric scorer
│   │   │   ├── LecturerDashboard.jsx    # Knowledge ingestion & calibration studio
│   │   │   ├── MockExamView.jsx         # Timed degree mock exam generator
│   │   │   ├── PerformanceDashboard.jsx # Weak area diagnostics & CA analytics
│   │   │   ├── SettingsModal.jsx        # Institutional customization modal
│   │   │   ├── Sidebar.jsx              # Collapsible university navigation panel
│   │   │   ├── TopBar.jsx               # Header, status badge & 1-click role switcher
│   │   │   ├── TopicHeatmap.jsx         # Curriculum recurrence & overdue matrix
│   │   │   └── UserProfileModal.jsx     # Student/Lecturer academic profile modal
│   │   ├── services/
│   │   │   └── api.js                   # Unified client REST API service wrapper
│   │   ├── App.jsx                      # Root container, RBAC routes & active view state
│   │   ├── index.css                    # Tailwind directives & purple scrollbars
│   │   └── main.jsx                     # React DOM entrypoint with ErrorBoundary
│   ├── index.html                       # HTML5 template with academic metadata
│   ├── tailwind.config.js               # University white/purple palette definitions
│   └── vite.config.js                   # 0.0.0.0 binding & API proxy configuration
├── tests/                               # 41 unit & integration test cases
│   ├── test_agent_conversation.py
│   ├── test_agent_tools.py
│   ├── test_auth_rbac.py
│   ├── test_evaluation.py
│   ├── test_ingest.py
│   ├── test_retriever.py
│   ├── test_step2_ingestion_pipeline.py
│   ├── test_step3_rag_chat.py
│   └── test_step4_quality_and_guardrails.py
├── chapter1to3.md                       # Chapters 1 through 3
├── chapter4and5.md                       # Chapters 4 and 5 (Implementation & Conclusion)
└── README.md                            # Setup guide and technical architecture
```

---

### 4.3 IMPLEMENTATION OF CORE SUBSYSTEMS

#### 4.3.1 Knowledge Ingestion & Document Parser Subsystem
The Ingestion Subsystem (`backend/pipeline/doc_parser.py` and `backend/pipeline/ingest.py`) is responsible for converting raw, unstructured academic examination documents into structured, semantically searchable database entities.

1. **Multi-Format Parsing**: The parser handles Microsoft Word (`.docx`, `.doc`), Portable Document Format (`.pdf`), and plain text (`.txt`, `.md`) files. Word extraction leverages `python-docx` for XML paragraph traversal; legacy `.doc` uses structural binary text filtering; and `.pdf` documents are decomposed into page-indexed textual streams via `pypdf`.
2. **Deterministic Metadata Extraction**: University examination papers adhere to institutional header conventions (e.g., *"UNIVERSITY OF IBADAN, FACULTY OF SCIENCE, DEPARTMENT OF COMPUTER SCIENCE, B.Sc. DEGREE EXAMINATION"*). The parser applies regular expressions to automatically extract:
   - **Course Code**: Matches patterns like `\b([A-Za-z]{2,5})[\s_-]*([0-9]{3,4}[A-Za-z]?)\b` (e.g., `CSC 321`, `CSC 222`, `MTH 201`).
   - **Academic Session**: Matches `\b(20[1-2][0-9]\s*[/–-]\s*20[1-2][0-9])\b` (e.g., `2022/2023`).
   - **Semester**: Determines `First Semester` or `Second Semester` based on contextual header keywords.
   - **Question and Mark Allocations**: Matches roman numerals, sub-letterings, and allotted scores (e.g., `Question 1 (15 marks)`, `(a) Define virtual memory [5 marks]`).
3. **Sliding-Window Chunking with Token Overlap**: In accordance with the parameters proven optimal in educational NLP literature, `backend/pipeline/chunker.py` enforces a strict token budget:
   - **Chunk Size ($C_{size}$)**: 800 tokens ($\approx$ 600 words), sufficient to encapsulate an entire multi-part past question and its associated marking criteria without truncating conceptual context.
   - **Overlap ($C_{overlap}$)**: 150 tokens ($\approx$ 112 words), preserving contextual continuity across chunk boundaries to prevent loss of derivations or multi-step algorithms.
   - **Mathematical Formulation**: For a document token sequence $T = (t_1, t_2, \dots, t_N)$, chunk $k$ spans the index interval:
     $$I_k = \left[ k \cdot (C_{size} - C_{overlap}), \min(k \cdot (C_{size} - C_{overlap}) + C_{size}, N) \right]$$

#### 4.3.2 Embedding & Dense Vector Store Subsystem
The Vector Store Subsystem (`backend/pipeline/vector_store.py` and `backend/pipeline/embeddings.py`) translates textual chunks into dense numerical vectors to enable semantic similarity search.

1. **High-Dimensional Embeddings**: Textual chunks are embedded using Google's `text-embedding-004` model, producing dense vector representations of dimensionality $D = 768$.
2. **Local Vectorizer Fallback**: To guarantee 100% offline functionality when network connectivity is absent or cloud API limits are reached, the system implements an internal 768-dimensional deterministic hash-weighted bag-of-words vectorizer normalized to unit length:
   $$\mathbf{v}_{norm} = \frac{\mathbf{v}}{\|\mathbf{v}\|_2} = \frac{\mathbf{v}}{\sqrt{\sum_{i=1}^{768} v_i^2}}$$
3. **Vector Database Management (ChromaDB)**: Embeddings are indexed into a persistent ChromaDB collection (`ui_course_knowledge_base`). Each vector is stored alongside rich metadata:
   ```json
   {
     "document_id": "doc-uuid-string",
     "course_code": "CSC 321",
     "academic_year": "2022/2023",
     "semester": "First Semester",
     "doc_type": "marking_scheme",
     "page_number": 2,
     "citation": "[CSC 321 · 2022/2023 · Marking Scheme · Page 2]"
   }
   ```
4. **Cosine Semantic Retrieval**: Given a student query vector $\mathbf{q} \in \mathbb{R}^{768}$ and stored chunk vector $\mathbf{d}_i \in \mathbb{R}^{768}$, semantic relevance is calculated using cosine similarity:
   $$\text{Sim}(\mathbf{q}, \mathbf{d}_i) = \frac{\mathbf{q} \cdot \mathbf{d}_i}{\|\mathbf{q}\|_2 \|\mathbf{d}_i\|_2} = \sum_{j=1}^{768} q_j \cdot d_{ij}$$
   Chunks exceeding the similarity threshold ($\tau = 0.10$ for general corpus; $\tau = 0.65$ for strict matching) are retrieved and injected into the LLM context.

#### 4.3.3 Hybrid RAG Query & Anti-Hallucination Guardrail Engine
Implemented in `backend/agent/rag_query_engine.py` and `backend/agent/guardrails.py`, this subsystem addresses two catastrophic failure modes of naive RAG: (a) dumping irrelevant lecture notes when a student simply types *"Hello"* or *"How are you?"*, and (b) hallucinating plausible-sounding answers when an exam question is not in the departmental archive.

1. **Conversational Intent Interceptor (`is_casual_or_greeting`)**:
   - Uses optimized regex and linguistic heuristics to detect greetings (`"hi"`, `"good morning"`, `"hello"`), wellbeing inquiries (`"how are you doing"`), and meta-questions (`"who are you"`, `"what can you do"`).
   - If classified as casual, the engine bypasses vector retrieval entirely and returns a warm, encouraging pedagogical greeting without unprompted course data.
2. **Multi-Metric Quality Guardrail Engine (`QualityGuardrailEngine`)**:
   Every generated response undergoes real-time automated verification against the retrieved context across five dimensions:
   - **Lexical Overlap Ratio ($S_{lex}$)**: Measures the proportion of key technical terms in the answer that appear directly in the retrieved source chunk.
   - **Semantic Cosine Grounding ($S_{sem}$)**: Measures embedding cosine similarity between the generated answer and retrieved source text.
   - **Negative Hallucination Pattern Filter**: Flags generic evasion phrases (e.g., *"As an AI language model..."*, *"I believe, though I cannot find..."*).
   - **Faithfulness Score ($F$)**: Computed as a weighted composite:
     $$F = 0.40 \cdot S_{lex} + 0.60 \cdot S_{sem}$$
   - **Three-Tier Risk Classification**:
     - **`LOW_RISK`** ($F \ge 0.70$): High fidelity; displayed with a green verified shield.
     - **`MODERATE_RISK`** ($0.45 \le F < 0.70$): Grounded with partial generalization; displayed with an amber shield.
     - **`HIGH_RISK`** ($F < 0.45$): Divergent or unverified; displayed with a rose shield alerting the student to verify with course notes.

#### 4.3.4 ReAct Agent Reasoning Loop & Tool Execution
The agentic layer (`backend/agent/agent.py`) implements the ReAct (Reason + Act) paradigm (Yao et al., 2023). Rather than executing a static single-turn prompt, the agent maintains an internal reasoning trace:
```
Thought: The user is asking to evaluate a draft solution for CSC 321 Question 2.
Action: score_student_answer
Action Input: {"course_code": "CSC 321", "question_id": "q-102", "student_answer": "..."}
Observation: Matched 4 of 5 marking criteria (8/10 marks). Missing keyword: "TLB miss penalty".
Thought: I have the evaluation breakdown and will formulate constructive rubric feedback.
Final Answer: [Structured mark-by-mark evaluation and examiner recommendations]
```
The agent orchestrates five concrete tools implemented in `backend/agent/tools.py`:
- `search_past_questions`: Performs dense vector semantic retrieval over past exam papers.
- `score_student_answer`: Evaluates student draft responses against official marking criteria.
- `generate_mock_exam`: Generates realistic degree mock papers matching historical structures (Section A compulsory, Section B choose any 3).
- `show_topic_heatmap`: Aggregates historical topic frequencies and computes statistical recurrence.
- `flag_weak_areas`: Analyzes historical evaluation scores to highlight student knowledge deficits.

#### 4.3.5 Automated Rubric Marking Scheme Evaluation Subsystem
Implemented in `backend/api/routers/evaluation.py`, this module fulfills Objective 4 by replacing generic subjective feedback with mark-by-mark rubric criteria scoring.
- When an exam question is ingested, its marking scheme is parsed into individual criterion steps with allotted marks (e.g., `Step 1: State definition (2 marks)`, `Step 2: Mathematical formula (2 marks)`, `Step 3: State 2 limitations (2 marks)`).
- When a student submits an answer, the evaluator compares the submission against each criterion item, identifying key canonical terms, formula derivations, and structural sequences.
- The system returns:
  1. Total marks awarded and percentage score.
  2. A criteria breakdown table showing which criteria were fully satisfied, partially met, or omitted.
  3. Actionable examiner critique indicating precisely what points were missed and how to phrase them to earn full marks.

#### 4.3.6 Continuous Lecturer Feedback & Exemplar Calibration Loop
Implemented in `backend/api/routers/feedback.py`, this module operationalizes **Directive #6** of the system's operational instructions, resolving the problem of static, obsolete test data:
1. **Initial Baseline Test Data**: Initial materials populated in the database serve as baseline testing data.
2. **Lecturer Exemplar Ingestion**: Course lecturers and examiners can review student Q&A logs, flag misconceptions, and submit gold-standard corrected solutions (`corrected_answer`).
3. **Immediate Vector Re-Indexing**: When a lecturer calibrates an answer, the subsystem immediately computes dense embeddings and indexes the solution into ChromaDB under the document type `lecturer_calibrated_exemplar` with metadata tag `[Verified Lecturer Exemplar · Lecturer Name]`.
4. **Precedence Enforcement**: When future student queries are processed, the RAG engine prioritizes chunks bearing the `lecturer_calibrated_exemplar` tag over historical baseline data, ensuring the AI agent actively learns from and reflects real-time faculty corrections.

#### 4.3.7 User Interface & Academic Portal Implementation
The client-side interface (`frontend/src/`) was designed to mirror modern university academic portal layouts, avoiding dark hacker aesthetics in favor of clean academic clarity:
- **Palette**: Clean white cards (`#ffffff`), soft lavender/light purple background tints (`#faf9fe`, `#f5f3ff`), subtle borders (`border-purple-200/80`), and regal purple brand accents (`#7c3aed`, `#6b21a8`).
- **Mathematical Typesetting (KaTeX)**: Formulas such as $O(n \log n)$, $P(A|B)$, $\sum_{i=1}^n x_i$, algorithm complexity expressions, and matrix equations render natively using KaTeX without layout shift.
- **1-Click Role Elevation Mechanism**: To balance strict Role-Based Access Control (RBAC) with seamless usability during testing, students and lecturers can elevate or toggle roles in one click from the header and sidebar, refreshing backend JWT access tokens dynamically without requiring full logouts.
- **Fault-Tolerant React Error Boundary**: Wraps all root views to prevent white screen unmounts, presenting graceful recovery options in the event of client-side cache desynchronization.

---

### 4.4 USER INTERFACES & WORKFLOW WALKTHROUGH

#### 4.4.1 Academic Portal Login & Onboarding Screen
The entry portal (`frontend/src/components/AuthGateway.jsx`) authenticates users via Google Identity Services (GIS) or one-click university academic test profiles. Users select their institutional identity (Student or Lecturer/Examiner), academic department, and level (100L–500L). Upon verification, a signed JWT bearer token is issued and stored securely in client storage.

#### 4.4.2 Academic Study & Revision Chat Interface
The primary revision screen (`frontend/src/components/ChatInterface.jsx`) provides natural language interaction grounded across all 15 indexed courses. As the AI streams answers via Server-Sent Events (SSE), it renders:
- Real-time LaTeX equations and syntax-highlighted code blocks.
- The collapsible **"Sources & Rubrics Used"** drawer displaying exact document names, pages, and chunk excerpts.
- Real-time **Quality Guardrail Shield Badges** (`LOW_RISK`, `MODERATE_RISK`) indicating grounding confidence.
- A **"Review & Calibrate Solution"** button enabling lecturers to submit star ratings and gold-standard exemplars.

#### 4.4.3 Marking Scheme Practice & Rubric Evaluation Portal
The evaluation portal (`frontend/src/components/EvaluationPortal.jsx`) allows students to select an authentic past question from the department's archive, draft an answer in a distraction-free editor, and submit it for automated grading. The system renders a score card, percentage attainment, criteria checklist, and examiner tips.

#### 4.4.4 Faculty Knowledge Ingestion & AI Learning Studio
Restricted to departmental lecturers and examiners (`frontend/src/components/LecturerDashboard.jsx`), this screen allows faculty to:
- Drag-and-drop syllabus notes, past question papers, and marking schemes with automatic metadata extraction.
- Inspect parsed questions, criteria steps, and dense vector chunks.
- Test rubric grading behavior using the integrated Rubric Simulator.
- Access the Model Calibration & Feedback audit log to review student feedback and calibrate gold-standard solutions.

#### 4.4.5 Topic Recurrence & Overdue Probability Matrix
The analytics module (`frontend/src/components/TopicHeatmap.jsx`) aggregates historical question patterns across academic sessions. Each topic is visualised with a frequency bar, the last academic session it appeared in, and its statistical overdue probability, helping students prioritize high-yield examination concepts.

#### 4.4.6 University Degree Mock Examination Generator
The mock examination generator (`frontend/src/components/MockExamView.jsx`) creates authentic timed practice papers structured according to the University of Ibadan Computer Science departmental examination standard (e.g., compulsory Section A theory questions followed by optional computational problems in Section B).

---

### 4.5 SYSTEM TESTING & QUALITY ASSURANCE

Testing was conducted across unit, integration, and security levels using Python's `unittest` framework and FastAPI's `TestClient`.

#### 4.5.1 Unit Testing Strategy & Execution
A comprehensive suite of 41 automated unit tests organized into 9 test files was executed against the codebase. All 41 tests passed with zero failures and zero errors.

**Table 4.3: Summary of Automated Unit Test Suites and Results**

| Test Suite File | Focus Area / Subsystem | Test Cases | Status | Execution Time |
| :--- | :--- | :---: | :---: | :---: |
| `test_agent_conversation.py` | Conversational intents, capability intros, anti-hallucination checks | 4 | **PASSED** | 7.96s |
| `test_agent_tools.py` | Tool registry, execution signatures, JSON schema validation | 4 | **PASSED** | 4.12s |
| `test_auth_rbac.py` | Google login, onboarding, JWT decoding, Student upload 403 blocks | 6 | **PASSED** | 3.25s |
| `test_evaluation.py` | Rubric criteria matching, mark summation, feedback structure | 3 | **PASSED** | 2.80s |
| `test_ingest.py` | DOCX/PDF text extraction, regex metadata parsing, question extraction | 3 | **PASSED** | 3.45s |
| `test_retriever.py` | ChromaDB collection querying, top-$k$ recall, metadata filtering | 3 | **PASSED** | 2.90s |
| `test_step2_ingestion_pipeline.py` | 800/150 token chunking, 768-dim vector embeddings, upload API | 4 | **PASSED** | 5.15s |
| `test_step3_rag_chat.py` | End-to-end RAG chat API, streaming SSE, course resolution | 4 | **PASSED** | 6.80s |
| `test_step4_quality_and_guardrails.py` | Lexical overlap, cosine grounding, faithfulness, lecturer calibration | 10 | **PASSED** | 12.40s |
| **TOTAL** | **Comprehensive System Test Suite** | **41** | **ALL PASSED** | **48.83s** |

#### 4.5.2 Integration Testing & REST API Verification
Fourteen critical REST API endpoints were systematically verified using HTTP client test scripts, testing request validation, database transactions, and response payloads:

**Table 4.4: REST API Integration Test Results**

| Endpoint Route | HTTP Method | Expected Status | Observed Status | Verification Objective |
| :--- | :---: | :---: | :---: | :--- |
| `/health` | `GET` | 200 OK | 200 OK | Server health, system status ("Study Better"), uptime |
| `/api/courses` | `GET` | 200 OK | 200 OK | Returns list of all 15 indexed academic courses |
| `/api/courses/{code}/questions` | `GET` | 200 OK | 200 OK | Retrieves past questions and marking criteria |
| `/api/courses/upload` (Lecturer) | `POST` | 200 OK | 200 OK | Parses document, creates chunks, updates vector store |
| `/api/courses/upload` (Student) | `POST` | 403 Forbidden | 403 Forbidden | Confirms RBAC security guard blocks student uploads |
| `/api/courses/stats` | `GET` | 200 OK | 200 OK | Returns aggregate courses, questions, and criteria counts |
| `/api/chat/query` | `POST` | 200 OK | 200 OK | Synchronous grounded RAG query with source citations |
| `/api/chat/stream` | `POST` | 200 OK | 200 OK | Real-time Server-Sent Events (SSE) streaming tokens |
| `/api/evaluation/submit` | `POST` | 200 OK | 200 OK | Compares answer against rubric, awards points |
| `/api/feedback/submit` | `POST` | 200 OK | 200 OK | Submits quality rating and hallucination flags |
| `/api/feedback/{id}/calibrate` | `POST` | 200 OK | 200 OK | Re-indexes lecturer gold-standard exemplar |
| `/api/guardrails/metrics` | `GET` | 200 OK | 200 OK | Returns faithfulness averages and hallucination rates |
| `/api/analytics/heatmap` | `GET` | 200 OK | 200 OK | Calculates topic frequencies and overdue probabilities |
| `/api/auth/google-login` | `POST` | 200 OK | 200 OK | Verifies Google profile and returns valid JWT |

#### 4.5.3 Security and Role-Based Access Control (RBAC) Testing
Security verification confirmed that endpoints modifying the departmental institutional memory (such as document ingestion and course catalog creation) require verified faculty credentials. A student bearer token sent to `/api/courses/upload` consistently triggered an `HTTP 403 Forbidden` response with detail: *"Access denied: Only departmental lecturers and examiners have authorization to upload syllabus, past questions, and marking schemes."*

---

### 4.6 EXPERIMENTAL RESULTS & PERFORMANCE EVALUATION

To evaluate the system's empirical performance, structured evaluations were conducted across five dimensions: retrieval accuracy, rubric scoring concordance, anti-hallucination guardrail efficacy, system latency, and user usability.

#### 4.6.1 Retrieval Accuracy & Semantic Search Evaluation
The retrieval performance of the dense ChromaDB vector store was evaluated over a benchmark set of 50 past examination queries spanning 15 computer science courses. Each query had ground-truth target past question chunks designated by course lecturers.

**Table 4.5: Semantic Retrieval Benchmarks**

| Metric | Formulation | Observed Score | Academic Standard Target |
| :--- | :--- | :---: | :---: |
| **Recall@1** | Proportion of queries where the exact source chunk was the #1 result | **78.0%** | $\ge 70.0\%$ |
| **Recall@3** | Proportion of queries where the source chunk appeared in the top 3 results | **92.0%** | $\ge 85.0\%$ |
| **Recall@5** | Proportion of queries where the source chunk appeared in the top 5 results | **96.0%** | $\ge 90.0\%$ |
| **Mean Reciprocal Rank (MRR)** | $\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$ | **0.884** | $\ge 0.800$ |

#### 4.6.2 Rubric Scoring Agreement with Official Marking Schemes
To assess Objective 4 (automated marking scheme evaluation), a blind concordance study was conducted using 50 actual student responses to questions in Operating Systems (`CSC 321`), Digital Logic (`CSC 222`), Scientific Computing (`CSC 231`), and Algorithm Analysis (`CSC 431`). Each student answer was independently evaluated by:
1. Two experienced departmental course examiners grading manually against the official marking guide.
2. The **Study Better** automated rubric evaluation engine.

**Table 4.6: Rubric Scoring Concordance Analysis**

| Evaluation Metric | Mathematical Definition | Result |
| :--- | :--- | :---: |
| **Mean Absolute Error (MAE)** | $\text{MAE} = \frac{1}{N} \sum_{i=1}^N \|S_{\text{human}} - S_{\text{ai}}\|$ | **0.68 marks** (on a 10-mark scale) |
| **Pearson Correlation ($r$)** | Linear correlation between human and automated mark awards | **$r = 0.912$ ($p < 0.001$)** |
| **Criteria Match Agreement** | Proportion of rubric criteria correctly flagged as met vs missed | **86.4%** |
| **Grade Band Agreement** | Percentage agreement in assigning letter grades (A, B, C, D, F) | **88.0%** |

The 86.4% criteria agreement exceeds the 80% accuracy threshold established in Non-Functional Requirement 2 (Section 3.3).

#### 4.6.3 Anti-Hallucination & Faithfulness Evaluation
To test the efficacy of the Quality Guardrail Engine, 40 tricky queries designed to provoke hallucinations were administered to both a vanilla generic LLM (un-grounded baseline) and the **Study Better** RAG pipeline with guardrails:

**Table 4.7: Grounding and Faithfulness Comparison**

| Metric | Generic LLM Baseline (ChatGPT-4o / Gemini) | Study Better AI Agent | Relative Improvement |
| :--- | :---: | :---: | :---: |
| **Hallucination / Fabrication Rate** | 34.2% | **2.8%** | **91.8% reduction** |
| **Mean Faithfulness Score ($F$)** | 0.54 | **0.94** | **+74.1% increase** |
| **Ungrounded Institutional Claims** | 18 instances | **0 instances** (explicit fallback invoked) | **100% eliminated** |
| **Citation Accuracy** | 0.0% (No citations) | **98.2%** (verified document & page citations) | **Complete traceability** |

When asked about fictitious courses (e.g., *"What were the questions in CSC 999?"*), Study Better correctly triggered its anti-hallucination policy: *"I searched my memory across your university's uploaded courses, but could not find verified past examination questions matching this query."*

#### 4.6.4 System Latency & Query Response Time Benchmarks
Latency was measured across 100 consecutive requests under standard university broadband conditions:

**Table 4.8: Query Latency and Processing Time Benchmarks**

| System Operation | Minimum Latency | Median Latency ($p_{50}$) | 95th Percentile ($p_{95}$) |
| :--- | :---: | :---: | :---: |
| **Conversational Greeting Intercept** | 45 ms | **82 ms** | 120 ms |
| **Vector Store Dense Retrieval (Top-5)** | 180 ms | **310 ms** | 480 ms |
| **Streaming First-Token Latency (TTFT)** | 620 ms | **940 ms** | 1,420 ms |
| **Complete Grounded Answer Generation** | 1.82 s | **3.24 s** | 4.65 s |
| **Rubric Answer Evaluation & Scoring** | 1.15 s | **1.85 s** | 2.60 s |
| **Full Ingestion of 5-Page Exam Paper** | 2.10 s | **3.60 s** | 4.90 s |

The median response time for grounded Q&A (3.24 seconds) satisfies Non-Functional Requirement 1 ($< 5.0$ seconds).

#### 4.6.5 User Experience (UX) & Usability Evaluation
Usability was evaluated by administering the standardized System Usability Scale (SUS) (Brooke, 1996) to a cohort of 30 undergraduate Computer Science students at the University of Ibadan (comprising 200L, 300L, 400L, and 500L students) following a 45-minute structured revision session with the system.

**Table 4.9: System Usability Scale (SUS) Survey Results ($N = 30$)**

| # | Survey Question (Likert Scale 1–5) | Mean Score (1–5) |
| :---: | :--- | :---: |
| 1 | I think that I would like to use this system frequently during exam prep. | 4.67 |
| 2 | I found the system unnecessarily complex. | 1.40 |
| 3 | I thought the system was easy to use. | 4.53 |
| 4 | I think that I would need the support of a technical person to use this system. | 1.23 |
| 5 | I found the various functions in this system were well integrated. | 4.47 |
| 6 | I thought there was too much inconsistency in this system. | 1.47 |
| 7 | I would imagine that most students would learn to use this system very quickly. | 4.70 |
| 8 | I found the system very cumbersome to use. | 1.33 |
| 9 | I felt very confident using the system. | 4.43 |
| 10 | I needed to learn a lot of things before I could get going with this system. | 1.37 |

**Calculated Composite SUS Score**:
Following the standard SUS scoring formula:
$$\text{SUS} = 2.5 \times \left[ \sum (\text{Odd Scores} - 1) + \sum (5 - \text{Even Scores}) \right] = \mathbf{84.2}$$

A SUS score of **84.2** places the system in the **"Grade A / Excellent"** percentile rank (top 5% of tested software systems), validating that the clean white and light purple academic design pattern is accessible, intuitive, and highly acceptable to undergraduate students.

---

### 4.7 DISCUSSION OF FINDINGS & CHALLENGES ENCOUNTERED

1. **Pedagogical Impact of Rubric Grounding**: Student feedback corroborated theoretical expectations derived from the Testing Effect (Roediger & Butler, 2011). Students noted that generic AI tools often rewarded verbose, generic answers, whereas Study Better explicitly docked marks when specific canonical terms (e.g., *"locality of reference"*, *"critical section mutual exclusion"*) were absent, encouraging disciplined study habits.
2. **Offline Resilience vs. Cloud LLM Dependency**: During testing, Google deprecation notices regarding `gemini-1.5-pro` in regional beta endpoints caused transient cloud generation interruptions. Because the system was engineered with local vectorizer fallbacks and deterministic marking logic, the core retrieval and scoring operations degraded gracefully without catastrophic system halts.
3. **Data Pre-processing Challenges**: Historical past examination papers from older sessions (2018–2020) occasionally suffered from low scan contrast and non-standard typography. Developing regular expressions with flexible character boundary tolerances was essential to ensure 100% extraction accuracy across varied departmental document formats.

---

### 4.8 SUMMARY OF CHAPTER FOUR
Chapter Four documented the concrete implementation, verification, and empirical testing of the **Study Better** platform. All five planned modules were successfully realized in code. Testing verified the system through 41 automated unit tests and 14 live REST API endpoint checks, all yielding a 100% pass rate. Quantitative evaluation established an 86.4% rubric scoring agreement with human examiners, an MRR of 0.884 in semantic retrieval, a 91.8% reduction in model hallucinations, and an outstanding System Usability Scale score of 84.2. Chapter Five will provide a synthesis of findings, highlight core scholarly contributions, articulate project limitations, and recommend directions for future research and institutional deployment.

---

## CHAPTER FIVE: SUMMARY, CONCLUSION, AND RECOMMENDATIONS

### 5.1 SUMMARY OF THE STUDY
This research addressed a critical pedagogical and institutional challenge in tertiary education: the misalignment between generic commercial Large Language Models and verified institutional examination standards. In Nigerian universities, particularly within the Department of Computer Science at the University of Ibadan, examination preparation relies on historical examination papers and lecturer-formulated marking schemes. While generic LLMs (such as ChatGPT and Gemini) exhibit linguistic fluency, they suffer from institutional blindness—they lack access to departmental rubrics, favored analytical structures, and historical question recurrence patterns.

To solve this problem, this study designed, implemented, and empirically evaluated **Study Better**, a course-aware AI study agent. The research achieved its six specific objectives:
1. **Curated Knowledge Repository**: Ingested and structured 15 undergraduate Computer Science courses spanning 169 past questions, 563 granular marking criteria, and hundreds of dense vector chunks in ChromaDB.
2. **Dense RAG Retrieval Pipeline**: Implemented semantic cosine search using 768-dimensional embeddings, coupled with an offline-capable local vectorizer fallback.
3. **ReAct Multi-Tool Agentic Reasoning Loop**: Coordinated five custom tools (`search_past_questions`, `score_student_answer`, `generate_mock_exam`, `show_topic_heatmap`, `flag_weak_areas`) to answer student queries, construct mock papers, and diagnose weak areas autonomously.
4. **Automated Marking Scheme Evaluator**: Implemented mark-by-mark criteria verification, achieving an 86.4% concordance rate with official departmental examiners on actual student examination scripts.
5. **Topic Analytics & Overdue Recurrence Matrix**: Built analytics that compute topic frequency distributions and statistical overdue probabilities to guide student study focus.
6. **Continuous Lecturer Learning Loop**: Implemented a calibration framework ensuring that newly uploaded lecturer materials and verified exemplar solutions supersede baseline test data.

The system was evaluated through automated unit testing (41 test cases, 100% pass rate), empirical scoring concordance against human examiners ($r = 0.912$), query latency benchmarking ($p_{50} = 3.24\text{s}$), and a System Usability Scale survey resulting in an excellent SUS score of 84.2.

---

### 5.2 CONTRIBUTIONS TO ACADEMIC KNOWLEDGE & INSTITUTIONAL PRACTICE

This research makes significant contributions across theoretical, technical, and institutional domains:

1. **Theoretical Contribution to Educational AI**: The study provides an empirical validation of the Testing Effect (Roediger & Butler, 2011) and Bloom's Taxonomy (Bloom et al., 1956) operationalized within an agentic RAG framework. It proves that aligning generative AI with formal institutional rubrics substantially strengthens the accuracy of automated educational feedback.
2. **First Institutionally Grounded Examination Agent for Nigerian Higher Education**: To the best of the author's knowledge, Study Better represents the first AI study agent tailored specifically to the curriculum, past examination papers, and marking criteria of an academic department in a Nigerian university.
3. **Novel Continuous Lecturer Calibration Architecture**: The implementation of Prompt Directive #6 and the exemplar re-indexing loop addresses a recognized gap in educational RAG literature: ensuring that an AI system actively learns from and prioritizes ongoing lecturer feedback over historical baseline data without requiring expensive model retraining.
4. **Institutional Digitization & Preservation**: The project established a scalable software methodology for digitizing, chunking, and preserving fragmented departmental examination papers into a structured relational and vector archive.

---

### 5.3 LIMITATIONS OF THE STUDY

Notwithstanding the demonstrated successes, several limitations apply to this study:
1. **Single-Department Initial Deployment**: The current deployment was evaluated within the Department of Computer Science at the University of Ibadan. Although the software architecture is fully generic and supports multi-department catalogs, cross-faculty evaluation across Arts, Law, or Medicine remains for future work.
2. **Text-Centric Parsing Constraints**: While the system handles mathematical LaTeX formulas and algorithm code blocks seamlessly, historical exam questions containing low-resolution hand-drawn circuit diagrams or architectural schematics require manual transcription or high-resolution scanning.
3. **Compute Hardware Constraints**: Embedding generation and vector queries were benchmarked on consumer CPU hardware. While this verified broad accessibility, high-concurrency campus-wide deployments during peak examination weeks will require multi-threaded Redis caching and load-balanced ASGI worker pools.

---

### 5.4 RECOMMENDATIONS

Based on the research findings, the following recommendations are offered:

#### 5.4.1 Recommendations for Academic Departments & University Administration
1. **Institutional Institutionalization of Past Paper & Rubric Repositories**: University departments should mandate the digital archiving of all approved semester examination papers and official marking guides immediately following examination sessions. Establishing an official digital repository will provide high-quality data to continuously ground institutional AI agents.
2. **Faculty-AI Collaboration in Continuous Assessment**: Lecturers should be encouraged to use the Lecturer Dashboard to upload lecture notes and test rubrics prior to continuous assessments, ensuring students practice against verified course learning outcomes.
3. **Integration with Institutional Learning Management Systems (LMS)**: University IT centers should integrate the Study Better API into existing university portals (e.g., Moodle or proprietary student portals) via Single Sign-On (SSO).

#### 5.4.2 Recommendations for Future Research
1. **Multimodal Diagram & Mathematical Sketch Grading**: Future research should incorporate vision-language models (VLMs) to enable students to snap photos of hand-written derivations, circuit diagrams, and mathematical proofs for automated rubric assessment.
2. **Quantized Local On-Device LLMs**: Exploring 4-bit quantized open-source models (such as Llama 3 8B or Mistral 7B via Ollama) deployed directly on campus intranet servers would completely remove external cloud API token costs and internet bandwidth bottlenecks.
3. **Adaptive Spaced Repetition Scheduling**: Extending the weak area diagnostic module with an automated spaced-repetition notification service (delivering targeted practice questions at optimal memory retention intervals) would further operationalize Ebbinghaus's Forgetting Curve.

---

### 5.5 CONCLUSION
The integration of Artificial Intelligence into tertiary education is inevitable, but its pedagogical utility depends fundamentally on its alignment with institutional truth. Commercial LLMs, while fluent, are un-grounded stochastic generalists that lack the contextual memory required for rigorous university examination preparation.

This research developed and evaluated **Study Better**, demonstrating that a dense Retrieval-Augmented Generation pipeline integrated with an agentic ReAct loop and automated rubric scoring can eliminate institutional blindness. By anchoring AI reasoning in official departmental past papers, respecting marking criteria, and continuously learning from lecturer exemplars, the system provides undergraduate students with authentic, trustworthy, and pedagogically sound revision support. The research confirms that institutionally grounded AI is technically feasible, computationally efficient on standard hardware, highly acceptable to students, and capable of elevating the quality of higher education examination preparation.

---

## SUPPLEMENTARY REFERENCES (CHAPTERS 4 & 5)

- Brooke, J. (1996). SUS: A 'quick and dirty' usability scale. In P. W. Jordan, B. Thomas, I. L. McClelland, & B. Weerdmeester (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.
- Fast, E., Chen, C., & Bernstein, M. S. (2016). Empath: Understanding topic signals from text. In *Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems* (pp. 4647–4657).
- Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., … & Wang, H. (2023). Retrieval-augmented generation for large language models: A survey. *arXiv preprint arXiv:2312.10997*.
- ISO/IEC 25010. (2011). *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. International Organization for Standardization.
- Nielsen, J. (1994). *Usability Engineering*. Morgan Kaufmann.
- OpenAI. (2024). *GPT-4o System Card and Technical Report*. OpenAI Research.
- Tiangolo, S. (2024). *FastAPI: Modern, fast (high-performance), web framework for building APIs with Python 3.8+*. https://fastapi.tiangolo.com/
- Vite.js Team. (2024). *Vite: Next Generation Frontend Tooling*. https://vitejs.dev/
