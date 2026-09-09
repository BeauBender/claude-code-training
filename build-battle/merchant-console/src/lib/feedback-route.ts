/**
 * Framework-free core for `POST /api/feedback`, kept free of Next.js
 * imports so it is testable in plain Node (see `feedback-route.test.ts`).
 * `route.ts` is a thin adapter over this.
 *
 * Order matters: validate the payload (FEAT2's `parseFeedback`) BEFORE
 * checking whether feedback is configured, so a bad payload always reads
 * as 400 regardless of server config. See .claude/rules/api-routes.md:
 * validate on the server, same error shape everywhere, never echo an
 * upstream error body (or the token) back to the client.
 */

import {
  createUserRequestIssue,
  GitHubError,
  readGitHubConfig,
} from "./github"
import { feedbackIssueBody, feedbackTitle, parseFeedback } from "./feedback"

export type FeedbackDeps = {
  env: NodeJS.ProcessEnv
  create: typeof createUserRequestIssue
  now: () => Date
  log: (msg: string) => void
}

export type FeedbackResult = {
  status: 201 | 400 | 502 | 503
  body: { number: number; id: string; url: string } | { message: string }
}

export async function handleFeedback(
  input: unknown,
  deps: FeedbackDeps,
): Promise<FeedbackResult> {
  const parsed = parseFeedback(input)
  if (!parsed.ok) {
    return { status: 400, body: { message: parsed.message } }
  }

  const config = readGitHubConfig(deps.env)
  if (!config) {
    return {
      status: 503,
      body: { message: "Feedback is not configured on this server." },
    }
  }

  try {
    const issue = await deps.create(config, {
      title: feedbackTitle(parsed.value.text),
      body: feedbackIssueBody(parsed.value, deps.now().toISOString()),
    })
    return { status: 201, body: issue }
  } catch (err) {
    if (err instanceof GitHubError) {
      deps.log(
        `POST /api/feedback: GitHub issue creation failed with status ${err.status}: ${err.message}`,
      )
    } else {
      const message = err instanceof Error ? err.message : String(err)
      deps.log(`POST /api/feedback: GitHub issue creation failed: ${message}`)
    }
    return { status: 502, body: { message: "GitHub rejected the request." } }
  }
}
