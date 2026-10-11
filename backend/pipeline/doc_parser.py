import os
import re
import uuid
from typing import Dict, List, Any, Tuple
import docx

COURSE_METADATA_MAP = {
    "CSC 101": {"title": "Introduction to Computer Science", "level": 100, "semester": "First Semester", "units": 3},
    "CSC 102": {"title": "Introduction to Problem Solving and Programming", "level": 100, "semester": "Second Semester", "units": 3},
    "CSC 213": {"title": "Foundations of Sequential Program Design", "level": 200, "semester": "First Semester", "units": 3},
    "CSC 222": {"title": "Digital Logic and Computer Organization", "level": 200, "semester": "Second Semester", "units": 3},
    "CSC 231": {"title": "Scientific Programming with Matlab", "level": 200, "semester": "First Semester", "units": 3},
    "CSC 321": {"title": "Operating Systems & Systems Programming", "level": 300, "semester": "First Semester", "units": 3},
    "CSC 351": {"title": "Database Systems & Design", "level": 300, "semester": "First Semester", "units": 3},
    "CSC 431": {"title": "Advanced Algorithms & Complexity Analysis", "level": 400, "semester": "First Semester", "units": 3},
    "CSC 472": {"title": "Software Engineering & Project Management", "level": 400, "semester": "Second Semester", "units": 3},
    "CSC 551": {"title": "Distributed Systems & Cloud Computing", "level": 500, "semester": "First Semester", "units": 3},
    "CSC 552": {"title": "Computer Networks & Internet Protocols", "level": 500, "semester": "First Semester", "units": 3},
    "CSC 574": {"title": "Intelligent Systems & Artificial Intelligence", "level": 500, "semester": "First Semester", "units": 3},
    "CSC 582": {"title": "Introduction to Bioinformatics", "level": 500, "semester": "First Semester", "units": 3},
    "CSC 583": {"title": "Computer and Information Security", "level": 500, "semester": "First Semester", "units": 3},
}

TOPIC_KEYWORDS = {
    "Memory Management & Virtual Memory": ["memory", "fragmentation", "partition", "paging", "page fault", "thrashing", "virtual memory"],
    "Process Scheduling & CPU Scheduling": ["scheduling", "turnaround", "waiting time", "cpu time", "fcfs", "round robin", "sjf", "process"],
    "Concurrency & Synchronization": ["deadlock", "banker", "semaphore", "mutex", "critical section", "synchronization", "concurrency"],
    "Scientific Computing & Matlab Syntax": ["matlab", "matrix", "vector", "inbuilt", "plot", "script", "function", "array"],
    "Digital Logic & Error Correction": ["hamming", "parity", "truth table", "flip flop", "logic gate", "boolean", "circuit"],
    "Database Systems & Normalization": ["database", "sql", "relational", "normalization", "1nf", "2nf", "3nf", "bcnf", "er diagram", "schema"],
    "Algorithms & Computational Complexity": ["complexity", "big o", "np-complete", "graph", "dynamic programming", "sorting", "search"],
    "Software Engineering & Design Patterns": ["software", "sdlc", "agile", "waterfall", "uml", "design pattern", "testing", "requirements"],
    "Distributed Systems & Networks": ["distributed", "network", "tcp", "ip", "packet", "socket", "rpc", "consensus", "cloud"],
    "Computer Security & Cryptography": ["security", "threat", "encryption", "cipher", "hash", "vulnerability", "malware", "authentication"],
    "Intelligent Systems & AI Search": ["heuristic", "a* search", "expert system", "machine learning", "neural", "knowledge", "inference"],
    "Bioinformatics & Sequence Alignment": ["alignment", "dna", "rna", "sequence", "fasta", "blast", "bioinformatics", "genome"]
}

def detect_topic(text: str) -> str:
    text_lower = text.lower()
    best_topic = "General Computer Science Principles"
    max_score = 0
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > max_score:
            max_score = score
            best_topic = topic
    return best_topic

def detect_bloom_level(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ["evaluate", "critique", "justify", "defend", "assess"]):
        return "Evaluation"
    if any(w in text_lower for w in ["design", "develop", "construct", "formulate", "create"]):
        return "Synthesis"
    if any(w in text_lower for w in ["analyze", "compare", "contrast", "differentiate", "distinguish", "examine"]):
        return "Analysis"
    if any(w in text_lower for w in ["apply", "solve", "calculate", "compute", "implement", "execute", "write"]):
        return "Application"
    if any(w in text_lower for w in ["explain", "describe", "discuss", "summarize", "interpret"]):
        return "Comprehension"
    return "Recall"

def extract_docx_text(file_path: str) -> str:
    doc = docx.Document(file_path)
    content_parts = []
    
    # Process paragraphs
    for p in doc.paragraphs:
        t = p.text.strip()
        if t:
            content_parts.append(t)
            
    # Process tables
    for table in doc.tables:
        table_rows = []
        for row in table.rows:
            row_text = [cell.text.strip().replace("\n", " ") for cell in row.cells if cell.text.strip()]
            if row_text:
                table_rows.append(" | ".join(row_text))
        if table_rows:
            content_parts.append("\n".join(table_rows))
            
    return "\n\n".join(content_parts)

def extract_doc_binary_text(file_path: str) -> str:
    with open(file_path, "rb") as f:
        data = f.read()
    raw_strings = re.findall(b"[\x20-\x7E]{4,}", data)
    extracted = [s.decode("latin1", errors="ignore").strip() for s in raw_strings]
    # Filter junk binary noise
    cleaned = [s for s in extracted if len(s) > 3 and not s.startswith("Microsoft")]
    return "\n".join(cleaned)

