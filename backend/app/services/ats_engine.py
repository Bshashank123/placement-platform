"""
ATS Scoring Engine — Module 4
Refactored spaCy NLP Scorer with high criticality.
Matches Resume Worded logic: Impact, Brevity, Style, Sections.
"""

import re
import sys
from dataclasses import dataclass, field
from sqlalchemy.orm import Session

from app.models import (
    Resume, ResumeSection, ResumeBullet,
    ResumeScore, ResumeSuggestion, StudentRanking, Student
)

# ─────────────────────────────────────────────────────────────────────────────
# spaCy Model Lazy Loader
# ─────────────────────────────────────────────────────────────────────────────

def _load_spacy():
    try:
        import spacy
        return spacy.load("en_core_web_sm")
    except OSError:
        import subprocess
        try:
            # Download model inside the virtual environment
            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], capture_output=True)
            import spacy
            return spacy.load("en_core_web_sm")
        except Exception:
            # Graceful fallback if download fails (e.g. offline)
            return None

nlp = _load_spacy()

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

STRONG_VERBS = {
    "developed", "built", "designed", "implemented", "engineered",
    "architected", "created", "launched", "deployed", "optimized",
    "improved", "reduced", "increased", "automated", "integrated",
    "led", "managed", "directed", "coordinated", "mentored",
    "researched", "analyzed", "evaluated", "established", "delivered",
    "scaled", "migrated", "refactored", "debugged", "resolved",
    "published", "presented", "collaborated", "spearheaded", "pioneered",
    "overhauled", "streamlined", "accelerated", "generated", "secured",
    "achieved", "awarded", "earned", "won", "solved", "proposed",
    "negotiated", "advised", "trained", "supervised",
}

WEAK_VERBS = {
    "responsible for", "worked on", "helped", "assisted",
    "involved in", "participated in", "was part of", "did",
    "made", "worked with", "tried to", "attempted",
    "was involved", "took part",
}

FILLER_PHRASES = {
    "various", "etc", "and more", "a lot of", "many",
    "several", "numerous", "different kinds", "some",
    "things", "stuff", "and so on", "as well as",
    "good communication", "team player", "hard working",
    "detail oriented", "fast learner", "quick learner",
    "passionate about", "enthusiastic", "result-oriented",
}

PRONOUNS = {
    " i ", " me ", " my ", " we ", " our ", " us "
}

REQUIRED_SECTIONS = {"education", "experience"}

METRIC_PATTERNS = [
    r'\d+\s*%',                             # 35%, 40 %
    r'\d+\s*x\b',                           # 3x faster
    r'\$\s*\d+',                            # $5000
    r'\b\d+[kKmMbB]\b',                     # 10k, 2M
    r'\b\d{2,}\b',                          # any 2+ digit number
    r'\b(increased|reduced|improved|decreased|saved|generated|cut|grew|boosted|accelerated)\b.*\d',
    r'\bfrom\s+\d+.*\bto\s+\d+',            # from X to Y
    r'\bover\s+\d+',                        # over 10,000
    r'\b\d+\s*(users|clients|customers|requests|transactions|records|lines|test cases)\b',
]

# ─────────────────────────────────────────────────────────────────────────────
# Data Transfer Object
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ScoringResult:
    ats_score:       float = 0.0
    impact_score:    float = 0.0   # /40
    brevity_score:   float = 0.0   # /25
    style_score:     float = 0.0   # /20
    sections_score:  float = 0.0   # /15
    suggestions:     list[dict] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# Bullet Linguistic Analyzer
# ─────────────────────────────────────────────────────────────────────────────

