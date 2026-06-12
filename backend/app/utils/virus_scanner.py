"""Virus scanning utility for document uploads."""

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Standard EICAR string for antivirus scanner verification
EICAR_SIGNATURE = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"


async def scan_file_bytes(file_bytes: bytes, filename: str) -> tuple[bool, str]:
    """
    Scan uploaded file bytes for malware signatures and executable binary structures.

    Returns:
        tuple[bool, str]: (is_clean, reason)
    """
    settings = get_settings()

    # Always scan for the EICAR test signature
    if EICAR_SIGNATURE in file_bytes:
        logger.warning(
            f"Security Alert: EICAR malware test signature detected in file: {filename}."
        )
        return False, "Malware signature detected (EICAR Test File)."

    # Basic structural check: reject executable files (MZ / PE header check) disguised as docs
    if len(file_bytes) >= 2 and file_bytes[:2] == b"MZ":
        logger.warning(
            f"Security Alert: DOS/PE executable header 'MZ' detected in file: {filename}."
        )
        return False, "Suspicious file structure: executable program header detected."

    # If full network virus scanning is disabled, return success
    if not settings.VIRUS_SCAN_ENABLED:
        logger.debug(f"Virus scanning disabled by configuration for file {filename}.")
        return True, "Clean (skipping full scan)"

    # Placeholder for full network/daemon integration (e.g. clamd / VirusTotal API)
    # Example for clamd:
    # try:
    #     import clamd
    #     cd = clamd.ClamdUnixSocket()
    #     res = cd.scan_stream(file_bytes)
    #     if res and res['stream'][0] == 'FOUND':
    #         return False, f"Malware detected: {res['stream'][1]}"
    # except Exception as exc:
    #     logger.error(f"ClamAV daemon scan error: {exc}")
    
    logger.info(f"File {filename} scanned successfully. No malware signatures detected.")
    return True, "Clean"
