import json

from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        tenant_id = None
        if request.user.is_authenticated and hasattr(request.user, "organization_id"):
            tenant_id = request.user.organization_id
        if tenant_id is None:
            tenant_header = request.headers.get("X-Tenant-ID")
            if tenant_header:
                try:
                    tenant_id = int(tenant_header)
                except (ValueError, TypeError):
                    pass
        request.tenant_id = tenant_id
