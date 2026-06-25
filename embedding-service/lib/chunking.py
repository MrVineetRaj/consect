import uuid

from clients.vector_da import vector_db
from clients.llm import llm_client

def get_chunks(text: str, chunk_size: int = 2000, overlapping: int = 200) -> list[str]:
    """Split a string into chunks of a specified size."""
    chunks = []
    for i in range(0, len(text), chunk_size - overlapping):
        chunks.append(text[i:i + chunk_size])
    return chunks

async def get_embedding_for_chunks(chunks: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of text chunks using the provided LLM client."""
    embeddings = []
    for chunk in chunks:
        embedding = await llm_client.get_embeddings(chunk)
        embeddings.append(embedding)
    return embeddings

def insert_chunks_into_vector_db(chunks: list[str], embeddings: list[list[float]], collection_name: str, meta: dict = None) -> list:
    """Insert text chunks and their corresponding embeddings into the vector database."""
    meta = meta or {}
    public_id = meta.get("publicId", "")
    point_ids:list = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        # Deterministic, globally-unique id per (document, chunk). Using the
        # chunk index alone made every document reuse ids 0,1,2,… so each new
        # upload overwrote the previous document's points. uuid5 keeps it stable
        # so re-embedding the same document overwrites only its own chunks.
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{public_id}:{i}"))
        vector_db.insert_vector(collection_name=collection_name, point_id=point_id, vector=embedding, payload={"text": chunk, **meta})
        point_ids.append(point_id)
    
    return point_ids
    
