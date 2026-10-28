# Aurexa-VerifyAI — React + Vite prototype

An advanced, responsive front-end prototype for AI-assisted application validation, document evidence review, and regulatory compliance workflows.

## Run locally

Requirements: Node.js compatible with the installed Vite release (see the official Vite guide).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Pages

1. Overview — metrics, review queue, activity and illustrative charts.
2. Applications — search, status/risk filters, case navigation and CSV export.
3. New verification — case creation, local file selection and filename-only demo triage.
4. Investigation — explainable findings, evidence references, confidence examples, reviewer notes and decision controls.
5. AI review lab — feature roadmap, rule-based copilot demo, confidence routing and staged implementation roadmap.
6. Relationship graph — interactive synthetic entity/document relationship view.
7. APH rule studio — toggle demo rules and see policy governance guidance.
8. Analytics & reports — illustrative charts and report exports.
9. Audit trail — illustrative event log and export.
10. Settings — demo settings, confidence threshold and planned integration inventory.

## Important scope statement

This is a front-end prototype. It does **not** connect to a real OCR service, LLM, official AICTE API, DigiLocker, APH rule database, backend or persistent database. The copilot uses simple local rule-based responses. The file triage feature checks filenames only. Local SHA-256 is a real browser-side operation on a selected file, but a hash is only an integrity/duplicate signal; it is not a certificate authenticity verdict. Demo institutions, numbers, findings, dates, risk scores and charts are synthetic examples.

## Proposed advanced AI architecture

- React + Vite frontend
- Spring Boot API for auth, roles, case workflow, rule execution and audit events
- Python OCR/document extraction service returning normalized fields, confidence, page coordinates and model version
- Cross-document entity/field matching with evidence-pair provenance
- Versioned rule engine mapping each approved rule to the official APH edition, clause, applicability and effective date
- Retrieval-augmented policy copilot using an approved corpus, citations, version filters, abstention and human review
- Duplicate signals: SHA-256 exact-match index, metadata anomalies and optional visual tamper indicators (each separate and explainable)
- Timeline consistency graph for validity dates, inspection dates and reporting periods
- Graph-based cross-case entity resolution with false-match review and privacy/access controls
- MySQL for structured case data; encrypted object storage for documents; immutable server-side audit trail
- Role-based access control, encryption, retention/deletion policies, malware scanning and evaluation on labelled data

## Suggested implementation order

1. Backend and secure upload pipeline.
2. OCR extraction with field confidence and source-page/bounding-box references.
3. Deterministic completeness, chronology and cross-document consistency checks.
4. Evidence-linked investigation and human review outcomes.
5. APH clause ingestion and versioned retrieval-augmented copilot.
6. Hash index, visual forensics and cross-case graph signals.
7. Security hardening, evaluation, audit, and controlled pilot.

## Governance

AI findings should be treated as advisory signals, not automatic proof of fraud or grounds for rejection. Verify official sources and applicable policy versions; authorised officials retain final decisions.
