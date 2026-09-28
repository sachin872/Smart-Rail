import hashlib
import datetime
from fastapi import Header, HTTPException, status
from typing import Optional, Dict, Any, List
from backend.app.core.db import get_db_connection

def hash_password(password: str) -> str:
    """Hashes password using SHA-256."""
    return hashlib.sha256(password.strip().encode("utf-8")).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verifies plain password matches stored SHA-256 hash."""
    return hash_password(password) == password_hash

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticates user against SQLite admin_users table in real time.
    Returns user details dictionary on success, or None on failure.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username, password_hash, role, full_name, division FROM admin_users WHERE UPPER(username) = UPPER(?)",
        (username.strip(),)
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    stored_hash = row["password_hash"]
    if verify_password(password, stored_hash):
        # Update last login timestamp in real time
        now_str = datetime.datetime.now().isoformat()
        cursor.execute("UPDATE admin_users SET last_login = ? WHERE username = ?", (now_str, row["username"]))
        conn.commit()
        user_info = {
            "username": row["username"],
            "role": row["role"],
            "full_name": row["full_name"],
            "division": row["division"]
        }
        conn.close()
        return user_info

    conn.close()
    return None

def change_user_password(username: str, old_password: str, new_password: str) -> Dict[str, Any]:
    """
    Updates the password for an operator in the database in real time.
    """
    if len(new_password.strip()) < 4:
        return {"success": False, "error": "New password must be at least 4 characters long."}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username, password_hash FROM admin_users WHERE UPPER(username) = UPPER(?)",
        (username.strip(),)
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"success": False, "error": f"Operator '{username}' not found in database."}

    if not verify_password(old_password, row["password_hash"]):
        conn.close()
        return {"success": False, "error": "Current password does not match database record."}

    new_hash = hash_password(new_password)
    cursor.execute("UPDATE admin_users SET password_hash = ? WHERE username = ?", (new_hash, row["username"]))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Password updated successfully in database."}

def list_admin_users() -> List[Dict[str, Any]]:
    """
    Returns sanitized list of authorized operators from database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, role, full_name, division, created_at, last_login FROM admin_users")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def require_role(required_role: str):
    """
    Dependency checking user role from header 'X-User-Role' or default.
    Roles: 'viewer' < 'controller' < 'admin'
    """
    role_weights = {
        "viewer": 1,
        "controller": 2,
        "admin": 3
    }

    async def role_checker(x_user_role: Optional[str] = Header(default="viewer")):
        client_role = x_user_role.lower() if x_user_role else "viewer"
        if client_role not in role_weights:
            client_role = "viewer"

        req_weight = role_weights.get(required_role, 1)
        cli_weight = role_weights.get(client_role, 1)

        if cli_weight < req_weight:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Endpoint requires '{required_role}' authorization, but client has '{client_role}'."
            )
        return client_role

    return role_checker
