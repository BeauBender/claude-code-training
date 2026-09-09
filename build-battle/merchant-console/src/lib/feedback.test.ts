import { describe, expect, it } from "vitest"
import { feedbackIssueBody, feedbackTitle, parseFeedback } from "./feedback"

/**
 * Feedback text and page come straight from the client, and the page value
 * lands verbatim in an issue body, so both are checked against an allowlist
 * before anything is built from them. See .claude/rules/api-routes.md.
 */

describe("parseFeedback", () => {
  it("rejects a non-object input", () => {
    const result = parseFeedback("not an object")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBeTypeOf("string")
      expect(result.message).not.toContain("not an object")
    }
  })

  it("rejects null", () => {
    expect(parseFeedback(null).ok).toBe(false)
  })

  it("rejects a missing text field", () => {
    const result = parseFeedback({ page: "/payments" })
    expect(result).toEqual({ ok: false, message: "Tell us a little more." })
  })

  it("rejects a non-string text field", () => {
    const result = parseFeedback({ text: 42, page: "/payments" })
    expect(result).toEqual({ ok: false, message: "Tell us a little more." })
  })

  it("rejects text that is too short after trimming", () => {
    const result = parseFeedback({ text: "  ab ", page: "/payments" })
    expect(result).toEqual({ ok: false, message: "Tell us a little more." })
  })

  it("rejects text over 2000 characters", () => {
    const result = parseFeedback({
      text: "a".repeat(2001),
      page: "/payments",
    })
    expect(result).toEqual({
      ok: false,
      message: "Keep it under 2000 characters.",
    })
  })

  it("rejects a missing page field", () => {
    const result = parseFeedback({ text: "Export is broken" })
    expect(result).toEqual({ ok: false, message: "Invalid page." })
  })

  it("rejects a page that does not start with /", () => {
    const result = parseFeedback({
      text: "Export is broken",
      page: "payments",
    })
    expect(result).toEqual({ ok: false, message: "Invalid page." })
  })

  it("rejects a page containing whitespace", () => {
    const result = parseFeedback({
      text: "Export is broken",
      page: "/payments overview",
    })
    expect(result).toEqual({ ok: false, message: "Invalid page." })
  })

  it("rejects a page over 200 characters", () => {
    const result = parseFeedback({
      text: "Export is broken",
      page: `/${"a".repeat(200)}`,
    })
    expect(result).toEqual({ ok: false, message: "Invalid page." })
  })

  it("accepts valid feedback, trims text, leaves page unchanged, and drops extra keys", () => {
    const result = parseFeedback({
      text: "  Export button is greyed out on Safari  ",
      page: "/payments",
      extra: "should be dropped",
      admin: true,
    })
    expect(result).toEqual({
      ok: true,
      value: {
        text: "Export button is greyed out on Safari",
        page: "/payments",
      },
    })
  })
})

describe("feedbackTitle", () => {
  it("takes only the first line", () => {
    expect(feedbackTitle("Export is broken\nMore detail here")).toBe(
      "Export is broken",
    )
  })

  it("collapses runs of whitespace", () => {
    expect(feedbackTitle("Export   button   is   greyed  out")).toBe(
      "Export button is greyed out",
    )
  })

  it("truncates to 72 chars and appends … when cut", () => {
    const long = "a".repeat(100)
    const title = feedbackTitle(long)
    expect(title).toBe(`${"a".repeat(72)}…`)
    expect(title.length).toBe(73)
  })

  it("returns a one-line 72-char input untouched", () => {
    const exact = "a".repeat(72)
    expect(feedbackTitle(exact)).toBe(exact)
  })
})

describe("feedbackIssueBody", () => {
  it("matches the exact Markdown contract for a known input", () => {
    const feedback = {
      text: "Export button is greyed out on Safari\nHappens every time.",
      page: "/payments",
    }
    const filedAt = "2026-03-15T01:30:00.000Z"

    const body = feedbackIssueBody(feedback, filedAt)

    expect(body).toBe(
      [
        "# Export button is greyed out on Safari",
        "",
        "**Type:** user-request",
        "",
        "## Goal",
        "> Export button is greyed out on Safari",
        "> Happens every time.",
        "",
        "## Context",
        "- Filed from: `/payments`",
        "- Filed at: 2026-03-15T01:30:00.000Z",
        "- Source: merchant console right-click feedback dialog",
        "",
        "## Acceptance criteria",
        "- [ ] the request above is addressed in the merchant console",
        "- [ ] gate green: `cd build-battle/merchant-console && npm test && npm run lint`",
        "",
      ].join("\n"),
    )
  })
})
