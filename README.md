# TUM Chronotype Lab

A bilingual English/German, mobile-friendly MCTQ sleep-timing calculator for a student event. It reports **MSFsc** and shows the result against a fixed **µMCTQ reference distribution of 679 records**, with earlier/lark and later/owl annotations. The TUM logos are served locally.

Eligible results also describe their position in this sample as earlier/lark-like, near the middle, or later/owl-like. The comparison uses the aggregate median band, with no exact percentiles or universal chronotype cutoffs. The rule is documented in `reference.qmd` and checked in the chart tests.

Results also show **social jetlag**: the shorter interval between the uncorrected scheduled-day and free-day sleep midpoints, with its direction. This follows `mctq::sjl(method = "shorter")` and is independently checked against R for all 512 synthetic cases. It remains available with free-day alarms or other waking; unsupported schedules have no estimate.

Share or bookmark [English](https://tscnlab.github.io/chronotypeTool/?lang=en) or [German](https://tscnlab.github.io/chronotypeTool/?lang=de). Switching languages updates `?lang=` in the address without clearing the current answers. The home link keeps the chosen language. No answers or results are included in the URL.

Participants need no account. Calculations run in the browser; answers and results stay in the current tab's memory and disappear on reload. There is no database, submission endpoint, analytics or score collection. The website host receives ordinary connection information, but no questionnaire answers or scores.

The result includes bilingual advice on daylight, evening light, sleep duration, regular sleep times, meals/caffeine and physical activity, with links to the evidence. These are general adult recommendations, not treatment or schedules inferred from MSFsc. The shift-work route omits the daytime-light and regular-schedule tips.

## Event slide

The [slide page](https://tscnlab.github.io/chronotypeTool/event-slide.html) offers a 16:9 PDF and a 3840 × 2160 PNG. Two QR codes open the German and English questionnaires directly. Reviewed exports are kept in `assets/chronotype-invitation.pdf` and `.png`; these are the only intentionally retained presentation exports.

`event-slide.qmd` documents and checks the exports. To re-author them, use `npm run slide` with `@oai/artifact-tool` 2.8.91, Python with reportlab/pypdf, LibreOffice, Poppler and Arial available. Optional `ARTIFACT_TOOL_MODULE` and `SLIDE_PYTHON` select bundled runtimes; `SLIDE_FONT_DIR` selects the fonts directory (macOS defaults to its system supplemental fonts). The authoring scripts are `scripts/slide.mjs` and `scripts/qr.py`. Intermediate files stay in ignored `.quarto/event-slide/`. These optional presentation dependencies are not needed by the app or the normal Pages build.

## Build and preview

Use Node.js 24, R 4.5.0 and Quarto 1.6.43. No npm packages or application credentials are required.

```sh
npm run setup
npm test
npm run build
npm run check
npm run dev
```

Open <http://127.0.0.1:4173>. Use HTTP rather than opening HTML directly, because browsers restrict JavaScript modules and workers on `file://` URLs. If `docs/` has already been rendered, only `npm run dev` is needed to preview it.

`npm run setup` installs the R rendering dependencies in the ignored `.R-library/` directory and pins the independent scoring implementation, `mctq`, to **0.3.2**. The build also accepts an absolute `R_LIBS_USER` path to an existing library.

## Deploy with GitHub Actions

1. Put the project sources in a GitHub repository whose default branch is `main`.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Push to `main`, or run **Publish chronotype lab** from the Actions tab.

The workflow tests, installs the rendering dependencies, builds all four Quarto notebooks, audits the static output, then deploys `docs/` using GitHub Pages. Pull requests run the checks without deployment permissions. The generated `docs/` directory is ignored by Git: Actions rebuilds it from source.

Links, styles, modules and the scoring worker use relative paths, so the site works at `https://USERNAME.github.io/REPOSITORY/`. No separate backend, secret, or participant login is needed. Only the organiser uses GitHub to publish the site. See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

A live deployment requires a GitHub repository and Pages configuration; the project does not create either automatically.

## Reproducible notebooks

| Source | Rendered output | Purpose |
| --- | --- | --- |
| `index.qmd` | `docs/index.html` | Interactive questionnaire and result |
| `reference.qmd` | `docs/reference.html` | Aggregate reference and figure |
| `methods.qmd` | `docs/methods.html` | Scoring, limitations and executed validation |
| `event-slide.qmd` | `docs/event-slide.html` | Invitation slide, downloads and reproducible authoring |

The build starts in a fresh temporary directory containing only the declared sources. It replaces `docs/` only after Quarto and the deployment audit succeed, then removes its temporary files. The source manifest in `scripts/project.mjs` must be updated when intentionally adding a source file or public asset. Unexpected files, symlinks, missing assets and local URLs that break under a project path fail the checks.

The methods notebook generates **512 deterministic synthetic cases in memory** and compares the production JavaScript calculation with R `mctq` 0.3.2. A discrepancy above 1e-7 minutes or a different alarm exclusion fails the build. Node tests cover scoring edge cases, the reference chart and deployment safeguards. Both reports regenerate their figures in `docs/assets/`, with bold panel letters and normal-weight titles.

The questionnaire is a **sleep-timing-core adaptation**, rather than the full validated questionnaire or a newly validated translation. Shift work and schedules without both day types are outside its scope. Free-day alarms or external waking produce a sleep summary without MSFsc. The methods report explains these restrictions and the application plausibility limits.

## Reference data and project hygiene

`assets/reference-data.js` is the **only reference-data source**: 48 half-hour bin counts, units and sample size. The browser and Quarto report read the same immutable aggregate. There are no participant rows, individual reference scores, source survey attachments, original filenames or data-import scripts in the project. New participant results never change the reference distribution.

PDFs, raw tables, credentials and local caches are excluded from version control, with one explicit exception for the invitation slide PDF. The build and audit use an explicit file manifest so attachments cannot be published accidentally. Keep source survey materials outside this folder.

```text
index.qmd, reference.qmd, methods.qmd   Reproducible primary sources
assets/                               Interface, scoring, fixed counts and logos
scripts/                              Setup, clean build, audits, synthetic checks
tests/                                Scoring, chart and deployment tests
server/                               Local preview server only
.github/workflows/pages.yml            Validation and Pages publication
docs/                                 Generated static website (ignored by Git)
```

The supplied TUM Corporate Design Manual inspired the typography and blue/white palette. The original English and German logo images are retained. No claim of official brand certification is made.

Scoring specification: [rOpenSci MCTQ tools](https://docs.ropensci.org/mctq/reference/msf_sc.html).
