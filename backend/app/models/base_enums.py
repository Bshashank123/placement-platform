import enum

class UserRole(str, enum.Enum):
    student     = "student"
    faculty     = "faculty"
    admin       = "admin"
    super_admin = "super_admin"

class ResumeType(str, enum.Enum):
    sde          = "SDE"
    data_science = "Data Science"
    ai_ml        = "AI/ML"
    general      = "General"

class ResumeStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

class DriveRSVPStatus(str, enum.Enum):
    pending   = "pending"
    attending = "attending"
    skipped   = "skipped"
