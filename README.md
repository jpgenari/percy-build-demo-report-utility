# Percy menu-loop visual test

Visual regression test for https://percy-demo-for-report-utility.vercel.app/home.

The Playwright test clicks each menu option (Home, About, Products, Contact, Sitemap) plus **Toggle Design Version**, taking a Percy snapshot after each click. It repeats this 20 times, so one build has **6 × 20 = 120 snapshots**.

The runner builds the site in two designs so every run produces visual diffs:

1. **Design A** is captured, then approved in Percy as the baseline.
2. **Design B** is captured and left unapproved, so Percy shows the A vs B differences.

Snapshot names are identical in both builds (for example `Loop 07 - Products`), so Percy compares them one to one.

## Requirements

- Node.js 20+
- A Percy project token (`web_...`): percy.io → your project → Project settings → Token
- A BrowserStack username and access key, used to approve build A

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Fill in `.env` (it is git-ignored, never commit it):

```
PERCY_TOKEN=web_...
BROWSERSTACK_USERNAME=...
BROWSERSTACK_ACCESS_KEY=...
```

## Run both builds (A, then B)

```bash
npm run percy:all
```

This runs design A, waits for it to finish, approves it, runs design B, and prints both build links. Open build B in Percy to review the diffs.

## Run a single build

```bash
# Design A only
npx percy exec -- npx playwright test

# Design B only
DESIGN_VERSION=B npx percy exec -- npx playwright test
```

`PERCY_TOKEN` must be set (in `.env` or exported). These commands do not approve anything.

Run the test without Percy as a quick check (snapshots are skipped):

```bash
LOOPS=1 npx playwright test
```

## Options

| Variable | Default | Purpose |
| --- | --- | --- |
| `DESIGN_VERSION` | `A` | `B` clicks the design toggle before the loops |
| `LOOPS` | `20` | Number of menu loops (6 snapshots each) |
| `BASE_URL` | the demo site `/home` page | Page to test |

## Run in GitHub Actions

The workflow in `.github/workflows/percy.yml` runs `npm run percy:all` on manual dispatch and on every push to `main`.

1. In the repository go to **Settings → Secrets and variables → Actions** and add these repository secrets:
   - `PERCY_TOKEN`
   - `BROWSERSTACK_USERNAME`
   - `BROWSERSTACK_ACCESS_KEY`
2. Go to the **Actions** tab, choose **Percy visual builds** and click **Run workflow**, or push to `main`.
3. Each run builds and approves design A first, then builds design B. Open the build B link from the job log to review the diffs.