def _analyze_bullet_nlp(text: str) -> dict:
    res = {
        "is_active": True,
        "starts_with_strong_verb": False,
        "has_metric": False,
        "has_outcome": False,
        "weak_phrase": None,
        "first_verb": None,
        "has_pronoun": False
    }
    
    lower_text = " " + text.lower() + " "
    for p in PRONOUNS:
        if p in lower_text:
            res["has_pronoun"] = True

    for w in WEAK_VERBS:
        if text.lower().startswith(w) or f" {w} " in lower_text:
            res["weak_phrase"] = w
            break
            
    if not nlp:
        words = text.strip().split()
        first_word = words[0].lower().rstrip(".,;") if words else ""
        res["first_verb"] = first_word
        res["starts_with_strong_verb"] = first_word in STRONG_VERBS
        res["has_metric"] = any(re.search(pat, text, re.IGNORECASE) for pat in METRIC_PATTERNS)
        return res

    doc = nlp(text)
    tokens = [t for t in doc if not t.is_space and not t.is_punct]
    
    if tokens:
        first = tokens[0]
        res["first_verb"] = first.lemma_.lower()
        if first.pos_ == "VERB" or first.lemma_.lower() in STRONG_VERBS:
            if first.lemma_.lower() in STRONG_VERBS:
                res["starts_with_strong_verb"] = True
            elif first.lemma_.lower() not in WEAK_VERBS:
                res["starts_with_strong_verb"] = True

        has_aux = any(t.pos_ == "AUX" and t.lemma_ in {"be", "have"} for t in tokens)
        has_vbn = any(t.tag_ == "VBN" for t in tokens)
        if has_aux and has_vbn:
            res["is_active"] = False

    has_num_ent = any(ent.label_ in {"CARDINAL", "PERCENT", "MONEY", "QUANTITY"} for ent in doc.ents)
    has_num_pos = any(t.pos_ == "NUM" for t in tokens)
    has_regex = any(re.search(pat, text, re.IGNORECASE) for pat in METRIC_PATTERNS)
    if has_num_ent or has_num_pos or has_regex:
        res["has_metric"] = True

    causality_lemmas = {"by", "through", "using", "resulting", "lead", "leads", "to", "for", "achieved", "optimized", "improve", "increase"}
    if any(t.lemma_.lower() in causality_lemmas for t in tokens):
        res["has_outcome"] = True

    return res

# ─────────────────────────────────────────────────────────────────────────────
# Category 1 — Impact (40 pts)
# ─────────────────────────────────────────────────────────────────────────────

def score_impact(bullets: list[ResumeBullet]) -> tuple[float, list[dict]]:
    suggestions = []
    if not bullets:
        suggestions.append({"category": "impact", "priority": 1, "text": "No experience or project bullets found. Add accomplishments."})
        return 0.0, suggestions

    metric_count = 0
    verb_count = 0
    weak_count = 0
    weak_examples = []

    for b in bullets:
        analysis = _analyze_bullet_nlp(b.bullet_text)
        if analysis["has_metric"]:
            metric_count += 1
        if analysis["starts_with_strong_verb"]:
            verb_count += 1
        if analysis["weak_phrase"]:
            weak_count += 1
            weak_examples.append((analysis["weak_phrase"], b.bullet_text[:50]))

    metric_ratio = metric_count / len(bullets)
    verb_ratio = verb_count / len(bullets)
    
    # 25 pts for metrics, 15 pts for action verbs
    metric_score = min(metric_ratio * 60.0, 25.0)  # maxes out at ~40% ratio
    verb_score = min(verb_ratio * 25.0, 15.0)      # maxes out at ~60% ratio
    
    raw_score = metric_score + verb_score
    raw_score -= (weak_count * 1.5)  # Moderate penalty for weak verbs
    
    if metric_ratio < 0.25:
        raw_score -= 4.0  # Moderate penalty for low metrics
        
    score = max(0.0, min(round(raw_score, 2), 40.0))

    if metric_count == 0:
        suggestions.append({"category": "impact", "priority": 1, "text": "Critical: None of your bullets contain metrics. Quantify achievements (e.g. 'reduced latency by 30%')."})
    elif metric_ratio < 0.50:
        suggestions.append({"category": "impact", "priority": 1, "text": f"Only {metric_count} out of {len(bullets)} bullets have metrics. Target >50% quantification for high impact."})

    if weak_count > 0:
        examples_str = "; ".join(f"'{phrase}' in '{snippet}...'" for phrase, snippet in weak_examples[:2])
        suggestions.append({"category": "impact", "priority": 1, "text": f"Severe weak phrasing detected: {examples_str}. Replace with strong active verbs."})

    if verb_ratio < 0.8:
        suggestions.append({"category": "impact", "priority": 2, "text": "Start every single bullet point with a strong action verb (e.g. 'Developed', 'Managed', 'Architected')."})

    return score, suggestions

# ─────────────────────────────────────────────────────────────────────────────
# Category 2 — Brevity (25 pts)
# ─────────────────────────────────────────────────────────────────────────────

