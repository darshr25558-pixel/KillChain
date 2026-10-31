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


class RepositoryInspect(BaseModel):
    repository_url: str = Field(..., min_length=1, max_length=2048)

    @field_validator("repository_url")
    @classmethod
    def validate_repository_url(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("A public GitHub repository URL is required.")
        return cleaned


class RepositoryScan(BaseModel):
    repository_url: str = Field(..., min_length=1, max_length=2048)
    manifest_path: str = Field(..., min_length=1, max_length=1024)
    name: str = Field(..., min_length=1, max_length=214)
    version: str = Field(..., min_length=1, max_length=128)
    revision: str | None = Field(default=None, max_length=255)

    @field_validator("repository_url")
    @classmethod
    def validate_repository_url(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("A public GitHub repository URL is required.")
        return cleaned

    @field_validator("manifest_path")
    @classmethod
    def validate_manifest_path(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned or "\\" in cleaned or cleaned.startswith("/"):
            raise ValueError("Select a valid repository package.json path.")
        if any(part in ("", ".", "..") for part in cleaned.split("/")):
            raise ValueError("Select a valid repository package.json path.")
        if cleaned.split("/")[-1] != "package.json":
            raise ValueError("The selected manifest must be a package.json file.")
        return cleaned

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return Package.validate_name(value)

    @field_validator("version")
    @classmethod
    def validate_version(cls, value: str) -> str:
        cleaned = Package.validate_version(value)
        if cleaned.casefold() == "latest":
            raise ValueError("Enter an exact published npm version; repository scans never substitute latest.")
        return cleaned

    @field_validator("revision")
    @classmethod
    def validate_revision(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        if len(cleaned) > 255 or any(ord(char) < 32 for char in cleaned):
            raise ValueError("Enter a valid GitHub commit, tag, or branch.")
        return cleaned
