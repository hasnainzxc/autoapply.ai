/**
 * Pure functions converting TailoredResumeSchema → HTML sections.
 * Generates clean HTML strings matching career-ops cv-template.html design.
 * No JSX — template literals only. Output is consumed via dangerouslySetInnerHTML.
 *
 * Types are defined here as canonical source. Other modules import from here.
 */
export interface Location {
  city?: string | null;
  countryCode?: string | null;
  address?: string | null;
  region?: string | null;
}

export interface Profile {
  network?: string | null;
  username?: string | null;
  url?: string | null;
}

export interface ResumeBasics {
  name: string;
  label?: string | null;
  email?: string | null;
  phone?: string | null;
  url?: string | null;
  summary?: string | null;
  location?: Location | null;
  profiles?: Profile[] | null;
}

export interface WorkExperience {
  name: string;
  position: string;
  startDate?: string | null;
  endDate?: string | null;
  highlights?: string[] | null;
  location?: string | null;
  url?: string | null;
  summary?: string | null;
}

export interface Project {
  name: string;
  description: string;
  highlights?: string[] | null;
  url?: string | null;
  keywords?: string[] | null;
}

export interface Education {
  institution: string;
  area: string;
  studyType: string;
  startDate?: string | null;
  endDate?: string | null;
  url?: string | null;
}

export interface Certificate {
  name: string;
  issuer: string;
  date?: string | null;
  url?: string | null;
}

export interface Skill {
  name: string;
  level?: string | null;
  keywords?: string[] | null;
}

export interface TailoredResumeSchema {
  basics?: ResumeBasics | null;
  summary?: string | null;
  skills?: Skill[] | null;
  work?: WorkExperience[] | null;
  projects?: Project[] | null;
  education?: Education[] | null;
  certificates?: Certificate[] | null;
  matched_keywords?: string[] | null;
  missing_keywords?: string[] | null;
  ats_score?: number | null;
  ats_breakdown?: Record<string, number> | null;
  optimization_notes?: string[] | null;
  template_used?: string | null;
  // Allow indexing for flexible API response shapes
  [key: string]: unknown;
}

// Template ID → CSS variant class mapping
const TEMPLATE_CSS_MAP: Record<string, string> = {
  modern: "resume-template--modern",
  modern_tech: "resume-template--modern",
  classic: "resume-template--classic",
  clean_professional: "resume-template--classic",
  executive: "resume-template--executive",
};

function resolveTemplateClass(template: string): string {
  return TEMPLATE_CSS_MAP[template] ?? "resume-template--modern";
}

// ------- Helpers -------

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  // Accept "2020-01", "2020-01-15", "2020"
  const m = dateStr.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return dateStr;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const year = m[1];
  const month = m[2] ? months[parseInt(m[2], 10) - 1] : "";
  return month ? `${month} ${year}` : year;
}

function safeArr<T>(val: T[] | null | undefined): T[] {
  return val ?? [];
}

// ------- Section Builders -------

function buildHeader(basics: ResumeBasics): string {
  const parts: string[] = [];
  if (basics.phone) parts.push(esc(basics.phone));
  if (basics.email) parts.push(esc(basics.email));

  const profiles = safeArr(basics.profiles);
  for (const p of profiles) {
    if (p.url) {
      parts.push(
        `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.network || p.url)}</a>`
      );
    }
  }

  if (basics.location) {
    const loc = [basics.location.city, basics.location.countryCode]
      .filter(Boolean)
      .join(", ");
    if (loc) parts.push(esc(loc));
  }

  const contactHtml =
    parts.length > 0
      ? parts
          .map((p, i) =>
            i < parts.length - 1 ? `${p}<span class="cv-separator">|</span>` : p
          )
          .join("")
      : "";

  return `
    <div class="cv-header avoid-break">
      <h1>${esc(basics.name)}</h1>
      <div class="cv-header-gradient"></div>
      ${contactHtml ? `<div class="cv-contact-row">${contactHtml}</div>` : ""}
    </div>`;
}

function buildSummary(summary: string | null | undefined): string {
  if (!summary) return "";
  return `
    <div class="cv-section avoid-break">
      <div class="cv-section-title">Professional Summary</div>
      <div class="cv-summary-text">${esc(summary)}</div>
    </div>`;
}

function buildCompetencies(
  skills: Skill[] | null | undefined,
  matchedKeywords: string[] | null | undefined
): string {
  // Collect all skill keywords + matched keywords
  const tags = new Set<string>();

  for (const skill of safeArr(skills)) {
    for (const kw of safeArr(skill.keywords)) {
      tags.add(kw);
    }
    // Also add skill name itself if it's a concrete skill
    if (skill.name && !skill.name.includes(" ") && skill.name.length > 2) {
      tags.add(skill.name);
    }
  }

  // Add matched keywords from ATS analysis
  for (const kw of safeArr(matchedKeywords)) {
    tags.add(kw);
  }

  if (tags.size === 0) return "";

  // Limit to ~12 tags for clean layout
  const tagList = Array.from(tags).slice(0, 12);
  const tagsHtml = tagList
    .map((t) => `<span class="cv-competency-tag">${esc(t)}</span>`)
    .join("");

  return `
    <div class="cv-section">
      <div class="cv-section-title">Core Competencies</div>
      <div class="cv-competencies-grid">${tagsHtml}</div>
    </div>`;
}

