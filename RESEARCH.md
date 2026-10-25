# RESEARCH — Codex x TwitchCon Hackathon & Lore Boss
Sources fetched 2026-10-25 (IST): Overview https://twitchcon-codex.devpost.com/ · Official Rules https://twitchcon-codex.devpost.com/rules

## 1. Dates (Rules §1, quoted)
- "Submission Period: October 23, 2026 (10:00 am Pacific Time) – November 2, 2026 (2:00 pm Pacific Time)" → **Nov 3, 2026 3:30 AM IST**.
- "Judging Period: November 5, 2026 (9:00 am Pacific Time) – November 15, 2026 (5:00 pm Pacific Time)".
- "Winners Announced: On or around November 15, 2026 at TwitchCon San Diego 2026". Top 5 shown on the Codex Booth stage (overview page).
- Sponsor: Amazon Advertising LLC; Administrator: Devpost, Inc.

## 2. Project requirements (Rules §4, quoted)
- "Entrants must build for streamers and their community on www.twitch.tv (“Twitch”) with OpenAI Codex (each a "Project"). The Project must be an interactive experience that connects to Twitch, for example through chat, a stream overlay, the Twitch API, EventSub or an Extension."
- "The Project must be capable of being successfully installed and running consistently on the platform for which it is intended and must function as depicted in the video and/or expressed in the text description." → **this is why faking anything in the demo is disqualifying-grade risk.**
- "Projects must be newly created during the Submission Period. Participants may use standard development tools, including frameworks, libraries, starter templates, and AI coding assistants. The work described and submitted must have been built during the Submission Period."
- Third-party APIs/data: "Entrant must be authorized to use them in accordance with any terms and conditions or licensing requirements of the tool."

## 3. Submission requirements (Rules §4, quoted)
- "Provide a URL to your code repository for judging and testing on GitHub, GitLab or Bitbucket. It must contain all source code, assets, and instructions needed for the project to run. The repository may be public or private. If private, it must be on GitHub or GitLab and shared with testing@devpost.com."
- "Include a text description that explains the Project's features and functionality and how you used Codex."
- "Provide the Codex session ID for the Codex thread where the Project was built." Overview adds: "for the thread where you built most of your project (type /status in Codex to see it). If you used multiple threads, include the one where most of the build happened."
- Video: "should be less than three (3) minutes"; "should include footage that shows the Project functioning on Twitch"; "Should include footage that shows how the project was built with Codex"; "must be uploaded to and made publicly visible on YouTube"; "must not include third party trademarks, or copyrighted music or other material unless the Entrant has permission".
- English (or translations). Project must be available free for judging until judging ends. Judges "may choose to judge based solely on the text description, images, and video" → video + description must carry the pitch.
- Drafts can be saved before the deadline; no edits after the Submission Period.

## 4. Using other AI tools alongside Codex
The rules **do not prohibit** other AI tools. Rules §4 ("New"): "Participants may use standard development tools, including frameworks, libraries, starter templates, and AI coding assistants." But the hard requirements remain: built "with OpenAI Codex", and a Codex session ID for the thread where the project was built / where most of the build happened, and video footage of "how the project was built with Codex". Also judged: "how well does it use Codex?" (Criterion 3). **Implication:** opencode subagents (DeepSeek/GLM) are allowed as assistants, but Codex must be the main build thread whose session ID is submitted, and we disclose the other models honestly. Rules §11.6 says ambiguity questions must be submitted in writing — optional: email the hackathon manager (michelle@devpost.com, listed on overview) to confirm. (Not sent; user decision.)

## 5. Judging (Rules §6)
Stage One pass/fail: fits theme + "reasonably applies the required developer tools". Stage Two, **equally weighted**:
1. Innovation/Idea — "How creative and novel is the concept and does the project differ from existing concepts?"
2. Potential Impact — "How useful or entertaining is it for streamers and their communities?"
3. Technological implementation — "How well is it built, and how well does it use Codex?"
4. Design — "Is it easy to use and fun to watch?"
Ties broken by criterion order → **Innovation is the first tiebreaker.** Judging may include "automated AI-driven analysis".
Prizes: $10k / $6k / $4k / 2× $2.5k runner-ups, all with TwitchCon stage time.

### How Lore Boss scores
| Criterion | Lore Boss answer |
|---|---|
| Innovation | Not "vote → effect" (Crowd Control, Streamer.bot already do that). The boss is generated *from the community's own mod-approved history*; every channel's boss is unique. Recap tools summarize; none (in our scan) turn lore into a playable boss. |
| Impact | New viewers/raiders don't get inside jokes; lurkers don't participate. Raid recap + one-command participation addresses both. Mods keep control (approval queue). |
| Tech + Codex | EventSub WebSocket, Helix chat, deterministic engine with tests, schema-validated LLM, replay harness; one Codex orchestrator thread with logged prompts, delegated tasks, review loops. |
| Design | Big readable overlay, "chat defeats itself" moment, 3 clear commands, setup in 5 steps. |

## 6. Competitor scan (verified 2026-10-25)
| Product | What it does (from its own site) | Gap Lore Boss fills |
|---|---|---|
| Crowd Control — https://crowdcontrol.live/ | "lets your viewers send jumpscares, keybinds, in-game effects, and more" | Viewer effects into games; no community-lore generation. |
| Streamer.bot — https://streamer.bot/ | "The most powerful stream bot with support for Twitch, YouTube, Kick, OBS Studio, Streamlabs" | General automation toolkit; you'd have to build this yourself. |
| CatchUp.help — https://catchup.help/ | "AI livestream recap assistant… Viewers type !recap in chat and get instant AI summaries" | Recaps are text summaries of the stream; not a game, not mod-approved community lore. **Closest overlap with our raid recap — do not pitch recap as the novelty.** |
| Pingys — https://pingys.com/ | "voice-activated AI companion… voice control for OBS, customizable personalities, automatic chat reading, real-time subtitling" | AI co-host, not a chat game. (Correction: board's Red Team described Pingys as "stream summaries"; its site describes an AI co-host.) |
| Twitch native Polls/Predictions — https://dev.twitch.tv/docs/api/reference/ | Built-in voting | Voting only; Polls/Predictions require Affiliate/Partner. |
Not verified here: whether any other entrant builds a similar idea (submissions aren't public before judging).

## 7. Target users & pains
- **Small/mid streamers (primary):** raids land and get fumbled; new viewers don't understand running jokes and lurk/leave; wanting interactivity without a complex Streamer.bot setup. (Board: Streamer Voice; product judgment, not survey data.)
- **Mods:** worried AI will surface toxic or personal content → hard approval gate, edit/reject, blocked words.
- **Regular chatters:** want their jokes recognized → quotes become boss attacks, MVP board.
- **Raiders/new viewers:** need 20-second context → "Previously On…".
Unverified assumption: magnitude of these pains; validate with 2–3 streamers on Oct 31 test day.

## 8. Twitch platform facts used (verified against dev.twitch.tv, see ARCHITECTURE.md §6)
EventSub WebSocket requires **user** access tokens; 10-second subscribe window after welcome; ≤3 WS connections per user token; 300 enabled subs per connection; keepalive configurable 10–600s.
