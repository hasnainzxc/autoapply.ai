"""
Executive Resume Template
Spacious, premium design - For senior roles, impressed recruiters
"""

from app.services.resume_schema import TailoredResumeSchema


EXECUTIVE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Garamond:wght@400;500;600;700&family=Calibri:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Calibri', Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.5;
            color: #2c3e50;
            background: #fff;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.6in 0.7in;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2c3e50;
        }
        
        .header-left { flex: 1; }
        
        .name {
            font-family: 'Garamond', Georgia, serif;
            font-size: 28pt;
            font-weight: 600;
            color: #1a252f;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .title {
            font-size: 13pt;
            color: #34495e;
            font-weight: 400;
            margin-bottom: 8px;
        }
        
        .contact-info {
            font-size: 9pt;
            color: #7f8c8d;
        }
        
        .contact-info span { margin-right: 15px; }
        
        .header-right {
            text-align: right;
        }
        
        .ats-badge {
            display: inline-block;
            background: #27ae60;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            font-size: 10pt;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .match-info {
            font-size: 8.5pt;
            color: #95a5a6;
        }
        
        /* Summary */
        .summary {
            background: linear-gradient(to right, #f8f9fa, #fff);
            border-left: 4px solid #2c3e50;
            padding: 15px 20px;
            margin-bottom: 25px;
            font-size: 10pt;
            line-height: 1.6;
            color: #34495e;
        }
        
        .summary-label {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-size: 8pt;
            letter-spacing: 1px;
        }
        
        /* Two Column Layout */
        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }
        
        .main-column {}
        .side-column {}
        
        /* Sections */
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-family: 'Garamond', Georgia, serif;
            font-size: 14pt;
            font-weight: 600;
            color: #1a252f;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        /* Experience */
        .experience-item {
            margin-bottom: 18px;
            padding-left: 15px;
            border-left: 2px solid #ecf0f1;
        }
        
        .experience-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .company-name {
            font-weight: 600;
            color: #2c3e50;
            font-size: 11pt;
        }
        
        .dates {
            font-size: 9pt;
            color: #95a5a6;
        }
        
        .job-title {
            font-style: italic;
            color: #34495e;
            font-size: 10pt;
            margin-bottom: 8px;
        }
        
        .achievements {
            list-style: none;
        }
        
        .achievements li {
            position: relative;
            padding-left: 18px;
            margin-bottom: 5px;
            font-size: 9.5pt;
            color: #555;
        }
        
        .achievements li::before {
            content: "—";
            position: absolute;
            left: 0;
            color: #27ae60;
        }
        
        /* Skills - Side Column */
        .skill-block {
            margin-bottom: 18px;
        }
        
        .skill-title {
            font-weight: 600;
            color: #2c3e50;
            font-size: 9.5pt;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .skill-items {
            font-size: 9pt;
            color: #555;
            line-height: 1.6;
        }
        
        /* Education */
        .education-item {
            margin-bottom: 12px;
        }
        
        .degree {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .institution {
            font-size: 9.5pt;
            color: #555;
        }
        
        .edu-details {
            font-size: 9pt;
            color: #7f8c8d;
        }
        
        /* Keywords */
        .keyword-analysis {
            background: #fef9e7;
            border: 1px solid #f39c12;
            border-radius: 6px;
            padding: 12px;
            margin-top: 15px;
            font-size: 8.5pt;
        }
        
        .keyword-title {
            font-weight: 600;
            color: #d68910;
            margin-bottom: 5px;
        }
        
        .matched-kw {
            color: #27ae60;
        }
        
        .missing-kw {
            color: #95a5a6;
        }
        
        /* Certifications */
        .cert-item {
            margin-bottom: 8px;
            font-size: 9pt;
        }
        
        .cert-name {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .cert-issuer {
            color: #7f8c8d;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ecf0f1;
            text-align: center;
            font-size: 7.5pt;
            color: #bdc3c7;
        }
        
        /* Optimization Notes */
        .optimizations {
            background: #e8f8f5;
            border-radius: 6px;
            padding: 10px;
            margin-top: 15px;
            font-size: 8pt;
            color: #1e8449;
        }
        
        @media print {
            body { padding: 0.4in; }
            .experience-item { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-left">
            <h1 class="name">{{basics.name}}</h1>
            <p class="title">{{basics.label}}</p>
            <div class="contact-info">
                {% if basics.email %}<span>{{basics.email}}</span>{% endif %}
                {% if basics.phone %}<span>{{basics.phone}}</span>{% endif %}
                {% for profile in basics.profiles %}{% if profile.url %}<span>{{profile.url}}</span>{% endif %}{% endfor %}
            </div>
        </div>
        <div class="header-right">
            <div class="ats-badge">ATS: {{ats_score}}/100</div>
            <p class="match-info">{{keyword_match_rate}}% keyword match</p>
        </div>
    </header>
    
    {% if basics.summary %}
    <div class="summary">
        <p class="summary-label">Executive Summary</p>
        <p>{{basics.summary}}</p>
    </div>
    {% endif %}
    
    <div class="content-grid">
        <div class="main-column">
            <section class="section">
                <h2 class="section-title">Professional Experience</h2>
                {% for job in work %}
                <div class="experience-item">
                    <div class="experience-header">
                        <span class="company-name">{{job.name}}</span>
                        <span class="dates">{{job.start_date|default('')}} - {{job.end_date|default('Present')}}</span>
                    </div>
                    <p class="job-title">{{job.position}}</p>
                    {% if job.highlights %}
                    <ul class="achievements">
                        {% for h in job.highlights %}
                        <li>{{h}}</li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                </div>
                {% endfor %}
            </section>
            
            <section class="section">
                <h2 class="section-title">Education</h2>
                {% for edu in education %}
                <div class="education-item">
                    <p class="degree">{{edu.study_type}}{% if edu.area %} in {{edu.area}}{% endif %}</p>
                    <p class="institution">{{edu.institution}}</p>
                    <p class="edu-details">{{edu.end_date|default('')}}</p>
                </div>
                {% endfor %}
            </section>
        </div>
        
        <div class="side-column">
            <section class="section">
                <h2 class="section-title">Core Competencies</h2>
                {% for skill in skills %}
                <div class="skill-block">
                    <p class="skill-title">{{skill.name}}</p>
                    <p class="skill-items">{{skill.keywords|join(' • ')}}</p>
                </div>
                {% endfor %}
            </section>
            
            {% if certificates %}
            <section class="section">
                <h2 class="section-title">Certifications</h2>
                {% for cert in certificates %}
                <div class="cert-item">
                    <p class="cert-name">{{cert.name}}</p>
                    <p class="cert-issuer">{{cert.issuer}}{% if cert.date %}, {{cert.date}}{% endif %}</p>
                </div>
                {% endfor %}
            </section>
            {% endif %}
            
            <div class="keyword-analysis">
                <p class="keyword-title">Keyword Analysis</p>
                {% if matched_keywords %}
                <p class="matched-kw">✓ {{matched_keywords[:8]|join(', ')}}</p>
                {% endif %}
                {% if missing_keywords %}
                <p class="missing-kw">○ Consider: {{missing_keywords[:4]|join(', ')}}</p>
                {% endif %}
            </div>
            
            {% if optimization_notes %}
            <div class="optimizations">
                <strong>Key Optimizations:</strong><br>
                {{optimization_notes[0]}}
            </div>
            {% endif %}
        </div>
    </div>
    
    <footer class="footer">
        Executive Resume • Generated by ApplyMate • {{generated_date}}
    </footer>
</body>
</html>"""


def render_executive(resume: TailoredResumeSchema) -> str:
    """Render Executive template"""
    import datetime

    template = EXECUTIVE_TEMPLATE

    template = template.replace(
        "{{basics.name}}", resume.basics.name if resume.basics else "Candidate"
    )
    template = template.replace(
        "{{basics.label}}",
        resume.basics.label if resume.basics and resume.basics.label else "",
    )
    template = template.replace(
        "{{basics.email}}",
        resume.basics.email if resume.basics and resume.basics.email else "",
    )
    template = template.replace(
        "{{basics.phone}}",
        resume.basics.phone if resume.basics and resume.basics.phone else "",
    )
    template = template.replace(
        "{{basics.summary}}",
        resume.basics.summary if resume.basics and resume.basics.summary else "",
    )
    template = template.replace("{{ats_score}}", str(resume.ats_score))
    keyword_rate = (
        int(resume.ats_breakdown.get("keyword_match", 0) * 100)
        if resume.ats_breakdown
        else 50
    )
    template = template.replace("{{keyword_match_rate}}", str(keyword_rate))
    template = template.replace(
        "{{generated_date}}", datetime.datetime.now().strftime("%B %Y")
    )

    work_html = ""
    for job in resume.work:
        highlights = (
            "".join([f"<li>{h}</li>" for h in job.highlights]) if job.highlights else ""
        )
        work_html += f"""
        <div class="experience-item">
            <div class="experience-header">
                <span class="company-name">{job.name}</span>
                <span class="dates">{job.start_date or ""} - {job.end_date or "Present"}</span>
            </div>
            <p class="job-title">{job.position}</p>
            <ul class="achievements">{highlights}</ul>
        </div>
        """

    skills_html = ""
    for skill in resume.skills:
        skills_html += f"""
        <div class="skill-block">
            <p class="skill-title">{skill.name}</p>
            <p class="skill-items">{" • ".join(skill.keywords)}</p>
        </div>
        """

    education_html = ""
    for edu in resume.education:
        education_html += f"""
        <div class="education-item">
            <p class="degree">{edu.study_type}{f" in {edu.area}" if edu.area else ""}</p>
            <p class="institution">{edu.institution}</p>
            <p class="edu-details">{edu.end_date or ""}</p>
        </div>
        """

    certs_html = ""
    for cert in resume.certificates:
        certs_html += f"""
        <div class="cert-item">
            <p class="cert-name">{cert.name}</p>
            <p class="cert-issuer">{cert.issuer}{f", {cert.date}" if cert.date else ""}</p>
        </div>
        """

    profile_html = " ".join(
        [
            f"<span>{p.url}</span>"
            for p in (resume.basics.profiles if resume.basics else [])
            if p.url
        ]
    )

    summary_html = ""
    if resume.basics and resume.basics.summary:
        summary_html = f"""
        <div class="summary">
            <p class="summary-label">Executive Summary</p>
            <p>{resume.basics.summary}</p>
        </div>
        """

    keywords_html = ""
    if resume.matched_keywords:
        keywords_html += (
            f'<p class="matched-kw">✓ {", ".join(resume.matched_keywords[:8])}</p>'
        )
    if resume.missing_keywords:
        keywords_html += f'<p class="missing-kw">○ Consider: {", ".join(resume.missing_keywords[:4])}</p>'

    notes_html = ""
    if resume.optimization_notes:
        notes_html = f'<div class="optimizations"><strong>Key Optimizations:</strong><br>{resume.optimization_notes[0]}</div>'

    import re

    template = re.sub(
        r"{% for job in work %}.*?{% endfor %}", work_html, template, flags=re.DOTALL
    )
    template = re.sub(
        r"{% for skill in skills %}.*?{% endfor %}",
        skills_html,
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% for edu in education %}.*?{% endfor %}",
        education_html,
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% for cert in certificates %}.*?{% endfor %}",
        certs_html,
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% for profile in basics.profiles %}.*?{% endfor %}",
        profile_html,
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% if basics.summary %}.*?{% endif %}",
        summary_html,
        template,
        flags=re.DOTALL,
    )
    template = re.sub(r"\{\{keyword_analysis\}\}", keywords_html, template)
    template = re.sub(r"\{\{optimization_notes\}\}", notes_html, template)
    template = re.sub(
        r"\{\{matched_keywords\[:8\]\|join\}\}",
        ", ".join(resume.matched_keywords[:8]),
        template,
    )
    template = re.sub(
        r"\{\{missing_keywords\[:4\]\|join\}\}",
        ", ".join(resume.missing_keywords[:4]),
        template,
    )

    return template
