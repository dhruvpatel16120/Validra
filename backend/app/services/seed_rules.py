"""Default Legal Metrology rules seeder.

Seeds the core statutory declarations into PostgreSQL if the rules table is empty.
"""

import logging
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rule import Rule

logger = logging.getLogger("validra.seed")

DEFAULT_RULES = [
    {
        "field_name": "mrp",
        "clause_reference": "Rule 6(1)(e)",
        "description": "Maximum Retail Price inclusive of all taxes must be declared.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "net_quantity",
        "clause_reference": "Rule 6(1)(a)",
        "description": "Net quantity in standard metric units (g, kg, ml, l) must be declared.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "mfg_date",
        "clause_reference": "Rule 6(1)(d)",
        "description": "Month and year of manufacture, packing, or import must be declared.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "consumer_care",
        "clause_reference": "Rule 6(1)(g)",
        "description": "Consumer care helpline phone number and email address for complaints must be provided.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "manufacturer_address",
        "clause_reference": "Rule 6(1)(b)",
        "description": "Full name and address of the manufacturer, packer, or importer must be declared.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "commodity_name",
        "clause_reference": "Rule 6(1)(c)",
        "description": "Common or generic name of the commodity contained in the package must be declared.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "brand",
        "clause_reference": "Rule 6(1)(c)",
        "description": "Brand name or registered trade name must be clearly printed on the principal display panel.",
        "validation_type": "presence",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "fssai_number",
        "clause_reference": "FSSAI Regulations, 2011",
        "description": "14-digit FSSAI license number is mandatory for packaged food commodities.",
        "validation_type": "presence",
        "applicable_categories": ["food"],
        "is_active": True,
    },
    {
        "field_name": "language",
        "clause_reference": "Rule 9(1)",
        "description": "Mandatory declarations must be prominently printed in English or Hindi (Devanagari script).",
        "validation_type": "custom",
        "applicable_categories": ["food", "cosmetic", "general"],
        "is_active": True,
    },
    {
        "field_name": "dimensions",
        "clause_reference": "Rule 6(1)(f)",
        "description": "Dimensions of the commodity when relevant to purchase must be declared (requires manual verification).",
        "validation_type": "custom",
        "applicable_categories": ["general"],
        "is_active": True,
    },
]


async def seed_default_rules(db: AsyncSession) -> None:
    """Check and seed default Legal Metrology rules if table is empty."""
    try:
        count_stmt = select(func.count(Rule.rule_id))
        result = await db.execute(count_stmt)
        count = result.scalar() or 0
        if count == 0:
            logger.info("Rules table empty. Seeding default Legal Metrology rules...")
            for rule_dict in DEFAULT_RULES:
                rule = Rule(**rule_dict)
                db.add(rule)
            await db.commit()
            logger.info(f"Successfully seeded {len(DEFAULT_RULES)} Legal Metrology rules.")
    except Exception as exc:
        logger.error(f"Failed to seed default rules: {exc}")
        await db.rollback()
