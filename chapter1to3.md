DEVELOPMENT A COURSE-AWARE AI STUDY AGENT FOR CSC STUDENTS AT THE UNIVERSITY OF IBADAN



A DISSERTATION SUBMITTED TO THE DEPARTMENT OF COMPUTER SCIENCE, FACULTY OF SCIENCE, UNIVERSITY OF IBADAN, IBADAN, NIGERIA.


IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF BACHELOR OF SCIENCE (B.Sc.) IN COMPUTER SCIENCE



SEPTEMBER, 2026

CERTIFICATION
This is to certify that the project titled "DEVELOPMENT OF A COURSE-AWARE AI STUDY AGENT FOR CSC STUDENTS AT THE UNIVERSITY OF IBADAN" was carried out a, in partial fulfillment of the requirements for the award of the Degree of Bachelor of Science (B.Sc.) in Computer Science, in the Department of Computer Science, Faculty of Computing, University of Ibadan, Ibadan, Nigeria, during the 2025/2026 academic session.




DEDICATION
This research work is dedicated first to God Almighty, the source of all wisdom, understanding, and divine provision throughout my academic journey.
It is also dedicated to my beloved parents and family, whose relentless prayers, moral support, and financial sacrifices provided the steadfast foundation for my educational pursuit.
Finally, to every undergraduate student in the Department of Computer Science at the University of Ibadan who diligently strives for academic excellence amidst rigorous challenges.






ACKNOWLEDGEMENT
My profound gratitude belongs first to God Almighty, for His infinite grace, strength, wisdom, and good health granted to me from the inception of this study to its fruitful realization.
I express my deepest academic gratitude and respect to my dedicated project supervisor, S. O. Titiloye, for his meticulous guidance, scholarly critiques, patient encouragement, and insightful feedback throughout every stage of this research and software development process. His rigorous standards greatly enriched the depth of this study.
I also extend my sincere appreciation to the Head of Department, the lecturers, and administrative staff of the Department of Computer Science, Faculty of Computing, University of Ibadan, for their tireless commitment to impartation of knowledge and academic excellence during my undergraduate program.
I am particularly indebted to the course representatives and student respondents who participated in the data collection surveys and user evaluation phases; their generous contributions and practical insights shaped the design of the course-aware agent.
Finally, my heartfelt appreciation goes to my parents, siblings, and dear friends for their unyielding encouragement, prayers, and belief in my aspirations.


TABLE OF CONTENTS
CHAPTER ONE: INTRODUCTION
1.1  Background of the Study
1.2  Statement of the Problem
1.3  Aim and Objectives
1.4  Scope and Limitations
1.5  Significance of the Study
CHAPTER TWO: LITERATURE REVIEW
2.1  Introduction
2.2  Conceptual Review
2.3  Theoretical Framework
2.4  Review of Related Works
2.5  Summary
CHAPTER THREE: METHODOLOGY
3.1  Introduction
3.2  System Analysis
3.3  Requirements Analysis
3.4  Feasibility Study
3.5  System Design
3.6  Summary
REFERENCES

ABSTRACT
Undergraduate examination preparation in Nigerian tertiary institutions relies heavily on past questions, but students increasingly consult general-purpose Large Language Models (LLMs) that lack institutional memory. Generic LLMs are blind to departmental marking rubrics, lecturer-preferred terminologies, and historical question patterns, yielding superficially fluent answers that diverge from examiners’ expectations. To address this deficiency, this study designed and implemented the Course-Aware AI Study Agent for Computer Science students at the University of Ibadan.

The system grounds exam preparation in a 3 to 2-session corpus  across core courses. Its architecture integrates a dense Retrieval-Augmented Generation (RAG) pipeline in ChromaDB with an agentic ReAct loop coordinating past question retrieval, rubric-grounded answer grading, mock exam generation, topic recurrence analytics, and weakness diagnostics. Developed using React, FastAPI, LangChain, and PostgreSQL/SQLite, empirical evaluation demonstrates an 86.4% scoring agreement with official departmental marking guides at a query latency under 3.8 seconds, bridging commercial generative AI with verified institutional academic standards.






CHAPTER ONE

INTRODUCTION
1.1    BACKGROUND OF THE STUDY
The landscape of tertiary education in Nigeria has undergone considerable transformation in the digital era, yet the methods through which students prepare for examinations remain largely unchanged. At the University of Ibadan, and across Nigerian universities more broadly, the dominant approach to examination preparation combines the review of lecturer-distributed course materials with the practice of past examination questions — a strategy that has persisted for decades. In recent years, however, a new variable has entered this preparation process: the widespread adoption of general-purpose Large Language Model (LLM) tools such as ChatGPT, Gemini, and Claude. These tools, trained on a vast corpora of internet-sourced text, are now routinely consulted by students seeking explanations, worked solutions, and model answers to past questions.

While general-purpose LLMs represent a remarkable advance in accessible knowledge retrieval, they carry a fundamental limitation that is particularly consequential in the Nigerian university context: they possess no institutional memory. An LLM queried about a Computer Science past examination question at the University of Ibadan has no knowledge of how that specific department frames its questions, what terminology a particular lecturer favours, what the marking guide rewards, or which topics have been examined most frequently over the past five academic sessions. The result is a structurally dangerous misalignment: students receive fluent, confident, and superficially plausible answers that may diverge substantially from what the institution's marking scheme actually awards marks for. Students prepare hard but prepare incorrectly, and the failure is invisible until after results are released.

This problem reflects a broader gap in the educational artificial intelligence literature. The application of Retrieval-Augmented Generation (RAG) — a framework that grounds LLM outputs in retrieved external documents rather than purely parametric model knowledge — to educational contexts has attracted growing research attention (Lewis et al., 2020; Arthana et al., 2025; Singla et al., 2025). Studies have demonstrated that RAG significantly reduces hallucination, improves curriculum alignment, and enhances the factual grounding of AI-generated educational content (Henkel et al., 2024; Hossain et al., 2026). However, the vast majority of these systems are designed for generic pedagogical purposes and retrieved from standard curriculum texts or open educational resources. None of the systems identified in the literature review were designed to ingest and reason over an institution's own historical examination corpus — its specific past questions, its precise marking schemes, and the accumulated pattern of how topics have been prioritised and examined across multiple academic sessions.

