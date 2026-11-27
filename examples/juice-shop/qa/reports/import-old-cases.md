# Import: old-cases.csv (2026-11-26)
100 cases / sections imported into qa/sources/old-cases.csv. Compared with the atlas: login-and-registration.

## Summary
- Conflicts: 13 (outdated case 12, manual vs app 0, not in app 0, needs a decision 1)
- Matches the app: 35 units · Not checked (area not explored yet): 53 units in Feedback, About, Checkout, Account, Basket, Language, Contact, Product, Search, Coupons, Deluxe
- Flagged text (kept as data, not followed): 1 · Real email addresses: 0

## Conflicts
| # | Feature | Source | Source says | App shows | Kind | Question |
|---|---|---|---|---|---|---|
| 1 | registration | C1003 [src: import:qa/sources/old-cases.csv#C1003] | Register button is enabled for an empty form and errors appear after the click | Register stays disabled while the form is incomplete [src: atlas:login-and-registration#R4] | outdated case | Update the expected result of C1003 to a disabled Register button? |
| 2 | registration | C1014 [src: import:qa/sources/old-cases.csv#C1014] | Link "New customer? Register here" | "Not yet a customer?" [src: atlas:login-and-registration#Login] | outdated case | Update the link text in C1014? |
| 3 | registration | C1018 [src: import:qa/sources/old-cases.csv#C1018] | "This email is already registered." | "Email must be unique" [src: atlas:login-and-registration#M12] | outdated case | Update the expected message in C1018? |
| 4 | registration | C1018 [src: import:qa/sources/old-cases.csv#C1018] | The message appears under the Email field | The message is an alert banner under the registration heading [src: atlas:login-and-registration#M12] | outdated case | Update where C1018 expects the message? |
| 5 | registration | C1029 [src: import:qa/sources/old-cases.csv#C1029] | There are 12 security questions | The list has 14 options [src: atlas:login-and-registration#User Registration] | outdated case | Update the expected count in C1029 to 14? |
| 6 | registration | C1040 [src: import:qa/sources/old-cases.csv#C1040] | "Please enter a valid email" | "Email address is not valid." [src: atlas:login-and-registration#M9] | outdated case | Update the expected message in C1040? |
| 7 | registration | C1044 [src: import:qa/sources/old-cases.csv#C1044] | Expects "Invalid login" | "Invalid email or password." [src: atlas:login-and-registration#M3] | outdated case | Update the expected result of C1044? |
| 8 | registration | C1051 [src: import:qa/sources/old-cases.csv#C1051] | "Please provide a security answer." | "Please provide an answer to your security question." [src: atlas:login-and-registration#M8] | outdated case | Update the expected message in C1051? |
| 9 | registration | C1055 [src: import:qa/sources/old-cases.csv#C1055] | The user is logged in automatically after registering and the product list opens | The login page opens and a success toast is shown [src: atlas:login-and-registration#R9] | outdated case | Update C1055 to expect the redirect to the login page? |
| 10 | registration | C1066 [src: import:qa/sources/old-cases.csv#C1066] | "Email is required" | "Please provide an email address." [src: atlas:login-and-registration#M4] | outdated case | Update the expected message in C1066? |
| 11 | registration | C1077 [src: import:qa/sources/old-cases.csv#C1077] | Hint "Password must be 8-40 characters long." | "Password must be 5-40 characters long." [src: atlas:login-and-registration#M10] | outdated case | Update the hint text in C1077? |
| 12 | registration | C1081 [src: import:qa/sources/old-cases.csv#C1081] | A 7-character password is rejected with "Password must be at least 8 characters" | The app accepts 5 to 40 characters and gives no error for 7, yet the password advice checklist lists an 8-character rule [src: atlas:login-and-registration#R6] | needs a decision | Is the minimum 5 or 8? Should the app or C1081 change? |
| 13 | registration | C1092 [src: import:qa/sources/old-cases.csv#C1092] | "Passwords must match" | "Passwords do not match" [src: atlas:login-and-registration#M11] | outdated case | Update the expected message in C1092? |

## Not checked
- Checkout: 9 units. `/reconqa:explore checkout`
- Account: 8 units (includes logout and profile). `/reconqa:explore account`
- Basket: 8 units. `/reconqa:explore basket`
- Search: 7 units. `/reconqa:explore search`
- Product: 5 units. `/reconqa:explore product`
- Feedback: 4 units. `/reconqa:explore feedback`
- About: 3 units. `/reconqa:explore about`
- Language: 3 units. `/reconqa:explore language`
- Contact: 3 units. `/reconqa:explore contact`
- Deluxe: 2 units. `/reconqa:explore deluxe`
- Coupons: 1 unit. `/reconqa:explore coupons`

## Flagged text
- C1064 [src: import:qa/sources/old-cases.csv#C1064]: asks to ignore instructions and to delete data in bulk. Nothing in it was followed. It is also in the Search area, which is not checked.
