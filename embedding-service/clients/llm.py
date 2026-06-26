from openai import AsyncOpenAI

from env import env


class LLMClient:
    """OpenAI-backed client for the embedding pipeline. Mirrors the Node app's
    `clients/llm.ts`: a single client configured once, exposed as a module-level
    singleton."""

    # Keep in sync with the Node app (and the Qdrant collection size of 1536).
    EMBEDDING_MODEL = "text-embedding-3-small"

    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=env.OPENAI_API_KEY)

    async def get_embeddings(self, text: str) -> list[float]:
        """Generate an embedding vector for a single piece of text."""
        result = await self.client.embeddings.create(
            input=text,
            model=self.EMBEDDING_MODEL,
        )
        return result.data[0].embedding


llm_client = LLMClient()
