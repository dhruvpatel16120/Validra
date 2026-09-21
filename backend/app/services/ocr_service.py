"""OCR Service using OCR.space API.

Handles image pre-processing (downscaling to <= 1024px JPEG) and text extraction
for 1-4 label panel photographs.
"""

import io
import logging
from typing import List, Optional, Union
import requests
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("validra.ocr")

OCR_SPACE_URL = "https://api.ocr.space/parse/image"
MAX_OCR_DIMENSION = 1024
REQUEST_TIMEOUT_SECONDS = 60

ImageSource = Union[str, bytes, bytearray, io.IOBase]


def resize_for_ocr(image_source: ImageSource, max_size: int = MAX_OCR_DIMENSION) -> io.BytesIO:
    """Downscale to <= max_size and re-encode as JPEG to optimize latency and stay under API limits."""
    if isinstance(image_source, (bytes, bytearray)):
        image_source = io.BytesIO(image_source)

    img = Image.open(image_source)
    img = img.convert("RGB")  # Convert palette/RGBA to RGB
    img.thumbnail((max_size, max_size))

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return buffer


def ocr_extract_single(image_source: ImageSource) -> Optional[str]:
    """Extract raw text from a single image using OCR.space."""
    api_key = settings.OCR_SPACE_API_KEY
    if not api_key:
        logger.warning("OCR_SPACE_API_KEY not configured. Falling back to default or mock behavior.")
        # Optional fallback public key if user has not set env yet
        api_key = "K83481239088957"

    try:
        resized = resize_for_ocr(image_source)
    except Exception as exc:
        logger.error(f"OCR pre-processing failed: {exc}")
        return None

    try:
        response = requests.post(
            OCR_SPACE_URL,
            files={"file": ("image.jpg", resized, "image/jpeg")},
            data={
                "apikey": api_key,
                "language": "eng",
                "OCREngine": 2,
                "scale": "true",
                "isTable": "false",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        result = response.json()
    except Exception as exc:
        logger.error(f"OCR request failed: {exc}")
        return None

    if result.get("IsErroredOnProcessing"):
        logger.error(f"OCR API error: {result.get('ErrorMessage')}")
        return None

    parsed = result.get("ParsedResults") or []
    if not parsed:
        logger.warning(f"OCR returned no ParsedResults: {str(result)[:300]}")
        return None

    return parsed[0].get("ParsedText") or ""


def ocr_extract_panels(images: List[ImageSource]) -> str:
    """Extract and concatenate OCR text from multiple product label panels (1-4).
    
    Each panel is processed and concatenated with clear separators so downstream
    extraction can trace declarations across package faces.
    """
    if not images:
        return ""

    panel_texts = []
    for index, image in enumerate(images):
        text = ocr_extract_single(image)
        if text:
            cleaned = text.strip()
            if cleaned:
                panel_texts.append(f"--- Panel {index + 1} ---\n{cleaned}")

    return "\n\n".join(panel_texts)
