"""Cloud OCR engine stub (EasyOCR removed for Vercel deployment).

Owner: Team M3 (Computer Vision)
Note:
- EasyOCR was removed because Vercel uses a read-only filesystem
  and PyTorch cold-start exceeds serverless timeout limits.
- All OCR is now handled by OCR.space cloud API (ocr_service.py).
- This stub preserves the interface so ocr_main.py imports don't break.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional, Union
from pathlib import Path
import numpy as np
from PIL import Image as PILImage

logger = logging.getLogger("validra.ocr.engine")


class CloudOCREngine:
    """Stub engine replacing EasyOCR. OCR is handled by OCR.space API.

    This class preserves the same interface as the former EasyOCREngine
    so that ocr_main.py and other importers don't break. Direct local
    inference is no longer supported — callers should use
    ocr_service.ocr_extract_single() or ocr_extract_panels() instead.
    """

    _instance: Optional["CloudOCREngine"] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CloudOCREngine, cls).__new__(cls)
        return cls._instance

    def initialize(self, lang_list: Optional[List[str]] = None, gpu: bool = False) -> None:
        """No-op initializer (OCR.space needs no local model loading)."""
        if self._initialized:
            return
        self._initialized = True
        logger.info("CloudOCREngine initialized (OCR handled by OCR.space API).")

    def run_inference_sync(self, image_input: Union[str, Path, np.ndarray, PILImage.Image]) -> List[Dict[str, Any]]:
        """Local inference is not supported on Vercel (read-only FS).

        Returns an empty list and logs a warning. Callers should use
        ocr_service.ocr_extract_single() for cloud-based OCR.
        """
        logger.warning(
            "CloudOCREngine.run_inference_sync() called but local OCR is disabled. "
            "Use OCR.space API via ocr_service instead."
        )
        return []

    async def run_inference_async(self, image_input: Union[str, Path, np.ndarray, PILImage.Image]) -> List[Dict[str, Any]]:
        """Async wrapper — delegates to sync stub."""
        return await asyncio.to_thread(self.run_inference_sync, image_input)


# Backwards compatibility aliases
EasyOCREngine = CloudOCREngine
PaddleOCREngine = CloudOCREngine

# Global singleton instance
ocr_engine = CloudOCREngine()
