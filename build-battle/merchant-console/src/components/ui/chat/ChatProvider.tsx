"use client"

import * as React from "react"

// Mirrors src/components/Sidebar.tsx's context + cookie-persisted open
// state, scoped to the chat panel instead of the nav sidebar.

const CHAT_COOKIE_NAME = "chat:state"
const CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type ChatContextValue = {
  open: boolean
  setOpen: (value: boolean | ((open: boolean) => boolean)) => void
  toggle: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const ChatContext = React.createContext<ChatContextValue | null>(null)

export function useChat() {
  const context = React.useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider.")
  }
  return context
}

export function ChatProvider({
  defaultOpen = false,
  children,
}: {
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, _setOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const setOpen = React.useCallback(
    (value: boolean | ((open: boolean) => boolean)) => {
      _setOpen((prev) => {
        const next = typeof value === "function" ? value(prev) : value
        document.cookie = `${CHAT_COOKIE_NAME}=${next}; path=/; max-age=${CHAT_COOKIE_MAX_AGE}`
        return next
      })
    },
    [],
  )

  const toggle = React.useCallback(() => {
    setOpen((prev) => !prev)
  }, [setOpen])

  const value = React.useMemo<ChatContextValue>(
    () => ({ open, setOpen, toggle, triggerRef }),
    [open, setOpen, toggle],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
