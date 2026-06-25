from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct


class VectorDB:
    """A simple wrapper around the Qdrant client for vector database operations."""

    def __init__(self, host: str = "localhost", port: int = 6333):
        self.client = QdrantClient(host=host, port=port)

    def create_collection(self, collection_name: str, vector_size: int):
        """Create a new collection in the vector database."""
        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )

    def insert_vector(self, collection_name: str, point_id: int, vector: list[float], payload: dict):
        """Insert a new vector into the specified collection."""
        is_collection_exist = self.client.collection_exists(collection_name)  # Ensure the collection exists before inserting

        if not is_collection_exist:
            self.create_collection(collection_name, len(vector))

        self.client.upsert(
            collection_name=collection_name,
            points=[PointStruct(id=point_id, vector=vector, payload=payload)]
        )



vector_db = VectorDB()