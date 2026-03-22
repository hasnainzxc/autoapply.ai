"""
Modern Tech Resume Template
2-column layout with colored accents - ATS-optimized + visually striking
"""

from app.services.resume_schema import TailoredResumeSchema


MODERN_TECH_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 9.5pt;
            line-height: 1.4;
            color: #1a1a2e;
            background: white;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 45px;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #6366f1;
        }
        
        .header-left {
            flex: 1;
        }
        
        .name {
            font-size: 26pt;
            font-weight: 700;
            color: #1a1a2e;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
        }
        
        .title {
            font-size: 12pt;
            color: #6366f1;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .contact-info {
            font-size: 8.5pt;
            color: #64748b;
        }
        
        .contact-info span {
            margin-right: 12px;
        }
        
        .header-right {
            text-align: right;
        }
        
        .ats-score {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 9pt;
            font-weight: 600;
            margin-bottom: 8px;
            display: inline-block;
        }
        
        .match-rate {
            font-size: 8pt;
            color: #64748b;
        }
        
        /* Summary */
        .summary {
            background: #f8fafc;
            border-left: 3px solid #6366f1;
            padding: 12px 16px;
            margin-bottom: 20px;
            border-radius: 0 6px 6px 0;
        }
        
        .summary-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6366f1;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .summary-text {
            font-size: 9pt;
            color: #334155;
            line-height: 1.5;
        }
        
        /* Two Column Layout */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 25px;
        }
        
        .left-column {
            flex: 1;
        }
        
        .right-column {
            background: #fafafa;
            padding: 15px;
            border-radius: 8px;
        }
        
        /* Section Styling */
        .section {
            margin-bottom: 18px;
        }
        
        .section-title {
            font-size: 10pt;
            font-weight: 600;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1.5px solid #e2e8f0;
        }
        
        /* Experience Entry */
        .experience-entry {
            margin-bottom: 14px;
        }
        
        .exp-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 2px;
        }
        
        .exp-company {
            font-weight: 600;
            color: #1a1a2e;
            font-size: 9.5pt;
        }
        
        .exp-dates {
            font-size: 8pt;
            color: #64748b;
        }
        
        .exp-title {
            font-size: 9pt;
            color: #6366f1;
            font-weight: 500;
            margin-bottom: 6px;
        }
        
        .exp-highlights {
            padding-left: 0;
            list-style: none;
        }
        
        .exp-highlights li {
            position: relative;
            padding-left: 14px;
            margin-bottom: 3px;
            font-size: 8.8pt;
            color: #475569;
        }
        
        .exp-highlights li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: #6366f1;
            font-size: 8pt;
        }
        
        /* Skills Sidebar */
        .skill-category {
            margin-bottom: 12px;
        }
        
        .skill-category-title {
            font-size: 8pt;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }
        
        .skill-tag {
            background: white;
            border: 1px solid #e2e8f0;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 7.5pt;
            color: #475569;
        }
        
        .skill-tag.highlight {
            background: #6366f1;
            color: white;
            border-color: #6366f1;
        }
        
        /* Keywords */
        .keywords-section {
            background: #fef3c7;
            border-radius: 6px;
            padding: 10px 12px;
            margin-top: 15px;
        }
        
        .keywords-title {
            font-size: 7.5pt;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        
        .keyword-match {
            font-size: 8pt;
            color: #78350f;
            margin-bottom: 4px;
        }
        
        .keyword-missing {
            font-size: 8pt;
            color: #9ca3af;
        }
        
        /* Education */
        .edu-entry {
            margin-bottom: 8px;
        }
        
        .edu-degree {
            font-weight: 600;
            color: #1a1a2e;
            font-size: 9pt;
        }
        
        .edu-school {
            font-size: 8.5pt;
            color: #64748b;
        }
        
        .edu-dates {
            font-size: 7.5pt;
            color: #94a3b8;
        }
        
        /* Optimization Notes */
        .optimization-notes {
            background: #ecfdf5;
            border-radius: 6px;
            padding: 10px 12px;
            margin-top: 15px;
            font-size: 7.5pt;
            color: #065f46;
        }
        
        .notes-title {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        /* Footer */
        .footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 7pt;
            color: #94a3b8;
        }
        
        @media print {
            body { font-size: 9pt; }
            .container { padding: 30px 35px; }
            .skill-tag { border: 1px solid #cbd5e1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-left">
                <h1 class="name">{{basics.name}}</h1>
                <p class="title">{{basics.label}}</p>
                <div class="contact-info">
                    {% if basics.email %}<span>{{basics.email}}</span>{% endif %}
                    {% if basics.phone %}<span>{{basics.phone}}</span>{% endif %}
                    {% for profile in basics.profiles %}
                        {% if profile.url %}<span>{{profile.url}}</span>{% endif %}
                    {% endfor %}
                </div>
            </div>
            <div class="header-right">
                <div class="ats-score">ATS Score: {{ats_score}}/100</div>
                <p class="match-rate">{{keyword_match_rate}}% keyword match</p>
            </div>
        </header>
        
        <!-- Summary -->
        {% if basics.summary %}
        <div class="summary">
            <p class="summary-label">Professional Summary</p>
            <p class="summary-text">{{basics.summary}}</p>
        </div>
        {% endif %}
        
        <!-- Main Content -->
        <div class="main-content">
            <div class="left-column">
                <!-- Experience -->
                {% if work %}
                <section class="section">
                    <h2 class="section-title">Experience</h2>
                    {% for job in work %}
                    <div class="experience-entry">
                        <div class="exp-header">
                            <span class="exp-company">{{job.name}}</span>
                            <span class="exp-dates">{{job.start_date|default('N/A')}} - {{job.end_date|default('Present')}}</span>
                        </div>
                        <p class="exp-title">{{job.position}}</p>
                        {% if job.highlights %}
                        <ul class="exp-highlights">
                            {% for highlight in job.highlights %}
                            <li>{{highlight}}</li>
                            {% endfor %}
                        </ul>
                        {% endif %}
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
                
                <!-- Education -->
                {% if education %}
                <section class="section">
                    <h2 class="section-title">Education</h2>
                    {% for edu in education %}
                    <div class="edu-entry">
                        <p class="edu-degree">{{edu.study_type}} in {{edu.area}}</p>
                        <p class="edu-school">{{edu.institution}}{% if edu.end_date %}, {{edu.end_date}}{% endif %}</p>
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
                
                <!-- Projects -->
                {% if projects %}
                <section class="section">
                    <h2 class="section-title">Projects</h2>
                    {% for project in projects %}
                    <div class="experience-entry">
                        <div class="exp-header">
                            <span class="exp-company">{{project.name}}</span>
                        </div>
                        <p class="exp-title">{{project.description}}</p>
                        {% if project.highlights %}
                        <ul class="exp-highlights">
                            {% for highlight in project.highlights %}
                            <li>{{highlight}}</li>
                            {% endfor %}
                        </ul>
                        {% endif %}
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
            </div>
            
            <div class="right-column">
                <!-- Skills -->
                {% if skills %}
                <section class="section">
                    <h2 class="section-title">Skills</h2>
                    {% for skill in skills %}
                    <div class="skill-category">
                        <p class="skill-category-title">{{skill.name}}</p>
                        <div class="skill-tags">
                            {% for keyword in skill.keywords %}
                            {% set is_match = keyword.lower() in matched_keywords|map('lower')|list %}
                            <span class="skill-tag {% if is_match %}highlight{% endif %}">{{keyword}}</span>
                            {% endfor %}
                        </div>
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
                
                <!-- Keywords Analysis -->
                <div class="keywords-section">
                    <p class="keywords-title">Keyword Analysis</p>
                    {% if matched_keywords %}
                    <p class="keyword-match">✓ Matched: {{matched_keywords[:8]|join(', ')}}</p>
                    {% endif %}
                    {% if missing_keywords %}
                    <p class="keyword-missing">○ Consider: {{missing_keywords[:5]|join(', ')}}</p>
                    {% endif %}
                </div>
                
                <!-- Optimization Notes -->
                {% if optimization_notes %}
                <div class="optimization-notes">
                    <p class="notes-title">Optimizations Made</p>
                    {% for note in optimization_notes[:2] %}
                    <p>• {{note}}</p>
                    {% endfor %}
                </div>
                {% endif %}
                
                <!-- Certifications -->
                {% if certificates %}
                <section class="section" style="margin-top: 15px;">
                    <h2 class="section-title">Certifications</h2>
                    {% for cert in certificates %}
                    <div class="edu-entry">
                        <p class="edu-degree">{{cert.name}}</p>
                        <p class="edu-school">{{cert.issuer}}{% if cert.date %}, {{cert.date}}{% endif %}</p>
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
            </div>
        </div>
        
        <footer class="footer">
            Generated by ApplyMate | ATS-Optimized Resume | {{generated_date}}
        </footer>
    </div>
</body>
</html>"""


def render_modern_tech(resume: TailoredResumeSchema) -> str:
    """Render Modern Tech template with resume data"""
    import datetime

    template = MODERN_TECH_TEMPLATE

    replacements = {
        "{{basics.name}}": resume.basics.name if resume.basics else "Candidate",
        "{{basics.label}}": resume.basics.label
        if resume.basics and resume.basics.label
        else "",
        "{{basics.email}}": resume.basics.email
        if resume.basics and resume.basics.email
        else "",
        "{{basics.phone}}": resume.basics.phone
        if resume.basics and resume.basics.phone
        else "",
        "{{basics.summary}}": resume.basics.summary
        if resume.basics and resume.basics.summary
        else "",
        "{{ats_score}}": str(resume.ats_score),
        "{{keyword_match_rate}}": str(
            int(resume.ats_breakdown.get("keyword_match", 0) * 100)
        )
        if resume.ats_breakdown
        else "0",
        "{{matched_keywords|map('lower')|list}}": [
            k.lower() for k in resume.matched_keywords
        ],
        "{{matched_keywords[:8]|join}}": ", ".join(resume.matched_keywords[:8])
        if resume.matched_keywords
        else "",
        "{{missing_keywords[:5]|join}}": ", ".join(resume.missing_keywords[:5])
        if resume.missing_keywords
        else "",
        "{{generated_date}}": datetime.datetime.now().strftime("%B %Y"),
    }

    for key, value in replacements.items():
        template = template.replace(key, str(value))

    template = _render_jinja_like(template, resume)

    return template


def _render_jinja_like(template: str, resume: TailoredResumeSchema) -> str:
    """Simple Jinja-like rendering"""
    import re

    work_section = ""
    if resume.work:
        for job in resume.work:
            highlights = (
                "\n".join([f"<li>{h}</li>" for h in job.highlights])
                if job.highlights
                else ""
            )
            work_section += f"""
            <div class="experience-entry">
                <div class="exp-header">
                    <span class="exp-company">{job.name}</span>
                    <span class="exp-dates">{job.start_date or "N/A"} - {job.end_date or "Present"}</span>
                </div>
                <p class="exp-title">{job.position}</p>
                <ul class="exp-highlights">{highlights}</ul>
            </div>
            """

    skills_section = ""
    matched_lower = [k.lower() for k in resume.matched_keywords]
    if resume.skills:
        for skill in resume.skills:
            tags = []
            for kw in skill.keywords:
                is_match = kw.lower() in matched_lower
                tags.append(
                    f'<span class="skill-tag {"highlight" if is_match else ""}">{kw}</span>'
                )
            skills_section += f"""
            <div class="skill-category">
                <p class="skill-category-title">{skill.name}</p>
                <div class="skill-tags">{" ".join(tags)}</div>
            </div>
            """

    education_section = ""
    if resume.education:
        for edu in resume.education:
            education_section += f"""
            <div class="edu-entry">
                <p class="edu-degree">{edu.study_type} in {edu.area}</p>
                <p class="edu-school">{edu.institution}{f", {edu.end_date}" if edu.end_date else ""}</p>
            </div>
            """

    projects_section = ""
    if resume.projects:
        for proj in resume.projects:
            highlights = (
                "\n".join([f"<li>{h}</li>" for h in proj.highlights])
                if proj.highlights
                else ""
            )
            projects_section += f"""
            <div class="experience-entry">
                <div class="exp-header">
                    <span class="exp-company">{proj.name}</span>
                </div>
                <p class="exp-title">{proj.description}</p>
                <ul class="exp-highlights">{highlights}</ul>
            </div>
            """

    certs_section = ""
    if resume.certificates:
        for cert in resume.certificates:
            certs_section += f"""
            <div class="edu-entry">
                <p class="edu-degree">{cert.name}</p>
                <p class="edu-school">{cert.issuer}{f", {cert.date}" if cert.date else ""}</p>
            </div>
            """

    keywords_html = ""
    if resume.matched_keywords:
        keywords_html += f'<p class="keyword-match">✓ Matched: {", ".join(resume.matched_keywords[:8])}</p>'
    if resume.missing_keywords:
        keywords_html += f'<p class="keyword-missing">○ Consider: {", ".join(resume.missing_keywords[:5])}</p>'

    notes_html = ""
    if resume.optimization_notes:
        notes_list = "<br>".join([f"• {n}" for n in resume.optimization_notes[:2]])
        notes_html = f"""
        <div class="optimization-notes">
            <p class="notes-title">Optimizations Made</p>
            <p>{notes_list}</p>
        </div>
        """

    profile_html = ""
    if resume.basics and resume.basics.profiles:
        profile_html = " ".join(
            [f"<span>{p.url}</span>" for p in resume.basics.profiles if p.url]
        )

    summary_html = ""
    if resume.basics and resume.basics.summary:
        summary_html = f"""
        <div class="summary">
            <p class="summary-label">Professional Summary</p>
            <p class="summary-text">{resume.basics.summary}</p>
        </div>
        """

    template = template.replace(
        "{% if work %}{{work_section}}{% endif %}", work_section
    )
    template = re.sub(r"{% if work %}.*?{% endif %}", "", template, flags=re.DOTALL)

    template = re.sub(
        r"{% if skills %}(.*?){% endif %}",
        skills_section if resume.skills else "",
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% if education %}(.*?){% endif %}",
        education_section if resume.education else "",
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% if projects %}(.*?){% endif %}",
        projects_section if resume.projects else "",
        template,
        flags=re.DOTALL,
    )
    template = re.sub(
        r"{% if certificates %}(.*?){% endif %}",
        certs_section if resume.certificates else "",
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
    template = re.sub(r"{{keywords_section}}", keywords_html, template)
    template = re.sub(r"{{optimization_notes}}", notes_html, template)

    return template