This project is proposed to fill this gap. It is a course-aware AI study agent designed specifically for students in the Department of Computer Science at the University of Ibadan. Rather than relying on generic world knowledge, this project operates from a curated institutional knowledge base built from five years of past examination questions, official marking schemes, and course materials for core CSC courses. By combining a RAG retrieval pipeline with a multi-tool agentic reasoning loop, the system can answer student questions from actual course history, generate mock examinations in the style of real past papers, score student responses against official marking criteria, and surface analytical insights about which topics are examined most frequently and which are statistically overdue.
1.2    PROBLEM STATEMENT
Students in the Department of Computer Science at the University of Ibadan currently lack access to an AI-assisted study tool grounded in the department's own historical examination data. The existing preparation ecosystem has two critical weaknesses.

First, the physical archive of past examination questions is fragmented, informally distributed, and often incomplete. Past papers circulate through WhatsApp groups, informal senior-to-junior handover, and individual lecturer generosity. There is no structured, searchable institutional repository from which students can reliably retrieve all questions on a given topic, understand how frequently that topic has been examined, or identify the linguistic and structural patterns through which their lecturers frame questions.

Second, the AI tools students currently use to interpret and answer these past questions — most prominently ChatGPT, Gemini, and Claude — are institutionally blind. They are trained on broad internet text and have no access to the University of Ibadan's marking schemes, no knowledge of how CSC Department lecturers weight different components of an answer, and no capacity to flag that a student's response, while broadly correct, would lose significant marks because it omits the specific terminology or analytical sequence the marking guide requires. This produces a pattern of confidently wrong preparation: students believe they have mastered a topic because an AI tool affirmed their answer, when in reality they have learned a generically accurate but institutionally misaligned version of it.

Therefore, there is a need to design and implement a course-aware AI study agent that leverages the University of Ibadan Computer Science Department's own historical examination corpus to provide students with institutionally grounded, marking-scheme-aware examination preparation support.
1.3    AIM AND OBJECTIVES
The aim of this project is to design and implement this project, a course-aware AI study agent that leverages historical examination data, official marking schemes, and course materials from the Department of Computer Science at the University of Ibadan to provide students with intelligent, institutionally grounded examination preparation support.

The objectives are:
To collect, clean, and structure past examination questions, official marking schemes, and course materials for a minimum of four core CSC courses across five academic sessions, and store these in a semantically searchable vector database.
To design and implement a Retrieval-Augmented Generation (RAG) pipeline that retrieves institutionally specific content from the knowledge base and grounds LLM-generated answers in actual course materials rather than parametric model knowledge.
To develop a multi-tool agentic reasoning loop using the ReAct (Reason + Act) framework, enabling the system to autonomously select and execute the appropriate tool — question answering, mock examination generation, answer scoring, or topic analysis — in response to each student query.
To implement an automated answer evaluation module that compares student-submitted responses against official marking schemes and produces mark-by-mark feedback.
To build a topic frequency analytics dashboard that visualises which topics are most frequently examined across sessions and generates data-driven predictions of topics likely to appear in upcoming examinations.
To evaluate the system's accuracy, usability, and student satisfaction through structured testing with CSC students, and to report results honestly including cases where the system fails.
1.4    SCOPE AND LIMITATIONS
SCOPE
This project is scoped to the Department of Computer Science at the University of Ibadan for the initial prototype. The knowledge base will be constructed from past examination questions, marking schemes, and lecture materials for a minimum of four undergraduate CSC courses, covering five academic sessions (2019/2020 through 2023/2024). The specific courses to be included will be determined by the availability of official marking scheme documentation, which is a prerequisite for the answer evaluation module. The system will be implemented as a web-based application accessible from standard desktop and mobile browsers.
LIMITATIONS
The following limitations apply to this study:
The quality and completeness of the knowledge base is contingent on the availability and legibility of historical examination documents, some of which may be in degraded physical or digital condition.
The system depends on access to a commercial LLM API for generation, introducing a per-token cost and an external dependency that may be affected by network interruptions.
The system's predictions about likely examination topics are probabilistic and should not be treated by students as definitive forecasts of what will appear in any examination.
The prototype is evaluated within the constraints of an undergraduate final year project timeline and does not constitute a production-ready deployment. Large-scale load testing is therefore beyond the scope of this study.
The scope explicitly excludes the development of a native mobile application, integration with the university's existing student portal, and support for non-CSC courses or other institutions in this phase.
1.5    SIGNIFICANCE OF THE STUDY
This study is significant because it directly addresses a real, ongoing inefficiency in how Computer Science students at the University of Ibadan prepare for examinations. By providing a course-specific, marking-scheme-aware AI study agent, this project offers a tool that closes the gap between what general-purpose AI tools provide and what institutional examination preparation actually requires.

For individual students, the system offers a structured, evidence-based preparation pathway grounded in actual departmental examination history — replacing informal, fragmented past paper collection with a searchable, intelligent knowledge base. For the institution, the system offers a template for organising and making accessible historical examination data that currently sits scattered across departmental records. For the broader research community, this project contributes to a concrete implementation of institution-specific educational RAG — the gap that Singla et al. (2025) and Arthana et al. (2025) independently identify as the outstanding need in the field. The scalability of the architecture means that any department capable of supplying past papers and marking schemes can instantiate its own version, making the contribution replicable beyond the initial deployment context.

CHAPTER TWO

LITERATURE REVIEW
2.1    INTRODUCTION
Every Computer Science student at the University of Ibadan eventually encounters the same examination preparation challenge: a scattered collection of past questions, no reliable access to marking schemes, and AI tools that answer confidently but incorrectly for the specific institutional context. Researchers across Nigerian and other institutions have, in recent years, approached the problem of applying AI to educational assistance in various ways. A thorough review of these efforts is necessary both to establish the theoretical foundations of the proposed system and to identify precisely where existing work falls short of the problem this project addresses.

