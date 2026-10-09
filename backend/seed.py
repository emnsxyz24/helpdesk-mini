from sqlalchemy import select

from app.database import SessionLocal
from app.models import Business, Role, User
from app.security import hash_password

DEMO_PASSWORD = 'Password123!'
BUSINESSES = [('Acme Store', 'acme-store', 'acme-demo.com'), ('Globex Travel', 'globex-travel', 'globex-demo.com')]
USERS = [('Admin', 'admin', Role.admin), ('Agent', 'agent', Role.agent), ('Customer One', 'customer1', Role.customer), ('Customer Two', 'customer2', Role.customer)]

def seed() -> None:
    with SessionLocal() as db:
        for business_name, slug, domain in BUSINESSES:
            business = db.scalar(select(Business).where(Business.slug == slug))    
            if business is None:
                business = Business(name=business_name, slug=slug)
                db.add(business)
                db.flush()
            for label, local_part, role in USERS:
                email = f'{local_part}@{domain}'
                if db.scalar(select(User).where(User.email == email)) is None:
                    db.add(
                        User(
                            business_id=business.id,
                            name=f'{label} ({business_name})',
                            email=email,
                            password_hash=hash_password(DEMO_PASSWORD),
                            role=role,
                        )
                    )
                    db.commit()
                print('Seed done')
if __name__ == '__main__':
    seed()
