"""
PDF Generator - Convert HTML resumes to PDF using WeasyPrint
Properly preserves formatting and styles
"""

import os
import io
from typing import Optional
from pathlib import Path

from app.services.resume_schema import TailoredResumeSchema
from app.services.resume_templates import render_resume


class PDFGenerator:
    """
    Generate professional PDFs from TailoredResumeSchema.
    Uses WeasyPrint for accurate HTML-to-PDF conversion.
    """

    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or os.getenv(
            "UPLOAD_DIR", "/home/hairzee/prods/applymate/backend/uploads"
        )
        os.makedirs(self.output_dir, exist_ok=True)

    def generate(
        self, resume: TailoredResumeSchema, filename: Optional[str] = None
    ) -> tuple[bytes, str]:
        """
        Generate PDF from tailored resume.

        Args:
            resume: TailoredResumeSchema with resume data
            filename: Optional filename (without extension)

        Returns:
            Tuple of (PDF bytes, full path to saved file)
        """
        html = render_resume(resume, resume.template_used)

        try:
            from weasyprint import HTML, CSS

            pdf_bytes = HTML(string=html).write_pdf()
        except ImportError:
            from fpdf import FPDF

            pdf_bytes = self._fallback_generate(resume)

        if filename:
            filepath = os.path.join(self.output_dir, f"{filename}.pdf")
            with open(filepath, "wb") as f:
                f.write(pdf_bytes)
            return pdf_bytes, filepath

        return pdf_bytes, ""

    def generate_to_bytes(self, resume: TailoredResumeSchema) -> bytes:
        """Generate PDF and return as bytes only"""
        html = render_resume(resume, resume.template_used)

        try:
            from weasyprint import HTML

            return HTML(string=html).write_pdf()
        except ImportError:
            from fpdf import FPDF

            return self._fallback_generate(resume)

    def _fallback_generate(self, resume: TailoredResumeSchema) -> bytes:
        """Fallback PDF generation using fpdf2 when WeasyPrint unavailable"""
        from fpdf import FPDF

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        pdf.set_font("Helvetica", "B", 18)
        name = resume.basics.name if resume.basics else "Candidate"
        pdf.cell(0, 10, name, ln=True)

        if resume.basics and resume.basics.label:
            pdf.set_font("Helvetica", "I", 12)
            pdf.cell(0, 8, resume.basics.label, ln=True)

        pdf.ln(5)

        if resume.basics and resume.basics.summary:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 8, "Professional Summary", ln=True)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, resume.basics.summary)
            pdf.ln(5)

        if resume.skills:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 8, "Skills", ln=True)
            pdf.set_font("Helvetica", "", 9)
            for skill in resume.skills:
                skills_text = f"{skill.name}: {', '.join(skill.keywords)}"
                pdf.multi_cell(0, 5, skills_text)
            pdf.ln(5)

        if resume.work:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 8, "Experience", ln=True)
            for job in resume.work:
                pdf.set_font("Helvetica", "B", 10)
                pdf.cell(0, 6, f"{job.position} at {job.name}", ln=True)
                if job.start_date or job.end_date:
                    pdf.set_font("Helvetica", "I", 8)
                    dates = f"{job.start_date or ''} - {job.end_date or 'Present'}"
                    pdf.cell(0, 5, dates, ln=True)
                if job.highlights:
                    pdf.set_font("Helvetica", "", 8)
                    for h in job.highlights[:3]:
                        pdf.multi_cell(0, 4, f"  - {h}")
                pdf.ln(3)

        if resume.education:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 8, "Education", ln=True)
            for edu in resume.education:
                pdf.set_font("Helvetica", "", 9)
                edu_text = f"{edu.study_type} in {edu.area}, {edu.institution}"
                pdf.cell(0, 5, edu_text, ln=True)

        pdf.ln(5)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 5, f"ATS Score: {resume.ats_score}/100", ln=True)

        return pdf.output()


def generate_resume_pdf(
    resume: TailoredResumeSchema,
    filename: Optional[str] = None,
    output_dir: Optional[str] = None,
) -> tuple[bytes, str]:
    """
    Convenience function to generate a resume PDF.

    Args:
        resume: TailoredResumeSchema with resume data
        filename: Optional filename without extension
        output_dir: Optional output directory

    Returns:
        Tuple of (PDF bytes, file path)
    """
    generator = PDFGenerator(output_dir)
    return generator.generate(resume, filename)
