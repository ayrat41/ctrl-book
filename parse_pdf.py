from pypdf import PdfReader
reader = PdfReader("Ctrl & Snap.pdf")
for page in reader.pages:
    print(page.extract_text())
