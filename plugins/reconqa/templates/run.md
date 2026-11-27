<!-- ReconQA run report template. One section per case, in the order of the cases file.
     Step results: pass, fail, blocked, observed, not run. After the first fail or blocked step,
     the remaining steps of that case are "not run". Exact UI text is marked per cases.ui_string_markup. -->
# Test run: {{title of the cases file}}

**Cases:** {{cases file}} · **Atlas:** {{atlas file(s)}} · **Environment:** {{env name}} ({{url}}) · **Version:** {{live app version or "not shown by the app"}} · **Date:** {{YYYY-MM-DD}}
**Result:** {{n}} passed · {{n}} failed · {{n}} blocked · {{n}} not run

| Case | Result | Failed or blocked step | Note |
|---|---|---|---|
| {{case id}} | {{passed / failed / blocked / not run}} | {{step number or empty}} | {{one short line, required for failed, blocked and not run}} |

## Test data used
- {{each record created in this run, with the prefix; or "None"}}

## {{case id}} {{case title}}
**Result:** {{passed / failed / blocked / not run}}

| # | Result | Actual |
|---|---|---|
| 1 | {{pass / fail / blocked / observed / not run}} | {{what the app did, exact text marked; empty only for "not run"}} |

**Evidence:** {{screenshot path(s); required for failed and blocked}}
**Next:** /reconqa:draft-bug {{case id}} step {{n}}   <!-- failed cases only -->

---
*Run with ReconQA: an AI ran these steps in the browser. Check each failure before reporting it.*