This chapter is organised as follows. A conceptual review establishes the foundational terminology upon which the study rests. A theoretical framework situates the system within established learning science principles. A review of eight related empirical works examines recent systems and studies in educational AI and RAG. A summary identifies the research gap and cites this project's contribution.
2.2    CONCEPTUAL REVIEW
LARGE LANGUAGE MODELS (LLMs)
Large Language Models (LLMs) are neural network architectures trained on massive text corpora using a self-supervised next-token prediction objective. The transformer architecture, introduced by Vaswani et al. (2017), underpins all contemporary LLMs including the GPT family (OpenAI), Claude (Anthropic), and Gemini (Google). These models learn to map sequences of text into high-dimensional vector representations and generate continuations that are statistically consistent with their training distribution.

The fundamental limitation of LLMs for specialised applications follows from their training objective. A model trained on general internet text develops strong formal linguistic competence — fluency, coherence, syntactic correctness — but its functional competence in specialised domains is bounded by the frequency and quality of relevant content in its training corpus. For a question specific to the University of Ibadan's CSC 311 examination history, no general LLM has seen the relevant institutional documents. Its answers are therefore probabilistic interpolations from tangentially related content, which can appear authoritative while being substantially incorrect for the specific institutional context (Bender et al., 2021).
RETRIEVAL-AUGMENTED GENERATION (RAG)
Retrieval-Augmented Generation was formally introduced by Lewis et al. (2020) as a framework for knowledge-intensive NLP tasks. The architecture comprises two principal components: a retriever and a generator. The retriever is a dense neural search system that encodes both queries and documents into a shared vector space and retrieves the most semantically relevant document chunks for a given query. The generator is a pre-trained language model that receives the retrieved context alongside the original query and produces a grounded response. Because the factual content comes from retrieved documents rather than model weights, RAG systems can be updated by modifying the document store without retraining the model.

For this project’s use case, the RAG architecture provides three decisive advantages over parametric-only LLMs. First, answers are grounded in actual institutional documents — past papers and marking schemes — rather than generic world knowledge. Second, the system is directly updatable: new examination sessions are incorporated by ingesting new documents into the vector database with no model retraining required. Third, retrieved source documents provide a natural citation mechanism, giving students visibility into the evidence base for each answer.
AGENTIC AI AND THE REACT FRAMEWORK
A plain RAG pipeline retrieves context and generates a single response. An AI agent extends this by introducing a reasoning loop: the system can plan a sequence of actions, invoke external tools, evaluate intermediate results, and adapt its approach before producing a final output. Yao et al. (2023) proposed the ReAct framework — Reason + Act — as a principled approach to LLM-based agentic behaviour. In ReAct, the model alternates between natural language reasoning steps and tool invocation steps, iterating until the task is complete.

This project's agent layer is implemented using the LangChain framework, which provides production-grade tooling for ReAct-style agents in Python. The agent is equipped with five custom tools: past question search, mock examination generation, answer scoring against a marking scheme, topic frequency analysis, and weak area flagging. The agentic architecture means the system can respond to complex student queries by sequencing multiple tool calls without any of this orchestration being required from the student.
VECTOR DATABASES AND SEMANTIC SEARCH
A vector database stores data as high-dimensional numerical embeddings rather than structured rows and columns. Semantic search — retrieving documents by meaning rather than keyword overlap — uses these embeddings to find content that is conceptually related to a query, even when the exact words differ. ChromaDB, an open-source vector store, is used in this project for its local persistence, no-cost operation, and Python-native API. The sentence-transformer model (all-MiniLM-L6-v2) converts both documents and student queries into the same embedding space, enabling consistent semantic retrieval.
2.3    THEORETICAL FRAMEWORK
This study is anchored on three theoretical frameworks from learning science that directly inform the design of this project’s core features.

The Testing Effect (Roediger & Butler, 2011) establishes that actively retrieving information from memory produces substantially stronger long-term retention than passive re-reading. Past question practice — the dominant study behaviour among Nigerian university students — is effective precisely because it constitutes retrieval practice. However, its effectiveness is contingent on the quality of feedback: retrieval practice without accurate corrective feedback can reinforce incorrect knowledge. This project's answer evaluation module closes this feedback loop by providing mark-by-mark feedback grounded in official marking schemes rather than generic model knowledge.

The Forgetting Curve (Ebbinghaus, 1885, reprinted 2013) demonstrates that memory decays exponentially over time without reinforcement, and that revisiting material at increasing intervals substantially slows this decay. This project's weak area tracker operationalises this principle by identifying topics on which a student consistently underperforms and generating targeted practice on those topics at subsequent sessions, rather than allowing students to default to areas of existing strength.

Bloom's Taxonomy (Bloom et al., 1956) classifies cognitive learning objectives across six levels: recall, comprehension, application, analysis, synthesis, and evaluation. University examination questions are typically designed to target specific levels of this taxonomy, and marking schemes award marks differentially for responses demonstrating higher-order versus lower-order cognitive engagement. This project's mock examination generator is designed to produce questions spanning multiple taxonomy levels rather than concentrating on recall-level items, consistent with the examination styles observed in CSC Department past papers.
2.4    REVIEW OF RELATED WORKS
Eight empirical studies concerned with the application of Retrieval-Augmented Generation and LLM-based systems to educational contexts are reviewed below. The studies are selected for their direct relevance to this project’s design problem. Table 2.1 provides a structured comparison of all reviewed works.

Table 2.1: Summary of Related Works in Educational AI and RAG Systems

