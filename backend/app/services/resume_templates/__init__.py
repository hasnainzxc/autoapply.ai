"""
Resume Templates - Factory module
"""

from app.services.resume_schema import TailoredResumeSchema
from app.services.resume_templates.modern_tech import render_modern_tech
from app.services.resume_templates.clean_professional import render_clean_professional
from app.services.resume_templates.executive import render_executive


TEMPLATE_REGISTRY = {
    "modern_tech": render_modern_tech,
    "clean_professional": render_clean_professional,
    "executive": render_executive,
}


def get_template_renderer(template_name: str = "modern_tech"):
    """
    Get template renderer function by name.

    Available templates:
    - modern_tech: 2-column, colored, tech-focused
    - clean_professional: Single column, B&W, most ATS-friendly
    - executive: Spacious, premium, for senior roles
    """
    renderer = TEMPLATE_REGISTRY.get(template_name)
    if not renderer:
        renderer = TEMPLATE_REGISTRY["modern_tech"]
    return renderer


def render_resume(
    resume: TailoredResumeSchema, template_name: str = "modern_tech"
) -> str:
    """
    Render a tailored resume to HTML using the specified template.

    Args:
        resume: TailoredResumeSchema with all resume data
        template_name: Name of template to use

    Returns:
        HTML string of the rendered resume
    """
    renderer = get_template_renderer(template_name)
    return renderer(resume)


def list_templates() -> list[dict]:
    """List all available templates with descriptions"""
    return [
        {
            "id": "modern_tech",
            "name": "Modern Tech",
            "description": "2-column layout with colored accents. Perfect for tech roles with modern companies.",
            "ats_score": "Excellent",
            "visually_striking": True,
        },
        {
            "id": "clean_professional",
            "name": "Clean Professional",
            "description": "Single column, black and white. Most ATS-friendly, ideal for conservative industries.",
            "ats_score": "Best",
            "visually_striking": False,
        },
        {
            "id": "executive",
            "name": "Executive",
            "description": "Spacious design with premium feel. For senior roles and executive positions.",
            "ats_score": "Good",
            "visually_striking": True,
        },
    ]
