/**
 * Review service - turns a real scan into the compliance-review view model.
 *
 * Everything here is derived from GET /api/scans/{scan_id}:
 *  - each applicable, non-compliant rule becomes a "finding" (violation)
 *  - each applicable rule's extracted value becomes an extracted field
 *  - rules excluded by an exemption are surfaced as "skipped", not as failures
 */

import { scanService } from "./scan-service";
import { humanizeField } from "./dashboard-service";
import { complianceScore } from "@/types/scan";
import type { Finding, FindingSeverity, ExtractedField, ReviewData } from "@/types/review";
import type { ScanResultRule } from "@/types/scan";
import { API_BASE_URL } from "./api";

/** Which declarations matter most when a violation is surfaced to a user. */
const SEVERITY_BY_FIELD: Record<string, FindingSeverity> = {
  mrp: "high",
  net_quantity: "high",
  mfg_date: "high",
  manufacturer_address: "high",
  commodity_name: "high",
  fssai_number: "medium",
  consumer_care: "medium",
  language: "medium",
  dimensions: "low",
};

function severityFor(field: string): FindingSeverity {
  return SEVERITY_BY_FIELD[field] || "medium";
}

function toFinding(result: ScanResultRule): Finding {
  const label = humanizeField(result.field_name || "declaration");
  return {
    id: `violation-${result.rule_id}`,
    title: `Missing or invalid ${label}`,
    severity: severityFor(result.field_name || ""),
    detectedIssue:
      result.extracted_value && result.extracted_value !== "not automatically assessed"
        ? `Read from the label as "${result.extracted_value}", which does not satisfy the requirement.`
        : "This mandatory declaration could not be found anywhere on the uploaded label panels.",
    relatedField: label,
    ruleReference: result.clause_reference || "PCR, 2011",
    explanation:
      result.description ||
      `Rule ${result.clause_reference || "PCR"} requires this declaration on every pre-packaged commodity.`,
    evidenceSnippet: `Automated check: ${result.field_name || "field"} — not compliant.`,
  };
}

function toExtractedField(result: ScanResultRule): ExtractedField {
  const skipped = !result.is_applicable;
  const missing = !skipped && result.is_compliant === false;
  const notAssessed = result.extracted_value === "not automatically assessed";

  return {
    id: `field-${result.rule_id}`,
    label: humanizeField(result.field_name || "declaration"),
    value: notAssessed ? null : result.extracted_value,
    confidence: null,
    isMandatory: !skipped,
    status: skipped ? "skipped" : missing ? "missing" : "verified",
    clauseReference: result.clause_reference || "",
    ruleReference: result.description || undefined,
  };
}

class ReviewService {
  /** Build the compliance-review view model for one scan. */
  async getReviewData(scanId: string): Promise<ReviewData> {
    const detail = await scanService.getScanById(scanId);
    const results = detail.results ?? [];

    const violations = results.filter((r) => r.is_applicable && r.is_compliant === false).length;
    const passed = results.filter((r) => r.is_applicable && r.is_compliant === true).length;
    const skipped = results.filter((r) => !r.is_applicable).length;
    const counts = { violations, passed, skipped };

    const findings = results
      .filter((r) => r.is_applicable && r.is_compliant === false)
      .map(toFinding);

    const extractedFields = results.map(toExtractedField);

    const evidenceImages = (detail.images || []).map((img, index) => ({
      id: `evidence-${index}`,
      title: `Label Panel ${index + 1}`,
      type: "original" as const,
      imageUrl: img.url
        ? img.url.startsWith("http")
          ? img.url
          : `${API_BASE_URL}${img.url}`
        : "",
      description: `Uploaded ${new Date(detail.created_at).toLocaleString("en-IN")}`,
    }));

    return {
      scanId: detail.scan_id,
      productName: detail.product_name || "Unidentified product",
      brand: detail.brand,
      category: detail.category || "general",
      status: detail.overall_status as ReviewData["status"],
      complianceScore: detail.compliance_score !== null
        ? Math.round(detail.compliance_score)
        : complianceScore(counts),
      counts: {
        passed: counts.passed,
        violations: counts.violations,
        skipped: counts.skipped,
        total: results.length,
      },
      extractedFields,
      evidenceImages,
      findings,
      scannedAt: detail.created_at,
    };
  }
}

export const reviewService = new ReviewService();
