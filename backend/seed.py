"""
Run this once after migrations to seed default data:
    python seed.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import db, get_next_sequence_value, init_db
from app.models import User, Role, RolesConfig
from app.core.security import hash_password


def seed():
    init_db()

    # ── Roles ──────────────────────────────────────────────
    roles_data = [
        {
            "name": "admin",
            "permissions": '["create_user","delete_user","view_all","edit_all","upload_task","view_reports","assign_task","configure_system"]',
            "access_level": 4,
        },
        {
            "name": "manager",
            "permissions": '["view_all","edit_task","upload_task","view_reports","assign_task"]',
            "access_level": 3,
        },
        {
            "name": "developer",
            "permissions": '["view_own","edit_own","upload_task","log_hours"]',
            "access_level": 2,
        },
        {
            "name": "intern",
            "permissions": '["view_own","log_hours"]',
            "access_level": 1,
        },
    ]

    for r in roles_data:
        exists = db.roles.find_one({"name": r["name"]})
        if not exists:
            role_id = get_next_sequence_value("role_id")
            role = Role(
                id=role_id,
                name=r["name"],
                permissions=r["permissions"],
                access_level=r["access_level"]
            )
            db.roles.insert_one(role.to_dict())
            print(f"  ✓ Role '{r['name']}' created")
        else:
            print(f"  - Role '{r['name']}' already exists")

    # ── Roles Config ────────────────────────────────────────
    for role_name in ["developer", "intern", "manager", "admin"]:
        exists = db.roles_config.find_one({"role_name": role_name})
        if not exists:
            config_id = get_next_sequence_value("roles_config_id")
            config = RolesConfig(
                id=config_id,
                role_name=role_name,
                domain="reliancehospital.com",
                upload_allowed=True,
            )
            db.roles_config.insert_one(config.to_dict())
            print(f"  ✓ RolesConfig for '{role_name}' created")

    # ── Default Admin User ─────────────────────────────────
    admin_exists = db.users.find_one({"username": "admin_raj"})
    if not admin_exists:
        user_id = get_next_sequence_value("user_id")
        user = User(
            id=user_id,
            username="admin_raj",
            email="admin@reliancehospital.com",
            password_hash=hash_password("Admin@1234"),
            full_name="Raj Admin",
            role="admin",
            dev_type="node",
            domain="reliancehospital.com",
            is_active=True,
        )
        db.users.insert_one(user.to_dict())
        print("  ✓ Default admin 'admin_raj' created (password: Admin@1234)")
    else:
        print("  - Admin user already exists")

    # ── Sample Developers ──────────────────────────────────
    sample_users = [
        {"username": "priya_dev",   "email": "priya@reliancehospital.com",   "role": "developer", "dev_type": "react",   "full_name": "Priya Dev"},
        {"username": "arjun_intern","email": "arjun@reliancehospital.com",   "role": "intern",    "dev_type": "python",  "full_name": "Arjun Intern"},
        {"username": "mgr_sneha",   "email": "sneha@reliancehospital.com",   "role": "manager",   "dev_type": "sap",     "full_name": "Sneha Manager"},
        {"username": "dev_karan",   "email": "karan@reliancehospital.com",   "role": "developer", "dev_type": "angular", "full_name": "Karan Dev"},
    ]

    for u in sample_users:
        exists = db.users.find_one({"username": u["username"]})
        if not exists:
            user_id = get_next_sequence_value("user_id")
            user = User(
                id=user_id,
                username=u["username"],
                email=u["email"],
                role=u["role"],
                dev_type=u["dev_type"],
                full_name=u["full_name"],
                password_hash=hash_password("Dev@1234"),
                domain="reliancehospital.com",
                is_active=True,
            )
            db.users.insert_one(user.to_dict())
            print(f"  ✓ User '{u['username']}' created (password: Dev@1234)")
        else:
            print(f"  - User '{u['username']}' already exists")

    print("\n✅ Seeding complete!")
    print("\nDefault credentials:")
    print("  Admin  → username: admin_raj  | password: Admin@1234")
    print("  Others → password: Dev@1234")


if __name__ == "__main__":
    print("🌱 Seeding DevTracker database...\n")
    seed()
