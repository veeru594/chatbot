from openai import OpenAI
import json
import numpy as np

client = OpenAI()

def embed(text):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return np.array(response.data[0].embedding)

# Load KB once
with open("app/data/knowledge_base.json", "r", encoding="utf-8") as f:
    KB = json.load(f)

# Flatten KB into chunks
def flatten_kb(data, prefix=""):
    chunks = []

    if isinstance(data, dict):
        # Dive into nested objects
        for key, value in data.items():
            path = f"{prefix}.{key}" if prefix else key
            chunks.extend(flatten_kb(value, path))

    elif isinstance(data, list):
        # Handle list of strings
        if all(isinstance(item, str) for item in data):
            chunks.append((prefix, " ".join(data)))
        
        # Handle list of dicts
        elif all(isinstance(item, dict) for item in data):
            for i, item in enumerate(data):
                path = f"{prefix}[{i}]"
                chunks.extend(flatten_kb(item, path))
        
        # Handle mixed list
        else:
            merged = " ".join([str(item) for item in data])
            chunks.append((prefix, merged))

    else:
        # Base scalar (str, int, bool)
        chunks.append((prefix, str(data)))

    return chunks


KB_CHUNKS = flatten_kb(KB)
KB_EMBEDDINGS = [(k, v, embed(v)) for k, v in KB_CHUNKS]

def retrieve_best(query, top_k=3):
    q_emb = embed(query)
    scored = []
    for key, text, emb in KB_EMBEDDINGS:
        score = float(np.dot(q_emb, emb))  # cosine-like
        scored.append((score, key, text))
    scored.sort(reverse=True)
    return scored[:top_k]
