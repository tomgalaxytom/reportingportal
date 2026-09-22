import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate DEE or JCEE official against public.users table."""
    email_clean = request.officer_email.strip().lower()
    user = (
        db.query(User)
        .filter(User.officer_email.ilike(email_clean))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Officer account not found.",
        )

    # Verify password with bcrypt
    password_bytes = request.password.strip().encode("utf-8")
    stored_hash_bytes = user.password.encode("utf-8")

    password_valid = False
    try:
        password_valid = bcrypt.checkpw(password_bytes, stored_hash_bytes)
    except Exception:
        # Fallback to direct comparison if not bcrypt hashed
        password_valid = request.password.strip() == user.password.strip()

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please check your credentials.",
        )

    return LoginResponse(
        status="success",
        user=UserResponse(
            id=user.id,
            district_name=user.district_name,
            officer_email=user.officer_email,
            role=user.role,
        ),
        token=f"tnpcb_jwt_{user.id}_{user.role}",
    )


@router.get("/me", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List system users for verification/reference."""
    users = db.query(User).order_by(User.id.asc()).all()
    return users
