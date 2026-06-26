from pypdf import PdfReader

from models.req_models import DocumentType




def readDocuments(type: DocumentType, file_path: str):
    if type == DocumentType.PDF:    
        reader = PdfReader(file_path)
        print(f"Number of pages: {len(reader.pages)}")

        # Extract text from the first page
        text = reader.pages[0].extract_text()
        return text