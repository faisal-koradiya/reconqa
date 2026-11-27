# App driver adapter: Android (built in)

## Quick start for testers

1. **Get an emulator** (a pretend phone on your computer): install Android Studio, open
   *Device Manager*, create a phone and press Play. Or use a **test** phone with USB debugging on
   (never your personal phone).
2. **Check the computer can see it.** Open a terminal and type `adb devices`. You should see a line
   like `emulator-5554   device`. If you see "command not found", ask a developer to put Android's
   `adb` on your computer's path.
3. **Install the app** you test on that emulator or phone (your developers can give you the file).
4. **Run `/reconqa:setup`** in Claude Code and choose Android. It asks for the device name from
   step 2 and the app's package name, and writes the settings file for you.
5. **Connect the Android helper.** Setup and `/reconqa:doctor` print one command for this. Copy
   it into the terminal, open in your project folder, and press Enter. It already has the right
   folder filled in. Then restart Claude Code.
6. **Run `/reconqa:doctor`.** Every line should start with `[ok]` (an `[info]` line is just a note).
   For each `[FAIL]` line it says what to do.

Claude Code asks you before each step at first ("Allow …?"). Saying yes each time is fine and safer
while you learn. Before anything risky, such as clearing the app's data, the question starts with
"ReconQA:"; say no if you're unsure.

The rest of this page is the detail, for when you need it.

## How it works

ReconQA's own Android driver, `drivers/android/server.mjs`. It needs only Node.js and `adb`
(Android platform-tools); nothing else is downloaded. It works on an emulator (default) or a test
phone, and touches **one device and one app**, both named in `.reconqa/kit.yml`. Setup writes
this file; you only need to check it. If you edit it by hand, keep the spaces exactly as they are.

    app:
      target: android
      android:
        device: emulator-5554          # the serial from "adb devices"
        package: org.example.app       # the app under test
        # extra_packages: [com.google.android.permissioncontroller]   # to answer permission dialogs
        # allow_real_device: true      # only for a test phone
        # allow_reset: true            # lets ReconQA clear the test app's data (asked every time)
    capabilities:
      app_driver:
        tool: android-adb

## Set it up

1. Install Android platform-tools so `adb devices` works. For an emulator, install Android Studio
   (or the command-line tools), create a virtual device and start it. For a test phone, turn on
   USB debugging and accept the prompt on the phone.
2. Install the test build of your app on that device.
3. Connect the driver in your project folder (one time). `/reconqa:doctor` prints this command with
   the real folder filled in; the general form is:

        claude mcp add reconqa-android --scope project -- node <ReconQA plugin folder>/drivers/android/server.mjs

   (`<ReconQA plugin folder>` means the `plugins/reconqa` folder inside the ReconQA download,
   without the angle brackets.)
   Optional, later: to stop the "Allow …?" question on every step, add the allow rule that the
   doctor shows to `.claude/settings.local.json`. Clearing app data is still asked.
4. Run `/reconqa:doctor`. It checks adb, the device and the app: each should say `[ok]`.

If more than one device is connected (for example your own phone and an emulator), that is fine:
the driver only ever talks to `app.android.device`. A real phone is refused unless you set
`allow_real_device: true`; use a test phone, never your personal one.

## Tools

| Need | Tool |
|---|---|
| Start the app / bring it to front | `android_launch` |
| Read the screen as text (preferred) | `android_snapshot` (refs e1, e2, … change after every snapshot) |
| Tap / long press | `android_tap` (`ref`, or `x` and `y`; `long: true`) |
| Type | `android_type` (`text`; `ref` to tap the field first; `clear: true` to empty it) |
| Keys | `android_press` (`back`, `enter`, `tab`, `del`, `escape`) |
| Scroll | `android_swipe` (`up` shows more of a list below) |
| Wait for a text | `android_wait_for` |
| Evidence screenshot | `android_screenshot` (give `filename`, a `.png` path in the project) |
| App and device version (for bugs) | `android_app_info` |
| App warnings and errors | `android_logcat` |
| Fresh start (asked) | `android_clear_app_data` |

## How exploring and running cases differ from the web

- "Open the URL" means `android_launch`. There are no routes: record the screen title and how you
  got there ("Habits list → + → Yes or No").
- **Field errors are often only an icon.** After submitting a form, tap each field that may be
  wrong and snapshot again: the message appears in a "Popup Window" at the top of the snapshot.
  Copy it from there. Toasts and snackbars are short-lived: snapshot right after the action.
- Elements without text or description show as bare `View clickable`. Note them as a finding
  ("button with no label": screen readers such as TalkBack cannot name it; an accessibility bug)
  and use a screenshot to see what they are.
- On every form, also check what `back` does after you typed something: does it ask, keep or
  discard the input? Record it as a rule.
- Typing supports plain ASCII only (adb limit). For accents or emoji, note the case as manual.
- The keyboard is hidden from snapshots. Press `back` to close it if it covers a button.
- Home and app switching are not offered: the driver stays in the test app. If another app comes
  to the front (a browser link, a share sheet), taps are refused; press `back` or `android_launch`.

## Login

The driver uses whatever account is already signed in on the device. Sign in to the test app on
the device yourself with a test account, once; ReconQA never sees or types the password, and
`/reconqa:login` has nothing to save. To map the sign-in screen itself, sign out first or use
`android_clear_app_data` (asked).

## Evidence in bugs and runs

`android_app_info` gives the app version, Android version and device for the bug's environment
line. `android_logcat` lists the app's recent warnings and errors (only lines from its own
process). Save screenshots with `filename` under the atlas or bug `shots/` folder.

## Safety

- One device (always passed to adb with `-s`), one app; taps only while that app (or a listed
  `extra_packages` dialog) is in front.
- No raw shell, no install or uninstall, no settings, calls, SMS or other apps. The gate also
  blocks `adb shell`, `install` and other device writes typed into the terminal.
- Password fields are shown as `••• (hidden)` in snapshots.
