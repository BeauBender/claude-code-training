import { describe, expect, it, vi } from "vitest"
import { GitHubError } from "./github"
import { handleFeedback, type FeedbackDeps } from "./feedback-route"

/**
 * Framework-free core for POST /api/feedback: validate (FEAT2), check
 * config (FEAT1), then create the issue (FEAT1). See
 * .claude/rules/api-routes.md — validate on the server, same error shape
 * everywhere, never echo an upstream error body back to the client.
 */

const VALID_PAYLOAD = { text: "Export button is broken", page: "/payments" }

/** Builds a fake `NodeJS.ProcessEnv` from just the vars a test cares about. */
function env(vars: Record<string, string>): NodeJS.ProcessEnv {
  return vars as unknown as NodeJS.ProcessEnv
}

function makeDeps(overrides: Partial<FeedbackDeps> = {}): FeedbackDeps {
  return {
    env: env({ GITHUB_TOKEN: "t" }),
    create: vi.fn().mockResolvedValue({
      number: 12,
      id: "REQ12",
      url: "https://github.com/o/r/issues/12",
    }),
    now: () => new Date("2026-03-15T01:30:00.000Z"),
    log: vi.fn(),
    ...overrides,
  }
}

describe("handleFeedback", () => {
  it("validates before checking config: bad payload + no GITHUB_TOKEN -> 400", async () => {
    const deps = makeDeps({ env: env({}) })

    const result = await handleFeedback({ text: "" }, deps)

    expect(result.status).toBe(400)
    expect(deps.create).not.toHaveBeenCalled()
  })

  it("valid payload + no GITHUB_TOKEN -> 503, create not called", async () => {
    const deps = makeDeps({ env: env({}) })

    const result = await handleFeedback(VALID_PAYLOAD, deps)

    expect(result).toEqual({
      status: 503,
      body: { message: "Feedback is not configured on this server." },
    })
    expect(deps.create).not.toHaveBeenCalled()
  })

  it("invalid payload -> 400 with FEAT2's message, create not called", async () => {
    const deps = makeDeps()

    const result = await handleFeedback({ text: "ab", page: "/x" }, deps)

    expect(result).toEqual({
      status: 400,
      body: { message: "Tell us a little more." },
    })
    expect(deps.create).not.toHaveBeenCalled()
  })

  it("valid payload -> calls create once with config + built issue, returns 201 with the CreatedIssue verbatim", async () => {
    const deps = makeDeps({ env: env({ GITHUB_TOKEN: "t", FEEDBACK_REPO: "o/r" }) })

    const result = await handleFeedback(VALID_PAYLOAD, deps)

    expect(deps.create).toHaveBeenCalledTimes(1)
    expect(deps.create).toHaveBeenCalledWith(
      { token: "t", repo: "o/r" },
      {
        title: "Export button is broken",
        body: expect.stringContaining("Export button is broken"),
      },
    )
    const [, issueArg] = (deps.create as ReturnType<typeof vi.fn>).mock
      .calls[0]
    expect(issueArg.body).toContain("2026-03-15T01:30:00.000Z")

    expect(result).toEqual({
      status: 201,
      body: { number: 12, id: "REQ12", url: "https://github.com/o/r/issues/12" },
    })
  })

  it("create throws GitHubError(422) -> 502 with a safe message, logs the detail, never echoes GitHub's body or the token", async () => {
    const deps = makeDeps({
      create: vi
        .fn()
        .mockRejectedValue(new GitHubError(422, "Validation failed")),
    })

    const result = await handleFeedback(VALID_PAYLOAD, deps)

    expect(result).toEqual({
      status: 502,
      body: { message: "GitHub rejected the request." },
    })
    expect(deps.log).toHaveBeenCalledTimes(1)
    const [loggedLine] = (deps.log as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(loggedLine).toContain("422")
  })

  it("create throws a plain Error -> 502 with the same safe message", async () => {
    const deps = makeDeps({
      create: vi.fn().mockRejectedValue(new Error("boom")),
    })

    const result = await handleFeedback(VALID_PAYLOAD, deps)

    expect(result).toEqual({
      status: 502,
      body: { message: "GitHub rejected the request." },
    })
  })
})