def score_brevity(raw_text: str, bullets: list[ResumeBullet]) -> tuple[float, list[dict]]:
    suggestions = []
    if not bullets:
        return 0.0, []

    ideal = sum(1 for b in bullets if 12 <= b.word_count <= 25)
    too_short = sum(1 for b in bullets if b.word_count < 10)
    too_long = sum(1 for b in bullets if b.word_count > 30)

    ideal_ratio = ideal / len(bullets)
    length_score = round(ideal_ratio * 15.0, 2)

    # Filler words
    all_text = " ".join(b.bullet_text.lower() for b in bullets)
    found_buzzwords = [phrase for phrase in FILLER_PHRASES if phrase in all_text]
    buzzword_score = max(0.0, 5.0 - (len(found_buzzwords) * 1.0))
    
    # Word count check
    word_count = len(raw_text.split())
    wc_score = 0.0
    if 400 <= word_count <= 850:
        wc_score = 5.0
    elif 250 <= word_count <= 1000:
        wc_score = 2.0
        
    penalty = (too_short * 0.5) + (too_long * 0.5)
    
    score = max(0.0, min(round(length_score + buzzword_score + wc_score - penalty, 2), 25.0))

    if too_short > 0:
        suggestions.append({"category": "brevity", "priority": 2, "text": f"Strict: {too_short} bullet(s) are too short (<10 words). Expand with details."})
    if too_long > 0:
        suggestions.append({"category": "brevity", "priority": 2, "text": f"Strict: {too_long} bullet(s) are too long (>30 words). Keep them concise and focused on a single outcome."})
    if found_buzzwords:
        suggestions.append({"category": "brevity", "priority": 2, "text": f"Remove filler/buzzwords: {', '.join(found_buzzwords[:3])}. They dilute your impact."})
    if word_count < 400:
        suggestions.append({"category": "brevity", "priority": 3, "text": f"Resume is too brief ({word_count} words). Aim for 400-800 words."})
    elif word_count > 850:
        suggestions.append({"category": "brevity", "priority": 3, "text": f"Resume is too long ({word_count} words). ATS prefers brevity. Trim down."})

    return score, suggestions

# ─────────────────────────────────────────────────────────────────────────────
# Category 3 — Style (20 pts)
# ─────────────────────────────────────────────────────────────────────────────

def score_style(bullets: list[ResumeBullet]) -> tuple[float, list[dict]]:
    suggestions = []
    if not bullets:
        return 0.0, []

    passive_count = 0
    pronoun_count = 0
    verb_usage = {}
    
    for b in bullets:
        analysis = _analyze_bullet_nlp(b.bullet_text)
        if not analysis["is_active"]:
            passive_count += 1
        if analysis["has_pronoun"]:
            pronoun_count += 1
            
        first = analysis["first_verb"]
        if first:
            verb_usage[first] = verb_usage.get(first, 0) + 1

    repeated_verbs = {k: v for k, v in verb_usage.items() if v >= 3 and len(k) > 3}
    
    base = 20.0
    base -= (passive_count * 1.0)
    base -= (pronoun_count * 2.0)  # moderate penalty for pronouns
    
    for verb, count in repeated_verbs.items():
        base -= ((count - 2) * 0.5)
        
    score = max(0.0, min(round(base, 2), 20.0))

    if pronoun_count > 0:
        suggestions.append({"category": "style", "priority": 1, "text": "Strict: Personal pronouns (I, me, my, we) detected. Resumes must be written in the third-person without pronouns."})
    if passive_count > 0:
        suggestions.append({"category": "style", "priority": 2, "text": f"Passive voice detected in {passive_count} bullets. Rewrite in active voice."})
    if repeated_verbs:
        verb_list = ", ".join(f"'{k}' ({v}x)" for k,v in list(repeated_verbs.items())[:3])
        suggestions.append({"category": "style", "priority": 2, "text": f"Repetitive action verbs found: {verb_list}. Vary your vocabulary to keep the reader engaged."})

    return score, suggestions

# ─────────────────────────────────────────────────────────────────────────────
# Category 4 — Sections (15 pts)
# ─────────────────────────────────────────────────────────────────────────────

def score_sections(sections: list[ResumeSection], bullets: list[ResumeBullet]) -> tuple[float, list[dict]]:
    suggestions = []
    present = {s.section_name.lower() for s in sections}

    base = 0.0
    for req in REQUIRED_SECTIONS:
        if req in present:
            base += 5.0
        else:
            suggestions.append({"category": "sections", "priority": 1, "text": f"Missing critical standard section: '{req.title()}'."})
            
    if "skills" in present:
        base += 5.0
    else:
        suggestions.append({"category": "sections", "priority": 2, "text": "Consider adding a dedicated 'Skills' section."})

    # Hard isolation checks
    if "experience" not in present and "projects" not in present:
        base = max(base - 8.0, 0)
        suggestions.append({"category": "sections", "priority": 1, "text": "Severe: No 'Experience' or 'Projects' sections found. Crucial for ATS matching."})

    for s in sections:
        if s.section_name.lower() in REQUIRED_SECTIONS:
            if not s.content or len(s.content.strip()) < 40:
                base = max(base - 1.5, 0)
                suggestions.append({"category": "sections", "priority": 2, "text": f"Section '{s.section_name.title()}' is empty or too short."})

    score = max(0.0, min(round(base, 2), 15.0))
    return score, suggestions

