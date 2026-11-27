<!-- ReconQA case template, format: steps-table (cases.format). Fields follow cases.required_fields. -->
<!-- Grounding rule: exact UI text (labels, buttons, messages) is marked per cases.ui_string_markup («text» by
     default) and must appear verbatim in the atlas. Anything not in the atlas is not marked; if it comes only from the
     ticket, say so ("per ticket") and list it under Mismatches / questions. -->

### {{id}} {{title}}
**Priority:** {{priority}} · **Area:** {{area}} · **Source:** {{ticket ref}} + atlas {{atlas file}}
**Preconditions:** {{preconditions}}

| # | Step | Expected |
|---|---|---|
| 1 | {{action, exact UI text marked «like this»}} | {{observable result, exact UI text marked «like this»}} |

---

## Mismatches / questions (one list per run, after the cases)
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
