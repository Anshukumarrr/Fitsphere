# Branch Model Fields

The `Branch` model (fitsphere/organizations/models.py) has the following fields, all exposed through `BranchSerializer`:

| Field | Type | Backend exposure |
|---|---|---|
| `id` | Integer | Read-only |
| `organization` | ForeignKey(GymOrganization) | Read-only |
| `name` | CharField(max_length=255) | Writable via PATCH |
| `code` | CharField | Read-only |
| `contact_email` | EmailField(blank=True) | Writable via PATCH |
| `contact_phone` | CharField(max_length=20, blank=True) | Writable via PATCH |
| `address_line1` | CharField(max_length=255, blank=True) | Writable via PATCH |
| `address_line2` | CharField(max_length=255, blank=True) | Writable via PATCH |
| `city` | CharField(max_length=100, blank=True) | Writable via PATCH |
| `state` | CharField(max_length=100, blank=True) | Writable via PATCH |
| `postal_code` | CharField(max_length=20, blank=True) | Writable via PATCH |
| `country` | CharField(max_length=100, blank=True, default="IN") | Writable via PATCH |
| `is_active` | BooleanField(default=True) | Writable via PATCH |
| `opening_time` | CharField (HH:MM:SS format, blank=True) | Writable via `BranchHoursDialog` |
| `closing_time` | CharField (HH:MM:SS format, blank=True) | Writable via `BranchHoursDialog` |
| `created_at` | DateTimeField | Read-only |
| `updated_at` | DateTimeField | Read-only |

**API:** `PATCH /organizations/branches/{id}/` with payload of any writable field.
