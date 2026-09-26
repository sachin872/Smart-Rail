from fastapi import Header, HTTPException, status
from typing import Optional

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
