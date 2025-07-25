import json
import numpy as np
import faiss
import torch
from sentence_transformers import SentenceTransformer
from transformers import pipeline, BartTokenizerFast

# Device & models
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"✅ Device set to use {DEVICE}")

EMBEDDER    = SentenceTransformer("multi-qa-MiniLM-L6-cos-v1", device=DEVICE)
SUMMARIZER  = pipeline(
    "summarization",
    model="sshleifer/distilbart-cnn-12-6",
    device=0 if DEVICE=="cuda" else -1
)
TOKENIZER   = BartTokenizerFast.from_pretrained("sshleifer/distilbart-cnn-12-6")

# Paths
INDEX_PATH    = "data/faiss_index.index"
METADATA_PATH = "data/embedding_metadata.json"
CHUNKS_PATH   = "data/central_chunks.jsonl"

def load_faiss_and_data():
    # 1) load FAISS index
    index = faiss.read_index(INDEX_PATH)

    # 2) load metadata (unused in core flow, but kept if needed)
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    # 3) load just the text field for each chunk
    with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
        chunks = [json.loads(line)["text"] for line in f]

    return index, metadata, chunks

def retrieve_chunks(question: str, index, metadata, chunks, top_k: int = 5):
    # embed + search
    q_emb = EMBEDDER.encode([question]).astype("float32")
    scores, ids = index.search(np.array(q_emb), top_k)

    # gather (text, score)
    results = []
    for score, idx in zip(scores[0], ids[0]):
        if 0 <= idx < len(chunks):
            results.append((chunks[idx], float(score)))
    return results

def summarize_answer(retrieved: list[tuple[str, float]]):
    # combine all retrieved text
    combined = " ".join([text for text, _ in retrieved])

    # tokenize and truncate to max 1024 tokens
    inputs = TOKENIZER(combined, return_tensors="pt", truncation=True, max_length=1024).to(DEVICE)

    # generate summary
    summary_ids = SUMMARIZER.model.generate(
        inputs["input_ids"],
        max_length=200,
        min_length=30,
        num_beams=4,
        early_stopping=True
    )
    return TOKENIZER.decode(summary_ids[0], skip_special_tokens=True)
