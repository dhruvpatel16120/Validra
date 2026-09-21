"""Structured field extraction service using Groq LLM.

Extracts mandatory statutory declarations under the Legal Metrology
(Packaged Commodities) Rules, 2011 from concatenated OCR text.
"""

import json
import logging
import re
from typing import Any, Dict, Optional
from groq import Groq

from app.core.config import settings

logger = logging.getLogger("validra.extraction")

EXTRACTED_FIELD_DEFAULTS: Dict[str, Any] = {
    "manufacturer_address": None,
    "commodity_name": None,
    "brand": None,
    "net_quantity": None,
    "mfg_date": None,
    "mrp": None,
    "consumer_care": None,
    "fssai_number": None,
    "category": "general",
    "package_weight_value": None,
    "package_weight_unit": None,
}

EXTRACTION_PROMPT = """You are analyzing OCR text extracted from a photo of a packaged product's label, for compliance checking under India's Legal Metrology (Packaged Commodities) Rules, 2011.

The OCR text below may have these issues — account for them:
- Currency symbols like ₹ may be misread as "R" or missing entirely
- A label and its value may be split apart and appear far from each other in the text, but in the SAME RELATIVE ORDER as other label/value pairs (e.g. "MRP" appears early, its actual value "1495.00" appears much later, with other unrelated values in between) — match them by position/sequence, not by proximity
- Minor OCR spelling errors (e.g. "IMT" read as "IT", "FSSAI" read as "Issat" or "Ssaf")
- Text from several photos of the SAME product has been concatenated; a field may appear in any of them

Extract these fields as JSON. Use null if a field is genuinely absent from the text, not just hard to locate.

Fields:
- manufacturer_address: full name and address of manufacturer/packer/importer
- commodity_name: common/generic name of the product
- brand: the brand or trade name printed on the label (NOT the manufacturer's legal entity name)
- net_quantity: net quantity with unit (e.g. "30ml", "200g")
- mfg_date: month and year of manufacture/packing/import
- mrp: retail sale price as a plain number, inclusive of taxes
- consumer_care: phone number and/or email for consumer complaints
- fssai_number: FSSAI license number if present (food items only, null otherwise)
- category: best guess — one of "food", "cosmetic", "general"
- package_weight_value: the numeric part of net quantity only (e.g. 200 for "200g"), null if absent
- package_weight_unit: "g" for any weight unit (g, gm, gms, kg converted to g), "ml" for any volume unit (ml, l, litre converted to ml), null if absent or not a mass/volume unit

Return ONLY valid JSON, no markdown formatting, no explanation, exactly this shape:
{"manufacturer_address": "...", "commodity_name": "...", "brand": "...", "net_quantity": "...", "mfg_date": "...", "mrp": "...", "consumer_care": "...", "fssai_number": "...", "category": "...", "package_weight_value": 0, "package_weight_unit": "..."}

OCR TEXT:
"""

SYSTEM_PROMPT = (
    "You extract structured data from noisy OCR text. "
    "Always respond with valid JSON only, no other text."
)


def _coerce(payload: dict) -> dict:
    """Normalize the model output into the exact shape the rule engine expects."""
    result = dict(EXTRACTED_FIELD_DEFAULTS)

    for key in EXTRACTED_FIELD_DEFAULTS:
        value = payload.get(key)
        if isinstance(value, str):
            value = value.strip()
            if not value or value.lower() in ("null", "none", "n/a", "na", "unknown"):
                value = None
        result[key] = value

    category = result.get("category")
    if not isinstance(category, str) or category.lower() not in ("food", "cosmetic", "general"):
        result["category"] = "general"
    else:
        result["category"] = category.lower()

    unit = result.get("package_weight_unit")
    if isinstance(unit, str):
        unit = unit.strip().lower()
        if unit.startswith("k") and unit in ("kg", "kgs", "kilogram", "kilograms"):
            try:
                result["package_weight_value"] = float(result["package_weight_value"]) * 1000
                result["package_weight_unit"] = "g"
            except (TypeError, ValueError):
                pass
        elif unit.startswith("l") and unit in ("l", "litre", "litres", "liter", "liters"):
            try:
                result["package_weight_value"] = float(result["package_weight_value"]) * 1000
                result["package_weight_unit"] = "ml"
            except (TypeError, ValueError):
                pass
        elif unit in ("g", "gm", "gms", "gram", "grams"):
            result["package_weight_unit"] = "g"
        elif unit in ("ml", "m.l.", "millilitre", "milliliter"):
            result["package_weight_unit"] = "ml"
        else:
            result["package_weight_unit"] = None

    if result.get("package_weight_value") is not None:
        try:
            result["package_weight_value"] = float(result["package_weight_value"])
        except (TypeError, ValueError):
            result["package_weight_value"] = None

    return result


def extract_fields(ocr_text: str) -> dict:
    """Extract structured Legal Metrology fields from OCR text using Groq LLM."""
    if not ocr_text or not ocr_text.strip():
        logger.warning("Empty OCR text provided for extraction; returning default empty payload.")
        return dict(EXTRACTED_FIELD_DEFAULTS)

    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.error("GROQ_API_KEY not configured. Returning fallback extraction.")
        return _fallback_regex_extraction(ocr_text)

    client = Groq(api_key=api_key)
    model = settings.GROQ_MODEL or "openai/gpt-oss-120b"

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"{EXTRACTION_PROMPT}\n{ocr_text}"},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        content = response.choices[0].message.content or ""
    except Exception as exc:
        logger.error(f"Groq extraction call failed: {exc}")
        return _fallback_regex_extraction(ocr_text)

    # Clean markdown fences if present
    cleaned = content.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()

    try:
        payload = json.loads(cleaned)
        if not isinstance(payload, dict):
            return dict(EXTRACTED_FIELD_DEFAULTS)
        return _coerce(payload)
    except Exception as exc:
        logger.error(f"Failed to parse Groq extraction JSON: {exc}. Raw content: {cleaned[:200]}")
        return _fallback_regex_extraction(ocr_text)


def _fallback_regex_extraction(text: str) -> dict:
    """Heuristic fallback extraction when LLM API is unavailable."""
    data = dict(EXTRACTED_FIELD_DEFAULTS)
    
    # Net quantity regex (e.g. 500g, 1 kg, 250ml)
    qty_match = re.search(r"(\d+(?:\.\d+)?)\s*(g|kg|ml|l)\b", text, re.IGNORECASE)
    if qty_match:
        data["net_quantity"] = qty_match.group(0)
        val = float(qty_match.group(1))
        unit = qty_match.group(2).lower()
        if unit == "kg":
            val *= 1000
            unit = "g"
        elif unit == "l":
            val *= 1000
            unit = "ml"
        data["package_weight_value"] = val
        data["package_weight_unit"] = unit

    # MRP regex (e.g. ₹ 150, Rs. 150.00)
    mrp_match = re.search(r"(?:₹|Rs\.?|MRP\s*:?)\s*(\d+(?:\.\d{2})?)", text, re.IGNORECASE)
    if mrp_match:
        data["mrp"] = mrp_match.group(1)

    # FSSAI license regex
    fssai_match = re.search(r"\b(1\d{13})\b", text)
    if fssai_match:
        data["fssai_number"] = fssai_match.group(1)
        data["category"] = "food"

    return data