# ─────────────────────────────────────────────────────────────────────────────
# Orchestration Scorer
# ─────────────────────────────────────────────────────────────────────────────

def calculate_ats_score(
    raw_text: str,
    sections: list[ResumeSection],
    bullets: list[ResumeBullet],
    detected_skills: list[str],
) -> ScoringResult:
    imp_score, imp_sug = score_impact(bullets)
    brv_score, brv_sug = score_brevity(raw_text, bullets)
    sty_score, sty_sug = score_style(bullets)
    sec_score, sec_sug = score_sections(sections, bullets)

    total = round(imp_score + brv_score + sty_score + sec_score, 2)

    all_suggestions = imp_sug + brv_sug + sty_sug + sec_sug

    return ScoringResult(
        ats_score=total,
        impact_score=imp_score,
        brevity_score=brv_score,
        style_score=sty_score,
        sections_score=sec_score,
        suggestions=all_suggestions
    )

def run_ats_scoring(db: Session, resume_id: int) -> ScoringResult:
    from app.services.parser import extract_skills

    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise ValueError(f"Resume {resume_id} not found.")

    sections = db.query(ResumeSection).filter(ResumeSection.resume_id == resume_id).all()
    bullets  = db.query(ResumeBullet).filter(ResumeBullet.resume_id  == resume_id).all()

    all_text = " ".join([s.content or "" for s in sections])
    all_text += " " + " ".join([b.bullet_text for b in bullets])
    detected_skills = extract_skills(all_text)

    result = calculate_ats_score(
        raw_text=all_text,
        sections=sections,
        bullets=bullets,
        detected_skills=detected_skills
    )

    existing_score = db.query(ResumeScore).filter(ResumeScore.resume_id == resume_id).first()

    if existing_score:
        existing_score.ats_score      = result.ats_score
        existing_score.impact_score   = result.impact_score
        existing_score.brevity_score  = result.brevity_score
        existing_score.style_score    = result.style_score
        existing_score.sections_score = result.sections_score
    else:
        db.add(ResumeScore(
            resume_id=resume_id,
            ats_score=result.ats_score,
            impact_score=result.impact_score,
            brevity_score=result.brevity_score,
            style_score=result.style_score,
            sections_score=result.sections_score
        ))

    db.query(ResumeSuggestion).filter(ResumeSuggestion.resume_id == resume_id).delete()

    for s in result.suggestions:
        db.add(ResumeSuggestion(
            resume_id=resume_id,
            category=s["category"],
            suggestion_text=s["text"],
            priority=s["priority"]
        ))

    db.flush()
    db.commit()
    return result

def _recalculate_ranking(db: Session, student_id: int, tenant_id: int):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or not student.department:
        return

    my_resumes = db.query(Resume.id).filter(Resume.student_id == student_id).all()
    my_resume_ids = [r.id for r in my_resumes]
    if not my_resume_ids:
        return

    best = (
        db.query(ResumeScore)
        .filter(ResumeScore.resume_id.in_(my_resume_ids))
        .order_by(ResumeScore.ats_score.desc())
        .first()
    )
    if not best:
        return

    my_best_score = best.ats_score

    existing = db.query(StudentRanking).filter(
        StudentRanking.student_id == student_id,
        StudentRanking.tenant_id  == tenant_id
    ).first()

    if existing:
        existing.ats_score  = my_best_score
        existing.department = student.department
    else:
        db.add(StudentRanking(
            student_id=student_id,
            tenant_id=tenant_id,
            department=student.department,
            rank=1,
            ats_score=my_best_score
        ))

    db.flush()

    dept_rankings = (
        db.query(StudentRanking)
        .filter(
            StudentRanking.tenant_id  == tenant_id,
            StudentRanking.department == student.department
        )
        .order_by(StudentRanking.ats_score.desc())
        .all()
    )

    for i, ranking in enumerate(dept_rankings, start=1):
        ranking.rank = i
