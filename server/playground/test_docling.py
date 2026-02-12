from docling.document_converter import DocumentConverter

source = r"server\data\2309.17425v3.pdf"  # document per local path or URL
converter = DocumentConverter()
result = converter.convert(source)
with open("output.md", "w", encoding="utf-8") as f:
    f.write(result.document.export_to_markdown())
print(result.document.export_to_markdown())  # output: "## Docling Technical Report[...]"