import re

from pydantic import BaseModel, Field, field_validator


class Package(BaseModel):
    name: str = Field(..., min_length=1)
    version: str = Field(default="latest", min_length=1)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Package name is required.")
        if not re.fullmatch(r"(?:@[a-z0-9._~-]+/)?[a-z0-9][a-z0-9._~-]*", cleaned):
            raise ValueError("Enter a valid npm package name.")
        return cleaned

    @field_validator("version")
    @classmethod
    def validate_version(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Version is required.")
        if len(cleaned) > 128 or any(ord(char) < 32 for char in cleaned):
            raise ValueError("Enter a valid package version.")
        return cleaned
