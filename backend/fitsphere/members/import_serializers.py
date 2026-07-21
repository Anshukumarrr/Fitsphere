from rest_framework import serializers


ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
MAX_FILE_SIZE = 5 * 1024 * 1024


class MemberImportFileSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        name = value.name.lower()
        ext = ""
        for e in ALLOWED_EXTENSIONS:
            if name.endswith(e):
                ext = e
                break
        if not ext:
            raise serializers.ValidationError(
                f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
            )
        return value
