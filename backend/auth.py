"""
Authentication and security utilities
JWT token generation, validation, and password hashing
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()


class AuthHandler:
    """Handle authentication operations"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Could not validate credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def get_current_user_id(
        credentials: HTTPAuthorizationCredentials = Security(security)
    ) -> str:
        """Extract user ID from JWT token"""
        token = credentials.credentials
        payload = AuthHandler.decode_token(token)
        
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if token_type != "access":
            raise HTTPException(
                status_code=401,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_id
    
    @staticmethod
    def get_current_user_role(
        credentials: HTTPAuthorizationCredentials = Security(security)
    ) -> str:
        """Extract user role from JWT token"""
        token = credentials.credentials
        payload = AuthHandler.decode_token(token)
        
        role: str = payload.get("role")
        
        if role is None:
            raise HTTPException(
                status_code=401,
                detail="Could not validate role",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return role


def require_role(*allowed_roles: str):
    """
    Dependency to check if user has required role
    Usage: Depends(require_role("admin", "instructor"))
    """
    def role_checker(
        credentials: HTTPAuthorizationCredentials = Security(security)
    ) -> str:
        token = credentials.credentials
        payload = AuthHandler.decode_token(token)
        
        user_role = payload.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return user_role
    
    return role_checker


# Convenience functions for role-based access
def require_admin():
    """Require admin role"""
    return require_role("admin")


def require_instructor():
    """Require instructor or admin role"""
    return require_role("instructor", "admin")


def require_authenticated():
    """Require any authenticated user"""
    return require_role("student", "instructor", "admin")