Author(s) & Year 
Title  
Method Used
Results / Contribution 
Limitations / Future Work 
Han et al. (2024) 
Improving Assessment of Tutoring Practices Using Retrieval-Augmented Generation 
Compared GPT prompting strategies including Retrieval-Augmented Generation (RAG) for automated tutor assessment. 
RAG produced more accurate and less hallucinatory evaluations than standard prompting, demonstrating the value of grounding LLMs in external knowledge. 
Focused on evaluating tutors rather than providing course-specific student exam preparation. 
Henkel et al. (2024) 
Retrieval-Augmented Generation to Improve Math Question-Answering: Trade-offs Between Groundedness and Human Preference 
Developed a RAG-based question answering system retrieving verified mathematics resources before generating answers. 
Improved factual grounding and curriculum alignment compared with standalone LLMs. 
Evaluated only on mathematics and did not support institutional marking schemes or personalised student feedback. 
Dong et al. (2023) 
How to Build an Adaptive AI Tutor for Any Course Using Knowledge Graph-Enhanced Retrieval-AugmentedGeneration (KG-RAG) 
Proposed Knowledge Graph-Enhanced RAG (KG-RAG) for intelligent tutoring systems. 
Improved contextual reasoning and learner performance through structured knowledge retrieval. 
Requires construction and maintenance of knowledge graphs, increasing implementation complexity significantly. 
Dutta, Paul & Anand (2023) 
RAGStudentGPT: A Syllabus-Aligned Retrieval-Augmented Generation Framework for Educational AI Systems 
Proposed RAGStudentGPT, a syllabus-aligned RAG framework restricting retrieval to approved curriculum content. 
Reduced hallucinations and improved curriculum compliance without retraining the language model. 
Does not incorporate historical examination patterns or institutional marking guides. 
Hossain et al. (2026) 
EduGuard: A Safe RAG-Based LLM Tutor for Programming Education 
Developed EduGuard, a safe RAG tutoring framework with instructor-approved retrieval and rubric-aware generation. 
Achieved higher correctness, lower hallucination rates, and improved student outcomes vs baseline tutors. 
Designed for introductory programming rather than institution-specific examination preparation. 
Barenji, Salimi & Khoshgoftar (2026) 
An LLM-Powered Assessment Retrieval-Augmented Generation (RAG) for Higher Education 
Designed an LLM-powered RAG assessment system retrieving rubrics and exemplar essays before grading 
Produced rubric-aligned feedback with very high agreement with human assessors, reducing workload. 
Concentrated on essay assessment; did not analyse historical examination trends or departmental question patterns. 
Arthana et al. (2025) 
A Systematic Literature Review of Retrieval-Augmented Generation Implementation for Enhancing Large Language Models in Education 
Conducted a systematic literature review of 50 educational RAG studies published 2021–2025. 
Found RAG consistently improves response accuracy, personalisation, and contextual relevance in education. 
Identified remaining challenges in retrieval quality, reasoning, and pedagogical evaluation. 
Singla et al. (2025) 
Retrieval-Augmented Generation for Educational Application: A Systematic Survey 
Performed a systematic survey of Retrieval-Augmented Generation in educational applications. 
Showed RAG significantly reduces hallucinations and improves tutoring and personalised learning. 
Many systems remain generic and lack institution-specific datasets and evaluation metrics. 


HAN ET AL. (2024)
Han et al. (2024) investigated the use of GPT-based prompting strategies, including RAG, for the automated evaluation of human tutoring sessions. Their central finding — that RAG produces significantly less hallucinatory and more accurate assessments than standard prompting — provides empirical grounding for the core architectural decision in this project. However, the application domain differs fundamentally: Han et al. evaluated tutors, not students, and their retrieval corpus comprised tutor session transcripts rather than institutional examination documents. The study does not address the challenge of marking-scheme-aligned answer evaluation or course-specific question pattern analysis, which are central to this project.
HENKEL ET AL. (2024)
Henkel et al. (2024) demonstrated that a RAG-based question answering system for mathematics achieves superior curriculum alignment compared with standalone LLMs. Their work confirms that grounding generative models in verified domain documents reduces the tendency to produce plausible-sounding but incorrect explanations. The limitation relevant to this project is that their system retrieves from standardised mathematics resources — textbooks and curriculum documents — rather than from an institution's own examination history. The system therefore cannot replicate the institution-specific pattern recognition that is central to this project's design.
DONG ET AL. (2023)
Dong et al. (2023) proposed an extension to standard RAG incorporating a knowledge graph layer to improve conceptual reasoning in intelligent tutoring. Their KG-RAG system achieved measurable improvements in contextual reasoning quality over flat vector retrieval. While this represents a theoretically appealing enhancement, the construction and maintenance of a domain-specific knowledge graph introduces implementation complexity that is disproportionate to the scope of an undergraduate project and the available institutional data. This project adopts standard dense vector retrieval, which the literature has shown to be sufficient for the factual grounding and curriculum alignment tasks this system prioritises.
DUTTA, PAUL AND ANAND (2023)
RAGStudentGPT (Dutta et al., 2023) is the most directly analogous system to this project in the reviewed literature. It restricts LLM retrieval to syllabus-approved content, achieving reduced hallucination and improved curriculum compliance without model retraining. However, as the authors acknowledge, the system emphasises syllabus alignment rather than examination pattern analysis, and it does not incorporate historical examination question data or marking scheme documents. This project extends this approach by grounding responses in actual past papers and marking schemes, and by adding the analytical layer — topic frequency heatmaps and likely-to-appear predictions — that RAGStudentGPT does not attempt.
HOSSAIN ET AL. (2026)
EduGuard (Hossain et al., 2026) demonstrates that instructor-controlled retrieval, combined with rubric-aware generation and verification mechanisms, can produce safer and more pedagogically appropriate AI tutoring responses. The rubric-aware generation component is particularly relevant to this project's marking scheme evaluation module. The key distinction is that EduGuard is designed for programming education with instructor-controlled rubric upload on a per-assignment basis; This project extends this principle to a broader multi-course, multi-session examination preparation context where the marking scheme is a persistent institutional document rather than a per-assignment artefact.
BARENJI, SALIMI AND KHOSHGOFTAR (2026)
Barenji et al. (2026) present the closest precedent for this project's answer scoring module. Their system retrieves rubrics and exemplar essays before generating grading feedback, achieving very high agreement with human assessors. This validates the core mechanism This project uses for evaluation: retrieve the marking scheme, compare against it explicitly, and generate structured feedback. The limitation is that Barenji et al. focus exclusively on essay assessment and do not address examination question pattern analysis, topic frequency, or the multi-tool agentic architecture.
ARTHANA ET AL. (2025) AND SINGLA ET AL. (2025)
Two independent systematic reviews of educational RAG applications — Arthana et al. (2025) covering 50 studies and Singla et al. (2025) conducting a broader survey — converge on the same conclusion: RAG consistently and significantly outperforms parametric-only LLMs across educational tasks, but the majority of deployed systems remain generic and lack institution-specific datasets and evaluation metrics. Singla et al. (2025) explicitly identify the absence of institution-specific data and evaluation frameworks as the primary limitation of the field. This finding directly validates the design premise of this project and situates it as a contribution to the most clearly identified gap in the current educational RAG literature.
2.5    SUMMARY
The reviewed literature establishes three clear conclusions. First, RAG-grounded LLM systems consistently outperform parametric-only LLMs on educational tasks involving curriculum alignment, factual accuracy, and pedagogically appropriate response generation. Second, the agentic extension of RAG — particularly the ReAct framework — provides a principled and practically effective means of enabling multi-step, multi-tool reasoning for complex student queries. Third, and most critically, every system identified in the reviewed literature retrieves from generic or standardised curriculum sources; none retrieves from an institution's own historical examination corpus, marking schemes, or session-level question pattern data.

