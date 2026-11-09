from typing import List, Dict, Any, Optional
from pipeline.vector_store import VectorStoreManager
from config import MAX_RETRIEVAL_CHUNKS, SIMILARITY_THRESHOLD

class CourseRetriever:
    def __init__(self):
        self.vector_store = VectorStoreManager()

    def retrieve(
        self, 
        query: str, 
        course_code: Optional[str] = None, 
        document_type: Optional[str] = None,
        top_k: int = MAX_RETRIEVAL_CHUNKS
    ) -> List[Dict[str, Any]]:
        raw_results = self.vector_store.search(
            query=query,
            top_k=top_k,
            course_code=course_code,
            document_type=document_type
        )
        
        # Format citation header for educational RAG
        for item in raw_results:
            meta = item.get("metadata", {})
            cc = meta.get("course_code", "CSC Core")
            year = meta.get("academic_year", "Historical")
            dtype = "Marking Scheme" if meta.get("document_type") == "marking_scheme" else "Past Question Paper"
            src = meta.get("source_filename", "Department Archive")
            item["citation"] = f"[{cc} · {year} · {dtype} · File: {src}]"
            
        return raw_results

    def format_context_for_prompt(self, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return "No relevant departmental examination context found."
            
        context_blocks = []
        for i, c in enumerate(chunks, 1):
            citation = c.get("citation", "[CSC Archive]")
            sim = c.get("similarity", 0.0)
            text = c.get("text", "").strip()
            context_blocks.append(f"--- Context {i} {citation} (Relevance Score: {sim:.2f}) ---\n{text}")
            
        return "\n\n".join(context_blocks)
