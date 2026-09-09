"use client"

import * as React from "react"

import { Button } from "@/components/Button"
import { cx, focusInput } from "@/lib/utils"

export function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
}) {
  const canSend = value.trim().length > 0

  const handleSubmit = () => {
    if (!canSend) return
    onSend(value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
      <label htmlFor="chat-composer" className="sr-only">
        Message the console assistant
      </label>
      <textarea
        id="chat-composer"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about payments, disputes, or payouts…"
        className={cx(
          "block w-full resize-none rounded-md border px-2.5 py-2 text-sm shadow-sm outline-none transition sm:text-sm",
          "border-gray-300 dark:border-gray-800",
          "text-gray-900 dark:text-gray-50",
          "placeholder-gray-400 dark:placeholder-gray-500",
          "bg-white dark:bg-gray-950",
          focusInput,
        )}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          disabled={!canSend}
          onClick={handleSubmit}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