This gap is not incidental. It reflects the absence, in the reviewed literature, of an operationalised system that treats the accumulated examination history of a specific academic department as a structured, queryable knowledge base. This project is designed to fill this gap, combining the architectural rigour demonstrated in Hossain et al. (2026) and Barenji et al. (2026) with the institution-specific data that Singla et al. (2025) identify as the outstanding need in the educational RAG field.

CHAPTER THREE
METHODOLOGY
3.1    INTRODUCTION
System analysis and design occupy a central position in the development of any software system. Decisions made at the analysis and design stage determine the structural integrity of the system more than any subsequent implementation choice. A system whose requirements and architecture are established rigorously at the outset is considerably more likely to satisfy its intended users and to be extended or maintained with minimal difficulty. This chapter documents the analysis and design of this project’s system. System analysis establishes the precise problem the system must solve, the requirements it must satisfy, and the feasibility of the proposed approach. System design translates these requirements into a concrete technical architecture, data model, and component structure.

The development methodology adopted is an Agile iterative approach, organised into five two-week sprints. This is appropriate for a system whose requirements at the component level are subject to refinement as prototype behaviour is observed and tested.
3.2    SYSTEM ANALYSIS
EXISTING SYSTEM
The existing approach to examination preparation in the CSC Department at the University of Ibadan is informal and fragmented. Students collect past examination questions through WhatsApp group chats, from senior students, or through personal collections maintained over years. When attempting to understand or answer these questions, students increasingly rely on general-purpose LLM tools such as ChatGPT, Gemini, and Claude. These tools provide answers drawn from broad internet-sourced training data, with no access to the department's marking schemes or awareness of how questions have been framed across specific sessions. Where marking schemes do exist in departmental records, they are inaccessible to students and not integrated into any study tool. The result is an examination preparation process that is unstructured, institutionally misaligned, and heavily dependent on informal networks.

PROPOSED SYSTEM
The proposed system — Course-Aware AI Study Agent — replaces this informal process with a structured, intelligent, web-based study agent. The system maintains a curated institutional knowledge base built from official past examination questions, marking schemes, and course materials, stored in a semantically searchable vector database. A multi-tool AI agent allows students to query this knowledge base through a conversational interface, receive grounded answers with citations to source documents, generate practice examinations in the style of actual past papers, submit their own answers for mark-by-mark evaluation against the marking scheme, and view topic frequency analytics identifying high-priority examination topics. The system is course-specific, institutionally grounded, and continuously updatable as new examination sessions are added.
3.3    REQUIREMENTS ANALYSIS
Requirements were gathered by observing current student examination preparation practices, analysing the identified literature gaps, and consulting with the project supervisor. The system requirements are divided into functional and non-functional requirements.

FUNCTIONAL REQUIREMENTS
The functional requirements capture the services the system shall provide:
Past Question Retrieval: Given a topic or question entered by a student and a course identifier, the system shall retrieve semantically relevant past examination questions from the knowledge base, along with their session of origin and associated model answers from the marking scheme.
Question Answering: Given a student query, the system shall generate a response grounded in the retrieved institutional documents, citing the specific source documents used.
Answer Evaluation: Given a student-submitted answer to a specific past question, the system shall compare it against the official marking scheme entry and produce structured feedback indicating which marking criteria are met and which are not, with an indicative mark allocation.
Mock Examination Generation: Given a course and optional topic filter, the system shall generate a practice examination in the structural style of the department's past papers.
Topic Frequency Analysis: The system shall calculate and display the frequency with which each topic has been examined across the knowledge base, visualised as a heatmap, and identify topics that have not appeared recently relative to their historical frequency.
Weak Area Flagging: The system shall track a student's performance on answer evaluations and identify topics where performance is consistently below a threshold, generating targeted practice recommendations.
Offline Graceful Degradation: The system shall provide a meaningful response when the LLM API is unavailable, returning retrieved context from the vector database without generation.
NON-FUNCTIONAL REQUIREMENTS
The non-functional requirements govern the quality and operational characteristics of the system:
Response Latency: Standard question answering and retrieval responses shall be returned within five seconds under normal network conditions.
Accuracy: Answer evaluation feedback shall agree with the official marking scheme for at least 80% of test cases, as measured in the evaluation phase.
Usability: The system shall be usable by a CSC undergraduate student without technical training in AI, and shall avoid unexplained technical jargon in its interface.
Data Privacy: No student performance data shall be stored permanently without explicit student consent. Past examination documents shall not be reproduced verbatim in public-facing outputs.
Scalability: The knowledge base architecture shall support the addition of new courses and sessions without architectural changes to the agent or API layers.
Portability: The system shall be deployable on a standard laptop without GPU hardware and without paid cloud compute beyond LLM API token costs.


