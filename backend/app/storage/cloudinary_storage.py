"""Cloudinary storage backend for EduQuiz AI file uploads."""

import asyncio
from functools import partial

import cloudinary
import cloudinary.uploader

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Configure Cloudinary on module import
_settings = get_settings()
cloudinary.config(
    cloud_name=_settings.CLOUDINARY_CLOUD_NAME,
    api_key=_settings.CLOUDINARY_API_KEY,
    api_secret=_settings.CLOUDINARY_API_SECRET,
    secure=True,
)


class CloudinaryStorage:
    """Async wrapper around the Cloudinary upload/delete SDK methods."""

    async def upload_file(
        self,
        file_bytes: bytes,
        user_id: str,
        filename: str,
        resource_type: str = "raw",
    ) -> str:
        """
        Upload a file to Cloudinary under ``eduquiz/<user_id>/``.

        Args:
            file_bytes:    Raw bytes of the file to upload.
            user_id:       Owning user UUID (used as a folder path segment).
            filename:      Original filename (used as the public_id stem).
            resource_type: Cloudinary resource type ('raw' for documents, 'image' for images).

        Returns:
            The secure Cloudinary URL of the uploaded file.
        """
        folder = f"eduquiz/{user_id}"
        # Strip extension from filename for public_id
        stem = filename.rsplit(".", 1)[0] if "." in filename else filename

        loop = asyncio.get_event_loop()
        upload_func = partial(
            cloudinary.uploader.upload,
            file_bytes,
            folder=folder,
            public_id=stem,
            resource_type=resource_type,
            overwrite=True,
        )
        result = await loop.run_in_executor(None, upload_func)
        secure_url: str = result["secure_url"]
        logger.info(f"Uploaded {filename!r} → {secure_url}")
        return secure_url

    async def delete_file(self, public_id: str, resource_type: str = "raw") -> None:
        """
        Delete a file from Cloudinary by its public_id.

        Args:
            public_id:     The Cloudinary public_id of the resource.
            resource_type: 'raw' for documents, 'image' for images.
        """
        loop = asyncio.get_event_loop()
        destroy_func = partial(
            cloudinary.uploader.destroy,
            public_id,
            resource_type=resource_type,
        )
        result = await loop.run_in_executor(None, destroy_func)
        logger.info(f"Deleted Cloudinary resource {public_id!r}: {result}")


# Module-level singleton
storage = CloudinaryStorage()
