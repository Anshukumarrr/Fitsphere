from django.db import models

from ..core.models import TenantAwareModel


class DashboardCache(models.Model):
    organization = models.ForeignKey(
        "organizations.GymOrganization",
        on_delete=models.CASCADE,
        related_name="dashboard_caches",
    )
    cache_key = models.CharField(max_length=255)
    data = models.JSONField()
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dashboard_caches"
        unique_together = ("organization", "cache_key")

    def __str__(self):
        return f"{self.organization.name} - {self.cache_key}"
