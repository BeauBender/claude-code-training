import { SidebarProvider, SidebarTrigger } from "@/components/Sidebar"
import { ChatPanel } from "@/components/ui/chat/ChatPanel"
import { ChatProvider } from "@/components/ui/chat/ChatProvider"
import { ChatTrigger } from "@/components/ui/chat/ChatTrigger"
import { FeedbackTrigger } from "@/components/ui/feedback/FeedbackTrigger"
import { AppSidebar } from "@/components/ui/navigation/AppSidebar"
import { Breadcrumbs } from "@/components/ui/navigation/Breadcrumbs"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import localFont from "next/font/local"
import { cookies } from "next/headers"
import "./globals.css"
import { siteConfig } from "./siteConfig"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://northwind.example"),
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: ["Payments", "Merchant console", "Operations"],
  authors: [
    {
      name: "Northwind Payments",
      url: "",
    },
  ],
  creator: "Northwind Payments",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: "@northwind",
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"
  const chatDefaultOpen = cookieStore.get("chat:state")?.value === "true"

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white-50 h-full antialiased dark:bg-gray-950`}
      >
        <ThemeProvider
          defaultTheme="system"
          disableTransitionOnChange
          attribute="class"
        >
          <FeedbackTrigger />
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <ChatProvider defaultOpen={chatDefaultOpen}>
              <div className="flex w-full">
                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
                    <SidebarTrigger className="-ml-1" />
                    <div className="mr-2 h-4 w-px bg-gray-200 dark:bg-gray-800" />
                    <Breadcrumbs />
                    <div className="ml-auto flex items-center">
                      <ChatTrigger />
                    </div>
                  </header>
                  <main className="min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-925">
                    {children}
                  </main>
                </div>
                <ChatPanel />
              </div>
            </ChatProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
