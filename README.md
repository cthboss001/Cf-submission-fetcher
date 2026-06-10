<div align="center">

<br/>

```
 ██████╗███████╗    ███████╗███████╗████████╗ ██████╗██╗  ██╗███████╗██████╗
██╔════╝██╔════╝    ██╔════╝██╔════╝╚══██╔══╝██╔════╝██║  ██║██╔════╝██╔══██╗
██║     █████╗      █████╗  █████╗     ██║   ██║     ███████║█████╗  ██████╔╝
██║     ██╔══╝      ██╔══╝  ██╔══╝     ██║   ██║     ██╔══██║██╔══╝  ██╔══██╗
╚██████╗██║         ██║     ███████╗   ██║   ╚██████╗██║  ██║███████╗██║  ██║
 ╚═════╝╚═╝         ╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

**Tampermonkey Userscript**

*Pull source code from multiple Codeforces submissions at once — for personal study and analysis.*

<br/>

[![Install](https://img.shields.io/badge/⬇_Install_Script-7aa2f7?style=for-the-badge&logoColor=white)](https://raw.githubusercontent.com/cthboss001/Cf-submission-fetcher/main/cf_submission_fetcher.user.js)
[![Tampermonkey](https://img.shields.io/badge/Requires-Tampermonkey-bb9af7?style=for-the-badge)](https://www.tampermonkey.net/)
[![Codeforces](https://img.shields.io/badge/Works_on-Codeforces-f7768e?style=for-the-badge)](https://codeforces.com)

<br/>

</div>

---

## 📌 What This Does

When studying competitive programming, one of the best ways to improve is to **read accepted solutions** from other contestants — especially on problems you attempted but couldn't solve.

This script lets you go to any Codeforces contest status page, **select multiple submissions at once**, and pull all their source codes into a single view. Copy everything in one click and paste it into your notes for deep analysis. It eliminates the repetitive work of opening each submission individually.

---

## ✨ Features

| Feature | Description |
|---|---|
| ☑ **Checkboxes** | Injected into every submission row — select all or pick individually |
| ⬇ **Batch Fetch** | Fetches source from each submission page using your logged-in session |
| ⏱ **Safe Delay** | 2-second countdown between each request to avoid rate limiting |
| 📄 **Copy All** | All sources merged into one block with clear separators — one click |
| 📋 **Copy Single** | Each solution has its own copy button for individual access |
| 🔐 **Session-based** | Runs inside your browser — no API keys or credentials required |

---

## 🚀 How to Install

**Step 1 — Install Tampermonkey**

Add the [Tampermonkey extension](https://www.tampermonkey.net/) to Chrome, Firefox, or Edge. It's free.

**Step 2 — Create a new script**

Click the Tampermonkey icon → `Create a new script` → delete all default content.

**Step 3 — Paste the script**

Click the install badge at the top → opens the raw `.js` file → `Ctrl+A` → `Ctrl+C` → paste into Tampermonkey editor → `Ctrl+S`.

**Step 4 — Go to any contest status page**

Open `codeforces.com/contest/XXXX/status/A` while **logged in**. The floating bar appears at the bottom-right corner.

**Step 5 — Select → Fetch → Copy**

Tick the checkboxes, click **⬇ Fetch Sources**, wait for the countdown, then hit **📄 Copy All**.

---

## 🖥️ Usage Demo

```
1. Visit → codeforces.com/contest/2233/status/A?friends=on
2. Floating bar appears bottom-right ───────────────────────────────────┐
                                                                        │
   [ ⚡ CF Fetcher ]  [ ☑ Select All ]  [ ⬇ Fetch Sources ]  [ ✕ Clear ] │
                                                                        ┘
3. Check submissions you want → Click Fetch Sources
4. Modal opens with all source codes
5. Click 📄 Copy All → paste anywhere
```

---

## ⚠️ Do Not Abuse This

> **Responsible use only.**

- This script is for **personal study** — reading and understanding accepted solutions on problems you have already attempted.
- **Do not** copy solutions and submit them as your own. That is plagiarism and violates Codeforces rules.
- **Do not** scrape hundreds of submissions in bulk. The built-in delay exists for a reason — respect it, don't bypass it.
- Codeforces rate-limits aggressive scrapers. If you get blocked, that is entirely on you.
- This tool provides no advantage in a **live contest** — it only works on the public status page after or during a contest.

---

## 🛠️ Tech

- Pure vanilla JavaScript — no dependencies
- Runs entirely in your browser via Tampermonkey
- Uses `GM_xmlhttpRequest` to fetch submission pages within your session
- No data is sent anywhere — everything stays local

---

<div align="center">

Built by [`unbowed_t`](https://codeforces.com/profile/unbowed_t) &nbsp;·&nbsp; [`tazim.dev`](https://tazim.dev) &nbsp;·&nbsp; Personal use only

</div>
