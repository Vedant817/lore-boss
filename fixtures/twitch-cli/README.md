# Official CLI simulation captures

`synthetic-events.jsonl` contains two **simulated** EventSub notification frames captured from Twitch CLI 1.1.24 on 2026-10-25. These are not live channel events. The production normalizer parsed both successfully; a unit contract test reuses the actual captured frames.

Reproduce in two terminals, using an unused default CLI mock port (8080):

```powershell
twitch event websocket start-server --config "$env:TEMP\loreboss-twitch-cli.env"
npx tsx tests/capture-cli.ts <absolute-path-to-twitch.exe>
```

The capture script connects to `ws://127.0.0.1:8080/ws`, then invokes `twitch event trigger channel.cheer --transport=websocket --to-user=67890 --from-user=12345 --no-config` and the equivalent `channel.raid` command. It writes test fixtures only. It does not connect these simulations to the live app or claim live Bits/raid acceptance. Chat is covered by a documented-payload unit fixture; CLI 1.1.24 does not list channel.chat.message in trigger help.

Documentation: https://dev.twitch.tv/docs/cli/websocket-event-command/
