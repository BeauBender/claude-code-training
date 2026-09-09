"use client"

import { Button } from "@/components/Button"
import { MessageSquare } from "lucide-react"

import { useChat } from "./ChatProvider"

export function ChatTrigger() {
  const { open, toggle, triggerRef } = useChat()

  return (
    <Button
      ref={triggerRef}
      variant="ghost"
      className="!p-2"
      onClick={toggle}
      aria-expanded={open}
    >
      <MessageSquare className="size-[18px] shrink-0" aria-hidden="true" />
      <span className="sr-only">Toggle chat</span>
    </Button>
  )
}
