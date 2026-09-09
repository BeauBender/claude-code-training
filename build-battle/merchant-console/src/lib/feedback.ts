/**
 * Feedback text and page path are client input. Both are checked against an
 * allowlist here before either reaches an issue body — the page path in
 * particular, since it is rendered verbatim into Markdown that a kanban tool
 * parses. See .claude/rules/api-routes.md: validate on the server, reject
 * early, return a message that is safe to show a user (no stack, no echoed
 * input).
 */

export type Feedback = { text: string; page: string }

export type ParseResult =
  | { ok: true; value: Feedback }
  | { ok: false; message: string }

const TEXT_MIN_LENGTH = 3
const TEXT_MAX_LENGTH = 2000
const PAGE_MAX_LENGTH = 200
const TITLE_MAX_LENGTH = 72

export function parseFeedback(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, message: "Invalid feedback." }
  }

  const candidate = input as Record<string, unknown>

  if (typeof candidate.text !== "string") {
    return { ok: false, message: "Tell us a little more." }
  }
  const text = candidate.text.trim()
  if (text.length < TEXT_MIN_LENGTH) {
    return { ok: false, message: "Tell us a little more." }
  }
  if (text.length > TEXT_MAX_LENGTH) {
    return { ok: false, message: "Keep it under 2000 characters." }
  }

  if (typeof candidate.page !== "string") {
    return { ok: false, message: "Invalid page." }
  }
  const page = candidate.page
  if (
    !page.startsWith("/") ||
    page.length > PAGE_MAX_LENGTH ||
    /\s/.test(page)
  ) {
    return { ok: false, message: "Invalid page." }
  }

  return { ok: true, value: { text, page } }
}

/** First line of the text, internal whitespace collapsed, capped at 72 chars. */
export function feedbackTitle(text: string): string {
  const firstLine = text.trim().split("\n")[0]
  const collapsed = firstLine.replace(/\s+/g, " ").trim()
  return collapsed.length > TITLE_MAX_LENGTH
    ? `${collapsed.slice(0, TITLE_MAX_LENGTH)}…`
    : collapsed
}

/** Renders feedback into the epic-card Markdown shape the pull agent expects. */
export function feedbackIssueBody(f: Feedback, filedAt: string): string {
  const title = feedbackTitle(f.text)
  const quoted = f.text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")

  return [
    `# ${title}`,
    "",
    "**Type:** user-request",
    "",
    "## Goal",
    quoted,
    "",
    "## Context",
    `- Filed from: \`${f.page}\``,
    `- Filed at: ${filedAt}`,
    "- Source: merchant console right-click feedback dialog",
    "",
    "## Acceptance criteria",
    "- [ ] the request above is addressed in the merchant console",
    "- [ ] gate green: `cd build-battle/merchant-console && npm test && npm run lint`",
    "",
  ].join("\n")
}
