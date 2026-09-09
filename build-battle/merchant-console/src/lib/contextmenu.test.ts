import { describe, expect, it } from "vitest"
import { shouldInterceptContextMenu } from "./contextmenu"

/**
 * The feedback dialog hijacks the browser's native right-click menu, so this
 * predicate is the one place that decides when that is and is not allowed.
 * It stays a pure structural check (no real MouseEvent) so it is testable
 * without a DOM: Shift is the escape hatch back to the native menu, and any
 * editable target (input/textarea/select/contentEditable) needs its own
 * native context menu for cut/paste to keep working.
 */

describe("shouldInterceptContextMenu", () => {
  it("intercepts a plain right-click on a DIV", () => {
    expect(
      shouldInterceptContextMenu({
        shiftKey: false,
        defaultPrevented: false,
        targetTag: "DIV",
      }),
    ).toBe(true)
  })

  it("does not intercept when shift is held", () => {
    expect(
      shouldInterceptContextMenu({
        shiftKey: true,
        defaultPrevented: false,
        targetTag: "DIV",
      }),
    ).toBe(false)
  })

  it("does not intercept when the event is already prevented", () => {
    expect(
      shouldInterceptContextMenu({
        shiftKey: false,
        defaultPrevented: true,
        targetTag: "DIV",
      }),
    ).toBe(false)
  })

  it.each(["INPUT", "TEXTAREA", "SELECT", "input", "textarea", "select"])(
    "does not intercept on a %s target, any case",
    (targetTag) => {
      expect(
        shouldInterceptContextMenu({
          shiftKey: false,
          defaultPrevented: false,
          targetTag,
        }),
      ).toBe(false)
    },
  )

  it("does not intercept an editable target", () => {
    expect(
      shouldInterceptContextMenu({
        shiftKey: false,
        defaultPrevented: false,
        targetTag: "DIV",
        targetEditable: true,
      }),
    ).toBe(false)
  })

  it("intercepts when targetTag is missing", () => {
    expect(
      shouldInterceptContextMenu({
        shiftKey: false,
        defaultPrevented: false,
      }),
    ).toBe(true)
  })
})
