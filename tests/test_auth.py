import pytest
from fastapi import HTTPException
from blackbox.auth import verify_jwt, current_org
from blackbox.orgs import create_org

def test_verify_jwt_returns_sub(make_jwt):
    assert verify_jwt(make_jwt("user-1")) == "user-1"

def test_verify_jwt_rejects_bad_signature(make_jwt):
    with pytest.raises(HTTPException):
        verify_jwt(make_jwt("user-1", secret="wrong-secret"))

def test_verify_jwt_rejects_expired(make_jwt):
    with pytest.raises(HTTPException):
        verify_jwt(make_jwt("user-1", expired=True))

def test_current_org_resolves_org(store, make_jwt):
    org_id = create_org("Acme", "user-7")
    assert current_org(authorization=f"Bearer {make_jwt('user-7')}") == org_id

def test_current_org_rejects_missing_header():
    with pytest.raises(HTTPException):
        current_org(authorization=None)

def test_current_org_rejects_user_without_org(make_jwt):
    with pytest.raises(HTTPException):
        current_org(authorization=f"Bearer {make_jwt('orphan-user')}")
