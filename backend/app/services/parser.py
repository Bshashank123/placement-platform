"""
Resume Parser — Module 3
Pipeline:
  PDF bytes → extract text → detect sections →
  extract bullets → extract skills → structured data
"""

import re
from dataclasses import dataclass, field


# ── Skills dictionary ─────────────────────────────────────────────────────────

SKILLS_DB = {
    # Languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#",
    "go", "rust", "swift", "kotlin", "ruby", "php", "scala", "r",
    "matlab", "perl", "bash", "shell", "dart", "lua",
    # Web
    "html", "css", "react", "next.js", "nextjs", "vue", "angular",
    "node.js", "nodejs", "express", "fastapi", "django", "flask",
    "spring", "spring boot", "asp.net", "laravel", "rails",
    "tailwind", "tailwindcss", "bootstrap", "graphql", "rest api",
    "rest apis", "websocket",
    # Data / ML
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas",
    "numpy", "matplotlib", "seaborn", "opencv", "huggingface",
    "llm", "data science", "data analysis", "statistics",
    # Databases
    "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis",
    "elasticsearch", "cassandra", "dynamodb", "firebase",
    "supabase", "prisma", "sqlalchemy",
    # DevOps / Cloud
    "docker", "kubernetes", "aws", "azure", "gcp", "google cloud",
    "ci/cd", "github actions", "jenkins", "terraform", "ansible",
    "linux", "nginx", "apache",
    # Tools
    "git", "github", "gitlab", "jira", "figma", "postman",
    "swagger", "vscode", "intellij",
    # CS fundamentals
    "data structures", "algorithms", "dsa", "system design",
    "object oriented programming", "oop", "design patterns",
    "microservices", "agile", "scrum",
    # Mobile
    "android", "ios", "react native", "flutter",
}

# ── Weak verbs that reduce bullet quality ────────────────────────────────────

WEAK_VERBS = {
    "responsible for", "worked on", "helped", "assisted",
    "involved in", "participated in", "was part of", "did",
    "made", "did work", "worked with",
}

# ── Section name patterns ─────────────────────────────────────────────────────

SECTION_PATTERNS = {
    "education":        r"\b(education|academic|qualification|degree)\b",
    "experience":       r"\b(experience|work experience|employment|internship|intern|job)\b",
    "projects":         r"\b(projects?|personal projects?|academic projects?|work done)\b",
    "skills":           r"\b(skills?|technical skills?|technologies|tech stack|competencies)\b",
    "certifications":   r"\b(certif(ication|icate)s?|courses?|training|credential)\b",
    "achievements":     r"\b(achievement|award|honor|accomplishment|recognition)\b",
    "leadership":       r"\b(leadership|extracurricular|activity|activities|volunteer|club)\b",
    "summary":          r"\b(summary|objective|profile|about|about me|career objective)\b",
    "publications":     r"\b(publication|paper|research|journal|conference)\b",
}


@dataclass
class ParsedSection:
    name: str
    content: str


@dataclass
class ParsedBullet:
    section_name: str
    bullet_text: str
    word_count: int
    has_metric: bool
    weak_verb: bool


@dataclass
class ParsedResume:
    raw_text: str
    sections: list[ParsedSection] = field(default_factory=list)
    bullets: list[ParsedBullet] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)


# ── Step 1: Extract text from PDF ────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Use PyMuPDF to extract all text from a PDF."""
    import fitz  # PyMuPDF
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


# ── Step 2: Detect sections ───────────────────────────────────────────────────

def detect_sections(text: str) -> list[ParsedSection]:
    """
    Split text into named sections by detecting section headers.
    A line is treated as a header if it:
      - matches one of our section patterns
      - is short (under 60 chars)
      - is on its own line or followed by a colon
    """
    lines = text.split("\n")
    sections: list[ParsedSection] = []
    current_name = "header"
    current_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        matched_section = _match_section_header(stripped)
        if matched_section:
            # Save current section before starting new one
            if current_lines:
                sections.append(ParsedSection(
                    name=current_name,
                    content="\n".join(current_lines).strip()
                ))
            current_name = matched_section
            current_lines = []
        else:
            current_lines.append(stripped)

    # Save last section
    if current_lines:
        sections.append(ParsedSection(
            name=current_name,
            content="\n".join(current_lines).strip()
        ))

    return sections


