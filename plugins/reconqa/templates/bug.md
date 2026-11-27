<!-- ReconQA bug template. Sections follow bugs.fields; evidence follows bugs.required_evidence.
     Exact UI text is marked per cases.ui_string_markup («text» by default). Text first seen during
     this reproduction (not in the atlas) is marked too, and listed under Evidence as "observed live". -->
# {{title: what is wrong, where; no blame, no guesses about the cause}}

**Severity:** {{one of bugs.severity_scale}} · **Environment:** {{env name + URL}} · **Version:** {{live app version or "not shown by the app"}}
**Found by:** {{case id + step, or "exploratory"}} · **Atlas:** {{atlas file}}

## Preconditions
{{account state, data, browser; reproducible by someone else}}

## Steps
1. {{one action per step, exact UI text marked}}

## Expected
{{from the case / atlas / ticket; say which}}

## Actual
{{what happened, exact text marked; observed during this reproduction}}

## Evidence
- Screenshot: {{path}}
- Reproduced: {{n of n attempts}} on {{date}}
- {{console errors, network status if relevant}}

---
*Drafted with ReconQA; reviewed by a person before filing.*
