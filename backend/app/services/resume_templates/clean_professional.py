"""
Clean Professional Resume Template
Single column, black and white - Most ATS-friendly, conservative style
"""

from app.services.resume_schema import TailoredResumeSchema


CLEAN_PROFESSIONAL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
            background: #fff;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in 0.6in;
        }
        
        /* Header - No styling, pure text */
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000;
        }
        
        .name {
            font-size: 18pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        .title {
            font-size: 11pt;
            font-style: italic;
            margin: 3px 0;
        }
        
        .contact {
            font-size: 9pt;
            margin-top: 5px;
        }
        
        .contact span { margin: 0 8px; }
        
        /* Section */
        .section {
            margin-bottom: 12px;
        }
        
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 8px;
        }
        
        /* Experience */
        .entry {
            margin-bottom: 10px;
        }
        
        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }
        
        .company {
            font-weight: bold;
        }
        
        .dates {
            font-style: italic;
            font-size: 9pt;
        }
        
        .position {
            font-style: italic;
            margin: 2px 0;
        }
        
        .highlights {
            list-style: none;
            padding-left: 15px;
        }
        
        .highlights li::before {
            content: "• ";
        }
        
        .highlights li {
            margin-bottom: 2px;
        }
        
        /* Skills */
        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .skill-category {
            font-weight: bold;
            margin-right: 5px;
        }
        
        .skills-list {
            margin-right: 15px;
        }
        
        /* Education */
        .edu-header {
            display: flex;
            justify-content: space-between;
        }
        
        .degree {
            font-weight: bold;
        }
        
        .school {
            font-style: italic;
        }
        
        /* Summary */
        .summary {
            text-align: justify;
            margin-bottom: 5px;
        }
        
        /* ATS Score */
        .ats-info {
            font-size: 8pt;
            color: #666;
            text-align: right;
            margin-top: 10px;
        }
        
        /* Keywords */
        .keywords {
            font-size: 8pt;
            color: #666;
            margin-top: 5px;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            font-size: 7pt;
            color: #999;
            margin-top: 15px;
            padding-top: 5px;
            border-top: 1px solid #ccc;
        }
        
        @media print {
            body { padding: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1 class="name">{{basics.name}}</h1>
        <p class="title">{{basics.label}}</p>
        <div class="contact">
            {% if basics.email %}<span>{{basics.email}}</span>{% endif %}
            {% if basics.phone %}<span>{{basics.phone}}</span>{% endif %}
            {% for profile in basics.profiles %}
                {% if profile.url %}<span>{{profile.url}}</span>{% endif %}
            {% endfor %}
        </div>
    </header>
    
    {% if basics.summary %}
    <section class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary">{{basics.summary}}</p>
    </section>
    {% endif %}
    
    <section class="section">
        <h2 class="section-title">Professional Experience</h2>
        {% for job in work %}
        <div class="entry">
            <div class="entry-header">
                <span class="company">{{job.name}}</span>
                <span class="dates">{{job.start_date|default('')}} - {{job.end_date|default('Present')}}</span>
            </div>
            <p class="position">{{job.position}}</p>
            {% if job.highlights %}
            <ul class="highlights">
                {% for highlight in job.highlights %}
                <li>{{highlight}}</li>
                {% endfor %}
            </ul>
            {% endif %}
        </div>
        {% endfor %}
    </section>
    
    <section class="section">
        <h2 class="section-title">Education</h2>
        {% for edu in education %}
        <div class="entry">
            <div class="edu-header">
                <span class="degree">{{edu.study_type}} in {{edu.area}}</span>
                <span class="dates">{{edu.end_date|default('')}}</span>
            </div>
            <p class="school">{{edu.institution}}</p>
        </div>
        {% endfor %}
    </section>
    
    <section class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-grid">
            {% for skill in skills %}
            <div class="skills-list">
                <span class="skill-category">{{skill.name}}:</span>
                {{skill.keywords|join(', ')}}
            </div>
            {% endfor %}
        </div>
    </section>
    
    {% if certificates %}
    <section class="section">
        <h2 class="section-title">Certifications</h2>
        {% for cert in certificates %}
        <p>{{cert.name}}{% if cert.issuer %}, {{cert.issuer}}{% endif %}{% if cert.date %}, {{cert.date}}{% endif %}</p>
        {% endfor %}
    </section>
    {% endif %}
    
    <div class="ats-info">
        ATS Score: {{ats_score}}/100
        {% if matched_keywords %}
        | Keywords Matched: {{matched_keywords|length}}
        {% endif %}
    </div>
    
    {% if matched_keywords or missing_keywords %}
    <div class="keywords">
        {% if matched_keywords %}
        <strong>Matched:</strong> {{matched_keywords[:10]|join(', ')}}
        {% endif %}
        {% if missing_keywords %}
        | <strong>Gap:</strong> {{missing_keywords[:5]|join(', ')}}
        {% endif %}
    </div>
    {% endif %}
    
    <footer class="footer">
        Generated by ApplyMate | {{generated_date}}
    </footer>
</body>
</html>"""


def render_clean_professional(resume: TailoredResumeSchema) -> str:
    """Render Clean Professional template"""
    import datetime

    template = CLEAN_PROFESSIONAL_TEMPLATE

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
    template = template.replace(
        "{{generated_date}}", datetime.datetime.now().strftime("%B %Y")
    )

    work_html = ""
    for job in resume.work:
        highlights = (
            "".join([f"<li>{h}</li>" for h in job.highlights]) if job.highlights else ""
        )
        work_html += f"""
        <div class="entry">
            <div class="entry-header">
                <span class="company">{job.name}</span>
                <span class="dates">{job.start_date or ""} - {job.end_date or "Present"}</span>
            </div>
            <p class="position">{job.position}</p>
            <ul class="highlights">{highlights}</ul>
        </div>
        """

    skills_html = ""
    for skill in resume.skills:
        skills_html += f'<div class="skills-list"><span class="skill-category">{skill.name}:</span> {", ".join(skill.keywords)}</div>'

    education_html = ""
    for edu in resume.education:
        education_html += f"""
        <div class="entry">
            <div class="edu-header">
                <span class="degree">{edu.study_type} in {edu.area}</span>
                <span class="dates">{edu.end_date or ""}</span>
            </div>
            <p class="school">{edu.institution}</p>
        </div>
        """

    certs_html = ""
    for cert in resume.certificates:
        certs_html += f"<p>{cert.name}{f', {cert.issuer}' if cert.issuer else ''}{f', {cert.date}' if cert.date else ''}</p>"

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
        <section class="section">
            <h2 class="section-title">Professional Summary</h2>
            <p class="summary">{resume.basics.summary}</p>
        </section>
        """

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
    template = re.sub(
        r"\{\{matched_keywords\|length\}\}", str(len(resume.matched_keywords)), template
    )
    template = re.sub(
        r"\{\{matched_keywords\[:10\]\|join\}\}",
        ", ".join(resume.matched_keywords[:10]),
        template,
    )
    template = re.sub(
        r"\{\{missing_keywords\[:5\]\|join\}\}",
        ", ".join(resume.missing_keywords[:5]),
        template,
    )

    return template