def _match_section_header(line: str) -> str | None:
    """Return section canonical name if line looks like a section header."""
    if len(line) > 80:
        return None

    clean = line.lower().strip().rstrip(":").strip()

    for section_name, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, clean, re.IGNORECASE):
            # Make sure it looks like a heading — not a full sentence
            word_count = len(clean.split())
            if word_count <= 5:
                return section_name

    return None


# ── Step 3: Extract bullet points ────────────────────────────────────────────

def extract_bullets(sections: list[ParsedSection]) -> list[ParsedBullet]:
    """Extract bullet points from section content."""
    bullets: list[ParsedBullet] = []

    # Sections where we look for bullets
    bullet_sections = {"experience", "projects", "achievements",
                       "leadership", "certifications"}

    for section in sections:
        if section.name not in bullet_sections:
            continue

        lines = section.content.split("\n")
        for line in lines:
            stripped = line.strip()

            # Bullet markers: •, -, *, >, –, or lines that start with a capital
            is_bullet = bool(re.match(r'^[•\-\*\>\–]\s+', stripped))
            if not is_bullet:
                # Also treat lines starting with capital letter and > 5 words as bullets
                if re.match(r'^[A-Z]', stripped) and len(stripped.split()) >= 5:
                    is_bullet = True

            if not is_bullet:
                continue

            # Clean bullet marker
            text = re.sub(r'^[•\-\*\>\–]\s+', '', stripped).strip()
            if len(text) < 10:
                continue

            words = text.split()
            word_count = len(words)
            has_metric = _has_metric(text)
            weak = _has_weak_verb(text)

            bullets.append(ParsedBullet(
                section_name=section.name,
                bullet_text=text,
                word_count=word_count,
                has_metric=has_metric,
                weak_verb=weak,
            ))

    return bullets


def _has_metric(text: str) -> bool:
    """True if bullet contains a number, percentage, currency, or scale indicator."""
    patterns = [
        r'\d+%',            # percentage: 35%
        r'\d+\+',           # scale: 10k+
        r'\$\d+',           # currency: $5000
        r'\d+[kKmMbB]',     # scale: 10k, 2M
        r'\b\d{2,}\b',      # any 2+ digit number
        r'\b(increased|reduced|improved|decreased|achieved|saved|generated)\b.*\d',
    ]
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False


def _has_weak_verb(text: str) -> bool:
    """True if bullet starts with a weak verb phrase."""
    lower = text.lower()
    for weak in WEAK_VERBS:
        if lower.startswith(weak):
            return True
    return False


# ── Step 4: Extract skills ────────────────────────────────────────────────────

def extract_skills(text: str) -> list[str]:
    """
    Find known skills mentioned anywhere in the resume text.
    Uses dictionary matching — returns a deduplicated sorted list.
    """
    lower_text = text.lower()
    found = set()

    for skill in SKILLS_DB:
        # Match whole word / phrase
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, lower_text):
            # Return with original casing from our DB
            found.add(skill)

    return sorted(found)


# ── Main pipeline entry point ─────────────────────────────────────────────────

def parse_resume(file_bytes: bytes) -> ParsedResume:
    """
    Full pipeline:
      bytes → text → sections → bullets → skills → ParsedResume
    """
    raw_text = extract_text_from_pdf(file_bytes)
    sections = detect_sections(raw_text)
    bullets  = extract_bullets(sections)
    skills   = extract_skills(raw_text)

    return ParsedResume(
        raw_text=raw_text,
        sections=sections,
        bullets=bullets,
        skills=skills,
    )