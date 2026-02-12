#!/usr/bin/env python3
"""
PDF Extractor using Docling library with fallback methods.
"""
import os
import sys
import re
import urllib.parse
from typing import Optional


class PDFExtractor:
    """
    Extract PDF content to Markdown using Docling library.
    Falls back to pymupdf4llm or other methods if Docling fails.
    """
    
    _docling_converter = None  # Singleton instance
    
    def __init__(self):
        """Initialize PDFExtractor with global DocumentConverter."""
        self.markdown_content = None
        self.source_path = None
        self.clean_images = True
        self.use_fallback = False

        # Initialize global DocumentConverter if not already done
        if PDFExtractor._docling_converter is None:
            try:
                print("pdf_extractor: Initializing global DocumentConverter...")
                from docling.document_converter import DocumentConverter
                PDFExtractor._docling_converter = DocumentConverter()
                print("pdf_extractor: DocumentConverter initialized successfully")
            except ImportError:
                print("pdf_extractor: docling library not found. Will use fallback.")
            except Exception as e:
                print(f"pdf_extractor: Error initializing DocumentConverter: {e}")

    def extract_from_file(self, file_path: str) -> str:
        """Extract content from local PDF file."""
        self.source_path = file_path
        
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Try Docling first
        if PDFExtractor._docling_converter:
            try:
                print(f"pdf_extractor: Extracting with Docling: {file_path}")
                result = PDFExtractor._docling_converter.convert(file_path)
                self.markdown_content = result.document.export_to_markdown()
                print("pdf_extractor: Docling extraction successful")
                return self.markdown_content
            except Exception as e:
                print(f"pdf_extractor: Docling failed: {e}")
                print("pdf_extractor: Trying fallback...")
        
        # Fallback
        self.use_fallback = True
        self.markdown_content = self._extract_text_fallback(file_path)
        return self.markdown_content

    def extract_from_url(self, url: str) -> str:
        """Extract content from PDF URL."""
        self.source_path = url
        
        # Try Docling first (it can handle URLs directly)
        if PDFExtractor._docling_converter:
            try:
                print(f"pdf_extractor: Extracting URL with Docling: {url}")
                result = PDFExtractor._docling_converter.convert(url)
                self.markdown_content = result.document.export_to_markdown()
                print("pdf_extractor: Docling URL extraction successful")
                return self.markdown_content
            except Exception as e:
                print(f"pdf_extractor: Docling URL failed: {e}")
        
        # Fallback: download and extract locally
        print("pdf_extractor: Downloading PDF for fallback extraction...")
        self.use_fallback = True
        
        import requests
        temp_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_download.pdf")
        
        try:
            r = requests.get(url, stream=True, timeout=60)
            r.raise_for_status()
            with open(temp_file, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            self.markdown_content = self._extract_text_fallback(temp_file)
            
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
            return self.markdown_content
        except Exception as e:
            if os.path.exists(temp_file):
                os.remove(temp_file)
            raise RuntimeError(f"Cannot download/extract PDF from URL: {e}")

    def _extract_text_fallback(self, file_path: str) -> str:
        """Fallback extraction using pymupdf4llm or other libraries."""
        extracted_text = ""
        
        # Try pymupdf4llm (best for LLM)
        try:
            import pymupdf4llm
            print("pdf_extractor: Trying pymupdf4llm...")
            return pymupdf4llm.to_markdown(file_path)
        except ImportError:
            print("pdf_extractor: pymupdf4llm not installed")
        except Exception as e:
            print(f"pdf_extractor: pymupdf4llm failed: {e}")

        # Try fitz (PyMuPDF)
        try:
            import fitz
            print("pdf_extractor: Trying fitz (PyMuPDF)...")
            doc = fitz.open(file_path)
            for page in doc:
                extracted_text += page.get_text() + "\n\n"
            doc.close()
            
            if extracted_text.strip():
                print("pdf_extractor: fitz extraction successful")
                return f"# Extracted Content\n\n{extracted_text}"
        except ImportError:
            print("pdf_extractor: fitz not installed")
        except Exception as e:
            print(f"pdf_extractor: fitz failed: {e}")
        
        # Try PyPDF2
        try:
            import PyPDF2
            print("pdf_extractor: Trying PyPDF2...")
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page in pdf_reader.pages:
                    extracted_text += page.extract_text() + "\n\n"
            
            if extracted_text.strip():
                print("pdf_extractor: PyPDF2 extraction successful")
                return f"# Extracted Content\n\n{extracted_text}"
        except ImportError:
            print("pdf_extractor: PyPDF2 not installed")
        except Exception as e:
            print(f"pdf_extractor: PyPDF2 failed: {e}")
        
        # Try pdfplumber
        try:
            import pdfplumber
            print("pdf_extractor: Trying pdfplumber...")
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n\n"
            
            if extracted_text.strip():
                print("pdf_extractor: pdfplumber extraction successful")
                return f"# Extracted Content\n\n{extracted_text}"
        except ImportError:
            print("pdf_extractor: pdfplumber not installed")
        except Exception as e:
            print(f"pdf_extractor: pdfplumber failed: {e}")
        
        if not extracted_text.strip():
            raise RuntimeError("All PDF extraction methods failed")
        
        return extracted_text

    def clean_base64_images(self, min_length: int = 100) -> str:
        """Remove base64 encoded images from markdown content."""
        if not self.markdown_content:
            raise ValueError("No content to clean. Extract first.")
        
        pattern = rf'!\[.*?\]\(data:image\/[^;]+;base64,[a-zA-Z0-9+/=]{{{min_length},}}\)'
        self.markdown_content = re.sub(pattern, '[Image removed]', self.markdown_content)
        
        return self.markdown_content

    def get_output_filename(self) -> str:
        """Generate output filename from source path."""
        if not self.source_path:
            raise ValueError("No source path set")
        
        if self.source_path.startswith(("http://", "https://")):
            parsed = urllib.parse.urlparse(self.source_path)
            file_name = os.path.basename(parsed.path)
            if not file_name or "." not in file_name:
                file_name = parsed.hostname.replace(".", "_") + ".pdf"
        else:
            file_name = os.path.basename(self.source_path)
        
        base_name, _ = os.path.splitext(file_name)
        return f"{base_name}.md"

    def save_markdown(self, output_path: Optional[str] = None) -> str:
        """Save extracted markdown to file."""
        if not self.markdown_content:
            raise ValueError("No content to save. Extract first.")
        
        if not output_path:
            output_path = self.get_output_filename()
        
        if self.clean_images:
            self.clean_base64_images()
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(self.markdown_content)
        
        return output_path

    def process(self, source: str, output_path: Optional[str] = None, clean_images: bool = True) -> str:
        """Full process: extract and save."""
        self.clean_images = clean_images
        
        if source.startswith(("http://", "https://")):
            self.extract_from_url(source)
        else:
            self.extract_from_file(source)
        
        return self.save_markdown(output_path)


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <file_or_url> [output_path]")
        sys.exit(1)

    try:
        source = sys.argv[1]
        output_path = sys.argv[2] if len(sys.argv) > 2 else None
        
        extractor = PDFExtractor()
        saved = extractor.process(source, output_path)
        print(f"Saved to: {saved}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
