"""OCR Service using OCR.space API with EasyOCR fallback.

Handles image pre-processing (downscaling to <= 1024px JPEG) and text extraction
for 1-4 label panel photographs.
Primary: OCR.space cloud API
Fallback: Local EasyOCR (PyTorch-based) if OCR.space fails, times out, or returns empty text.
"""

import io
import logging
from typing import List, Optional, Union
import numpy as np
import requests
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("validra.ocr")

OCR_SPACE_URL = "https://api.ocr.space/parse/image"
MAX_OCR_DIMENSION = 1024
REQUEST_TIMEOUT_SECONDS = 30

ImageSource = Union[str, bytes, bytearray, io.IOBase]


def resize_for_ocr(image_source: ImageSource, max_size: int = MAX_OCR_DIMENSION) -> io.BytesIO:
    """Downscale to <= max_size and re-encode as JPEG to optimize latency and stay under API limits."""
    if isinstance(image_source, (bytes, bytearray)):
        image_source = io.BytesIO(image_source)

    img = Image.open(image_source)
    img = img.convert("RGB")
    img.thumbnail((max_size, max_size))

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return buffer


def easyocr_extract_single(image_source: ImageSource) -> str:
    """Fallback OCR extraction using EasyOCR running locally.
    
    Extracts text lines and joins them into a unified string.
    """
    try:
        from app.services.ocr.engine import ocr_engine

        if isinstance(image_source, (bytes, bytearray)):
            image_source = io.BytesIO(image_source)

        img = Image.open(image_source)
        img = img.convert("RGB")
        img_np = np.array(img)

        detections = ocr_engine.run_inference_sync(img_np)
        lines = [d["text"] for d in detections if d.get("text") and d["text"].strip()]
        extracted = "\n".join(lines).strip()
        logger.info(f"EasyOCR fallback extracted {len(lines)} lines ({len(extracted)} chars).")
        return extracted
    except Exception as exc:
        logger.error(f"EasyOCR fallback extraction failed: {exc}", exc_info=True)
        return ""


def ocr_space_extract_single(image_source: ImageSource) -> Optional[str]:
    """Extract raw text from a single image using OCR.space API."""
    api_key = settings.OCR_SPACE_API_KEY
    if not api_key:
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
        logger.warning(f"OCR.space request failed or timed out: {exc}")
        return None

    if result.get("IsErroredOnProcessing"):
        logger.warning(f"OCR.space API error: {result.get('ErrorMessage')}")
        return None

    parsed = result.get("ParsedResults") or []
    if not parsed:
        logger.warning(f"OCR.space returned no ParsedResults.")
        return None

    text = (parsed[0].get("ParsedText") or "").strip()
    return text or None


def ocr_extract_single(image_source: ImageSource) -> Optional[str]:
    """Extract text from a product label panel with automatic EasyOCR fallback.
    
    Flow:
    1. Attempts primary OCR using OCR.space cloud API.
    2. If OCR.space fails, encounters errors, or returns empty text, triggers EasyOCR locally.
    3. Guarantees non-empty text when readable packaging text is present.
    """
    source_bytes = None
    if isinstance(image_source, io.IOBase):
        try:
            image_source.seek(0)
            source_bytes = image_source.read()
            image_source.seek(0)
        except Exception:
            pass
    elif isinstance(image_source, (bytes, bytearray)):
        source_bytes = bytes(image_source)

    # 1. Primary: OCR.space
    try:
        first_attempt_source = io.BytesIO(source_bytes) if source_bytes else image_source
        text = ocr_space_extract_single(first_attempt_source)
        if text:
            logger.info(f"OCR.space extraction successful ({len(text)} chars).")
            return text
    except Exception as exc:
        logger.warning(f"OCR.space execution threw exception: {exc}")

    # 2. Fallback: EasyOCR local inference
    logger.info("OCR.space unavailable or empty. Triggering EasyOCR fallback...")
    try:
        fallback_source = io.BytesIO(source_bytes) if source_bytes else image_source
        fallback_text = easyocr_extract_single(fallback_source)
        if fallback_text:
            return fallback_text
    except Exception as exc:
        logger.error(f"EasyOCR fallback exception: {exc}")

    return None


def ocr_extract_panels(images: List[ImageSource]) -> str:
    """Extract and concatenate OCR text from multiple product label panels (1-4).
    
    Each panel is processed with OCR.space (falling back to EasyOCR if needed) and concatenated
    with clear separators so downstream Groq LLM extraction can trace declarations across package faces.
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
