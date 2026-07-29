import django
django.setup()

from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

user = User.objects.filter(email='anshupersonal2471@gmail.com').first()
if user:
    print(f"User already exists: {user.email} (id={user.id})")
else:
    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, role, phone, photo, organization_id, avatar)
            VALUES ('', NULL, FALSE, 'anshu_test', 'Anshu', 'Test', 'anshupersonal2471@gmail.com', FALSE, TRUE, NOW(), 'member', '', NULL, NULL, 'default')
        """)
    user = User.objects.get(email='anshupersonal2471@gmail.com')
    user.set_password('test1234')
    user.save(update_fields=['password'])
    print(f"Created user: {user.email} (id={user.id})")
