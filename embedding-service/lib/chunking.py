
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

def insert_chunks_into_vector_db(chunks: list[str], embeddings: list[list[float]], collection_name: str, meta: dict = None):
    """Insert text chunks and their corresponding embeddings into the vector database."""
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vector_db.insert_vector(collection_name=collection_name, point_id=i, vector=embedding, payload={"text": chunk, **meta})
    
