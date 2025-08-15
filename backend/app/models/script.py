from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from ..database import Base


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text)
    tags = Column(Text)
    thumbnail_text = Column(String(100))
    imagefx_prompt = Column(Text)
    status = Column(String(20), default="script_ready")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    video_file_path = Column(String(500))
    youtube_video_id = Column(String(50))
    scheduled_time = Column(DateTime)

    def __repr__(self):
        return f"<Script(id={self.id}, title='{self.title}', status='{self.status}')>"
