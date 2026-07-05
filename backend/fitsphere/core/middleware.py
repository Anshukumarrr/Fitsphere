from django.http import HttpResponse


class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
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
        response = self.get_response(request)
        return response