def parse_examination_document(file_path: str) -> Dict[str, Any]:
    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    
    if filename.lower().endswith(".docx"):
        raw_text = extract_docx_text(file_path)
    elif filename.lower().endswith(".doc"):
        raw_text = extract_doc_binary_text(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_text = f.read()

    # 1. Course Code Detection
    course_code = None
    # Check filename first
    fn_match = re.search(r"csc\s*(\d{3})", filename, re.IGNORECASE)
    if fn_match:
        course_code = f"CSC {fn_match.group(1)}"
    else:
        text_match = re.search(r"csc\s*(\d{3})", raw_text[:1000], re.IGNORECASE)
        if text_match:
            course_code = f"CSC {text_match.group(1)}"
        else:
            course_code = "CSC 321"

    meta = COURSE_METADATA_MAP.get(course_code, {
        "title": f"{course_code} Core Principles",
        "level": 300,
        "semester": "First Semester",
        "units": 3
    })

    # 2. Session detection
    sess_match = re.search(r"(\d{4}\s*[/_-]\s*\d{4})", raw_text[:1500])
    session_year = sess_match.group(1).replace("-", "/").replace("_", "/").strip() if sess_match else "2022/2023"

    # 3. Document Type
    is_marking_scheme = bool(re.search(r"marking\s*(?:guide|scheme|quide)|ms", filename, re.IGNORECASE) or 
                            re.search(r"marking\s*(?:guide|scheme|quide)", raw_text[:500], re.IGNORECASE))
    doc_type = "marking_scheme" if is_marking_scheme else "past_examination_paper"

    # 4. Extract Questions and Criteria
    questions = []
    # Pattern to split questions
    q_blocks = re.split(r"(?:\n+(?=(?:QUESTION\s+[A-Z0-9]+|Q\d+[a-z]?[\.\)\t:]|\b\d+[a-z]?\s*[\.\)\t])))", raw_text, flags=re.IGNORECASE)
    
    q_index = 1
    for block in q_blocks:
        block = block.strip()
        if len(block) < 25:
            continue
            
        first_line = block.split("\n")[0].strip().lower()
        if any(h in first_line for h in ["university of ibadan", "b.sc. degree", "department of computer", "faculty of"]) and not re.search(r"^(?:QUESTION\s+[A-Z0-9]+|Q\d+|1[a-z]?[\.\)\t])", block, re.IGNORECASE):
            continue

        # Detect question header
        header_match = re.search(r"^(?:QUESTION\s+([A-Z0-9]+)|Q(\d+[a-z]?)|(\d+[a-z]?))", block, re.IGNORECASE)
        q_num = f"Q{q_index}"
        if header_match:
            q_num_part = header_match.group(1) or header_match.group(2) or header_match.group(3)
            q_num = f"Q{q_num_part}"
        
        # Detect marks
        mark_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:marks?|mks)", block, re.IGNORECASE)
        total_marks = float(mark_match.group(1)) if mark_match else (10.0 if "marking" not in filename.lower() else 5.0)
        
        topic = detect_topic(block)
        bloom = detect_bloom_level(block)

        # Criteria steps extraction
        criteria = []
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        for line in lines:
            line_lower = line.lower()
            if any(b in line_lower for b in ["university of ibadan", "department of computer", "b.sc. degree", "time allowed", "instructions:"]):
                continue
            line_mark = re.search(r"(\d+(?:\.\d+)?)\s*(?:marks?|mks)", line, re.IGNORECASE)
            alloc = float(line_mark.group(1)) if line_mark else round(total_marks / max(1, min(len(lines), 4)), 1)
            # Keywords extraction
            words = re.findall(r"\b[A-Za-z]{4,}\b", line)
            filtered_kws = [w.lower() for w in words if w.lower() not in {"this", "that", "with", "from", "each", "have", "been", "which", "marks", "question"}]
            criteria.append({
                "criterion_step": line[:300],
                "allocated_marks": alloc,
                "required_keywords": filtered_kws[:6],
                "deduction_rule": "Deduct 50% for missing core terminology or incorrect step logic."
            })

        questions.append({
            "question_number": q_num,
            "question_text": block,
            "total_marks": total_marks,
            "topic_tag": topic,
            "bloom_level": bloom,
            "criteria": criteria[:5] # keep top distinct criteria steps
        })
        q_index += 1

    # 5. Semantic Document Chunking
    chunks = []
    # 350-word sliding window chunking with 50-word overlap
    words = raw_text.split()
    chunk_size = 350
    overlap = 50
    start = 0
    c_idx = 0
    while start < len(words):
        chunk_words = words[start:start + chunk_size]
        chunk_str = " ".join(chunk_words)
        chunks.append({
            "chunk_index": c_idx,
            "chunk_text": chunk_str,
            "token_count": len(chunk_words)
        })
        start += (chunk_size - overlap)
        c_idx += 1

    return {
        "filename": filename,
        "file_size": file_size,
        "course_code": course_code,
        "course_title": meta["title"],
        "level": meta["level"],
        "semester": meta["semester"],
        "credit_units": meta["units"],
        "session": session_year,
        "document_type": doc_type,
        "raw_text": raw_text,
        "questions": questions,
        "chunks": chunks
    }
