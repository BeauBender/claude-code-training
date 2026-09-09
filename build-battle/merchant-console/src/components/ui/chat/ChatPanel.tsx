"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/Button"
import { cx } from "@/lib/utils"

import { useChat } from "./ChatProvider"
import { Composer } from "./Composer"
import { MessageList, type ChatMessage } from "./MessageList"

// CHAT1 builds the shell only: the composer appends the user's message and a
// placeholder assistant reply to local state. CHAT5 replaces the placeholder
// with the real streamed request.
const PLACEHOLDER_REPLY = "Not connected yet"

export function ChatPanel() {
  const { open, setOpen, triggerRef } = useChat()
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [draft, setDraft] = React.useState("")
  const nextId = React.useRef(0)

  const close = React.useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [setOpen, triggerRef])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
    }
  }

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    nextId.current += 1
    const userMessage: ChatMessage = {
      id: `msg-${nextId.current}`,
      role: "user",
      content: trimmed,
    }
    nextId.current += 1
    const assistantMessage: ChatMessage = {
      id: `msg-${nextId.current}`,
      role: "assistant",
      content: PLACEHOLDER_REPLY,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setDraft("")
  }

  return (
    <aside
      aria-label="Chat"
      onKeyDown={handleKeyDown}
      className={cx(
        "flex h-full shrink-0 flex-col overflow-hidden bg-white transition-[width] duration-150 ease-in-out dark:bg-gray-950",
        open
          ? "w-96 border-l border-gray-200 dark:border-gray-800"
          : "w-0 border-l-0",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Console assistant
        </h2>
        <Button variant="ghost" className="!p-2" onClick={close}>
          <X className="size-[18px] shrink-0" aria-hidden="true" />
          <span className="sr-only">Close chat</span>
        </Button>
      </div>
      <MessageList messages={messages} onExampleSelect={setDraft} />
      <Composer value={draft} onChange={setDraft} onSend={handleSend} />
    </aside>
  )
}
