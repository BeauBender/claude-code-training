import { createUserRequestIssue } from "@/lib/github"
import { handleFeedback } from "@/lib/feedback-route"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null)
  const r = await handleFeedback(input, {
    env: process.env,
    create: createUserRequestIssue,
    now: () => new Date(),
    log: console.error,
  })
  return NextResponse.json(r.body, { status: r.status })
}
