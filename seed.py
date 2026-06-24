"""
Run this once after migrations to seed default data:
    python seed.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.models.models import User, Role, RolesConfig
from app.core.security import hash_password

# Import all models so Base knows about them
import app.models.models  # noqa


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
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
            exists = db.query(Role).filter(Role.name == r["name"]).first()
            if not exists:
                db.add(Role(**r))
                print(f"  ✓ Role '{r['name']}' created")
            else:
                print(f"  - Role '{r['name']}' already exists")

        # ── Roles Config ────────────────────────────────────────
        for role_name in ["developer", "intern", "manager", "admin"]:
            exists = db.query(RolesConfig).filter(RolesConfig.role_name == role_name).first()
            if not exists:
                db.add(RolesConfig(
                    role_name=role_name,
                    domain="reliancehospital.com",
                    upload_allowed=True,
                ))
                print(f"  ✓ RolesConfig for '{role_name}' created")

        # ── Default Admin User ─────────────────────────────────
        admin_exists = db.query(User).filter(User.username == "admin_raj").first()
        if not admin_exists:
            db.add(User(
                username="admin_raj",
                email="admin@reliancehospital.com",
                password_hash=hash_password("Admin@1234"),
                full_name="Raj Admin",
                role="admin",
                dev_type="node",
                domain="reliancehospital.com",
                is_active=True,
            ))
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
            exists = db.query(User).filter(User.username == u["username"]).first()
            if not exists:
                db.add(User(
                    **u,
                    password_hash=hash_password("Dev@1234"),
                    domain="reliancehospital.com",
                    is_active=True,
                ))
                print(f"  ✓ User '{u['username']}' created (password: Dev@1234)")
            else:
                print(f"  - User '{u['username']}' already exists")

        db.commit()
        print("\n✅ Seeding complete!")
        print("\nDefault credentials:")
        print("  Admin  → username: admin_raj  | password: Admin@1234")
        print("  Others → password: Dev@1234")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding DevTracker database...\n")
    seed()
