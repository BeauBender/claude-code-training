"use client"

import * as React from "react"

import { shouldInterceptContextMenu } from "@/lib/contextmenu"

import { FeedbackDialog } from "./FeedbackDialog"

/**
 * Mounted once, globally, in the root layout. Listens for a right-click
 * anywhere in the app; when `shouldInterceptContextMenu` says to hijack it,
 * opens the feedback dialog instead of the browser's native context menu.
 */
export function FeedbackTrigger() {
  const [open, setOpen] = React.useState(false)
  const [page, setPage] = React.useState("")

  React.useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const intercept = shouldInterceptContextMenu({
        shiftKey: event.shiftKey,
        defaultPrevented: event.defaultPrevented,
        targetTag: target?.tagName,
        targetEditable: target?.isContentEditable,
      })
      if (!intercept) return
      event.preventDefault()
      setPage(window.location.pathname)
      setOpen(true)
    }

    document.addEventListener("contextmenu", handleContextMenu)
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])

  return <FeedbackDialog open={open} page={page} onOpenChange={setOpen} />
}
