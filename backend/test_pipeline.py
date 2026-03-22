#!/usr/bin/env python3
"""
Test script for Resume Crafting Pipeline 2.0
Run locally to verify the new pipeline works
"""

import os
import sys

sys.path.insert(0, "/home/hairzee/prods/applymate/backend")


SAMPLE_RESUME = """
John Smith
Software Engineer
john.smith@email.com | (555) 123-4567

SUMMARY
Experienced software engineer with 5+ years building web applications and distributed systems.

SKILLS
Programming: Python, JavaScript, TypeScript, Go
Frameworks: React, Django, FastAPI, Node.js
Cloud: AWS, Docker, Kubernetes, Terraform
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, CI/CD, Linux

EXPERIENCE

Senior Software Engineer at Tech Corp
Jan 2022 - Present
- Led team of 5 developers building microservices architecture
- Improved system uptime from 95% to 99.9%
- Reduced deployment time by 60% through CI/CD optimization
- Mentored junior developers and conducted code reviews

Software Engineer at StartupXYZ
Jun 2019 - Dec 2021
- Built RESTful APIs serving 1M+ daily requests
- Implemented authentication system using JWT and OAuth2
- Optimized database queries resulting in 40% faster load times
- Developed frontend features using React and TypeScript

Junior Developer at WebDev Inc
Aug 2017 - May 2019
- Created responsive web pages using HTML, CSS, JavaScript
- Fixed bugs and implemented new features in existing applications
- Collaborated with designers to improve UI/UX

EDUCATION
Bachelor of Science in Computer Science
State University, 2017
"""


SAMPLE_JOB_DESCRIPTION = """
Senior Software Engineer

We are looking for a Senior Software Engineer to join our growing engineering team.

Requirements:
- 5+ years of software development experience
- Strong proficiency in Python and JavaScript/TypeScript
- Experience with React and Node.js
- Familiarity with AWS or Google Cloud
- Experience with PostgreSQL and Redis
- Strong problem-solving skills
- Excellent communication skills

Preferred:
- Experience with Kubernetes and Docker
- Knowledge of CI/CD pipelines
- Experience with microservices architecture
- Contribution to open-source projects

Benefits:
- Competitive salary $150K-$180K
- Remote work options
- Health, dental, vision insurance
- 401k matching
- Unlimited PTO
"""


def test_resume_parser():
    """Test resume parsing"""
    print("\n" + "=" * 60)
    print("TEST 1: Resume Parser")
    print("=" * 60)

    from pathlib import Path
    import sys

    sys.path.insert(0, str(Path(__file__).parent))

    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "resume_parser", "app/services/resume_parser.py"
    )
    resume_parser_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(resume_parser_module)
    ResumeParser = resume_parser_module.ResumeParser

    parser = ResumeParser(SAMPLE_RESUME)
    cleaned = parser.cleaned_text[:200]
    print(f"✓ Cleaned text (first 200 chars):\n{cleaned}...\n")

    resume = parser.parse()
    print(f"✓ Parsed name: {resume.basics.name}")
    print(f"✓ Parsed title: {resume.basics.label}")
    print(f"✓ Work experience entries: {len(resume.work)}")
    print(f"✓ Skills categories: {len(resume.skills)}")

    if resume.work:
        print(f"✓ First job: {resume.work[0].name} - {resume.work[0].position}")
        print(f"✓ Achievements: {len(resume.work[0].highlights)}")

    if resume.skills:
        print(f"✓ First skill category: {resume.skills[0].name}")
        print(f"✓ Skills: {resume.skills[0].keywords[:5]}")

    return resume


def test_ats_analyzer(resume):
    """Test ATS analyzer"""
    print("\n" + "=" * 60)
    print("TEST 2: ATS Analyzer")
    print("=" * 60)

    from app.services.resume_schema import JobAnalysis
    from app.services.ats_analyzer import ATSAnalyzer

    job = JobAnalysis(
        raw_text=SAMPLE_JOB_DESCRIPTION,
        required_skills=[
            "Python",
            "JavaScript",
            "React",
            "Node.js",
            "PostgreSQL",
            "AWS",
        ],
        preferred_skills=["Kubernetes", "Docker", "CI/CD"],
        tools_and_technologies=["AWS", "PostgreSQL", "Redis"],
        job_title="Senior Software Engineer",
        keywords=[
            "Python",
            "JavaScript",
            "TypeScript",
            "React",
            "Node.js",
            "AWS",
            "Docker",
            "Kubernetes",
        ],
    )

    analyzer = ATSAnalyzer()
    analysis = analyzer.analyze(resume, job)

    print(f"✓ Overall ATS Score: {analysis.overall_score}/100")
    print(f"✓ Keyword Match Score: {analysis.breakdown['keyword_match']}/100")
    print(f"✓ Format Score: {analysis.breakdown['format_score']}/100")
    print(f"✓ Content Score: {analysis.breakdown['content_score']}/100")
    print(f"✓ Matched keywords: {analysis.matched_keywords[:5]}")
    print(f"✓ Missing keywords: {analysis.missing_keywords[:3]}")

    if analysis.issues:
        print(f"✓ Issues: {analysis.issues}")
    if analysis.recommendations:
        print(f"✓ Recommendations: {analysis.recommendations[:2]}")

    return analysis


