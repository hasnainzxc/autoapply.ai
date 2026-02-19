from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/applymate")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
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
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String(255), unique=True)
    email = Column(String(255))
    full_name = Column(String(255))
    base_resume = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Credit(Base):
    __tablename__ = "credits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), unique=True)
    balance = Column(Integer, default=0)
    lifetime_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255))
    amount = Column(Integer)
    type = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255))
    job_url = Column(Text)
    job_title = Column(String(255))
    company_name = Column(String(255))
    company_logo = Column(Text)
    location = Column(String(255))
    salary_range = Column(String(100))
    status = Column(String(50), default="queued")
    match_score = Column(Integer)
    tailored_resume = Column(JSON)
    cover_letter = Column(Text)
    applied_at = Column(DateTime)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ApplicationEvent(Base):
    __tablename__ = "application_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True))
    event_type = Column(String(50))
    message = Column(Text)
    payload = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255))
    original_file_path = Column(Text)
    extracted_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TailoredResume(Base):
    __tablename__ = "tailored_resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255))
    resume_id = Column(UUID(as_uuid=True))
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
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tailored_resume_id = Column(UUID(as_uuid=True))
    event_type = Column(String(50))
    message = Column(Text)
    payload = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)


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
