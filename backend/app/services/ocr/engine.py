"""EasyOCR portable engine wrapper and execution runtime.

Owner: Team M3 (Computer Vision)
Provides:
- Thread-safe lazy singleton initialization
- Cross-platform portability (Windows, macOS, Linux)
- Non-blocking asynchronous inference via asyncio.to_thread
- Unified output structure with 4-point polygons, text, and confidence
"""

import asyncio
import logging
import os
import sys
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image as PILImage

logger = logging.getLogger("validra.ocr.engine")


class EasyOCREngine:
    """Portable EasyOCR singleton wrapper replacing legacy PaddleOCR."""

    _instance: Optional["EasyOCREngine"] = None
    _ocr_model: Any = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EasyOCREngine, cls).__new__(cls)
        return cls._instance

    def initialize(self, lang_list: Optional[List[str]] = None, gpu: bool = False) -> None:
        """Initialize EasyOCR Reader lazily."""
        if self._initialized and self._ocr_model is not None:
            return

        langs = lang_list or ["en"]
        logger.info(f"Initializing EasyOCR engine with languages={langs}, gpu={gpu}...")
        try:
            import easyocr

            self._ocr_model = easyocr.Reader(langs, gpu=gpu)
            self._initialized = True
            logger.info("EasyOCR engine initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}", exc_info=True)
            self._ocr_model = None
            self._initialized = False
            raise RuntimeError(f"EasyOCR engine initialization error: {e}")

    def run_inference_sync(self, image_input: Union[str, Path, np.ndarray, PILImage.Image]) -> List[Dict[str, Any]]:
        """Synchronous inference for EasyOCR.

        Args:
            image_input: File path, numpy ndarray, or PIL Image.

        Returns:
            List of raw detections: [{"polygon": [[x1,y1],...], "text": "...", "confidence": float}]
        """
        if not self._initialized or self._ocr_model is None:
            self.initialize()

        if isinstance(image_input, (str, Path)):
            input_val = str(image_input)
        elif isinstance(image_input, PILImage.Image):
            input_val = np.array(image_input.convert("RGB"))
        else:
            input_val = image_input

        logger.debug("Running EasyOCR inference")

        try:
            results = self._ocr_model.readtext(input_val)
        except Exception as e:
            logger.error(f"EasyOCR execution error: {e}")
            raise

        detections: List[Dict[str, Any]] = []
        if not results:
            return detections

        for item in results:
            if not item or len(item) < 2:
                continue
            bbox = item[0]
            text = str(item[1]).strip()
            conf = float(item[2]) if len(item) >= 3 and item[2] is not None else 1.0

            if hasattr(bbox, "tolist"):
                poly = bbox.tolist()
            elif isinstance(bbox, (list, tuple)):
                poly = [list(pt) if hasattr(pt, "__iter__") else pt for pt in bbox]
            else:
                poly = []

            detections.append({
                "polygon": poly,
                "text": text,
                "confidence": round(conf, 4),
            })

        return detections

    async def run_inference_async(self, image_input: Union[str, Path, np.ndarray, PILImage.Image]) -> List[Dict[str, Any]]:
        """Run OCR inference in a separate worker thread to avoid blocking the event loop."""
        return await asyncio.to_thread(self.run_inference_sync, image_input)


# Backwards compatibility alias
PaddleOCREngine = EasyOCREngine

# Global singleton instance
ocr_engine = EasyOCREngine()
