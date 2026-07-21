import random
from datetime import timedelta, date, datetime, time

from django.core.management.base import BaseCommand
from django.utils import timezone

from fitsphere.core.models import User, ReceptionistProfile
from fitsphere.organizations.models import GymOrganization, Branch
from fitsphere.trainers.models import Trainer
from fitsphere.members.models import Member
from fitsphere.memberships.models import MembershipPlan, MemberMembership
from fitsphere.personal_training.models import PTPackage, PTMembership, PTSession
from fitsphere.attendance.models import AttendanceLog, AttendanceCode
from fitsphere.payments.models import Payment
from fitsphere.billing.models import SubscriptionPlan, Subscription
from fitsphere.audit.models import AuditLog
from fitsphere.notifications.models import NotificationTemplate, NotificationPreference

PASSWORD = "admin123"


class Command(BaseCommand):
    help = "Seed the database with sample data for Fitness Gym"

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
                features=["Core modules", "Member management", "QR check-in", "Basic reports"],
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
                    "Everything in Starter", "Advanced reporting",
                    "Trainer performance", "PT session scheduling", "Priority support",
                ],
            ),
        )
        SubscriptionPlan.objects.get_or_create(
            tier="enterprise",
            defaults=dict(
                name="Enterprise",
                description="For large fitness chains with no limits",
                max_branches=999,
                max_members=999999,
                monthly_price=24999,
                annual_price=249900,
                features=[
                    "Everything in Professional", "Unlimited branches",
                    "Unlimited members", "Priority support", "Advanced Analytics",
                    "Dedicated account manager", "Custom integrations",
                    "99.9% uptime SLA", "White-label option",
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
            super_admin.set_password(PASSWORD)
            super_admin.save()
        self.stdout.write("  [OK] Super Admin created (superadmin / admin123)")

        # ── 3. Gym Organization: Fitness Gym ──
        fg_org, created = GymOrganization.objects.get_or_create(
            slug="fitness-gym",
            defaults=dict(
                name="Fitness Gym",
                contact_email="info@fitnessgym.com",
                contact_phone="+91-9876543210",
                address_line1="42 Fitness Avenue",
                city="Chandigarh",
                state="Chandigarh",
                postal_code="160001",
                country="IN",
            ),
        )
        self.stdout.write("  [OK] Gym Organization created: Fitness Gym")

        # ── 4. Subscription for the org ──
        sub, _ = Subscription.objects.get_or_create(
            organization=fg_org,
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
        fg_org.subscription = sub
        fg_org.save(update_fields=["subscription"])

        # ── 5. Branches ──
        branch_pb, _ = Branch.objects.get_or_create(
            organization=fg_org,
            name="Sector 119, Punjab",
            defaults=dict(
                code="FG-PB",
                contact_email="sector119@fitnessgym.com",
                contact_phone="+91-9876543211",
                address_line1="Sector 119, Phase 12",
                city="Mohali",
                state="Punjab",
                postal_code="140307",
                country="IN",
                opening_time="05:00",
                closing_time="23:00",
            ),
        )
        branch_ch, _ = Branch.objects.get_or_create(
            organization=fg_org,
            name="Sector 34, Chandigarh",
            defaults=dict(
                code="FG-CH",
                contact_email="sector34@fitnessgym.com",
                contact_phone="+91-9876543212",
                address_line1="Sector 34-A",
                city="Chandigarh",
                state="Chandigarh",
                postal_code="160022",
                country="IN",
                opening_time="05:00",
                closing_time="22:00",
            ),
        )
        self.stdout.write("  [OK] Branches created: Sector 119 (Punjab) & Sector 34 (Chandigarh)")

        # ── 6. Gym Owner ──
        gym_owner, user_created = User.objects.get_or_create(
            username="gymowner",
            defaults=dict(
                email="owner@fitnessgym.com",
                first_name="Arjun",
                last_name="Singh",
                role="gym_owner",
                phone="+91-9876543200",
                organization=fg_org,
            ),
        )
        if user_created:
            gym_owner.set_password(PASSWORD)
            gym_owner.save()
        self.stdout.write("  [OK] Gym Owner created (gymowner / admin123)")

        # ── 7. Trainers ──
        trainer_pb_user, user_created = User.objects.get_or_create(
            username="trainer_pb",
            defaults=dict(
                email="trainer.pb@fitnessgym.com",
                first_name="Gurpreet",
                last_name="Singh",
                role="trainer",
                phone="+91-9876543221",
                organization=fg_org,
            ),
        )
        if user_created:
            trainer_pb_user.set_password(PASSWORD)
            trainer_pb_user.save()

        trainer_pb, _ = Trainer.objects.get_or_create(
            user=trainer_pb_user,
            defaults=dict(
                organization=fg_org,
                branch=branch_pb,
                specialization="Strength & Conditioning",
                bio="10+ years of experience in powerlifting and functional training",
                qualifications="NSCA-CSCS, CrossFit Level 2",
                years_of_experience=10,
                hourly_rate=600,
                max_members=40,
            ),
        )

        trainer_ch_user, user_created = User.objects.get_or_create(
            username="trainer_ch",
            defaults=dict(
                email="trainer.ch@fitnessgym.com",
                first_name="Priyanka",
                last_name="Chopra",
                role="trainer",
                phone="+91-9876543222",
                organization=fg_org,
            ),
        )
        if user_created:
            trainer_ch_user.set_password(PASSWORD)
            trainer_ch_user.save()

        trainer_ch, _ = Trainer.objects.get_or_create(
            user=trainer_ch_user,
            defaults=dict(
                organization=fg_org,
                branch=branch_ch,
                specialization="Yoga & Flexibility",
                bio="Certified yoga instructor with expertise in Hatha and Vinyasa",
                qualifications="RYT-500, ACE Certified",
                years_of_experience=8,
                hourly_rate=500,
                max_members=35,
            ),
        )
        self.stdout.write("  [OK] Trainers created: Gurpreet (Punjab) & Priyanka (Chandigarh)")

        # ── 8. Receptionists ──
        reception_pb_user, user_created = User.objects.get_or_create(
            username="reception_pb",
            defaults=dict(
                email="reception.pb@fitnessgym.com",
                first_name="Aman",
                last_name="Verma",
                role="receptionist",
                phone="+91-9876543231",
                organization=fg_org,
            ),
        )
        if user_created:
            reception_pb_user.set_password(PASSWORD)
            reception_pb_user.save()

        ReceptionistProfile.objects.get_or_create(
            user=reception_pb_user,
            defaults=dict(branch=branch_pb),
        )

        reception_ch_user, user_created = User.objects.get_or_create(
            username="reception_ch",
            defaults=dict(
                email="reception.ch@fitnessgym.com",
                first_name="Neha",
                last_name="Gupta",
                role="receptionist",
                phone="+91-9876543232",
                organization=fg_org,
            ),
        )
        if user_created:
            reception_ch_user.set_password(PASSWORD)
            reception_ch_user.save()

        ReceptionistProfile.objects.get_or_create(
            user=reception_ch_user,
            defaults=dict(branch=branch_ch),
        )
        self.stdout.write("  [OK] Receptionists created: Aman (Punjab) & Neha (Chandigarh)")

        # ── 9. Membership Plans ──
        monthly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=fg_org,
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
            organization=fg_org,
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
            organization=fg_org,
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

        # ── 10. PT Packages ──
        pt_5, _ = PTPackage.objects.get_or_create(
            organization=fg_org,
            name="5 Sessions + 1 Free",
            defaults=dict(
                description="Get 1 session free with this pack",
                number_of_sessions=6,
                validity_days=30,
                price=1500,
            ),
        )
        pt_10, _ = PTPackage.objects.get_or_create(
            organization=fg_org,
            name="10 Sessions Pack",
            defaults=dict(
                description="Economical pack for regular training",
                number_of_sessions=10,
                validity_days=45,
                price=2500,
            ),
        )
        pt_20, _ = PTPackage.objects.get_or_create(
            organization=fg_org,
            name="20 Sessions Pack",
            defaults=dict(
                description="Best value for dedicated trainees",
                number_of_sessions=20,
                validity_days=60,
                price=4000,
            ),
        )
        self.stdout.write("  [OK] PT Packages created")

        # ── 11. Members (5 per branch) ──
        today = date.today()

        pb_members_data = [
            {"username": "member_pb1", "first": "Raj", "last": "Sharma", "email": "raj.sharma@email.com", "gender": "male", "phone": "+91-9812345601", "emergency_name": "Sita Sharma", "emergency_phone": "+91-9812345601"},
            {"username": "member_pb2", "first": "Simran", "last": "Kaur", "email": "simran.kaur@email.com", "gender": "female", "phone": "+91-9812345602", "emergency_name": "Gurpreet Kaur", "emergency_phone": "+91-9812345602"},
            {"username": "member_pb3", "first": "Vikram", "last": "Singh", "email": "vikram.singh@email.com", "gender": "male", "phone": "+91-9812345603", "emergency_name": "Harpreet Singh", "emergency_phone": "+91-9812345603"},
            {"username": "member_pb4", "first": "Riya", "last": "Arora", "email": "riya.arora@email.com", "gender": "female", "phone": "+91-9812345604", "emergency_name": "Pooja Arora", "emergency_phone": "+91-9812345604"},
            {"username": "member_pb5", "first": "Amrit", "last": "Sethi", "email": "amrit.sethi@email.com", "gender": "male", "phone": "+91-9812345605", "emergency_name": "Kiran Sethi", "emergency_phone": "+91-9812345605"},
        ]

        ch_members_data = [
            {"username": "member_ch1", "first": "Amit", "last": "Verma", "email": "amit.verma@email.com", "gender": "male", "phone": "+91-9812345701", "emergency_name": "Sunita Verma", "emergency_phone": "+91-9812345701"},
            {"username": "member_ch2", "first": "Divya", "last": "Sharma", "email": "divya.sharma@email.com", "gender": "female", "phone": "+91-9812345702", "emergency_name": "Ravi Sharma", "emergency_phone": "+91-9812345702"},
            {"username": "member_ch3", "first": "Rohit", "last": "Kapoor", "email": "rohit.kapoor@email.com", "gender": "male", "phone": "+91-9812345703", "emergency_name": "Meera Kapoor", "emergency_phone": "+91-9812345703"},
            {"username": "member_ch4", "first": "Neha", "last": "Malhotra", "email": "neha.malhotra@email.com", "gender": "female", "phone": "+91-9812345704", "emergency_name": "Anil Malhotra", "emergency_phone": "+91-9812345704"},
            {"username": "member_ch5", "first": "Gaurav", "last": "Thakur", "email": "gaurav.thakur@email.com", "gender": "male", "phone": "+91-9812345705", "emergency_name": "Poonam Thakur", "emergency_phone": "+91-9812345705"},
        ]

        plans_by_branch = {
            branch_pb.id: {"plan": yearly_plan, "price": 15999, "start_offset": 30, "end_offset": 335},
            branch_ch.id: {"plan": quarterly_plan, "price": 4999, "start_offset": 60, "end_offset": 30},
        }

        def create_member(data, branch, trainer):
            user, user_created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "first_name": data["first"],
                    "last_name": data["last"],
                    "role": "member",
                    "phone": data["phone"],
                    "organization": fg_org,
                },
            )
            if user_created:
                user.set_password(PASSWORD)
                user.save()

            member, _ = Member.objects.get_or_create(
                user=user,
                defaults={
                    "organization": fg_org,
                    "branch": branch,
                    "gender": data["gender"],
                    "emergency_contact_name": data["emergency_name"],
                    "emergency_contact_phone": data["emergency_phone"],
                    "membership_status": "active",
                    "membership_start_date": today - timedelta(days=plans_by_branch[branch.id]["start_offset"]),
                    "membership_end_date": today + timedelta(days=plans_by_branch[branch.id]["end_offset"]),
                    "assigned_trainer": trainer,
                },
            )

            MemberMembership.objects.get_or_create(
                member=member,
                plan=plans_by_branch[branch.id]["plan"],
                start_date=today - timedelta(days=plans_by_branch[branch.id]["start_offset"]),
                end_date=today + timedelta(days=plans_by_branch[branch.id]["end_offset"]),
                amount_paid=plans_by_branch[branch.id]["price"],
                defaults={"is_active": True, "organization": fg_org},
            )

            return member

        pb_members = []
        for m in pb_members_data:
            pb_members.append(create_member(m, branch_pb, trainer_pb))
        ch_members = []
        for m in ch_members_data:
            ch_members.append(create_member(m, branch_ch, trainer_ch))
        self.stdout.write("  [OK] Members created: 5 Punjab + 5 Chandigarh")

        # ── 12. PT Memberships (2 per branch) ──
        pt_pb_membership1, _ = PTMembership.objects.get_or_create(
            member=pb_members[0],
            package=pt_10,
            trainer=trainer_pb,
            start_date=today - timedelta(days=20),
            defaults=dict(
                organization=fg_org,
                sessions_total=10,
                sessions_used=3,
                sessions_remaining=7,
                end_date=today + timedelta(days=25),
                amount_paid=2500,
                is_active=True,
            ),
        )
        pt_pb_membership2, _ = PTMembership.objects.get_or_create(
            member=pb_members[1],
            package=pt_5,
            trainer=trainer_pb,
            start_date=today - timedelta(days=15),
            defaults=dict(
                organization=fg_org,
                sessions_total=6,
                sessions_used=2,
                sessions_remaining=4,
                end_date=today + timedelta(days=15),
                amount_paid=1500,
                is_active=True,
            ),
        )
        pt_ch_membership1, _ = PTMembership.objects.get_or_create(
            member=ch_members[0],
            package=pt_10,
            trainer=trainer_ch,
            start_date=today - timedelta(days=25),
            defaults=dict(
                organization=fg_org,
                sessions_total=10,
                sessions_used=4,
                sessions_remaining=6,
                end_date=today + timedelta(days=20),
                amount_paid=2500,
                is_active=True,
            ),
        )
        pt_ch_membership2, _ = PTMembership.objects.get_or_create(
            member=ch_members[1],
            package=pt_20,
            trainer=trainer_ch,
            start_date=today - timedelta(days=10),
            defaults=dict(
                organization=fg_org,
                sessions_total=20,
                sessions_used=1,
                sessions_remaining=19,
                end_date=today + timedelta(days=50),
                amount_paid=4000,
                is_active=True,
            ),
        )
        self.stdout.write("  [OK] PT Memberships created (2 per branch)")

        # ── 13. PT Sessions ──
        pt_session_data = [
            # Punjab PT membership 1 sessions
            (pt_pb_membership1, pb_members[0], trainer_pb, branch_pb, today - timedelta(days=18), time(9, 0), 60, "completed", "Focus on compound lifts. Good form on squats.", 4),
            (pt_pb_membership1, pb_members[0], trainer_pb, branch_pb, today - timedelta(days=15), time(9, 0), 60, "completed", "Increased deadlift by 5kg. Core work done.", 5),
            (pt_pb_membership1, pb_members[0], trainer_pb, branch_pb, today - timedelta(days=10), time(9, 0), 60, "completed", "Upper body push day. Bench press 60kg.", 4),
            (pt_pb_membership1, pb_members[0], trainer_pb, branch_pb, today + timedelta(days=2), time(9, 0), 60, "scheduled", "", None),
            # Punjab PT membership 2 sessions
            (pt_pb_membership2, pb_members[1], trainer_pb, branch_pb, today - timedelta(days=12), time(7, 0), 45, "completed", "HIIT session. Good endurance improvement.", 4),
            (pt_pb_membership2, pb_members[1], trainer_pb, branch_pb, today - timedelta(days=7), time(7, 0), 45, "completed", "Agility drills and plyometrics.", 5),
            (pt_pb_membership2, pb_members[1], trainer_pb, branch_pb, today + timedelta(days=3), time(7, 0), 45, "scheduled", "", None),
            # Chandigarh PT membership 1 sessions
            (pt_ch_membership1, ch_members[0], trainer_ch, branch_ch, today - timedelta(days=22), time(8, 0), 60, "completed", "Vinyasa flow sequence. Improved flexibility.", 5),
            (pt_ch_membership1, ch_members[0], trainer_ch, branch_ch, today - timedelta(days=18), time(8, 0), 60, "completed", "Power yoga session. Strong core engagement.", 4),
            (pt_ch_membership1, ch_members[0], trainer_ch, branch_ch, today - timedelta(days=14), time(8, 0), 60, "completed", "Restorative yoga. Stress relief focus.", 5),
            (pt_ch_membership1, ch_members[0], trainer_ch, branch_ch, today - timedelta(days=10), time(8, 0), 60, "completed", "Advanced asanas. Headstand practice.", 4),
            (pt_ch_membership1, ch_members[0], trainer_ch, branch_ch, today + timedelta(days=1), time(8, 0), 60, "scheduled", "", None),
            # Chandigarh PT membership 2 sessions
            (pt_ch_membership2, ch_members[1], trainer_ch, branch_ch, today - timedelta(days=6), time(17, 0), 60, "completed", "Mixed martial arts conditioning.", 4),
            (pt_ch_membership2, ch_members[1], trainer_ch, branch_ch, today + timedelta(days=4), time(17, 0), 60, "scheduled", "", None),
        ]

        for pm, mem, tr, br, sched_date, sched_time, duration, status, notes, rating in pt_session_data:
            PTSession.objects.get_or_create(
                pt_membership=pm,
                member=mem,
                trainer=tr,
                scheduled_date=sched_date,
                scheduled_time=sched_time,
                defaults=dict(
                    organization=fg_org,
                    branch=br,
                    duration_minutes=duration,
                    status=status,
                    progress_notes=notes,
                    rating=rating if status == "completed" else None,
                    completed_at=timezone.make_aware(datetime.combine(sched_date, sched_time)) if status == "completed" else None,
                ),
            )

        self.stdout.write("  [OK] PT Sessions created (14 total)")

        # ── 14. Attendance Logs (7 days for all members) ──
        all_members = pb_members + ch_members
        reception_users = {"reception_pb": reception_pb_user, "reception_ch": reception_ch_user}

        for member in all_members:
            member_branch = member.branch
            reception_user = reception_users["reception_pb"] if member_branch.id == branch_pb.id else reception_users["reception_ch"]
            for day_ago in range(7):
                check_in_date = today - timedelta(days=day_ago)
                if check_in_date.weekday() >= 5:
                    continue
                random_hour = random.randint(6, 10)
                check_in_time = timezone.make_aware(
                    datetime.combine(check_in_date, time(random_hour, random.randint(0, 59)))
                )
                method = random.choice(["qr", "qr", "manual"])
                AttendanceLog.objects.get_or_create(
                    member=member,
                    branch=member_branch,
                    check_in_time=check_in_time,
                    check_in_method=method,
                    defaults={
                        "organization": fg_org,
                        "marked_by": reception_user if method == "manual" else None,
                        "session_type": "regular",
                    },
                )

        self.stdout.write("  [OK] Attendance logs created (~60 entries)")

        # ── 15. Payments ──
        for member in all_members:
            branch = member.branch
            reception_user = reception_users["reception_pb"] if branch.id == branch_pb.id else reception_users["reception_ch"]
            plan_info = plans_by_branch[branch.id]
            amount = plan_info["price"]
            method = random.choice(["cash", "upi", "card"])
            payment_date = today - timedelta(days=plan_info["start_offset"])
            Payment.objects.get_or_create(
                member=member,
                payment_type="membership",
                amount=amount,
                branch=branch,
                organization=fg_org,
                paid_at=timezone.make_aware(datetime.combine(payment_date, time(10, 0))),
                defaults=dict(
                    payment_method=method,
                    status="completed",
                    description=f"{plan_info['plan'].name} membership payment",
                    received_by=reception_user,
                ),
            )

        for ptm, mem, amount_paid in [
            (pt_pb_membership1, pb_members[0], 2500),
            (pt_pb_membership2, pb_members[1], 1500),
            (pt_ch_membership1, ch_members[0], 2500),
            (pt_ch_membership2, ch_members[1], 4000),
        ]:
            branch = mem.branch
            reception_user = reception_users["reception_pb"] if branch.id == branch_pb.id else reception_users["reception_ch"]
            pay_date = ptm.start_date
            Payment.objects.get_or_create(
                member=mem,
                payment_type="pt_package",
                amount=amount_paid,
                branch=branch,
                organization=fg_org,
                paid_at=timezone.make_aware(datetime.combine(pay_date, time(14, 0))),
                defaults=dict(
                    payment_method="upi",
                    status="completed",
                    description=f"{ptm.package.name} PT package payment",
                    received_by=reception_user,
                ),
            )

        self.stdout.write("  [OK] Payments created (membership + PT)")

        # ── 16. Audit Logs ──
        all_users = [super_admin, gym_owner, trainer_pb_user, trainer_ch_user,
                     reception_pb_user, reception_ch_user]
        all_users += [Member.objects.get(user=User.objects.get(username=m["username"])).user
                      for m in pb_members_data + ch_members_data]

        for u in all_users:
            AuditLog.objects.get_or_create(
                user=u,
                action="login",
                entity_type="user",
                entity_id=u.id,
                timestamp=timezone.make_aware(datetime.combine(today - timedelta(days=random.randint(0, 3)), time(9, 0))),
                defaults=dict(organization=fg_org if u.role != "super_admin" else None),
            )

        for member in all_members:
            AuditLog.objects.get_or_create(
                user=gym_owner,
                action="create",
                entity_type="member",
                entity_id=member.id,
                organization=fg_org,
                timestamp=timezone.make_aware(datetime.combine(
                    member.created_at.date() if hasattr(member, 'created_at') and member.created_at else today - timedelta(days=30),
                    time(10, 0),
                )),
            )

        self.stdout.write("  [OK] Audit logs created")

        # ═══════════════════════════════════════════════════════
        # SECOND GYM: Powerhouse Fitness (3 branches)
        # ═══════════════════════════════════════════════════════

        ph_org, created = GymOrganization.objects.get_or_create(
            slug="powerhouse-fitness",
            defaults=dict(
                name="Powerhouse Fitness",
                contact_email="info@powerhousefitness.com",
                contact_phone="+91-9876543100",
                address_line1="1 Fitness Hub",
                city="Mumbai",
                state="Maharashtra",
                postal_code="400001",
                country="IN",
            ),
        )
        self.stdout.write("  [OK] Gym Organization created: Powerhouse Fitness")

        sub, _ = Subscription.objects.get_or_create(
            organization=ph_org,
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
        ph_org.subscription = sub
        ph_org.save(update_fields=["subscription"])

        # Branches
        ph_branch_mum, _ = Branch.objects.get_or_create(
            organization=ph_org,
            name="Andheri West, Mumbai",
            defaults=dict(
                code="PH-MUM", contact_email="andheri@powerhousefitness.com",
                contact_phone="+91-9876543101", address_line1="Andheri West, Near Station",
                city="Mumbai", state="Maharashtra", postal_code="400058", country="IN",
                opening_time="05:30", closing_time="23:00",
            ),
        )
        ph_branch_blr, _ = Branch.objects.get_or_create(
            organization=ph_org,
            name="Koramangala, Bangalore",
            defaults=dict(
                code="PH-BLR", contact_email="koramangala@powerhousefitness.com",
                contact_phone="+91-9876543102", address_line1="Koramangala 1st Block",
                city="Bangalore", state="Karnataka", postal_code="560034", country="IN",
                opening_time="05:00", closing_time="22:30",
            ),
        )
        ph_branch_del, _ = Branch.objects.get_or_create(
            organization=ph_org,
            name="Connaught Place, Delhi",
            defaults=dict(
                code="PH-DEL", contact_email="cp@powerhousefitness.com",
                contact_phone="+91-9876543103", address_line1="Connaught Place, Outer Circle",
                city="New Delhi", state="Delhi", postal_code="110001", country="IN",
                opening_time="06:00", closing_time="22:00",
            ),
        )
        ph_branches = [ph_branch_mum, ph_branch_blr, ph_branch_del]
        self.stdout.write("  [OK] Powerhouse branches created: Mumbai, Bangalore, Delhi")

        # Owner
        ph_owner, user_created = User.objects.get_or_create(
            username="ph_owner",
            defaults=dict(
                email="owner@powerhousefitness.com", first_name="Vikram",
                last_name="Malhotra", role="gym_owner",
                phone="+91-9876543099", organization=ph_org,
            ),
        )
        if user_created:
            ph_owner.set_password(PASSWORD)
            ph_owner.save()
        self.stdout.write("  [OK] Powerhouse Owner created (ph_owner / admin123)")

        # Trainers
        ph_trainers = []
        ph_trainer_data = [
            ("trainer_ph1", "Carlos", "Silva", "trainer.ph1@powerhousefitness.com", "Cardio & HIIT", "Strong cardio specialist", "ACSM-CEP, ACE Certified", 9, 500),
            ("trainer_ph2", "Meera", "Iyer", "trainer.ph2@powerhousefitness.com", "CrossFit & Strength", "CrossFit Level 3 coach", "CF-L3, NSCA-CSCS", 6, 550),
            ("trainer_ph3", "Rohan", "Mehta", "trainer.ph3@powerhousefitness.com", "Zumba & Dance Fitness", "High-energy dance fitness instructor", "ZIN, ACE Group Fitness", 5, 400),
        ]
        for i, (uname, fn, ln, email, spec, bio, quals, exp, rate) in enumerate(ph_trainer_data):
            u, uc = User.objects.get_or_create(
                username=uname,
                defaults=dict(email=email, first_name=fn, last_name=ln, role="trainer", phone=f"+91-9876543{100+i}", organization=ph_org),
            )
            if uc:
                u.set_password(PASSWORD)
                u.save()
            t, _ = Trainer.objects.get_or_create(
                user=u,
                defaults=dict(
                    organization=ph_org, branch=ph_branches[i],
                    specialization=spec, bio=bio, qualifications=quals,
                    years_of_experience=exp, hourly_rate=rate, max_members=30,
                ),
            )
            ph_trainers.append(t)

        self.stdout.write("  [OK] Powerhouse Trainers created: Carlos (Mumbai), Meera (Bangalore), Rohan (Delhi)")

        # Receptionists
        ph_receptionists = []
        ph_reception_data = [
            ("reception_ph1", "Anita", "Sharma", "reception.ph1@powerhousefitness.com"),
            ("reception_ph2", "Kabir", "Singh", "reception.ph2@powerhousefitness.com"),
            ("reception_ph3", "Sneha", "Reddy", "reception.ph3@powerhousefitness.com"),
        ]
        for i, (uname, fn, ln, email) in enumerate(ph_reception_data):
            u, uc = User.objects.get_or_create(
                username=uname,
                defaults=dict(email=email, first_name=fn, last_name=ln, role="receptionist", phone=f"+91-9876543{200+i}", organization=ph_org),
            )
            if uc:
                u.set_password(PASSWORD)
                u.save()
            rp, _ = ReceptionistProfile.objects.get_or_create(user=u, defaults=dict(branch=ph_branches[i]))
            ph_receptionists.append(u)

        self.stdout.write("  [OK] Powerhouse Receptionists created")

        # Membership Plans
        MembershipPlan.objects.get_or_create(
            organization=ph_org, name="Monthly Unlimited",
            defaults=dict(description="Full access to all equipment and classes", duration="monthly", duration_days=30, price=2499, billing_cycle="one_time"),
        )
        MembershipPlan.objects.get_or_create(
            organization=ph_org, name="Quarterly Unlimited",
            defaults=dict(description="Best value — 3 months full access", duration="quarterly", duration_days=90, price=5999, billing_cycle="one_time"),
        )
        ph_yearly_plan, _ = MembershipPlan.objects.get_or_create(
            organization=ph_org, name="Yearly Unlimited",
            defaults=dict(description="Full year at the best rate", duration="yearly", duration_days=365, price=17999, billing_cycle="one_time"),
        )

        # PT Packages
        PTPackage.objects.get_or_create(organization=ph_org, name="5 Sessions Pack", defaults=dict(number_of_sessions=5, validity_days=30, price=2000, description="Perfect starter pack"))
        PTPackage.objects.get_or_create(organization=ph_org, name="10 Sessions Pack", defaults=dict(number_of_sessions=10, validity_days=45, price=3500, description="Popular choice"))
        ph_pt_20, _ = PTPackage.objects.get_or_create(organization=ph_org, name="20 Sessions Pack", defaults=dict(number_of_sessions=20, validity_days=60, price=5500, description="Best value"))

        self.stdout.write("  [OK] Powerhouse membership plans & PT packages created")

        # Members (4 per branch = 12 total)
        ph_members_data = {
            0: [  # Mumbai
                {"username": "ph_member1", "first": "Akash", "last": "Patel", "email": "akash.patel@email.com", "phone": "+91-9988776601", "gender": "male", "ename": "Sonal Patel", "ephone": "+91-9988776601"},
                {"username": "ph_member2", "first": "Isha", "last": "Shah", "email": "isha.shah@email.com", "phone": "+91-9988776602", "gender": "female", "ename": "Raj Shah", "ephone": "+91-9988776602"},
                {"username": "ph_member3", "first": "Ravi", "last": "Desai", "email": "ravi.desai@email.com", "phone": "+91-9988776603", "gender": "male", "ename": "Neha Desai", "ephone": "+91-9988776603"},
                {"username": "ph_member4", "first": "Tina", "last": "Jain", "email": "tina.jain@email.com", "phone": "+91-9988776604", "gender": "female", "ename": "Anil Jain", "ephone": "+91-9988776604"},
            ],
            1: [  # Bangalore
                {"username": "ph_member5", "first": "Varun", "last": "Nair", "email": "varun.nair@email.com", "phone": "+91-9988776605", "gender": "male", "ename": "Devi Nair", "ephone": "+91-9988776605"},
                {"username": "ph_member6", "first": "Priya", "last": "Rao", "email": "priya.rao@email.com", "phone": "+91-9988776606", "gender": "female", "ename": "Krishna Rao", "ephone": "+91-9988776606"},
                {"username": "ph_member7", "first": "Deep", "last": "Kohli", "email": "deep.kohli@email.com", "phone": "+91-9988776607", "gender": "male", "ename": "Asha Kohli", "ephone": "+91-9988776607"},
                {"username": "ph_member8", "first": "Anu", "last": "Pillai", "email": "anu.pillai@email.com", "phone": "+91-9988776608", "gender": "female", "ename": "Mohan Pillai", "ephone": "+91-9988776608"},
            ],
            2: [  # Delhi
                {"username": "ph_member9", "first": "Karan", "last": "Bajaj", "email": "karan.bajaj@email.com", "phone": "+91-9988776609", "gender": "male", "ename": "Sunita Bajaj", "ephone": "+91-9988776609"},
                {"username": "ph_member10", "first": "Nidhi", "last": "Agarwal", "email": "nidhi.agarwal@email.com", "phone": "+91-9988776610", "gender": "female", "ename": "Rohit Agarwal", "ephone": "+91-9988776610"},
                {"username": "ph_member11", "first": "Manish", "last": "Khanna", "email": "manish.khanna@email.com", "phone": "+91-9988776611", "gender": "male", "ename": "Kavita Khanna", "ephone": "+91-9988776611"},
                {"username": "ph_member12", "first": "Pooja", "last": "Saxena", "email": "pooja.saxena@email.com", "phone": "+91-9988776612", "gender": "female", "ename": "Raj Saxena", "ephone": "+91-9988776612"},
            ],
        }

        ph_all_members = []
        for bi, members in ph_members_data.items():
            br = ph_branches[bi]
            tr = ph_trainers[bi]
            for m in members:
                u, uc = User.objects.get_or_create(
                    username=m["username"],
                    defaults=dict(email=m["email"], first_name=m["first"], last_name=m["last"], role="member", phone=m["phone"], organization=ph_org),
                )
                if uc:
                    u.set_password(PASSWORD)
                    u.save()
                mem, _ = Member.objects.get_or_create(
                    user=u,
                    defaults=dict(
                        organization=ph_org, branch=br, gender=m["gender"],
                        emergency_contact_name=m["ename"], emergency_contact_phone=m["ephone"],
                        membership_status="active",
                        membership_start_date=today - timedelta(days=45),
                        membership_end_date=today + timedelta(days=320),
                        assigned_trainer=tr,
                    ),
                )
                MemberMembership.objects.get_or_create(
                    member=mem, plan=ph_yearly_plan,
                    start_date=today - timedelta(days=45),
                    end_date=today + timedelta(days=320),
                    amount_paid=17999, defaults={"is_active": True, "organization": ph_org},
                )
                ph_all_members.append(mem)

        self.stdout.write("  [OK] Powerhouse members created: 4 per branch (12 total)")

        # PT Memberships & Sessions (1 per branch)
        for bi, br in enumerate(ph_branches):
            tr = ph_trainers[bi]
            mem = ph_all_members[bi * 4]
            ptm, _ = PTMembership.objects.get_or_create(
                member=mem, package=ph_pt_20, trainer=tr,
                start_date=today - timedelta(days=15),
                defaults=dict(
                    organization=ph_org,
                    sessions_total=20, sessions_used=2, sessions_remaining=18,
                    end_date=today + timedelta(days=45), amount_paid=5500, is_active=True,
                ),
            )
            for d in range(2):
                sd = today - timedelta(days=15 - d * 5)
                PTSession.objects.get_or_create(
                    pt_membership=ptm, member=mem, trainer=tr,
                    scheduled_date=sd, scheduled_time=time(8, 0),
                    defaults=dict(
                        organization=ph_org,
                        branch=br, duration_minutes=60, status="completed",
                        progress_notes=f"Session {d+1} - Good progress.",
                        rating=5, completed_at=timezone.make_aware(datetime.combine(sd, time(8, 30))),
                    ),
                )

        self.stdout.write("  [OK] Powerhouse PT data created")

        # Attendance (5 days)
        for mem in ph_all_members:
            br = mem.branch
            ri = ph_branches.index(br)
            reception_user = ph_receptionists[ri]
            for day_ago in range(5):
                cd = today - timedelta(days=day_ago)
                if cd.weekday() >= 5:
                    continue
                ct = timezone.make_aware(datetime.combine(cd, time(random.randint(6, 10), random.randint(0, 59))))
                method = random.choice(["qr", "qr", "manual"])
                AttendanceLog.objects.get_or_create(
                    member=mem, branch=br, check_in_time=ct, check_in_method=method,
                    defaults={"organization": ph_org, "marked_by": reception_user if method == "manual" else None, "session_type": "regular"},
                )

        self.stdout.write("  [OK] Powerhouse attendance logs created")

        # Payments
        for bi, br in enumerate(ph_branches):
            reception_user = ph_receptionists[bi]
            for mi in range(4):
                mem = ph_all_members[bi * 4 + mi]
                Payment.objects.get_or_create(
                    member=mem, payment_type="membership", amount=17999, branch=br, organization=ph_org,
                    paid_at=timezone.make_aware(datetime.combine(today - timedelta(days=45), time(10, 0))),
                    defaults=dict(payment_method="cash", status="completed", description="Yearly Unlimited membership", received_by=reception_user),
                )

        self.stdout.write("  [OK] Powerhouse payments created")

        # Audit logs
        ph_users = [ph_owner] + [Trainer.objects.get(user=User.objects.get(username=uname)).user for uname, *_ in ph_trainer_data]
        ph_users += ph_receptionists
        for mem in ph_all_members:
            ph_users.append(mem.user)
        for u in ph_users:
            AuditLog.objects.get_or_create(
                user=u, action="login", entity_type="user", entity_id=u.id,
                timestamp=timezone.make_aware(datetime.combine(today - timedelta(days=random.randint(0, 3)), time(9, 0))),
                defaults=dict(organization=ph_org),
            )
        for mem in ph_all_members:
            AuditLog.objects.get_or_create(
                user=ph_owner, action="create", entity_type="member", entity_id=mem.id, organization=ph_org,
                timestamp=timezone.make_aware(datetime.combine(today - timedelta(days=45), time(10, 0))),
            )

        self.stdout.write("  [OK] Powerhouse audit logs created")

        # ── 17. Notification Templates & Preferences ──
        wa_templates = [
            ("Membership Expiry Reminder", "membership_expiry", "Hi {name}, your {plan} is expiring in {days} day(s) on {end_date}. Please renew to continue enjoying our services."),
            ("Payment Due Reminder", "payment_due", "Hi {name}, payment of {amount} (Invoice: {invoice}) is due on {due_date}. Please pay at your earliest convenience."),
            ("PT Session Reminder", "pt_session_reminder", "Hi {name}, you have a PT session with {trainer} on {date} at {time}. See you there!"),
            ("Gym Announcement", "announcement", "Announcement: {message}"),
            ("Staff Invite", "staff_invite", "Hi {name}, you have been invited to join {organization} as {role}. Welcome aboard!"),
            ("Welcome", "welcome", "Welcome to {organization}, {name}! We are excited to have you with us."),
        ]

        for org in [fg_org, ph_org]:
            for name, event, body in wa_templates:
                NotificationTemplate.objects.get_or_create(
                    event=event, channel="whatsapp",
                    defaults=dict(
                        name=name,
                        body_template=body,
                        subject="",
                        channel="whatsapp",
                        is_active=True,
                    ),
                )
            for _, event, _ in wa_templates:
                NotificationPreference.objects.get_or_create(
                    organization=org, event=event, channel="whatsapp",
                    defaults=dict(enabled=True),
                )

        email_templates = [
            ("Welcome Email", "welcome", "Welcome to FitSphere!", "Hi {name},\n\nWelcome to {organization}! We are excited to have you on board.\n\nBest,\nFitSphere Team"),
            ("Staff Invite Email", "staff_invite", "You're invited to join {organization}", "Hi {name},\n\nYou have been invited to join {organization} as {role}. Please check your email to accept the invitation.\n\nBest,\nFitSphere Team"),
        ]
        for org in [fg_org, ph_org]:
            for name, event, subject, body in email_templates:
                NotificationTemplate.objects.get_or_create(
                    event=event, channel="email",
                    defaults=dict(
                        name=name,
                        body_template=body,
                        subject=subject,
                        is_active=True,
                    ),
                )

        self.stdout.write("  [OK] Notification templates & preferences seeded")

        # ── 18. Done ──
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("====== Seed Complete ======"))
        self.stdout.write("")
        self.stdout.write(f"  Super Admin:                         superadmin / {PASSWORD}")
        self.stdout.write(f"  Gym Owner (Fitness Gym):             gymowner / {PASSWORD}")
        self.stdout.write(f"  Trainer:")
        self.stdout.write(f"    - trainer_pb / {PASSWORD} (Sector 119, Punjab)")
        self.stdout.write(f"    - trainer_ch / {PASSWORD} (Sector 34, Chandigarh)")
        self.stdout.write(f"  Receptionist:")
        self.stdout.write(f"    - reception_pb / {PASSWORD} (Sector 119, Punjab)")
        self.stdout.write(f"    - reception_ch / {PASSWORD} (Sector 34, Chandigarh)")
        self.stdout.write(f"  Members (Sector 119, Punjab):        member_pb1 - member_pb5 / {PASSWORD}")
        self.stdout.write(f"  Members (Sector 34, Chandigarh):     member_ch1 - member_ch5 / {PASSWORD}")
        self.stdout.write(f"")
        self.stdout.write(f"  --- Powerhouse Fitness ---")
        self.stdout.write(f"  Gym Owner (Powerhouse Fitness):      ph_owner / {PASSWORD}")
        self.stdout.write(f"  Trainer:")
        self.stdout.write(f"    - trainer_ph1 / {PASSWORD} (Andheri West, Mumbai)")
        self.stdout.write(f"    - trainer_ph2 / {PASSWORD} (Koramangala, Bangalore)")
        self.stdout.write(f"    - trainer_ph3 / {PASSWORD} (Connaught Place, Delhi)")
        self.stdout.write(f"  Receptionist:")
        self.stdout.write(f"    - reception_ph1 / {PASSWORD} (Andheri West, Mumbai)")
        self.stdout.write(f"    - reception_ph2 / {PASSWORD} (Koramangala, Bangalore)")
        self.stdout.write(f"    - reception_ph3 / {PASSWORD} (Connaught Place, Delhi)")
        self.stdout.write(f"  Members (Mumbai):                    ph_member1 - ph_member4 / {PASSWORD}")
        self.stdout.write(f"  Members (Bangalore):                 ph_member5 - ph_member8 / {PASSWORD}")
        self.stdout.write(f"  Members (Delhi):                     ph_member9 - ph_member12 / {PASSWORD}")
        self.stdout.write(f"")
        self.stdout.write(f"  All passwords: {PASSWORD}")
