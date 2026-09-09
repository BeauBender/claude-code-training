"use client"

import * as React from "react"
import * as DialogPrimitives from "@radix-ui/react-dialog"

import { Button } from "@/components/Button"
import { cx, focusInput } from "@/lib/utils"

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; number: number; id: string; url: string }
  | { status: "error"; message: string }

export type FeedbackDialogProps = {
  open: boolean
  page: string
  onOpenChange: (open: boolean) => void
}

const FALLBACK_ERROR = "Something went wrong."

/**
 * The dialog `FeedbackTrigger` opens on a right-click. Radix owns focus
 * (moves into the textarea on open, returns it on close) and Escape/overlay
 * dismissal; this component only owns submit state and resets it whenever
 * the dialog closes, by whatever route (Cancel, Escape, overlay, Close).
 */
export function FeedbackDialog({
  open,
  page,
  onOpenChange,
}: FeedbackDialogProps) {
  const [text, setText] = React.useState("")
  const [state, setState] = React.useState<SubmitState>({ status: "idle" })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setText("")
      setState({ status: "idle" })
    }
    onOpenChange(nextOpen)
  }

  const submitting = state.status === "submitting"
  const canSubmit = text.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setState({ status: "submitting" })
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, page }),
      })
      if (res.status === 201) {
        const body = (await res.json()) as {
          number: number
          id: string
          url: string
        }
        setState({ status: "success", ...body })
        return
      }
      let message = FALLBACK_ERROR
      try {
        const body = (await res.json()) as { message?: string }
        if (body?.message) message = body.message
      } catch {
        // keep the fallback message
      }
      setState({ status: "error", message })
    } catch {
      setState({ status: "error", message: FALLBACK_ERROR })
    }
  }

  const success = state.status === "success" ? state : null
  const error = state.status === "error" ? state.message : null

  return (
    <DialogPrimitives.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitives.Portal>
        <DialogPrimitives.Overlay
          className={cx(
            "fixed inset-0 z-50 overflow-y-auto",
            "bg-black/30",
            "data-[state=closed]:animate-hide",
          )}
        />
        <DialogPrimitives.Content
          className={cx(
            "fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2",
            "flex flex-col rounded-md border p-4 shadow-lg focus:outline-none sm:p-6",
            "border-gray-200 dark:border-gray-900",
            "bg-white dark:bg-[#090E1A]",
            "data-[state=open]:animate-slideUpAndFade data-[state=closed]:animate-hide",
          )}
        >
          <DialogPrimitives.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Send feedback
          </DialogPrimitives.Title>
          <DialogPrimitives.Description className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            Right-click anywhere to file a bug or request a feature. Shift +
            right-click opens the browser menu.
          </DialogPrimitives.Description>

          {success ? (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-sm text-gray-900 dark:text-gray-50">
                Filed as{" "}
                <a
                  href={success.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-500 underline hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400"
                >
                  {success.id}
                </a>
              </p>
              <div className="flex justify-end">
                <DialogPrimitives.Close asChild>
                  <Button variant="secondary">Close</Button>
                </DialogPrimitives.Close>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <label
                htmlFor="feedback-text"
                className="text-sm font-medium text-gray-900 dark:text-gray-50"
              >
                Describe the bug or the feature you need
              </label>
              <textarea
                id="feedback-text"
                rows={4}
                maxLength={2000}
                value={text}
                disabled={submitting}
                onChange={(event) => setText(event.target.value)}
                className={cx(
                  "block w-full resize-none rounded-md border px-2.5 py-2 shadow-sm outline-none transition sm:text-sm",
                  "border-gray-300 dark:border-gray-800",
                  "text-gray-900 dark:text-gray-50",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "bg-white dark:bg-gray-950",
                  "disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400",
                  "disabled:dark:border-gray-700 disabled:dark:bg-gray-800 disabled:dark:text-gray-500",
                  focusInput,
                )}
              />
              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-500"
                >
                  {error}
                </p>
              )}
              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                <DialogPrimitives.Close asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogPrimitives.Close>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!canSubmit}
                  isLoading={submitting}
                  onClick={handleSubmit}
                >
                  Okay
                </Button>
              </div>
            </div>
          )}
        </DialogPrimitives.Content>
      </DialogPrimitives.Portal>
    </DialogPrimitives.Root>
  )
}
