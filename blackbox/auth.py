# blackbox/blackbox/auth.py
import os
import jwt
from fastapi import Header, HTTPException
from .orgs import org_for_user

JWT_ALG = "HS256"

def verify_jwt(token: str) -> str:
    secret = os.environ["SUPABASE_JWT_SECRET"]
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALG], audience="authenticated")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="token has no subject")
    return sub

def current_org(authorization: str = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    user_id = verify_jwt(authorization[len("Bearer "):])
    org_id = org_for_user(user_id)
    if not org_id:
        raise HTTPException(status_code=403, detail="user has no org")
    return org_id
