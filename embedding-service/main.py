from fastapi import FastAPI
import uvicorn
import httpx


from clients.embedding_cache import embedding_cache
from env import env  # noqa: F401  validates env on startup
from models.req_models import EmbedDocumentRequest
from clients.document_reader import readDocuments
from lib.chunking import get_chunks, get_embedding_for_chunks, insert_chunks_into_vector_db


app = FastAPI()


@app.post("/embed_document")
async def embed_document(data: EmbedDocumentRequest):
    print(f"Received request to embed document with ID: {data.id}")

    # Pull the document down to the local embedding cache before processing.
    document_path = await embedding_cache.fetch_document(
        secure_url=data.secureURL,
        public_id=data.publicId,
    )
    print(f"Document cached at: {document_path}")

    # Read the document and extract text
    text = readDocuments(data.type, document_path)

    chunks = get_chunks(text)
    print(f"Document split into {len(chunks)} chunks.")

    # Generate embeddings for each chunk
    embeddings =  await get_embedding_for_chunks(chunks)
    print(f"Generated embeddings for {len(embeddings)} chunks.")

    # Insert chunks and embeddings into the vector database
    point_ids = insert_chunks_into_vector_db(chunks, embeddings, collection_name=data.organizationId, meta=data.model_dump())
    print(f"Inserted chunks and embeddings into vector database collection: {data.organizationId}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "http://localhost:8000/api/webhook/embedding/status-update",
                json={
                    "pointIds": point_ids,
                    "organizationId": data.organizationId,
                },
            )
            resp.raise_for_status()
            print(f"Webhook responded: {resp.status_code}")
    except httpx.HTTPError as e:
        print(f"Webhook call failed: {e}")

    return {"message": "Document embedded successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