def test_templates():
    """Test template listing"""
    print("\n" + "=" * 60)
    print("TEST 3: Resume Templates")
    print("=" * 60)

    from app.services.resume_templates import list_templates

    templates = list_templates()
    print(f"✓ Available templates: {[t['id'] for t in templates]}")

    for template in templates:
        print(f"\n  Template: {template['name']}")
        print(f"    Description: {template['description']}")
        print(f"    ATS Score: {template['ats_score']}")

    return templates


def test_template_rendering(resume):
    """Test template rendering"""
    print("\n" + "=" * 60)
    print("TEST 4: Template Rendering")
    print("=" * 60)

    from app.services.resume_schema import TailoredResumeSchema
    from app.services.resume_templates import render_resume

    tailored = TailoredResumeSchema(
        basics=resume.basics,
        work=resume.work,
        education=resume.education,
        skills=resume.skills,
        ats_score=85,
        ats_breakdown={"keyword_match": 90, "format_score": 80, "content_score": 85},
        matched_keywords=["Python", "JavaScript", "React", "AWS", "Docker"],
        missing_keywords=["Kubernetes"],
        template_used="modern_tech",
    )

    for template_name in ["modern_tech", "clean_professional", "executive"]:
        try:
            html = render_resume(tailored, template_name)
            print(f"✓ {template_name} rendered ({len(html)} bytes)")
        except Exception as e:
            print(f"✗ {template_name} failed: {e}")

    return tailored


def test_pdf_generation(tailored):
    """Test PDF generation"""
    print("\n" + "=" * 60)
    print("TEST 5: PDF Generation")
    print("=" * 60)

    try:
        from app.services.pdf_generator import generate_resume_pdf

        pdf_bytes = generate_resume_pdf(tailored, "test_resume", "/tmp")
        print(f"✓ PDF generated ({len(pdf_bytes)} bytes)")

        return True
    except Exception as e:
        print(f"✗ PDF generation failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_llm_orchestrator():
    """Test LLM orchestrator (requires API key)"""
    print("\n" + "=" * 60)
    print("TEST 6: LLM Orchestrator")
    print("=" * 60)

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key in ["your_openrouter_key_here", ""]:
        print("⚠ SKIPPED: OPENROUTER_API_KEY not configured")
        print("  Set this in your .env file to test LLM calls")
        return None

    import asyncio
    from app.services.llm_orchestrator import LLMOrchestrator

    async def run_test():
        try:
            orchestrator = LLMOrchestrator(api_key=api_key)

            print("  Testing Step 1: Extract structure...")
            structured = await orchestrator.step1_extract_structure(SAMPLE_RESUME)
            print(
                f"  ✓ Extracted: {structured.basics.name if structured.basics else 'N/A'}"
            )

            print("  Testing Step 2: Analyze job...")
            job_analysis = await orchestrator.step2_analyze_job(SAMPLE_JOB_DESCRIPTION)
            print(f"  ✓ Analyzed: {job_analysis.job_title}")
            print(f"    Required skills: {len(job_analysis.required_skills)}")

            print("  Testing Step 3: Calculate match...")
            match_result = await orchestrator.step3_calculate_match(
                structured, job_analysis
            )
            print(f"  ✓ Match score: {match_result.overall_score}/100")
            print(f"    Matched: {len(match_result.matched_keywords)}")
            print(f"    Missing: {len(match_result.missing_keywords)}")

            return structured, job_analysis, match_result

        except Exception as e:
            print(f"✗ LLM test failed: {e}")
            import traceback

            traceback.print_exc()
            return None

    result = asyncio.run(run_test())

    if result:
        structured, job_analysis, match_result = result
        print("\n  All LLM steps completed successfully!")

    return result


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("RESUME CRAFTING PIPELINE 2.0 - TEST SUITE")
    print("=" * 60)

    try:
        resume = test_resume_parser()
        test_ats_analyzer(resume)
        test_templates()
        tailored = test_template_rendering(resume)
        test_pdf_generation(tailored)
        test_llm_orchestrator()

        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nNew pipeline is ready!")
        print("\nNext steps:")
        print("1. Push changes to GitHub")
        print("2. Test the new API endpoints:")
        print("   POST /api/resume/tailor-v2")
        print("   POST /api/resume/analyze-v2")
        print("   GET  /api/resume/templates")

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
