<!-- ReconQA bug draft -->
# Registration: «Password» character counter shows «/20» although the limit is 40

**Severity:** Trivial · **Environment:** local (http://localhost:3000) · **Version:** not shown by the app
**Found by:** TC-REG-010 step 2 · **Atlas:** qa/atlas/login-and-registration.md

Severity reasoning: cosmetic wrong counter text only; the field still accepts exactly 40 characters and registration is not blocked.

## Preconditions
- App running at http://localhost:3000, browser logged out (no account needed).
- Welcome banner and cookie dialog dismissed.
- Desktop viewport, Chromium (Playwright).

## Steps
1. Open http://localhost:3000/#/register («User Registration»).
2. Look at the counter under «Password» without typing anything.
3. Click into «Password» and enter Ab1! followed by 36 letters x (40 characters), then click outside the field.
4. Clear «Password» and type 41 letters a one at a time.
5. Look at the counter under «Password».

## Expected
The counter should show the real limit, «n/40», matching the hint «Password must be 5-40 characters long.» and the «Repeat Password» counter («0/40»). Source: case TC-REG-010 step 2 and atlas (hint and rules R6).

## Actual
- Step 2: the counter shows «0/20».
- Step 3: the counter shows «40/20».
- Steps 4–5: the field holds 40 characters (the 41st is not accepted) and the counter shows «40/20».
- The hint under the field reads «Password must be 5-40 characters long.» and the «Repeat Password» counter reads «0/40».

## Evidence
- Screenshot: qa/bugs/shots/password-counter-20.png
- Reproduced: 2 of 2 attempts on 2026-11-26 (counter «0/20» on load, «40/20» after both the 40-character and the 41-character input)
- Console: no errors (only DOM autocomplete verbose notices). Text «0/20» and «40/20» observed live (atlas records «40/20» and «n/20»).

---
*Drafted with ReconQA; reviewed by a person before filing.*