function buildWorkExperience(work: WorkExperience[] | null | undefined): string {
  const items = safeArr(work);
  if (items.length === 0) return "";

  const jobsHtml = items
    .map((job) => {
      const highlights = safeArr(job.highlights)
        .map((h) => `<li>${esc(h)}</li>`)
        .join("");

      const period =
        job.startDate || job.endDate
          ? `${fmtDate(job.startDate)} – ${fmtDate(job.endDate) || "Present"}`
          : "";

      return `
        <div class="cv-job">
          <div class="cv-job-header">
            <span class="cv-job-company">${esc(job.name)}</span>
            ${period ? `<span class="cv-job-period">${period}</span>` : ""}
          </div>
          <div class="cv-job-role">${esc(job.position)}</div>
          ${job.location ? `<div class="cv-job-location">${esc(job.location)}</div>` : ""}
          ${highlights ? `<ul>${highlights}</ul>` : ""}
        </div>`;
    })
    .join("");

  return `
    <div class="cv-section">
      <div class="cv-section-title">Work Experience</div>
      ${jobsHtml}
    </div>`;
}

function buildProjects(projects: Project[] | null | undefined): string {
  const items = safeArr(projects);
  if (items.length === 0) return "";

  const projectsHtml = items
    .map((proj) => {
      const url = proj.url
        ? ` <a href="${esc(proj.url)}" target="_blank" rel="noopener" class="cv-project-badge">Link</a>`
        : "";

      const techTags = safeArr(proj.keywords)
        .map((k) => esc(k))
        .join(", ");

      const highlights = safeArr(proj.highlights)
        .map((h) => `<li>${esc(h)}</li>`)
        .join("");

      return `
        <div class="cv-project">
          <div class="cv-project-title">${esc(proj.name)}${url}</div>
          <div class="cv-project-desc">${esc(proj.description)}</div>
          ${techTags ? `<div class="cv-project-tech">${techTags}</div>` : ""}
          ${highlights ? `<ul style="padding-left:18px; margin-top:4px">${highlights}</ul>` : ""}
        </div>`;
    })
    .join("");

  return `
    <div class="cv-section avoid-break">
      <div class="cv-section-title">Projects</div>
      ${projectsHtml}
    </div>`;
}

function buildEducation(education: Education[] | null | undefined): string {
  const items = safeArr(education);
  if (items.length === 0) return "";

  const eduHtml = items
    .map((edu) => {
      const years =
        edu.startDate || edu.endDate
          ? `${fmtDate(edu.startDate)} – ${fmtDate(edu.endDate) || "Present"}`
          : "";

      return `
        <div class="cv-edu-item">
          <div class="cv-edu-header">
            <span class="cv-edu-title">
              ${esc(edu.studyType)} in ${esc(edu.area)}
              <span class="cv-edu-org"> — ${esc(edu.institution)}</span>
            </span>
            ${years ? `<span class="cv-edu-year">${years}</span>` : ""}
          </div>
        </div>`;
    })
    .join("");

  return `
    <div class="cv-section avoid-break">
      <div class="cv-section-title">Education</div>
      ${eduHtml}
    </div>`;
}

function buildCertificates(certificates: Certificate[] | null | undefined): string {
  const items = safeArr(certificates);
  if (items.length === 0) return "";

  const certHtml = items
    .map((cert) => {
      return `
        <div class="cv-cert-item">
          <span class="cv-cert-title">${esc(cert.name)}</span>
          <span class="cv-cert-org">${esc(cert.issuer)}</span>
          <span class="cv-cert-year">${fmtDate(cert.date)}</span>
        </div>`;
    })
    .join("");

  return `
    <div class="cv-section avoid-break">
      <div class="cv-section-title">Certifications</div>
      ${certHtml}
    </div>`;
}

function buildSkillsSection(skills: Skill[] | null | undefined): string {
  const items = safeArr(skills);
  if (items.length === 0) return "";

  const skillsHtml = items
    .map((skill) => {
      const keywords = safeArr(skill.keywords)
        .map((k) => `<span class="cv-skill-item">${esc(k)}</span>`)
        .join(", ");

      // Format: "Languages: Python, JavaScript, Go"
      return keywords
        ? `<div style="margin-bottom:4px">
            <span class="cv-skill-category">${esc(skill.name)}: </span>${keywords}
           </div>`
        : "";
    })
    .join("");

  return `
    <div class="cv-section avoid-break">
      <div class="cv-section-title">Skills</div>
      <div class="cv-skills-grid">${skillsHtml}</div>
    </div>`;
}

// ------- Main Export -------

/**
 * Converts TailoredResumeSchema JSON to complete HTML string.
 *
 * @param resume   - The tailored resume data from /api/resume/tailor-v3
 * @param template - Template variant: "modern" | "classic" | "executive"
 *                   Accepts backend IDs too: "modern_tech" | "clean_professional"
 * @returns        - Full HTML string with inline CSS classes matching resume-templates.css
 */
export function resumeToHtml(
  resume: TailoredResumeSchema,
  template: string
): string {
  try {
    const basics = resume?.basics;
    if (!basics) {
      return '<div class="resume-preview"><p>Error: Missing resume basics data</p></div>';
    }

    const cssClass = resolveTemplateClass(template);

    const sections = [
      buildHeader(basics),
      buildSummary(resume.summary ?? basics.summary),
      buildCompetencies(resume.skills, resume.matched_keywords ?? null),
      buildWorkExperience(resume.work),
      buildProjects(resume.projects),
      buildEducation(resume.education),
      buildCertificates(resume.certificates),
      buildSkillsSection(resume.skills),
    ]
      .filter(Boolean)
      .join("\n");

    return `\
<div class="resume-preview ${cssClass}">
  <div class="resume-page">
    ${sections}
  </div>
</div>`;
  } catch (err) {
    console.error("[resumeToHtml] Error:", err);
    return '<div class="resume-preview"><p>Error: Could not generate resume HTML. Check console for details.</p></div>';
  }
}
