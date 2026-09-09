import { cx, focusRing } from "@/lib/utils"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const EXAMPLE_QUESTIONS = [
  "Show me disputed payments",
  "What was yesterday's captured volume?",
  "Give me a CSV of last week's refunds",
]

export function MessageList({
  messages,
  onExampleSelect,
}: {
  messages: ChatMessage[]
  onExampleSelect: (text: string) => void
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Ask about payments, disputes, and payouts in this console.
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLE_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onExampleSelect(question)}
              className={cx(
                "rounded-md border px-3 py-2 text-left text-sm transition",
                "border-gray-200 text-gray-700 hover:bg-gray-100",
                "dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/80",
                focusRing,
              )}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cx(
            "max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm",
            message.role === "user"
              ? "self-end bg-blue-500 text-white dark:bg-blue-500"
              : "self-start bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-50",
          )}
        >
          {message.content}
        </div>
      ))}
    </div>
  )
}
