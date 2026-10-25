# DESIGN — Lore Boss
## Where the designs live
- **Framer (canonical, built):** https://framer.com/projects/kmiVOyZm6Awpz0t8rBya — project "Lore Boss — Designs", page "Home", Desktop breakpoint `WQLkyLRf1` holds all screens stacked vertically.
- **Figma (empty):** https://www.figma.com/design/n2sSRenpqx4313wGkHUnjs — file "Lore Boss — Designs" was created, but the Figma MCP Starter-plan tool-call limit was hit before any frames were drawn. Either upgrade, or rebuild from this doc/Framer.
- Screenshots: `designs/screenshots/{boss-fight,raid-recap,mod-queue,design-system}.jpg`.

## Frames (Framer node IDs)
| Frame | Node ID | Size |
|---|---|---|
| 00 Design System | `bUZ7wLdOG` | 1920×900 |
| 01 Overlay — Boss Fight | `bDXj91UTp` | 1920×1080 |
| 02 Overlay — Previously On… (raid recap) | `y6PPN7gU9` | 1920×1080 |
| 03 Overlay — Lore Ticker | `Ksb3qVdHE` | 1920×80 |
| 04 Overlay — Boss Defeated | `CRUubY7Xx` | 1920×1080 |
| 05 Web — Mod Approval Queue | `VBsu6Z56A` | 1440×900 |
| 06 Web — Streamer Setup & Settings | `WdD73qX4n` | 1440×900 |
Key children: HP bar `msLrrQqD8` (fill `RkW50icOF`), MVP list `jZsfzTMjd`, quote bubble `BtVVpI0Ot`, portrait slot `INupX2YGB`.

All copy in frames is `{placeholder}` — real values come from state. **Never ship placeholder or sample names in the product.** In the real overlay the 1920×1080 background is transparent (the frames use dark fill only for preview).

## Tokens (also Framer color styles `LoreBoss/*`)
| Token | Hex | Use |
|---|---|---|
| bg | #0E0B16 | page bg |
| surface | #18122B | panels |
| surface2 | #241A3D | cards, HP track |
| primary | #9146FF | brand, portrait border |
| primaryHi | #B57BFF | accents, chips |
| text | #EFEFF1 | body |
| muted | #ADADB8 | secondary |
| danger | #FF4F6D | HP fill, reject, quote-attack chip, REPLAY badge |
| success | #2EE6A6 | approve, defeated |
| gold | #FFC83D | crits, MVP, LV chip |
Type: Inter — Display 72/800, H1 40/700, H2 28/600, Body 18/400, Caption 13/500. Spacing 4/8/12/16/24/32/48. Radius 8 / cards 16 / pills 999. Overlay safe area 64px. Motion: HP drain 300ms ease-out; crit pop scale 1→1.2→1 over 250ms; recap card stagger 150ms. Respect OBS 30/60fps — CSS transforms only.

## How Codex/agents read designs
- **Framer:** Framer's MCP (`open_project` → `exec` with `api.tree.serialize(nodeId,{depth:3})` and `api.tree.screenshot(nodeId)`) returns structure + images. Add the Framer MCP to Codex (`codex mcp add …` per Framer's docs) or read the screenshots in `designs/screenshots/`.
- **Figma (if you populate the file):** Figma MCP tools `get_metadata` (frame list) and `get_design_context` / `get_screenshot` on a node ID. Add to Codex with its MCP config (`~/.codex/config.toml` `[mcp_servers.figma]`). Verify tool names in Figma's current MCP docs before relying on them.
- Agents implement **from tokens + structure**, not pixel-copying; keep tokens in `src/overlay/tokens.css`.
