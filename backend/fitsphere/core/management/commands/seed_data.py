from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date

from fitsphere.core.models import User, ReceptionistProfile
from fitsphere.organizations.models import GymOrganization, Branch
from fitsphere.trainers.models import Trainer
from fitsphere.members.models import Member
from fitsphere.memberships.models import MembershipPlan, MemberMembership
from fitsphere.billing.models import SubscriptionPlan, Subscription


class Command(BaseCommand):
    help = "Seed the database with sample data for development"

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # ── 1. Subscription Plans ──
        starter_plan, _ = SubscriptionPlan.objects.get_or_create(
            tier="starter",
            defaults=dict(
                name="Starter",
                description="Perfect for small independent gyms",
                max_branches=1,
                max_members=100,
                monthly_price=2999,
                annual_price=29900,
                features=[
                    "Core modules",
                    "Member management",
                    "QR check-in",
                    "Basic reports",
                ],
            ),
        )
        pro_plan, _ = SubscriptionPlan.objects.get_or_create(
            tier="professional",
            defaults=dict(
                name="Professional",
                description="For growing fitness businesses",
                max_branches=5,
                max_members=1000,
                monthly_price=7999,
                annual_price=79900,
                features=[
                    "Everything in Starter",
                    "Advanced reporting",
                    "Trainer performance",
                    "PT session scheduling",
                    "Priority support",
                ],
            ),
        )
        SubscriptionPlan.objects.get_or_create(
            tier="premium",
            defaults=dict(
                name="Premium",
                description="For large fitness chains with no limits",
                max_branches=999,
                max_members=999999,
                monthly_price=24999,
                annual_price=249900,
                features=[
                    "Everything in Professional",
                    "Unlimited branches",
                    "Unlimited members",
                    "Priority support",
                    "Advanced Analytics",
                    "Dedicated account manager",
                    "Custom integrations",
                    "99.9% uptime SLA",
                    "White-label option",
                ],
            ),
        )
        self.stdout.write("  [OK] Subscription plans created")

        # ── 2. Super Admin ──
        super_admin, created = User.objects.get_or_create(
            username="superadmin",
            defaults=dict(
                email="superadmin@fitsphere.com",
                first_name="Platform",
                last_name="Admin",
                role="super_admin",
                is_staff=True,
                is_superuser=True,
            ),
        )
        if created:
            super_admin.set_password("admin123")
            super_admin.save()
        self.stdout.write("  [OK] Super Admin created (superadmin / admin123)")

        # ── 3. Gym Organization ──
        org, created = GymOrganization.objects.get_or_create(
            slug="iron-forge-gym",
            defaults=dict(
                name="Iron Forge Gym",
                contact_email="info@ironforgegym.com",
                contact_phone="+91-9876543210",
                address_line1="42 Fitness Avenue",
                city="Metro City",
                state="State",
                postal_code="400001",
                country="IN",
            ),
        )
        self.stdout.write("  [OK] Gym Organization created: Iron Forge Gym")

        # ── 4. Subscription for the org ──
        sub, _ = Subscription.objects.get_or_create(
            organization=org,
            defaults=dict(
                plan=pro_plan,
                status="active",
                billing_cycle="monthly",
                trial_start=timezone.now(),
                trial_end=timezone.now() + timedelta(days=14),
                current_period_start=timezone.now(),
                current_period_end=timezone.now() + timedelta(days=30),
                auto_renew=True,
            ),
        )
        org.subscription = sub
        org.save(update_fields=["subscription"])

        # ── 5. Branches ──
        branch1, _ = Branch.objects.get_or_create(
            organization=org,
            name="Downtown",
            defaults=dict(
                code="IF-DT",
                contact_email="downtown@ironforgegym.com",
                contact_phone="+91-9876543211",
                address_line1="100 Main Street",
                city="Metro City Downtown",
                state="State",
                postal_code="400002",
                country="IN",
                opening_time="05:00",
                closing_time="23:00",
            ),
        )
        branch2, _ = Branch.objects.get_or_create(
            organization=org,
            name="Uptown",
            defaults=dict(
                code="IF-UT",
                contact_email="uptown@ironforgegym.com",
                contact_phone="+91-9876543212",
                address_line1="200 Hill Road",
                city="Metro City Uptown",
                state="State",
                postal_code="400003",
                country="IN",
                opening_time="06:00",
                closing_time="22:00",
            ),
        )
        self.stdout.write("  [OK] Branches created: Downtown & Uptown")

        # ── 6. Gym Owner ──
        gym_owner, created = User.objects.get_or_create(
            username="gymowner",
            defaults=dict(
                email="owner@ironforgegym.com",
                first_name="Alex",
                last_name="Steel",
                role="gym_owner",
                phone="+91-9876543200",
                organization=org,
            ),
        )
        if created:
            gym_owner.set_password("admin123")
            gym_owner.save()
        self.stdout.write("  [OK] Gym Owner created (gymowner / admin123)")

        # ── 7. Trainers ──
        trainer1_user, _ = User.objects.get_or_create(
            username="trainer1",
            defaults=dict(
                email="trainer1@ironforgegym.com",
                first_name="Sarah",
                last_name="Connor",
                role="trainer",
                phone="+91-9876543221",
                organization=org,
            ),
        )
        if created:
            trainer1_user.set_password("admin123")
            trainer1_user.save()

        trainer1, _ = Trainer.objects.get_or_create(
            user=trainer1_user,
            defaults=dict(
                organization=org,
                branch=branch1,
                specialization="Strength & Conditioning",
                bio="10+ years of experience in powerlifting and functional training",
                qualifications="NSCA-CSCS, CrossFit Level 2",
                years_of_experience=10,
                hourly_rate=500,
                max_members=30,
            ),
        )

        trainer2_user, _ = User.objects.get_or_create(
            username="trainer2",
            defaults=dict(
                email="trainer2@ironforgegym.com",
                first_name="Marcus",
                last_name="Rivers",
                role="trainer",
                phone="+91-9876543222",
                organization=org,
            ),
        )
        if created:
            trainer2_user.set_password("admin123")
            trainer2_user.save()

        trainer2, _ = Trainer.objects.get_or_create(
            user=trainer2_user,
            defaults=dict(
                organization=org,
                branch=branch2,
                specialization="Yoga & Flexibility",
                bio="Certified yoga instructor with expertise in Hatha and Vinyasa",
                qualifications="RYT-500, ACE Certified",
                years_of_experience=7,
                hourly_rate=400,
                max_members=25,
            ),
        )
        self.stdout.write("  [OK] Trainers created: Sarah (Downtown) & Marcus (Uptown)")

        # ── 8. Receptionists ──
        receptionist1_user, _ = User.objects.get_or_create(
            username="receptionist1",
            defaults=dict(
                email="receptionist1@ironforgegym.com",
                first_name="Priya",
                last_name="Sharma",
                role="receptionist",
                phone="+91-9876543231",
                organization=org,
            ),
        )
        if created:
            receptionist1_user.set_password("admin123")
            receptionist1_user.save()

        ReceptionistProfile.objects.get_or_create(
            user=receptionist1_user,
            defaults=dict(branch=branch1),
        )

        receptionist2_user, _ = User.objects.get_or_create(
            username="receptionist2",
            defaults=dict(
                email="receptionist2@ironforgegym.com",
                first_name="Ravi",
                last_name="Patel",
                role="receptionist",
                phone="+91-9876543232",
                organization=org,
            ),
        )
        if created:
            receptionist2_user.set_password("admin123")
            receptionist2_user.save()

        ReceptionistProfile.objects.get_or_create(
            user=receptionist2_user,
            defaults=dict(branch=branch2),
        )
        self.stdout.write("  [OK] Receptionists created: Priya (Downtown) & Ravi (Uptown)")

        # ── 9. Membership Plans ──
        monthly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=org,
            name="Monthly Unlimited",
            defaults=dict(
                description="Full access to all equipment and classes",
                duration="monthly",
                duration_days=30,
                price=1999,
                billing_cycle="one_time",
            ),
        )
        quarterly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=org,
            name="Quarterly Unlimited",
            defaults=dict(
                description="Best value — 3 months full access",
                duration="quarterly",
                duration_days=90,
                price=4999,
                billing_cycle="one_time",
            ),
        )
        yearly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=org,
            name="Yearly Unlimited",
            defaults=dict(
                description="Full year at the best rate",
                duration="yearly",
                duration_days=365,
                price=15999,
                billing_cycle="one_time",
            ),
        )
        self.stdout.write("  [OK] Membership plans created")

        # ── 10. Members for Branch 1 (Downtown) ──
        today = date.today()
        branch1_members_data = [
            {
                "username": "member1a",
                "email": "john.doe@email.com",
                "first_name": "John",
                "last_name": "Doe",
                "gender": "male",
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_phone": "+91-9876543241",
            },
            {
                "username": "member1b",
                "email": "emma.wilson@email.com",
                "first_name": "Emma",
                "last_name": "Wilson",
                "gender": "female",
                "emergency_contact_name": "Tom Wilson",
                "emergency_contact_phone": "+91-9876543242",
            },
            {
                "username": "member1c",
                "email": "mike.tyson@email.com",
                "first_name": "Mike",
                "last_name": "Tyson",
                "gender": "male",
                "emergency_contact_name": "Mary Tyson",
                "emergency_contact_phone": "+91-9876543243",
            },
        ]
        for m in branch1_members_data:
            user, _ = User.objects.get_or_create(
                username=m["username"],
                defaults={
                    "email": m["email"],
                    "first_name": m["first_name"],
                    "last_name": m["last_name"],
                    "role": "member",
                    "phone": m.get("emergency_contact_phone", ""),
                    "organization": org,
                },
            )
            if _:
                user.set_password("admin123")
                user.save()
            Member.objects.get_or_create(
                user=user,
                defaults={
                    "organization": org,
                    "branch": branch1,
                    "gender": m["gender"],
                    "emergency_contact_name": m["emergency_contact_name"],
                    "emergency_contact_phone": m["emergency_contact_phone"],
                    "membership_status": "active",
                    "membership_start_date": today - timedelta(days=30),
                    "membership_end_date": today + timedelta(days=335),
                    "assigned_trainer": trainer1,
                },
            )
            MemberMembership.objects.get_or_create(
                member=Member.objects.get(user=user),
                plan=yearly_plan,
                start_date=today - timedelta(days=30),
                end_date=today + timedelta(days=335),
                amount_paid=15999,
                defaults={"is_active": True},
            )

        # ── 11. Members for Branch 2 (Uptown) ──
        branch2_members_data = [
            {
                "username": "member2a",
                "email": "arjun.reddy@email.com",
                "first_name": "Arjun",
                "last_name": "Reddy",
                "gender": "male",
                "emergency_contact_name": "Anita Reddy",
                "emergency_contact_phone": "+91-9876543244",
            },
            {
                "username": "member2b",
                "email": "sophia.lee@email.com",
                "first_name": "Sophia",
                "last_name": "Lee",
                "gender": "female",
                "emergency_contact_name": "David Lee",
                "emergency_contact_phone": "+91-9876543245",
            },
            {
                "username": "member2c",
                "email": "rocky.bhai@email.com",
                "first_name": "Rocky",
                "last_name": "Bhai",
                "gender": "male",
                "emergency_contact_name": "Rocky Sr.",
                "emergency_contact_phone": "+91-9876543246",
            },
        ]
        for m in branch2_members_data:
            user, _ = User.objects.get_or_create(
                username=m["username"],
                defaults={
                    "email": m["email"],
                    "first_name": m["first_name"],
                    "last_name": m["last_name"],
                    "role": "member",
                    "phone": m.get("emergency_contact_phone", ""),
                    "organization": org,
                },
            )
            if _:
                user.set_password("admin123")
                user.save()
            Member.objects.get_or_create(
                user=user,
                defaults={
                    "organization": org,
                    "branch": branch2,
                    "gender": m["gender"],
                    "emergency_contact_name": m["emergency_contact_name"],
                    "emergency_contact_phone": m["emergency_contact_phone"],
                    "membership_status": "active",
                    "membership_start_date": today - timedelta(days=60),
                    "membership_end_date": today + timedelta(days=305),
                    "assigned_trainer": trainer2,
                },
            )
            MemberMembership.objects.get_or_create(
                member=Member.objects.get(user=user),
                plan=quarterly_plan,
                start_date=today - timedelta(days=60),
                end_date=today + timedelta(days=30),
                amount_paid=4999,
                defaults={"is_active": True},
            )

        self.stdout.write("  [OK] Members created: 3 Downtown + 3 Uptown")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("====== Seed Complete ======"))
        self.stdout.write(f"  Super Admin:    superadmin / admin123")
        self.stdout.write(f"  Gym Owner:      gymowner / admin123")
        self.stdout.write(f"  Trainers:       trainer1 / admin123 (Downtown)")
        self.stdout.write(f"                  trainer2 / admin123 (Uptown)")
        self.stdout.write(f"  Receptionists:  receptionist1 / admin123 (Downtown)")
        self.stdout.write(f"                  receptionist2 / admin123 (Uptown)")
        self.stdout.write(f"  Members:        member1a, member1b, member1c (Downtown)")
        self.stdout.write(f"                  member2a, member2b, member2c (Uptown)")
        self.stdout.write("")
        self.stdout.write(f"  All passwords: admin123")