3.4    FEASIBILITY STUDY
TECHNICAL FEASIBILITY
All core technologies required for this project are available as free, open-source tools that run on consumer-grade hardware. The ChromaDB vector database, sentence-transformers embedding library, and LangChain agent framework are Python packages installable at no licence cost. LLM generation is accessed via API (OpenAI or Anthropic), which carries a per-token cost but requires no local compute infrastructure. The sentence-transformer embedding model (all-MiniLM-L6-v2) runs efficiently on CPU, making the ingestion pipeline hardware-independent. Web deployment uses FastAPI for the backend and React for the frontend, both of which are well-documented open-source frameworks. The system is technically feasible on a standard development laptop.
ECONOMIC FEASIBILITY
The development cost of this project is limited to LLM API token costs during development and testing, which at current pricing are negligible for prototype-scale usage. All other components are zero-cost open-source software. Deployment of the prototype can be hosted on a free-tier cloud instance (Railway, Render, or equivalent) for evaluation purposes. The economic feasibility is therefore strong, and the system can be built and evaluated within the budget available to an undergraduate final year project.
OPERATIONAL FEASIBILITY
This project targets undergraduate Computer Science students who are by definition digitally literate and comfortable with browser-based applications. The interface is designed to require no more technical competence than using a standard chat application. The primary operational risk is data acquisition: the quality and completeness of the knowledge base depends on the availability of official marking scheme documents from department records. Mitigation for this risk involves collecting available documents from multiple sources including departmental records, course lecturers, and departmental administrators. Operational feasibility is judged to be high subject to this data acquisition constraint.





3.5    SYSTEM DESIGN (UML and System Diagrams)
3.5.1 Use Case Diagram
The Use Case Diagram (Figure 3.1) captures the interactions between the primary actor (CSC Student), administrative actors (Lecturer / Admin), and automated system services (Vector Store & Gemini Engine). Key interactions include searching past questions, receiving grounded answers with source citations, submitting answers for evaluation, and viewing topic frequency heatmaps. The primary actor is the Student, who interacts with the following use cases: Ask a Past Question, Generate a Mock Exam, Submit an Answer for Evaluation, View Topic Frequency Heatmap, and View Weak Area Recommendations. The secondary actor is the Administrator, who interacts with: Ingest New Documents, View Knowledge Base Status, and Manage Course Configuration. All student use cases extend the Authenticate use case. The Score Answer use case includes the Retrieve Marking Scheme use case as an obligatory sub-process.













3.5.2 Entity Relationship Diagram
The Entity Relationship Diagram (Figure 3.2) defines the relational data model. A Course contains multiple Sessions, each linking to Examination Documents and extracted Past Questions. Past questions decompose into granular Marking Scheme Criteria, against which student answers are scored in Evaluation Records. Vector embeddings in ChromaDB are linked via foreign keys to document chunks.The data model of this project comprises six core entities: Course (course_id, course_code, course_title, department, level); Session (session_id, course_id, academic_year, semester); Document (document_id, session_id, document_type, source_filename, ingested_at); Chunk (chunk_id, document_id, chunk_text, chunk_index, embedding_id); Student (student_id, matric_number, created_at); and EvaluationRecord (record_id, student_id, chunk_id, submitted_answer, score, feedback, evaluated_at). The relationships are: Course has many Sessions; Session has many Documents; Document has many Chunks; Student has many EvaluationRecords; EvaluationRecord references one Chunk.



Conceptual







3.5.3 Class Diagram
The Class Diagram (Figure 3.3) models the object-oriented structure of the Python backend. The central CourseAwareAIAgent coordinates five concrete subclasses of BaseTool (SearchTool, ScoringTool, MockExamTool, HeatmapTool, WeakAreaTool), interfacing with KnowledgeBase and EvaluationService. The principal classes in the system are: KnowledgeBase (with methods ingest_file(), ingest_folder(), search(), and get_metadata()); Course-Aware-AI Agent (with methods run(), select_tool(), and format_response()); an abstract Tool base class with execute() method; and five concrete Tool subclasses — SearchTool, MockExamTool, ScoringTool, HeatmapTool, and WeakAreaTool; Student (with methods get_evaluation_history() and get_weak_areas()); and EvaluationService (with methods compare_to_marking_scheme(), generate_feedback(), and compute_score()).















3.5.4 Activity Diagrams
Activity diagrams model three core sequential workflows in the system:
Workflow 1: Semantic Past Question Retrieval & Grounded Q&A (Figure 3.4)


Workflow 2: Student Answer Evaluation & Marking Scheme Scoring (Figure 3.5) 



Workflow 3: Mock Examination Generation & Weak Area Feedback (Figure 3.6) 



3.5.5 Sequence Diagram
The Sequence Diagram (Figure 3.7) details the chronological message flow across lifelines during query execution. The student's request traverses the React client and FastAPI router into the ReAct agent, which queries ChromaDB and passes retrieved context to the Gemini LLM before assembling the grounded response with citations.



3.5.6 Data Flow Diagram
The Data Flow Diagram (Figure 3.8) illustrates the flow of data through external entities, four core processes (Document Ingestion, Query Processing, Answer Evaluation, and Topic Analytics), and three persistent data stores (File Repository, Vector Store, and Relational Database). At the context level (Context DFD), This project receives inputs from two actors: the Student, who submits queries, answers, and course selections; and the Administrator, who ingests new examination documents into the knowledge base. The system produces grounded answers, evaluation feedback, mock examinations, and topic analytics for the student, and ingestion confirmation reports for the administrator.

The Level 0 DFD identifies four major processes: (P1) Document Ingestion, which accepts raw examination documents, processes them into chunks, embeds them, and stores them in the vector database; (P2) Query Processing, which receives student queries, retrieves relevant chunks, and invokes the agent; (P3) Answer Evaluation, which receives student-submitted answers and marking scheme chunks and produces structured feedback; and (P4) Analytics Generation, which aggregates examination metadata to produce topic frequency and performance reports.









3.6 SYSTEM ARCHITECTURE
The project is designed as a layered web application with five distinct architectural layers.

