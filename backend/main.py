from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from backend.utils.utils import load_faiss_and_data, retrieve_chunks, summarize_answer

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load once
index, metadata, chunks = load_faiss_and_data()

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5

class QueryResponse(BaseModel):
    summary: str
    matched_chunks: List[str]

@app.post("/ask", response_model=QueryResponse)
def ask_question(req: QueryRequest):
    retrieved = retrieve_chunks(req.question, index, metadata, chunks, req.top_k)
    summary   = summarize_answer(retrieved)
    texts     = [text for text, _ in retrieved]
    return QueryResponse(summary=summary, matched_chunks=texts)

@app.get("/")
def health_check():
    return {"msg": "RAG Legal Chatbot Backend is running 🚀"}
