# Verification / 验证记录

Date: 2026-11-12 (Asia/Shanghai). Version: 0.1.0 preview; model 1.0.0-teaching.

## Passed automated checks

- `npm test`: 16 tests passed, zero failures. Model checks cover repeatability, equality of gradient and single-tube runs, zero cycles, zero template, predefined off-target bands, temperature response, bounded plateau, enzyme profiles, fixed fragment sizes and parameter extremes.
- Export checks cover JSON round-trip reproduction, invalid input rejection, complete CSV cycle data and escaped report metadata.
- `npm run build` succeeds without npm dependencies; runtime-only output and `.nojekyll` are in `dist/`.
- Report SVG parses as XML. Root CLI reports Node.js 24.18.1.

## Observed browser checks

Google Chrome on macOS, using the actual served application:

- Gradient mode: completed a 30-cycle experiment, changed only cycles to 20, completed a second run, and compared both. The comparison identified cycles 20 versus 30 and used the same output scale.
- Free mode: changed to 60°C / hot-start configuration, ran successfully and obtained one linked result group.
- Switching Toy Lab / Comic Notebook preserved numerical results. Refresh restored settings and three completed local records.
- Keyboard Enter selected a result group and retained focus on its selection button.
- Actual CSV export: 32 rows including header, 14 columns, for a single 30-cycle run.
- Actual PNG export: 2400 × 2160, opened and visually inspected; contains simulation label, parameters, charts and gel. A gradient export was also generated.
- Actual JSON configuration export generated a valid version-1 file. Browser re-import was not completed because the automation extension lacks local-file access. The same parser and model round-trip passed automated tests.
- 390 × 844 mobile viewport: document width remained 390, controls used 16px input text and a single-column layout. Desktop and both material themes were visually inspected.
- No console errors were reported during tested core flows.
- Screenshots are in `docs/screenshots/`. `sample-report.svg` demonstrates the same report renderer; the PNG export was separately downloaded and inspected.

## Limits

This is an uncalibrated educational model. Automated checks establish consistency with its stated assumptions, not predictive accuracy against real PCR data. No real wet-lab experiments, sequence-level predictions, qPCR measurements, human biology review, cross-browser certification, or dynamic network capture are claimed.

The app has no simulation-upload code; its Content Security Policy sets `connect-src 'none'`. This is a source-level property, not a recorded network-trace result. External reference links navigate only when clicked.

History settings are recomputed under the current model; the UI marks version changes. A target fraction is hidden below total relative amount 0.1 to prevent misleading interpretation; this is a teaching display threshold, not an instrument detection limit.

## Publication

- Independent public repository exists: https://github.com/X-Dice/pcr-playground
- Source published at commit `0b8215aba624fee6c6d5c22c60e399bb39a0da1d`.
- GitHub Check run [43241617368](https://github.com/X-Dice/pcr-playground/actions/runs/43241617368) succeeded.
- Pages build and deploy run [43241617332](https://github.com/X-Dice/pcr-playground/actions/runs/43241617332) succeeded.
- Public URL: https://x-dice.github.io/pcr-playground/
- The public page loaded its modules, styles and scene from the repository subpath. A gradient run completed, recorded history and selecting 66°C updated the shared metrics and low-product explanation. No console errors were reported in this online smoke check.
- A separate owner-private Sites preview was also deployed successfully. Public sharing uses the GitHub Pages URL above.
