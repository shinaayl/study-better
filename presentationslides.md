FINAL YEAR PROJECT 
METHODOLOGY DEFENCE
CourseAware AI Study Agent
Development of A Course-Aware AI 
Study Agent for University Students
A Universal Multi-Department Framework (Tested with Computer Science Test Cohort)
2024/2025 Academic Session
INTRODUCTION
Most students depend on past questions for tests/examinations preparation and  use AI tools to get 
answers to these questions.
LLMs (ChatGpt, Gemini, Claude and the likes) often give generic answers. Most of these answers are 
not what lecturers expect/are looking for.
These AI tools lack awareness of departmental marking schemes and exam patterns. As a result, 
students often study AI-generated answers that lectures won’t grade well.
This project proposes an AI study assistant trained on 4 to 3 years of CSC past questions, marking 
schemes, and course materials for each course to help students get more accurate answers, learn 
the course-specific information and lecturers expected answers over the past sessions and deliver 
department-specific guidance and feedback.
THE PROBLEM STATEMENT
THE PROBLEM
University students often study broadly for their tests and exams, solve as many past 
questions as they can find, using LLMs without structured insight into exam patterns, 
question frequency, or how lecturers expect answers to be framed. This critical 
information exists in historical exam data but remains unorganized and inaccessible, 
leaving students to rely on guesswork and AI generated responses rather than evidence
based preparation.
Existing AI study tools such as ChatGPT, Gemini, Copilot, Claude and the likes are 
general-purpose and carry no institutional memory. They do not know how, for 
example, a CSC321 lecturer has structured questions over 5 years, what the marking 
guide rewards, or which topics are perennially examined. No tool currently leverages a 
university's own historical exam dataset in a course-specific, structured way to guide 
student preparation.
Institution-specific
Grounded in real
past exam data
Marking-scheme
aligned answers
LITERATURE REVIEW/RELATED WORKS
Kasneci et al. (2023)
Ouyang et al. (2022) Brown et al. (2020)
s/n Author(s) & 
Year
Problem Addressed Method Used Results / Contribution Limitations / Future Work
1 Han et al. 
(2024)
Manual evaluation 
of tutoring sessions 
is time-consuming 
and inconsistent.
Compared GPT 
prompting strategies, 
including Retrieval
Augmented Generation 
(RAG), for automated 
tutor assessment.
RAG produced more accurate 
and less hallucinatory 
evaluations than standard 
prompting, demonstrating 
the value of grounding LLMs 
in external knowledge.
Focused on evaluating 
tutors rather than 
providing course-specific 
assistance or student exam 
preparation
2 Henkel et 
al. (2024)
General LLMs often 
provide maths 
explanations that 
are not aligned with 
the intended 
curriculum
Developed a RAG-based 
question answering 
systemthat retrieves 
verified mathematics 
resources before 
generating answers.
Improved factual grounding 
and curriculum alignment 
compared with standalone 
LLMs
Evaluated only on 
mathematics learning and 
did not support 
institutional marking 
schemes or personalized 
feedback.
3 Lack of consolidated 
evidence on how 
RAG is applied 
across educational 
systems.
Performed a systematic 
surveyof Retrieval
Augmented Generation 
in educational 
applications.
Showed that RAG 
significantly reduces 
hallucinations and improves 
course assistance, tutoring, 
and personalized learning.
Reported that many 
systems remain generic 
and lack institution-specific 
datasets and evaluation 
metrics.
LITERATURE REVIEW/RELATED WORKS
Kasneci et al. (2023)
Ouyang et al. (2022) Brown et al. (2020)
s/n Author(s) & 
Year
Problem Addressed Method Used Results / Contribution Limitations / Future Work
4 Barenji, 
Salimi & 
Khoshgoftar
(2026)
Providing consistent 
and scalable feedback 
on student 
assessments is 
difficult for 
instructors.
Designed an LLM
powered RAG 
assessment system
that retrieves rubrics, 
exemplar essays, and 
instructor feedback 
before grading.
Produced rubric-aligned 
feedback with very high 
agreement with human 
assessors while reducing 
instructor workload.
Concentrated on essay 
assessment and did not 
analyzehistorical 
examination trends or 
departmental question 
patterns.
5 Hossain et 
al. (2026)
Programming tutors 
powered by LLMs 
may hallucinate, 
reveal complete 
assignment solutions, 
or violate 
instructional policies.
Developed EduGuard, 
a safe RAG tutoring 
framework with 
instructor-approved 
retrieval, rubric-aware 
generation, and 
verification 
mechanisms.
Achieved higher 
correctness, lower 
hallucination rates, and 
improved student 
learning outcomes 
compared with baseline 
tutors.
Designed specifically for 
introductory 
programming rather than 
institution-specific 
examination preparation.
AIM & OBJECTIVES
AIM AND OBJECTIVES
AIM
To design and develop a course-aware AI study agent that leverages historical CSC Department exam data, course materials, and marking schemes to provide UI CS students with 
accurate/institutional expected answers, historical patterns, and evidence-based exam preparation support.
OBJECTIVES
1. Collect, clean, and structure past exam questions, answers, marking schemes, and course 
materials for CSC courses across 5 academic sessions.
1
2. Build a Retrieval-Augmented Generation pipeline using ChromaDB and an LLM API to enable 
course-specific, context-aware question answering.
3. Implement a multi-tool AI agent (ReAct pattern) capable of autonomously selecting 
between tools: Q&A, mock exam generation, answer scoring, or weak-area flagging.
4. Develop an automated evaluation module that compares student responses to official marking schemes and 
provides mark-by-mark feedback.
5. Build a topic frequency heatmap and 'likely-to-appear' prediction feature grounded in historical exam 
pattern analysis across sessions.
SYSTEM ARCHITECTURE/DESIGN 
INPUT LAYER
Student query via React web interface
AGENT REASONING LOOP
ReAct pattern · Plans multi-step actions · Selects appropriate tool · Manages conversation context
RETRIEVAL LAYER (RAG)
ChromaDB vector store · Semantic search via sentence-transformers · Chunk retrieval from exam 
corpus
LLM LAYER
Claude API / GPT-4o · Generates answers, scores responses, creates mock exams from retrieved 
context
KNOWLEDGE BASE
CSC past papers (4 sessions) · Marking schemes · Lecture notes · Courses materials
AGENT TOOLS
search_past_questions
generate_mock_exam
score_student_answer
show_topic_heatmap
flag_weak_areas
METHODOLOGY & RESEARCH DESIGN
Data Flow Diagrams(level 0 and level 1) – DATA COLLECTION AND VECTORIZATION
Phase 1
Phase 5
METHODOLOGY
Tool
Course-Specific?
Uses Past Papers?
Marking-Scheme?
ACTIVITY DIAGRAMS –RAG PIPELINE & GROUNDED Q&A.
AUTOMATED RUBRIC EVALUATION ENGINE.
TOPIC ANALYTICS & MOCK EXAMS GENERATION.
Inst. Memory?
AI-Powered?
Verdict
METHODOLOGY
Tool
Uses Past Papers?
ReAct Multi-Tool Agent & UML Use Case
ReAct Reasoning Engine: LangChain Reason + Act
Loop executing Thought -> Action Observation 
Iterations determine student intent and orchestrate
Multi-step tasks.
When a student interacts with the system, 
the agent does not guess. It enters a ”Thought
Action Observation” loop.
The development phase utilizes iterative
prototyping to continuously build, test, 
and refine the core algorithms.
Marking-Scheme?
Inst. Memory?
AI-Powered?
Verdict
METHODOLOGY
Tool
Course-Specific?
Uses Past Papers?
Marking-Scheme?
Inst. Memory?
DATA ARCHITECTURE –RELATIONAL MODEL & VECTOR BRIDGE
Each course links to multiple academic 
sessions, each session contains examination 
documents, and each document breaks down into 
discrete past questions. Crucially, each question is 
mapped one-to-many to its official marking scheme 
with specified mark allocations. 
each chunk record stores relational 
foreign keys alongside a unique UUID—the 
vector_embedding_id. This UUID acts as a
bridge pointer to the corresponding vector 
stored in ChromaDB.
AI-Powered?
Verdict
Past Question Engine
Returns real past questions with model answers 
for any topic across 5 sessions.
CORE
Topic Frequency Heatmap
Visual map of high-frequency exam topics —
shows students exactly where to focus.
CORE
Answer Quality Scoring
Compares student answer against marking 
scheme and gives mark-by-mark feedback.
CORE
Mock Exam Generator
Auto-generates fresh practice exams in the style 
of real CSC past papers.
Likely-to-Appear Predictions
Flags topics not examined recently —likely to 
appear in the upcoming session.
Weak Area Tracker
Tracks student scores and generates targeted 
practice for consistently weak topics.
KEY SYSTEM FEATURES
REFERENCES
➢ Arthana, I. K. R., et al. (2025). A Systematic Literature Review of Retrieval-Augmented Generation 
Implementation for Enhancing Large Language Models in Education. JANAPATI. 
➢ Barenji, A. V., Salimi, A., & Khoshgoftar, M. (2026). An LLM-Powered Assessment Retrieval
Augmented Generation (RAG) for Higher Education. arXiv. 
➢ Dong, Y., et al. (2023). How to Build an Adaptive AI Tutor for Any Course Using Knowledge Graph
Enhanced Retrieval-Augmented Generation (KG-RAG). arXiv. 
➢ Dutta, S., Paul, S., & Anand, A. (2023). RAGStudentGPT: A Syllabus-Aligned Retrieval-Augmented 
Generation Framework for Educational AI Systems. IJIRCT. 
➢ Han, T., et al. (2024). Improving Assessment of Tutoring Practices Using Retrieval-Augmented 
Generation. Proceedings of Machine Learning Research (PMLR). 
➢ Henkel, A., et al. (2024). Retrieval-Augmented Generation to Improve Math Question Answering: 
Trade-offs Between Groundedness and Human Preference. Educational Data Mining (EDM). 
➢ Hossain, M., et al. (2026). EduGuard: A Safe RAG-Based LLM Tutor for Programming Education. 
arXiv.
➢ Singla, A., et al. (2025). Retrieval-Augmented Generation for Educational Application: A 
Systematic Survey. ScienceDirect.
Thank You
Comments/Feedbacks
Development of A Course-Aware AI Study Agent for CSC Students, University of Ibadan
  Department of Computer Science  ·  2025/2026 Academic Session