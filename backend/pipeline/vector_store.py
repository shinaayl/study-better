import os
import chromadb
from typing import List, Dict, Any, Optional
from backend.config import CHROMA_DB_PATH

class VectorStoreManager:
    def __init__(self, collection_name: str = "ui_csc_knowledge_base"):
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_chunks(self, chunks: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        if not chunks:
            return
        # Batch insert to handle any payload size smoothly
        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            end = i + batch_size
            self.collection.upsert(
                documents=chunks[i:end],
                metadatas=metadatas[i:end],
                ids=ids[i:end]
            )

    def search(
        self, 
        query: str, 
        top_k: int = 5, 
        course_code: Optional[str] = None, 
        document_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        where_filter = None
        conditions = []
        if course_code:
            conditions.append({"course_code": course_code.upper().strip()})
        if document_type:
            conditions.append({"document_type": document_type})

        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}

        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        formatted = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            dists = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
            ids = results["ids"][0] if results.get("ids") else [""] * len(docs)

            for doc, meta, dist, chunk_id in zip(docs, metas, dists, ids):
                # Cosine distance: similarity = 1 - distance
                similarity = max(0.0, min(1.0, 1.0 - dist)) if dist is not None else 0.5
                formatted.append({
                    "chunk_id": chunk_id,
                    "text": doc,
                    "metadata": meta,
                    "similarity": round(similarity, 4),
                    "course_code": meta.get("course_code", "CSC"),
                    "session": meta.get("academic_year", "N/A"),
                    "document_type": meta.get("document_type", "past_examination_paper")
                })
        return formatted

    def count(self) -> int:
        return self.collection.count()
