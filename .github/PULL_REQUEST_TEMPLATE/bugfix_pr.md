> [!IMPORTANT]
> ⚠️ **INSTRUCTIONS FOR PR AUTHOR**:
> 1. Follow title convention: `[BUG][DOMAIN] Short description` (e.g. `[BUG][M2] Fix unhandled DB timeout`)
> 2. Complete root cause analysis & regression checklist below.
> 3. 🚨 **DELETE THIS INSTRUCTION BOX** before submitting your PR!

---

## 🐛 Bug Fix Title

<!-- Short description of the bug being fixed -->

## 🔍 Root Cause Analysis

- **What was happening?**: <!-- Describe the broken behavior -->
- **Why was it happening?**: <!-- Describe the underlying cause -->
- **How does this PR fix it?**: <!-- Describe the fix -->

---

## 👥 Primary Domain Responsible
M1 (FE) [ ] | M2 (BE/Infra) [ ] | M3 (CV/OCR) [ ] | M4 (Rule Engine) [ ] | M5 (RAG) [ ] | M6 (QA) [ ]

## 🔗 Related Issue

Fixes #

---

## 🧪 Regression & QA Verification Checklist

- [ ] Added automated unit test reproducing the bug before the fix
- [ ] Confirmed fix resolves issue without regressing adjacent components
- [ ] Tested edge cases (e.g., empty string OCR output, blurry image upload, database connection timeout)

### Verification Logs / Screenshots
```text
// Paste log output or test result demonstrating fix
```
