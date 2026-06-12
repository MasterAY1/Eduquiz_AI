import unittest
import uuid
import datetime
from pydantic import ValidationError as PydanticValidationError

# Mock app components
from app.schemas.ai import DocumentAnalysisSchema, QuizQuestionSchema, EvaluationResultSchema
from app.utils.virus_scanner import scan_file_bytes, EICAR_SIGNATURE
from app.utils.ai_cache import generate_cache_key
from app.services.document_service import document_service
from app.utils.errors import ValidationError

class TestSecuritySprint(unittest.IsolatedAsyncioTestCase):

    # ── Upload Protections ──────────────────────────────────────────────────
    def test_file_signature_pdf(self):
        # Valid PDF header
        valid_pdf = b"%PDF-1.4\n1 0 obj..."
        try:
            document_service._validate_file_signature(valid_pdf, "test.pdf")
        except ValidationError:
            self.fail("Valid PDF signature raised ValidationError")

        # Invalid PDF header
        invalid_pdf = b"NOTAPDF-1.4\n1 0 obj..."
        with self.assertRaises(ValidationError) as ctx:
            document_service._validate_file_signature(invalid_pdf, "test.pdf")
        self.assertIn("Invalid PDF file signature", str(ctx.exception))

    def test_file_signature_docx(self):
        # Valid ZIP/DOCX/PPTX header
        valid_zip = b"PK\x03\x04\x14\x00\x08\x00..."
        try:
            document_service._validate_file_signature(valid_zip, "document.docx")
            document_service._validate_file_signature(valid_zip, "slides.pptx")
        except ValidationError:
            self.fail("Valid ZIP/Office signature raised ValidationError")

        # Invalid ZIP header
        invalid_zip = b"ZIP\x03\x04..."
        with self.assertRaises(ValidationError) as ctx:
            document_service._validate_file_signature(invalid_zip, "document.docx")
        self.assertIn("Invalid Office document structure", str(ctx.exception))

    def test_file_signature_images(self):
        # PNG
        valid_png = b"\x89PNG\r\n\x1a\n\x00\x00..."
        try:
            document_service._validate_file_signature(valid_png, "image.png")
        except ValidationError:
            self.fail("Valid PNG signature raised ValidationError")

        # JPEG
        valid_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF..."
        try:
            document_service._validate_file_signature(valid_jpeg, "photo.jpg")
        except ValidationError:
            self.fail("Valid JPEG signature raised ValidationError")

        # Invalid image signature
        with self.assertRaises(ValidationError):
            document_service._validate_file_signature(b"INVALIDIMAGEBYTES", "photo.jpg")

    def test_file_signature_text_binary_check(self):
        # Valid text
        valid_txt = b"Hello world, this is a clean educational document text file."
        try:
            document_service._validate_file_signature(valid_txt, "notes.txt")
        except ValidationError:
            self.fail("Valid text signature raised ValidationError")

        # Binary/Null bytes in text file
        invalid_txt = b"Hello world\x00this is binary content"
        with self.assertRaises(ValidationError) as ctx:
            document_service._validate_file_signature(invalid_txt, "notes.txt")
        self.assertIn("binary format detected", str(ctx.exception))

    # ── Malware & Virus Scanner ─────────────────────────────────────────────
    async def test_virus_scanner_eicar(self):
        # Check EICAR detection
        is_clean, reason = await scan_file_bytes(EICAR_SIGNATURE, "test_eicar.pdf")
        self.assertFalse(is_clean)
        self.assertIn("EICAR", reason)

    async def test_virus_scanner_executable_pe(self):
        # Check DOS/PE executable detection (MZ header)
        pe_file = b"MZ\x90\x00\x03\x00\x00\x00..."
        is_clean, reason = await scan_file_bytes(pe_file, "notes.exe")
        self.assertFalse(is_clean)
        self.assertIn("executable program header detected", reason)

    async def test_virus_scanner_clean_file(self):
        # Check clean file signature passes
        clean_file = b"This is a clean document text file with no viruses."
        is_clean, reason = await scan_file_bytes(clean_file, "notes.txt")
        self.assertTrue(is_clean)
        self.assertEqual("Clean", reason)

    # ── AI Output Schema Validation ──────────────────────────────────────────
    def test_document_analysis_schema_validation(self):
        # Valid analysis output
        valid_data = {
            "subject": "Biology",
            "detected_level": "sss",
            "topics": ["Photosynthesis", "Plant Cells"],
            "subtopics": {"Photosynthesis": ["Light Reaction", "Calvin Cycle"]},
            "summary": "This is a comprehensive summary of plant cells and photosynthesis processes."
        }
        schema = DocumentAnalysisSchema.model_validate(valid_data)
        self.assertEqual(schema.subject, "Biology")
        self.assertEqual(schema.detected_level, "sss")

        # Invalid detected level
        invalid_data = valid_data.copy()
        invalid_data["detected_level"] = "invalid_level"
        with self.assertRaises(PydanticValidationError):
            DocumentAnalysisSchema.model_validate(invalid_data)

    def test_quiz_question_schema_validation(self):
        # Valid MCQ question
        valid_q = {
            "question_text": "What is the powerhouse of the cell?",
            "question_type": "mcq",
            "correct_answer": "A",
            "explanation": "Mitochondria generates most of the chemical energy.",
            "topic_reference": "Cell Biology",
            "difficulty": "easy",
            "options": [
                {"key": "A", "text": "Mitochondria"},
                {"key": "B", "text": "Nucleus"},
                {"key": "C", "text": "Ribosome"}
            ]
        }
        schema = QuizQuestionSchema.model_validate(valid_q)
        self.assertEqual(schema.question_type, "mcq")

        # Invalid type
        invalid_q = valid_q.copy()
        invalid_q["question_type"] = "invalid_type"
        with self.assertRaises(PydanticValidationError):
            QuizQuestionSchema.model_validate(invalid_q)

    # ── AI Cache Key Stability ──────────────────────────────────────────────
    def test_cache_key_generation_stability(self):
        data1 = {"provider": "gemini", "model": "gemini-2.0-flash", "prompt": "Tell me about Nigeria."}
        data2 = {"prompt": "Tell me about Nigeria.", "provider": "gemini", "model": "gemini-2.0-flash"}
        
        key1 = generate_cache_key(data1)
        key2 = generate_cache_key(data2)
        
        # Sorter key serialization must produce the exact same key regardless of dictionary ordering
        self.assertEqual(key1, key2)
        self.assertEqual(len(key1), 64)  # SHA-256 is 64 hex characters

if __name__ == "__main__":
    unittest.main()
