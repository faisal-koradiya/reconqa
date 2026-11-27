# CSV output for test-management tool: csv

One row per step; case-level fields repeat only on the first row of each case.
Header (exact order):

    id,title,priority,area,preconditions,step_no,step,expected,source

- UTF-8, comma-separated, RFC 4180 quoting (double quotes inside a field are doubled).
- `source` = ticket reference + atlas file, e.g. `new-customer-registration.md + atlas/login-and-registration.md`.
- Same grounding rule as the Markdown template: exact UI text marked per `cases.ui_string_markup`, present in the atlas.
