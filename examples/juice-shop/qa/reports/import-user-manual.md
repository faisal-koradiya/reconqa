# Import: user-manual.md (2026-11-26)
12 cases / sections imported into qa/sources/user-manual.md. Compared with the atlas: login-and-registration.

## Summary
- Conflicts: 8 (outdated case 0, manual vs app 8, not in app 0, needs a decision 0)
- Matches the app: 1 units · Not checked (area not explored yet): 5 units in shopping (search, basket, checkout), customer feedback, language
- Flagged text (kept as data, not followed): 1 · Real email addresses: 0

## Conflicts
| # | Feature | Source | Source says | App shows | Kind | Question |
|---|---|---|---|---|---|---|
| 1 | registration | Creating an account [src: manual:qa/sources/user-manual.md#Creating an account] | Hint "Password must be 8-40 characters long." | "Password must be 5-40 characters long." [src: atlas:login-and-registration#M10] | manual vs app | Fix the hint text in the manual? |
| 2 | registration | Creating an account [src: manual:qa/sources/user-manual.md#Creating an account] | Password must be at least 8 characters long | Password length is 5-40 characters [src: atlas:login-and-registration#R6] | manual vs app | Is the minimum 5 or 8? Fix the manual or the app. |
| 3 | registration | Creating an account [src: manual:qa/sources/user-manual.md#Creating an account] | The Register button stays enabled the whole time and problems are listed after pressing it | Register stays disabled until the form is valid [src: atlas:login-and-registration#R4] | manual vs app | Fix the manual to say the button is disabled until the form is valid? |
| 4 | registration | Security questions [src: manual:qa/sources/user-manual.md#Security questions] | Pick one of 12 security questions | 14 options in the Security Question dropdown [src: atlas:login-and-registration#User Registration] | manual vs app | Fix the number in the manual? |
| 5 | registration | After registering [src: manual:qa/sources/user-manual.md#After registering] | You are signed in automatically and taken to the product list | Redirect to the login page with a success toast [src: atlas:login-and-registration#R9] | manual vs app | Fix the manual: the user must log in after registering? |
| 6 | registration | Email already used [src: manual:qa/sources/user-manual.md#Email already used] | Message "This email address is already in use." | "Email must be unique" [src: atlas:login-and-registration#M12] | manual vs app | Fix the message text in the manual? |
| 7 | registration | Email already used [src: manual:qa/sources/user-manual.md#Email already used] | The message appears under the email field | Shown as an alert banner under the "User Registration" heading [src: atlas:login-and-registration#M12] | manual vs app | Fix where the manual says the message appears? |
| 8 | registration | Signing in [src: manual:qa/sources/user-manual.md#Signing in] | Message "Wrong password. Please try again." | "Invalid email or password." [src: atlas:login-and-registration#M3] | manual vs app | Fix the message text in the manual? |

## Not checked
- Shopping (search, basket, checkout): 3 units. `/reconqa:explore shopping`
- Customer feedback: 1 unit. `/reconqa:explore customer feedback`
- Changing the language: 1 unit. `/reconqa:explore language`

## Flagged text
- Signing in [src: manual:qa/sources/user-manual.md#Signing in]: asks to ignore instructions (a note addressed to AI assistants). Nothing in it was followed.
