import textract
from pypdf import PdfReader


from models.req_models import DocumentType


def _detect_word_extension(file_path: str) -> str:
    """The cache stores files without an extension, but textract selects its
    parser by extension. Sniff the magic bytes to tell a modern `.docx`
    (a zip archive, starts with `PK\\x03\\x04`) from a legacy `.doc`
    (an OLE compound file, starts with `\\xD0\\xCF\\x11\\xE0`)."""
    with open(file_path, "rb") as f:
        header = f.read(8)
    if header.startswith(b"PK\x03\x04"):
        return "docx"
    if header.startswith(b"\xD0\xCF\x11\xE0"):
        return "doc"
    # Default to docx — it's by far the common case for uploads.
    return "docx"


def readDocuments(type: DocumentType, file_path: str):
    try:
        if type == DocumentType.TEXT or type == DocumentType.MD:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            return text

        if type == DocumentType.PDF:
            reader = PdfReader(file_path)
            print(f"Number of pages: {len(reader.pages)}")

            # Extract text from every page, not just the first.
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return text

        if type == DocumentType.DOC:
            extension = _detect_word_extension(file_path)
            print(f"Reading Word document as .{extension}")
            # textract needs the extension hint since the cached file has none.
            raw = textract.process(file_path, extension=extension)
            text = raw.decode("utf-8", errors="ignore")
            return text

        raise ValueError(f"Unsupported document type: {type}")
    except Exception as _:
        return ""
