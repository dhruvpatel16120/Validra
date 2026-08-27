> [!IMPORTANT]
> ⚠️ **INSTRUCTIONS FOR PR AUTHOR**:
> 1. Follow title convention: `[QA][DOMAIN] Short description` (e.g. `[QA][M6] Add OCR evaluation dataset`)
> 2. Complete benchmark metrics & verification checklist below.
> 3. 🚨 **DELETE THIS INSTRUCTION BOX** before submitting your PR!

---

## 🔬 QA / Benchmark / Rule Update Title

<!-- Short title describing dataset, benchmark run, or legal rule updates -->

## 📊 Summary of QA Submission

- **Type**:
  - [ ] 📈 Model / OCR Accuracy Benchmark Data
  - [ ] 📸 Test Dataset / Package Sample Addition
  - [ ] ⚖️ Legal Metrology Rule Addition / Amendment (M4/M6)
  - [ ] 🧪 End-to-End Test Suite Update (M6)
  - [ ] 📚 Documentation & SIH Presentation Asset Update

---

## ⚖️ Legal Metrology Rule Details (if applicable)

- **Act / Rule Reference**: Legal Metrology (Packaged Commodities) Rules, 2011 (Rule #___)
- **Target Declaration**: MRP [ ] | Net Quantity [ ] | Manufacturer [ ] | Date [ ] | Consumer Care [ ]
- **Validation Logic**: Deterministic [ ] | NLP Pattern [ ] | Manual Review Trigger [ ]

---

## 📈 Benchmark / Evaluation Results (if applicable)

| Metric | Target | Result in this PR | Status |
|:---|:---:|:---:|:---:|
| Character Error Rate (CER) | < 5% | ___% | ✅ / ⚠️ |
| Field Extraction Accuracy | > 90% | ___% | ✅ / ⚠️ |
| Rule Engine False Positive Rate | < 2% | ___% | ✅ / ⚠️ |
| End-to-End Latency | < 3s | ___s | ✅ / ⚠️ |

---

## 🧪 Verification Checklist for Tester

- [ ] All new rules validated against authoritative Legal Metrology documentation
- [ ] Benchmark datasets scrubbed of unauthorized PII / credentials
- [ ] Full integration suite run (`pytest tests/`)
