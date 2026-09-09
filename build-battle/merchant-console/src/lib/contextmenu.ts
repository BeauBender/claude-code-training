/**
 * Whether a right-click should be hijacked to open the feedback dialog,
 * instead of showing the browser's native context menu.
 *
 * Pure and DOM-free on purpose: `FeedbackTrigger` builds this structural
 * input from a real `MouseEvent`, so the decision itself stays unit-testable
 * without jsdom.
 */
export type ContextMenuInput = {
  shiftKey: boolean
  defaultPrevented: boolean
  targetTag?: string
  targetEditable?: boolean
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

export function shouldInterceptContextMenu(e: ContextMenuInput): boolean {
  if (e.shiftKey) return false
  if (e.defaultPrevented) return false
  if (e.targetEditable) return false
  if (e.targetTag && EDITABLE_TAGS.has(e.targetTag.toUpperCase())) {
    return false
  }
  return true
}
