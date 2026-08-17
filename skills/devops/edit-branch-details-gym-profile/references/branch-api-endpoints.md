# Branch API Endpoints

## List/Create branches
- **Endpoint:** `GET /organizations/branches/`
- **List query params:** None required; returns all branches for the authenticated org
- **Create:** `POST /organizations/branches/` — gated to `gym_owner` + `receptionist`
- **Response:** Array of `BranchSerializer` objects (read-only fields: id, organization, created_at, updated_at)

## Branch detail (read)
- **Endpoint:** `GET /organizations/branches/{id}/`
- **Response:** Single `BranchSerializer` object

## Branch update (edit)
- **Endpoint:** `PATCH /organizations/branches/{id}/`
- **Permission:** `gym_owner` or `receptionist`
- **Payload:** Any writable field from the `BranchSerializer`:
  - `name`, `contact_email`, `contact_phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `is_active`
- **Example PATCH:**
  ```json
  {"name": "New Branch Name", "contact_email": "new@gym.com", "is_active": false}
  ```

## Branch delete
- **Endpoint:** `DELETE /organizations/branches/{id}/`
- **Permission:** `gym_owner` or `super_admin`
- **Note:** Deleting a branch is tenant-destructive (removes associated data)

**Auth:** All endpoints require JWT authentication. The `beforeLoad` guard on the dashboard route only checks `access_token` — real permission enforcement happens in the backend views.
