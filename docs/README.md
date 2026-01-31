# Chambresito Documentation

Organized documentation for the chambresito.com prediction platform.

---

## Structure

```
docs/
├── README.md                    # This file
├── architecture/
│   ├── system-flow.md           # 9-step pipeline from X API to resolution
│   ├── database-mapping.md      # Endpoint → table mappings
│   └── data-flow-diagrams.md    # Visual flow diagrams
├── api/
│   ├── endpoints.md             # Internal API documentation
│   └── vudy-api-5.1.0.md        # External Vudy API reference
├── policies/
│   ├── safety-filters.md        # Content filtering & public figure rules
│   └── constraints.md           # Hard constraints & tech requirements
└── assets/
    ├── 7a7748a6-db81-449b-a3ad-f7872d8be508.png
    ├── Flow-chart-of-the-steps-in-our-proposed-framework-for-stock-market-forecasting-using.png
    └── Simple-Data-Flow-Diagram-1.webp
```

---

## Quick Links

### Architecture
- [System Flow](./architecture/system-flow.md) - The complete 9-step processing pipeline
- [Database Mapping](./architecture/database-mapping.md) - Which endpoints touch which tables
- [Data Flow Diagrams](./architecture/data-flow-diagrams.md) - Visual representations of data flows

### API
- [Endpoints](./api/endpoints.md) - All system endpoints with descriptions
- [Vudy API](./api/vudy-api-5.1.0.md) - External wallet/credits API documentation

### Policies
- [Safety Filters](./policies/safety-filters.md) - Content moderation and public figure rules
- [Constraints](./policies/constraints.md) - Technical and business constraints

---

## Key Concepts

| Concept              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| Markets              | Binary prediction questions with resolution dates     |
| Predictions          | User participation in markets using credits           |
| Credits              | Service credits managed by vudy.com (not money)       |
| Reputation           | Points earned for correct predictions (separate from credits) |
| Resolution           | Deterministic outcome based on verifiable sources     |

---

## Important Notes

- **No gambling**: This is a prediction platform using service credits, not money
- **No user-created markets**: All markets are system-generated from X API signals
- **External verification required**: All markets must have verifiable resolution sources
- **Safety first**: >90% of candidate topics are rejected by design
