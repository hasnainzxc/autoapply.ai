from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import os

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or (DATABASE_URL.startswith("${{") or DATABASE_URL.startswith("{{")):
    DATABASE_URL = f"sqlite:///{os.path.join(_BACKEND_DIR, 'applymate.db').replace(os.sep, '/')}"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=not is_sqlite)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clerk_id = Column(String(255), unique=True)
    email = Column(String(255))
    full_name = Column(String(255))
    base_resume = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Credit(Base):
    __tablename__ = "credits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), unique=True)
    balance = Column(Integer, default=0)
    lifetime_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255))
    amount = Column(Integer)
    type = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255))
    job_url = Column(Text)
    job_title = Column(String(255))
    company_name = Column(String(255))
    company_logo = Column(Text)
    location = Column(String(255))
    salary_range = Column(String(100))
    status = Column(String(50), default="queued")
    match_score = Column(Integer)
    score_rating = Column(String(10))
    has_pdf = Column(Boolean, default=False)
    report_path = Column(Text)
    report_number = Column(String(10))
    portal = Column(String(100))
    notes = Column(Text)
    cv_used = Column(Text)
    tailored_resume = Column(JSON)
    cover_letter = Column(Text)
    applied_at = Column(DateTime)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36))
    event_type = Column(String(50))
    message = Column(Text)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255))
    original_file_path = Column(Text)
    extracted_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TailoredResume(Base):
    __tablename__ = "tailored_resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255))
    resume_id = Column(String(36))
    job_description = Column(Text)
    llm_model = Column(String(100))
    llm_raw_response = Column(Text)
    llm_structured_json = Column(JSON)
    template_used = Column(String(100))
    pdf_path = Column(Text)
    status = Column(String(50), default="processing")
    created_at = Column(DateTime, default=datetime.utcnow)


class ResumeEvent(Base):
    __tablename__ = "resume_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tailored_resume_id = Column(String(36))
    event_type = Column(String(50))
    message = Column(Text)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255))
    job_url = Column(Text)
    title = Column(String(255))
    company = Column(String(255))
    location = Column(String(255))
    portal = Column(String(100))
    status = Column(String(50), default="pending")
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class PipelineEntry(Base):
    __tablename__ = "pipeline_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255))
    job_url = Column(Text)
    title = Column(String(255))
    company = Column(String(255))
    section = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_or_create_credits(db, user_id: str):
    credit = db.query(Credit).filter(Credit.user_id == user_id).first()
    if not credit:
        credit = Credit(user_id=user_id, balance=5)
        db.add(credit)
        db.commit()
        db.refresh(credit)
    return credit
