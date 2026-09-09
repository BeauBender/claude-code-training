# Filing bugs and feature requests from the console

Right-click anywhere in the merchant console to open a feedback dialog. Type a brief description and click Okay to file a GitHub issue with the label `UserRequest`. Shift + right-click opens your browser's native context menu.

## Run the console with a token

Set `GITHUB_TOKEN` before running the dev server. The `.env*` files are gitignored; never commit a token.

```bash
GITHUB_TOKEN="$(gh auth token)" npm run dev
```

Run this from `build-battle/merchant-console`. The default repository is `BeauBender/claude-code-training`; set `FEEDBACK_REPO` to file into a different one. Without a token, the feedback dialog shows "Feedback is not configured on this server."

## What gets filed

Each feedback submission creates a GitHub issue with labels `UserRequest`, `state:backlog`, and `id:REQ<n>`, where `<n>` is the issue number. The title is `REQ<n> — <first line>` of the feedback text. The body is formatted as a kanban card with Goal, Context, and Acceptance criteria sections.

The two labels `state:backlog` and `id:REQ<n>` are both required because the pull agent's ready queue only finds issues carrying both labels simultaneously.

## The agent that works them

In a second terminal at the repository root, start Claude Code and run `/dev-loop:pull-start`. Every REQ issue is immediately visible to the agent as a ready card. The Stop hook nudges the session to keep pulling until you run `/dev-loop:pull-stop`. Completed work lands as pull requests following the repository's standard submission rules.

## Out of scope

Screenshots/attachments, auth or rate limiting on the route (internal tool, local dev), editing or listing issues from the console, a Cards page, any persistence layer (NWP-203).
