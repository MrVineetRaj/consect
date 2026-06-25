from pydantic import BaseModel
from enum import Enum

class DocumentType(Enum):
    URL = "url"
    DOC = "doc"
    PDF = "pdf"
    TEXT = "text"
    MD = "md"

class EmbedDocumentRequest(BaseModel):
    id: str
    organizationId: str | None
    publicId: str
    allowedChannelIds: list[str]
    tags: list[str]
    type: DocumentType
    secureURL: str
    embeddingId: str | None = None
    callbackUrl: str | None = None