import { describe, expect, it, vi } from "vitest"
import { createUserRequestIssue, GitHubError, readGitHubConfig } from "./github"

/**
 * The pull agent only sees issues carrying both `state:backlog` and an
 * `id:` label, and the `id:REQ<number>` label needs the number GitHub
 * assigns on create. So issue creation is a two-call dance (POST, then
 * PATCH) rather than a single call — these tests exist to pin that order
 * and payload shape down, and to make sure the token never leaks.
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("readGitHubConfig", () => {
  it("returns null when GITHUB_TOKEN is unset", () => {
    expect(readGitHubConfig({})).toBeNull()
  })

  it("returns null when GITHUB_TOKEN is empty", () => {
    expect(readGitHubConfig({ GITHUB_TOKEN: "" })).toBeNull()
  })

  it("defaults repo to BeauBender/claude-code-training", () => {
    expect(readGitHubConfig({ GITHUB_TOKEN: "t" })).toEqual({
      token: "t",
      repo: "BeauBender/claude-code-training",
    })
  })

  it("honours FEEDBACK_REPO as an override", () => {
    expect(
      readGitHubConfig({ GITHUB_TOKEN: "t", FEEDBACK_REPO: "o/r" }),
    ).toEqual({
      token: "t",
      repo: "o/r",
    })
  })
})

describe("createUserRequestIssue", () => {
  it("makes exactly two calls, in order, with the right URLs and bodies", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          number: 12,
          html_url: "https://github.com/o/r/issues/12",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, {}))

    const result = await createUserRequestIssue(
      { token: "t", repo: "o/r", fetchImpl },
      { title: "Add dark mode", body: "Please add a dark theme" },
    )

    expect(fetchImpl).toHaveBeenCalledTimes(2)

    const [postUrl, postInit] = fetchImpl.mock.calls[0]
    expect(postUrl).toBe("https://api.github.com/repos/o/r/issues")
    expect(postInit.method).toBe("POST")
    expect(JSON.parse(postInit.body)).toEqual({
      title: "Add dark mode",
      body: "Please add a dark theme",
      labels: ["UserRequest", "state:backlog"],
    })

    const [patchUrl, patchInit] = fetchImpl.mock.calls[1]
    expect(patchUrl).toBe("https://api.github.com/repos/o/r/issues/12")
    expect(patchInit.method).toBe("PATCH")
    expect(JSON.parse(patchInit.body)).toEqual({
      title: "REQ12 — Add dark mode",
      labels: ["UserRequest", "state:backlog", "id:REQ12"],
    })

    expect(result).toEqual({
      number: 12,
      id: "REQ12",
      url: "https://github.com/o/r/issues/12",
    })
  })

  it("sends the required headers on both calls", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          number: 12,
          html_url: "https://github.com/o/r/issues/12",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, {}))

    await createUserRequestIssue(
      { token: "t", repo: "o/r", fetchImpl },
      { title: "Add dark mode", body: "Please add a dark theme" },
    )

    for (const [, init] of fetchImpl.mock.calls) {
      expect(init.headers).toEqual({
        Authorization: "Bearer t",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      })
    }
  })

  it("resolves to { number, id, url } built from the POST response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          number: 12,
          html_url: "https://github.com/o/r/issues/12",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, {}))

    const result = await createUserRequestIssue(
      { token: "t", repo: "o/r", fetchImpl },
      { title: "Add dark mode", body: "Please add a dark theme" },
    )

    expect(result).toEqual({
      number: 12,
      id: "REQ12",
      url: "https://github.com/o/r/issues/12",
    })
  })

  it("rejects with GitHubError on a failed POST, without leaking the token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "Bad credentials" }))

    const promise = createUserRequestIssue(
      { token: "super-secret-token", repo: "o/r", fetchImpl },
      { title: "Add dark mode", body: "Please add a dark theme" },
    )

    await expect(promise).rejects.toBeInstanceOf(GitHubError)
    try {
      await promise
      throw new Error("expected createUserRequestIssue to reject")
    } catch (err) {
      const error = err as InstanceType<typeof GitHubError>
      expect(error.status).toBe(401)
      expect(error.message).not.toContain("super-secret-token")
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("rejects with GitHubError on a failed PATCH, even though the POST succeeded", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          number: 12,
          html_url: "https://github.com/o/r/issues/12",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(422, { message: "Validation failed" }),
      )

    const promise = createUserRequestIssue(
      { token: "super-secret-token", repo: "o/r", fetchImpl },
      { title: "Add dark mode", body: "Please add a dark theme" },
    )

    await expect(promise).rejects.toBeInstanceOf(GitHubError)
    try {
      await promise
      throw new Error("expected createUserRequestIssue to reject")
    } catch (err) {
      const error = err as InstanceType<typeof GitHubError>
      expect(error.status).toBe(422)
      expect(error.message).not.toContain("super-secret-token")
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("honours an apiBase override", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          number: 12,
          html_url: "https://example.test/o/r/issues/12",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, {}))

    await createUserRequestIssue(
      {
        token: "t",
        repo: "o/r",
        fetchImpl,
        apiBase: "https://example.test/api",
      },
      { title: "Add dark mode", body: "Please add a dark theme" },
    )

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://example.test/api/repos/o/r/issues",
    )
    expect(fetchImpl.mock.calls[1][0]).toBe(
      "https://example.test/api/repos/o/r/issues/12",
    )
  })
})
