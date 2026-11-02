# Design reference

The implemented design tokens are in `src/overlay/tokens.css`, shared by the operator and overlay. The original visual references remain in `designs/screenshots/` for contributor comparison.

## Tokens and surfaces

Use the existing `--lb-*` variables for colors, typography, spacing, radius and motion instead of adding near-duplicates. The palette includes purple primary, dark surfaces, mint success, pink danger and gold highlights. Font sizes and overlay typography already include responsive limits.

The overlay targets a transparent1920×1080 OBS browser source; `?preview` supplies a dark viewing backdrop. The operator interface provides Setup, Lore Queue and Hall of Fame. Keep fixture/replay labeling visible and private operator actions separate from public overlay output.

## Interaction requirements

- Keep health, quote attacks, strike/block state, damage and final contributor credit readable without collisions.
- Show one numeric combat effect per hit and preserve real attribution; do not repeat an already multiplied amount.
- Treat extraction errors and valid empty results differently. Failed/stale loads must not claim fresh success.
- Background refresh must preserve drafts and expanded evidence, stop for hidden/locked views and avoid stale-response overwrites.
- Provide visible labels, focus indicators, accessible status feedback and keyboard access. Overflowing Hall statistics need a visible horizontal-scroll affordance.
- Enabled danger buttons, badges and banners use the dark foreground on the danger background; keep contrast coverage passing.
- Respect reduced motion. Optional synthesized sounds are opt-in; ordinary overlay mode is silent.

Portrait art and generated lore prose are deferred. Do not add placeholders or fake community data to product paths. Add synthetic inputs only to clearly labeled tests/fixtures.

Current rendered regression coverage lives in `tests/browser/`: presentation, operator freshness, moderation/auth and the real fixture-driven combat loop. Review visual changes against both the original references and current behavior.