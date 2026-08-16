"""Seed a new gym 'gym_ex' with trainers, members, and all related data.

Usage:
    python manage.py seed_gym_ex
"""
import random
from datetime import date, datetime, time, timedelta

from django.utils import timezone
from django.core.management.base import BaseCommand

from fitsphere.core.models import User, ReceptionistProfile
from fitsphere.organizations.models import GymOrganization, Branch
from fitsphere.trainers.models import Trainer
from fitsphere.members.models import Member
from fitsphere.memberships.models import MembershipPlan, MemberMembership
from fitsphere.personal_training import models as pt_models
from fitsphere.attendance.models import AttendanceLog
from fitsphere.payments.models import Payment
from fitsphere.billing.models import SubscriptionPlan, Subscription
from fitsphere.audit.models import AuditLog

PASSWORD = "admin123"


class Command(BaseCommand):
    help = "Seed gym_ex organization with trainers, members, and related data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding gym_ex...")

        today = date.today()

        # ── 1. Subscription Plans (shared, get_or_create so no dupes) ──
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
                    "Everything in Starter", "Advanced reporting",
                    "Trainer performance", "PT session scheduling", "Priority support",
                ],
            ),
        )

        # ── 2. Gym Organization: gym_ex ──
        gym_ex, created = GymOrganization.objects.get_or_create(
            slug="gym_ex",
            defaults=dict(
                name="gym_ex",
                contact_email="info@gymex.in",
                contact_phone="+91-9000000001",
                address_line1="24 Fitness Street",
                city="Jaipur",
                state="Rajasthan",
                postal_code="302001",
                country="IN",
            ),
        )
        if created:
            self.stdout.write("  [+] Gym Organization created: gym_ex")
        else:
            self.stdout.write("  [=] Gym Organization already exists: gym_ex")

        # ── 3. Subscription ──
        sub, _ = Subscription.objects.get_or_create(
            organization=gym_ex,
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
        gym_ex.subscription = sub
        gym_ex.save(update_fields=["subscription"])

        # ── 4. Branches ──
        branch_a, _ = Branch.objects.get_or_create(
            organization=gym_ex,
            name="Sector A, Jaipur",
            defaults=dict(
                code="GEX-JA-A",
                contact_email="sector_a@gymex.in",
                contact_phone="+91-9000000010",
                address_line1="Sector A, Malviya Nagar",
                city="Jaipur",
                state="Rajasthan",
                postal_code="302015",
                country="IN",
                opening_time="05:30",
                closing_time="23:30",
            ),
        )
        branch_b, _ = Branch.objects.get_or_create(
            organization=gym_ex,
            name="Sector B, Kota",
            defaults=dict(
                code="GEX-KT-B",
                contact_email="sector_b@gymex.in",
                contact_phone="+91-9000000020",
                address_line1="Sector B, Haldighati Road",
                city="Kota",
                state="Rajasthan",
                postal_code="324002",
                country="IN",
                opening_time="06:00",
                closing_time="22:30",
            ),
        )
        self.stdout.write("  [OK] Branches: Sector A (Jaipur) & Sector B (Kota)")

        # ── 5. Gym Owner ──
        gym_owner, uc = User.objects.get_or_create(
            username="gym_ex_owner",
            defaults=dict(
                email="owner@gymex.in",
                first_name="Neha",
                last_name="Shekhawat",
                role="gym_owner",
                phone="+91-9000000005",
                organization=gym_ex,
            ),
        )
        if uc:
            gym_owner.set_password(PASSWORD)
            gym_owner.save()
        self.stdout.write("  [OK] Gym Owner: gym_ex_owner / admin123")

        # ── 6. Trainers (1 per branch) ──
        trainer_a_user, uc = User.objects.get_or_create(
            username="gym_ex_trainer_a",
            defaults=dict(
                email="trainer.a@gymex.in",
                first_name="Deepak",
                last_name="Chaudhary",
                role="trainer",
                phone="+91-9000000011",
                organization=gym_ex,
            ),
        )
        if uc:
            trainer_a_user.set_password(PASSWORD)
            trainer_a_user.save()

        trainer_a, _ = Trainer.objects.get_or_create(
            user=trainer_a_user,
            defaults=dict(
                organization=gym_ex,
                branch=branch_a,
                specialization="Strength & Conditioning",
                bio="NSCA-CSCS certified with 7 years in powerlifting.",
                qualifications="NSCA-CSCS, CrossFit Level 2",
                years_of_experience=7,
                hourly_rate=700,
                max_members=35,
            ),
        )

        trainer_b_user, uc = User.objects.get_or_create(
            username="gym_ex_trainer_b",
            defaults=dict(
                email="trainer.b@gymex.in",
                first_name="Anjali",
                last_name="Rao",
                role="trainer",
                phone="+91-9000000021",
                organization=gym_ex,
            ),
        )
        if uc:
            trainer_b_user.set_password(PASSWORD)
            trainer_b_user.save()

        trainer_b, _ = Trainer.objects.get_or_create(
            user=trainer_b_user,
            defaults=dict(
                organization=gym_ex,
                branch=branch_b,
                specialization="Cardio & HIIT",
                bio="ACE Certified with 5 years in HIIT and endurance training.",
                qualifications="ACE-CPT, ACSM-CEP",
                years_of_experience=5,
                hourly_rate=650,
                max_members=30,
            ),
        )
        self.stdout.write("  [OK] Trainers: Deepak (Jaipur) & Anjali (Kota)")

        # ── 7. Receptionists ──
        recv_a_user, uc = User.objects.get_or_create(
            username="gym_ex_recv_a",
            defaults=dict(
                email="recv.a@gymex.in",
                first_name="Monika",
                last_name="Sharma",
                role="receptionist",
                phone="+91-9000000012",
                organization=gym_ex,
            ),
        )
        if uc:
            recv_a_user.set_password(PASSWORD)
            recv_a_user.save()
        ReceptionistProfile.objects.get_or_create(
            user=recv_a_user, defaults=dict(branch=branch_a),
        )

        recv_b_user, uc = User.objects.get_or_create(
            username="gym_ex_recv_b",
            defaults=dict(
                email="recv.b@gymex.in",
                first_name="Sunita",
                last_name="Yadav",
                role="receptionist",
                phone="+91-9000000022",
                organization=gym_ex,
            ),
        )
        if uc:
            recv_b_user.set_password(PASSWORD)
            recv_b_user.save()
        ReceptionistProfile.objects.get_or_create(
            user=recv_b_user, defaults=dict(branch=branch_b),
        )
        self.stdout.write("  [OK] Receptionists: Monika (Jaipur) & Sunita (Kota)")

        # ── 8. Membership Plans ──
        monthly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=gym_ex,
            name="Monthly Unlimited",
            defaults=dict(
                description="Full access to all equipment and classes",
                duration="monthly",
                duration_days=30,
                price=1499,
                billing_cycle="one_time",
            ),
        )
        quarterly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=gym_ex,
            name="Quarterly Unlimited",
            defaults=dict(
                description="3 months full access",
                duration="quarterly",
                duration_days=90,
                price=3999,
                billing_cycle="one_time",
            ),
        )
        yearly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=gym_ex,
            name="Yearly Unlimited",
            defaults=dict(
                description="Full year at the best rate",
                duration="yearly",
                duration_days=365,
                price=13999,
                billing_cycle="one_time",
            ),
        )
        self.stdout.write("  [OK] Membership plans created (Monthly/Quarterly/Yearly)")

        # ── 9. PT Packages ──
        pt_5, _ = pt_models.PTPackage.objects.get_or_create(
            organization=gym_ex,
            name="5 Sessions Pack",
            defaults=dict(
                description="Starter pack for new trainees",
                number_of_sessions=5,
                validity_days=30,
                price=1500,
            ),
        )
        pt_10, _ = pt_models.PTPackage.objects.get_or_create(
            organization=gym_ex,
            name="10 Sessions Pack",
            defaults=dict(
                description="Popular choice for regular training",
                number_of_sessions=10,
                validity_days=45,
                price=2500,
            ),
        )
        self.stdout.write("  [OK] PT packages created (5 & 10 sessions)")

        # ── 10. Members (5 per branch = 10 total) ──
        branches = {branch_a.id: {"branch": branch_a, "trainer": trainer_a, "plan": monthly_plan, "price": 1499},
                    branch_b.id: {"branch": branch_b, "trainer": trainer_b, "plan": yearly_plan, "price": 13999}}

        member_data_a = [
            ("gym_ex_m1", "Ravi", "Kumar", "ravi.kumar@gymex.member", "+91-9100000001", "male", "Sita Kumari", "+91-9100000001"),
            ("gym_ex_m2", "Pooja", "Verma", "pooja.verma@gymex.member", "+91-9100000002", "female", "Raj Verma", "+91-9100000002"),
            ("gym_ex_m3", "Amit", "Yadav", "amit.yadav@gymex.member", "+91-9100000003", "male", "Sunita Yadav", "+91-9100000003"),
            ("gym_ex_m4", "Nidhi", "Singh", "nidhi.singh@gymex.member", "+91-9100000004", "female", "Ramesh Singh", "+91-9100000004"),
            ("gym_ex_m5", "Sanjay", "Patel", "sanjay.patel@gymex.member", "+91-9100000005", "male", "Meena Patel", "+91-9100000005"),
        ]
        member_data_b = [
            ("gym_ex_m6", "Kavita", "Mishra", "kavita.mishra@gymex.member", "+91-9100000006", "female", "Arun Mishra", "+91-9100000006"),
            ("gym_ex_m7", "Manish", "Jain", "manish.jain@gymex.member", "+91-9100000007", "male", "Pinki Jain", "+91-9100000007"),
            ("gym_ex_m8", "Divya", "Sharma", "divya.sharma@gymex.member", "+91-9100000008", "female", "Naresh Sharma", "+91-9100000008"),
            ("gym_ex_m9", "Tarun", "Rao", "tarun.rao@gymex.member", "+91-9100000009", "male", "Kavita Rao", "+91-9100000009"),
            ("gym_ex_m10", "Priya", "Chauhan", "priya.chauhan@gymex.member", "+91-9100000010", "female", "Ravi Chauhan", "+91-9100000010"),
        ]

        def create_member(mdata, info):
            u, uc = User.objects.get_or_create(
                username=mdata[0],
                defaults=dict(
                    email=mdata[3],
                    first_name=mdata[1],
                    last_name=mdata[2],
                    role="member",
                    phone=mdata[4],
                    organization=gym_ex,
                ),
            )
            if uc:
                u.set_password(PASSWORD)
                u.save()
            mem, _ = Member.objects.get_or_create(
                user=u,
                defaults=dict(
                    organization=gym_ex,
                    branch=info["branch"],
                    gender=mdata[5],
                    emergency_contact_name=mdata[6],
                    emergency_contact_phone=mdata[7],
                    membership_status="active",
                    membership_start_date=today - timedelta(days=30),
                    membership_end_date=today + timedelta(days=335),
                    assigned_trainer=info["trainer"],
                ),
            )
            MemberMembership.objects.get_or_create(
                member=mem,
                plan=info["plan"],
                start_date=today - timedelta(days=30),
                end_date=today + timedelta(days=335),
                amount_paid=info["price"],
                defaults={"is_active": True, "organization": gym_ex},
            )
            return mem

        all_members = []
        for m in member_data_a:
            all_members.append(create_member(m, branches[branch_a.id]))
        for m in member_data_b:
            all_members.append(create_member(m, branches[branch_b.id]))
        self.stdout.write(f"  [OK] Members created: 5 per branch (10 total)")

        # ── 11. PT Memberships (1 per branch) ──
        ptm_records = []
        for i, (branch_id, info) in enumerate(branches.items()):
            mem = all_members[i * 5]
            ptm, _ = pt_models.PTMembership.objects.get_or_create(
                member=mem,
                package=pt_10,
                trainer=info["trainer"],
                start_date=today - timedelta(days=20),
                defaults=dict(
                    organization=gym_ex,
                    sessions_total=10,
                    sessions_used=3,
                    sessions_remaining=7,
                    end_date=today + timedelta(days=25),
                    amount_paid=2500,
                    is_active=True,
                ),
            )
            ptm_records.append(ptm)
            self.stdout.write(f"  [OK] PT membership: {mem.user.first_name} ({info['branch'].name})")

        # ── 12. PT Sessions ──
        session_data = []
        for i, ptm in enumerate(ptm_records):
            mem = ptm.member
            trainer = ptm.trainer
            branch = branches[ptm.branch_id]["branch"]
            for d in range(2):
                sd = today - timedelta(days=18 - d * 5)
                session_data.append((
                    ptm, mem, trainer, branch, sd, time(8, 0), 60,
                    "completed", f"Session {d+1}: Strength training focus.", 5 if d == 0 else 4,
                ))
            # One upcoming
            session_data.append((
                ptm, mem, trainer, branch, today + timedelta(days=2), time(8, 0), 60,
                "scheduled", "", None,
            ))

        for pm, mem, tr, br, sd, st, dur, status, notes, rating in session_data:
            pt_models.PTSession.objects.get_or_create(
                pt_membership=pm,
                member=mem,
                trainer=tr,
                scheduled_date=sd,
                scheduled_time=st,
                defaults=dict(
                    organization=gym_ex,
                    branch=br,
                    duration_minutes=dur,
                    status=status,
                    progress_notes=notes,
                    rating=rating if status == "completed" else None,
                    completed_at=timezone.make_aware(
                        datetime.combine(sd, st)
                    ) if status == "completed" else None,
                ),
            )
        self.stdout.write(f"  [OK] PT Sessions created ({len(session_data)} total)")

        # ── 13. Attendance Logs (5 days per member) ──
        recv_map = {branch_a.id: recv_a_user, branch_b.id: recv_b_user}
        for member in all_members:
            for day_ago in range(5):
                cd = today - timedelta(days=day_ago)
                if cd.weekday() >= 5:
                    continue
                ct = timezone.make_aware(
                    datetime.combine(cd, time(random.randint(6, 10), random.randint(0, 59)))
                )
                method = random.choice(["qr", "qr", "manual"])
                marked_by = recv_map.get(member.branch_id) if method == "manual" else None
                AttendanceLog.objects.get_or_create(
                    member=member,
                    branch=member.branch,
                    check_in_time=ct,
                    check_in_method=method,
                    defaults={
                        "organization": gym_ex,
                        "marked_by": marked_by,
                        "session_type": "regular",
                    },
                )
        self.stdout.write("  [OK] Attendance logs created (~40 entries)")

        # ── 14. Payments ──
        for member in all_members:
            info = branches[member.branch_id]
            Payment.objects.get_or_create(
                member=member,
                payment_type="membership",
                amount=info["price"],
                branch=member.branch,
                organization=gym_ex,
                paid_at=timezone.make_aware(
                    datetime.combine(today - timedelta(days=30), time(10, 0))
                ),
                defaults=dict(
                    payment_method=random.choice(["cash", "upi", "card"]),
                    status="completed",
                    description=f"{info['plan'].name} membership payment",
                    received_by=recv_map.get(member.branch_id),
                ),
            )

        for ptm in ptm_records:
            mem = ptm.member
            Payment.objects.get_or_create(
                member=mem,
                payment_type="pt_package",
                amount=ptm.amount_paid,
                branch=mem.branch,
                organization=gym_ex,
                paid_at=timezone.make_aware(
                    datetime.combine(ptm.start_date, time(14, 0))
                ),
                defaults=dict(
                    payment_method="upi",
                    status="completed",
                    description=f"{ptm.package.name} PT package payment",
                    received_by=recv_map.get(mem.branch_id),
                ),
            )
        self.stdout.write("  [OK] Payments created (membership + PT)")

        # ── 15. Audit Logs ──
        all_users = [gym_owner, trainer_a_user, trainer_b_user, recv_a_user, recv_b_user]
        all_users += [m.user for m in all_members]
        for u in all_users:
            AuditLog.objects.get_or_create(
                user=u,
                action="login",
                entity_type="user",
                entity_id=u.id,
                timestamp=timezone.make_aware(
                    datetime.combine(today - timedelta(days=random.randint(0, 3)), time(9, 0))
                ),
                defaults=dict(organization=gym_ex if u.role != "super_admin" else None),
            )
        self.stdout.write("  [OK] Audit logs created")

        # ── Summary ──
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("====== gym_ex Seed Complete ======"))
        self.stdout.write("")
        self.stdout.write(f"  Gym Owner:     gym_ex_owner / admin123")
        self.stdout.write(f"  Trainers:")
        self.stdout.write(f"    - gym_ex_trainer_a / admin123 (Sector A, Jaipur)")
        self.stdout.write(f"    - gym_ex_trainer_b / admin123 (Sector B, Kota)")
        self.stdout.write(f"  Receptionists:")
        self.stdout.write(f"    - gym_ex_recv_a / admin123 (Sector A, Jaipur)")
        self.stdout.write(f"    - gym_ex_recv_b / admin123 (Sector B, Kota)")
        self.stdout.write(f"  Members:")
        self.stdout.write(f"    - gym_ex_m1 - gym_ex_m5 / admin123 (Jaipur)")
        self.stdout.write(f"    - gym_ex_m6 - gym_ex_m10 / admin123 (Kota)")
        self.stdout.write(f"")
        self.stdout.write(f"  All passwords: admin123")
