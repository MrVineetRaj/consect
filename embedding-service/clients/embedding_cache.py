from pathlib import Path

import httpx

# Service root (the dir holding main.py), i.e. the parent of this `clients/` dir.
SERVICE_ROOT = Path(__file__).resolve().parent.parent


class EmbeddingCache:
    """Fetches resource documents (uploaded to Cloudinary by the Node app) and
    caches them on local disk before they go through the embedding pipeline.

    Follows the same shape as the Node `clients/*` adapters: a single class
    configured once, exposed as a module-level singleton."""

    def __init__(self) -> None:
        # A dedicated cache folder inside the service (temp/cache), created once.
        self.cache_dir = SERVICE_ROOT / "temp" / "cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path_for(self, public_id: str) -> Path:
        # Cloudinary public ids carry their folder path (e.g.
        # `consect/ws_<id>/ai_hub/<name>`); flatten the "/" so it maps to a
        # single safe filename inside the cache dir.
        safe_name = public_id.replace("/", "_")
        return self.cache_dir / safe_name

    async def fetch_document(self, secure_url: str, public_id: str) -> Path:
        """Download the document at `secure_url` into the cache and return its
        local path. If it was fetched before, the cached copy is reused."""
        dest = self._path_for(public_id)
        if dest.exists():
            return dest

        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            response = await client.get(secure_url)
            response.raise_for_status()
            dest.write_bytes(response.content)

        return dest

    def clear(self, public_id: str) -> None:
        """Drop a cached document once it has been embedded."""
        self._path_for(public_id).unlink(missing_ok=True)


embedding_cache = EmbeddingCache()
