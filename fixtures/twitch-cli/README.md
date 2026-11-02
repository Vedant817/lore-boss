# Official Twitch CLI simulation inputs

`synthetic-events.jsonl` contains two simulated EventSub notification frames captured using Twitch CLI1.1.24: a cheer and an incoming raid. These are not live channel events or real paid Bits. `tests/eventsub.test.ts` uses the captured frames to check the production normalizer, so this file is required test data.

The one-off capture utility was removed during repository cleanup. The documented source tool remains the [official Twitch CLI WebSocket event commands](https://dev.twitch.tv/docs/cli/websocket-event-command/). Any replacement recording must remain synthetic, match the production contract and be reviewed with the normalizer tests.