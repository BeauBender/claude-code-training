/**
 * Minimal GitHub Issues client for turning a user request into a tracked
 * issue on the kanban repo. Kept free of Next.js imports so it stays
 * testable in plain Node with an injected `fetchImpl`.
 */

/** Config needed to talk to the GitHub REST API on behalf of one repo. */
export type IssueClientConfig = {
  token: string
  repo: string // "owner/repo"
  fetchImpl?: typeof fetch
  apiBase?: string // default "https://api.github.com"
}

export type CreatedIssue = { number: number; id: string; url: string }

/** A non-2xx response from the GitHub API. Never carries the token. */
export class GitHubError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "GitHubError"
    this.status = status
  }
}

/**
 * Reads GitHub issue-client config from the process environment.
 * Returns `null` when `GITHUB_TOKEN` is unset or empty, so callers can
 * treat "no token configured" as a single falsy check. `FEEDBACK_REPO`
 * overrides the default repo.
 */
export function readGitHubConfig(
  env: NodeJS.ProcessEnv,
): IssueClientConfig | null {
  const token = env.GITHUB_TOKEN
  if (!token) return null
  return {
    token,
    repo: env.FEEDBACK_REPO || "BeauBender/claude-code-training",
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string }
    if (body && typeof body.message === "string") return body.message
  } catch {
    // Body wasn't JSON (or was empty) — fall through to the status text.
  }
  return res.statusText || `GitHub API error (${res.status})`
}

/**
 * Creates a user-request issue and then patches its title/labels to bake
 * in the id GitHub only reveals once the issue exists — this is why
 * creation is two calls, not one. The `id:REQ<number>` label is what lets
 * the pull agent's issue search find this request; it only looks at
 * issues carrying both `state:backlog` and an `id:` label.
 */
export async function createUserRequestIssue(
  cfg: IssueClientConfig,
  issue: { title: string; body: string },
): Promise<CreatedIssue> {
  const fetchImpl = cfg.fetchImpl ?? fetch
  const apiBase = cfg.apiBase ?? "https://api.github.com"
  const reqHeaders = headers(cfg.token)

  const createRes = await fetchImpl(`${apiBase}/repos/${cfg.repo}/issues`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: ["UserRequest", "state:backlog"],
    }),
  })
  if (!createRes.ok) {
    throw new GitHubError(createRes.status, await readErrorMessage(createRes))
  }
  const created = (await createRes.json()) as {
    number: number
    html_url: string
  }
  const id = `REQ${created.number}`

  const patchRes = await fetchImpl(
    `${apiBase}/repos/${cfg.repo}/issues/${created.number}`,
    {
      method: "PATCH",
      headers: reqHeaders,
      body: JSON.stringify({
        title: `${id} — ${issue.title}`,
        labels: ["UserRequest", "state:backlog", `id:${id}`],
      }),
    },
  )
  if (!patchRes.ok) {
    throw new GitHubError(patchRes.status, await readErrorMessage(patchRes))
  }

  return { number: created.number, id, url: created.html_url }
}