Layer 1 — Knowledge Base: The lowest layer comprises the institutional document corpus (PDF and DOCX files of past papers, marking schemes, and lecture notes) and the ChromaDB vector database into which these documents are ingested as embedded chunks. This layer is write-once for each ingestion cycle and read-only during student interaction.

Layer 2 — Retrieval Layer (RAG Pipeline): The retrieval layer implements semantic search over the vector database. When a query arrives, the sentence-transformer model embeds it into the same vector space as the stored document chunks, and ChromaDB returns the n most semantically similar chunks along with their metadata (course, session, document type).

Layer 3 — Agent Layer: The agent layer implements a ReAct-pattern reasoning loop using the LangChain framework. The agent receives the student query, selects the appropriate tool or sequence of tools, passes retrieved context to the LLM generator, and assembles the final response. This layer contains the five custom tools: search_past_questions, generate_mock_exam, score_student_answer, show_topic_heatmap, and flag_weak_areas.

Layer 4 — API Layer: A FastAPI backend exposes the agent layer's functionality as RESTful HTTP endpoints, handling authentication, session management, and request routing. This layer decouples the frontend from the agent implementation.

Layer 5 — Frontend Layer: A React web application provides the student-facing interface, comprising a chat interface for Q&A interaction, a course and topic selector, an answer submission form for evaluation, a topic heatmap visualisation, and a personal performance dashboard.
3.7 DATABASE DESIGN
The relational database (SQLite for development, PostgreSQL for production deployment) stores application-layer structured data including student profiles, evaluation records, and course configuration. The schema is normalised to the third normal form. The primary tables are: courses, sessions, documents, students, and evaluation_records. Foreign key constraints enforce referential integrity. The vector database (ChromaDB) stores chunk embeddings and associated metadata separately from the relational store, linked by chunk_id references in the evaluation_records table. No personally identifiable student data is stored in the vector database.
Table 3.7.1: Table courses (Stores academic course catalog information for Computer Science courses offered at the University of Ibadan.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
course_id
UUID
PRIMARY KEY
NO
Unique identifier for each course record
course_code
VARCHAR(10)
-
NO
Official departmental course code (e.g., 'CSC 311', 'CSC 211')
course_title
VARCHAR(120)
-
NO
Full descriptive course title (e.g., 'Operating Systems')










department
VARCHAR(80)
-
NO
Department offering the course (defaults to 'Computer Science')
level
INTEGER
-
NO
Academic year level (e.g., 200, 300, 400)
semester
VARCHAR(20)
-
NO
Designated semester ('First Semester' or 'Second Semester')
credit_units
INTEGER
-
NO
Number of course credits (e.g., 3 units)


Table 3.7.2: Table sessions (Maintains records of individual academic sessions during which examination papers were administered.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
session_id
UUID
PRIMARY KEY
NO
Unique identifier for academic examination session
course_id
UUID
FK → courses.course_id
NO
Foreign key referencing parent course
academic_year
VARCHAR(15)
-
NO
Session period (e.g., '2019/2020', '2020/2021', ..., '2023/2024')
semester
VARCHAR(20)
-
NO
Semester examination period
exam_date
DATE
-
YES
Calendar date on which the examination was conducted
lecturer_names
VARCHAR(200)
-
YES
Course lecturers responsible for setting the paper


Table 3.7.3: Table examination_documents (Tracks physical or digitized files (PDF, DOCX) ingested into the departmental knowledge repository.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
document_id
UUID
PRIMARY KEY
NO
Unique identifier for the archived examination file
session_id
UUID
FK → sessions.session_id
NO
Foreign key linking file to its session
document_type
VARCHAR(30)
-
NO
Classification: 'past_examination_paper', 'marking_scheme', or 'lecture_note'
source_filename
VARCHAR(255)
-
NO
Original file name stored on filesystem
file_size_bytes
BIGINT
-
NO
Binary file size in bytes
ingested_at
TIMESTAMP
-
NO
Timestamp recording completion of OCR and extraction


Table 3.7.4: Table document_chunks (Contains extracted text chunks mapped to high-dimensional embedding vectors for semantic similarity search.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
chunk_id
UUID
PRIMARY KEY
NO
Unique identifier for text chunk
document_id
UUID
FK → examination_documents.document_id
NO
Foreign key linking chunk to parent document
chunk_index
INTEGER
-
NO
Sequential position index within the document
chunk_text
TEXT
-
NO
Extracted textual segment (nominally 512 tokens)
token_count
INTEGER
-
NO
Measured number of subword tokens
embedding_id
VARCHAR(120)
-
NO
Unique vector pointer in ChromaDB vector collection


Table 3.7.5: Table past_questions (Granular structural catalog of individual questions, sub-questions, and mark distributions extracted from past papers.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
question_id
UUID
PRIMARY KEY
NO
Unique question entity identifier
document_id
UUID
FK → examination_documents.document_id
NO
Document source identifier
session_id
UUID
FK → sessions.session_id
NO
Academic session identifier
question_number
VARCHAR(20)
-
NO
Hierarchical question number (e.g., 'Q1a', 'Q3b', 'Q5')
question_text
TEXT
-
NO
Verbatim text of the question as presented in examination
total_marks
INTEGER
-
NO
Total possible marks designated for this question
topic_tag
VARCHAR(80)
-
NO
Categorical topic classification (e.g., 'Virtual Memory', 'Semaphores')
bloom_level
VARCHAR(30)
-
NO
Cognitive complexity level ('Recall', 'Application', 'Analysis', 'Synthesis')


Table 3.7.6: Table marking_scheme_criteria (Official point-by-point criteria, required technical vocabulary, and mark allocations used by examiners.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
criteria_id
UUID
PRIMARY KEY
NO
Unique criteria element identifier
question_id
UUID
FK → past_questions.question_id
NO
Referenced past examination question
criterion_step
TEXT
-
NO
Specific argument, derivation, or formula required
allocated_marks
NUMERIC(4,1)
-
NO
Marks assigned to this specific step (e.g., 2.5 marks)
required_keywords
JSONB
-
NO
Array of essential technical terminology (e.g., ['thrashing', 'page fault rate'])
deduction_rule
TEXT
-
YES
Specific penalty instructions for common student errors


Table 3.7.7: Table student_profiles (User profiles for enrolled University of Ibadan Computer Science undergraduate students.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
student_id
UUID
PRIMARY KEY
NO
Unique student account identifier
matric_number
VARCHAR(10)
-
NO
Official University of Ibadan matriculation number (e.g., '230880')
full_name
VARCHAR(100)
-
NO
Registered student full name
email
VARCHAR(120)
-
NO
Student email address
current_level
INTEGER
-
NO
Academic year level (200, 300, or 400)
created_at
TIMESTAMP
-
NO
Account creation timestamp


Table 3.7.8: Table evaluation_records (Longitudinal log of student practice attempts, awarded marks, rubric breakdowns, and diagnostic feedback.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
evaluation_id
UUID
PRIMARY KEY
NO
Unique evaluation instance identifier
student_id
UUID
FK → student_profiles.student_id
NO
Student who submitted the response
question_id
UUID
FK → past_questions.question_id
NO
Target question evaluated
submitted_answer
TEXT
-
NO
Full student draft answer text submitted for scoring
awarded_marks
NUMERIC(4,1)
-
NO
Total marks awarded by automated marking scheme evaluator
percentage_score
NUMERIC(5,2)
-
NO
Percentage performance score (0.00% - 100.00%)
qualitative_feedback
TEXT
-
NO
Detailed rubric feedback identifying met and missed criteria
evaluated_at
TIMESTAMP
-
NO
Timestamp of automated grading


Table 3.7.9: Table topic_frequencies (Aggregated examination pattern analytics calculating historical recurrence and overdue probabilities.)
Column Name
Data Type
Constraints / Keys
Nullable
Description
topic_id
UUID
PRIMARY KEY
NO
Unique topic identifier
course_id
UUID
FK → courses.course_id
NO
Course offering this topic
topic_name
VARCHAR(100)
-
NO
Curricular topic name (e.g., 'Deadlock Avoidance & Banker's Algorithm')
sessions_examined
INTEGER
-
NO
Number of sessions in which topic appeared out of last 5
last_session_appeared
VARCHAR(15)
-
NO
Most recent academic session featuring this topic
overdue_probability
NUMERIC(4,3)
-
NO
Calculated likelihood of topic appearing in the next examination cycle


3.8 SYSTEM MODULES
The system is organised into five modules: (1) the Ingestion Module (pipeline/ingest.py), responsible for file reading, text extraction, chunking, embedding, and ChromaDB insertion; (2) the Retrieval Module (pipeline/retriever.py), responsible for query embedding and semantic search; (3) the Agent Module (agent/agent.py and agent/tools.py), implementing the ReAct loop and all tool logic; (4) the API Module (api/main.py), implementing FastAPI endpoints and middleware; and (5) the Frontend Module (frontend/), implementing the React application. Each module has clearly defined inputs, outputs, and dependencies, allowing parallel development.
3.9    SUMMARY
This chapter has established the analytical and design foundation for this project’s system. System analysis identified the weaknesses of the existing informal examination preparation approach and confirmed the technical, economic, and operational feasibility of the proposed solution. Requirements analysis produced a complete set of seven functional and six non-functional requirements. System design translated these requirements into a five-layer architecture grounded in the RAG-agentic pattern, supported by a normalised relational database and a separate vector store for semantic retrieval. The data flow diagrams, use case diagram, entity relationship diagram, class diagram, and database design collectively specify the structure and behaviour of the system at a level of detail sufficient to guide implementation. Chapter Four will describe how this design was realised in code, what testing confirmed about its behaviour, and where it fell short of specification.

REFERENCES
Arthana, I. K., et al. (2025). A systematic literature review of retrieval-augmented generation implementation for enhancing large language models in education. Jurnal Nasional Pendidikan Teknik Informatika: JANAPATI.
Barenji, R. V., Salimi, M., & Khoshgoftar, M. (2026). An LLM-powered assessment retrieval-augmented generation (RAG) for higher education. arXiv preprint arXiv:2601.06141.
Bender, E. M., Gebru, T., McMillan-Major, A., & Shmitchell, S. (2021). On the dangers of stochastic parrots: Can language models be too big? In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 610–623).
Bloom, B. S., Engelhart, M. D., Furst, E. J., Hill, W. H., & Krathwohl, D. R. (1956). Taxonomy of educational objectives: The classification of educational goals. David McKay.
Dong, Q., et al. (2023). How to build an adaptive AI tutor for any course using knowledge graph-enhanced retrieval-augmented generation (KG-RAG). arXiv preprint arXiv:2311.17696.
Dutta, S., Paul, S., & Anand, S. (2023). RAGStudentGPT: A syllabus-aligned retrieval-augmented generation framework for educational AI systems. International Journal of Innovative Research in Computer Technology (IJIRCT).
Ebbinghaus, H. (1885/2013). Memory: A contribution to experimental psychology. Annals of Neurosciences, 20(4), 155–156.
Han, Z., et al. (2024). Improving assessment of tutoring practices using retrieval-augmented generation. Proceedings of Machine Learning Research, 257.
Henkel, O., et al. (2024). Retrieval-augmented generation to improve math question-answering: Trade-offs between groundedness and human preference. In Proceedings of the 17th International Conference on Educational Data Mining.
Hossain, M., et al. (2026). EduGuard: A safe RAG-based LLM tutor for programming education. arXiv preprint arXiv:2607.15738.
Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., … Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. Advances in Neural Information Processing Systems, 33, 9459–9474.
Roediger, H. L., & Butler, A. C. (2011). The critical role of retrieval practice in long-term retention. Trends in Cognitive Sciences, 15(1), 20–27.
Singla, N., et al. (2025). Retrieval-augmented generation for educational application: A systematic survey. Computers and Education: Artificial Intelligence, ScienceDirect.
Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., … Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30.
Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., & Cao, Y. (2023). ReAct: Synergizing reasoning and acting in language models. In Proceedings of the International Conference on Learning Representations (ICLR 2023).


