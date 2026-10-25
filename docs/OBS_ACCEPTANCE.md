# Isolated OBS acceptance

OBS is tested in a portable copy under the OS temporary directory, with its own configuration, scene collection and authenticated websocket port. The normal OBS profile is not changed. The acceptance helper refuses an active stream or recording and mutes special audio inputs; it takes only a browser-source screenshot.

```powershell
npx tsx scripts/obs-acceptance.ts <portable-config/obs-studio/plugin_config/obs-websocket/config.json> http://localhost:3137/overlay-view
```

The helper creates a 1920×1080/30fps scene and browser source, verifies actual OBS input settings/active state, and writes `obs-overlay.png` and `manifest.json` under OS temp. Inspect the screenshot before claiming rendering acceptance. For combat acceptance, use an isolated explicitly labeled replay instance and repeat with its overlay URL. Never treat the local waiting/replay screen as proof of a real Twitch stream, received Bits, raid, or live LLM extraction.

Official references: [portable mode](https://obsproject.com/kb/portable-mode), [launch flags](https://obsproject.com/kb/launch-parameters), [WebSocket protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md), [browser-source settings](https://github.com/obsproject/obs-browser/blob/master/browser-source.cpp).
