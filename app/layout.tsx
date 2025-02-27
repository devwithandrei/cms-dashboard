import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/providers/theme-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { ModalProvider } from "@/providers/modal-provider"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dashboard',
  description: 'E-commerce Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          logoPlacement: "none",
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
        },
        variables: {
          colorPrimary: "#8B5CF6",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-[#0a101f]/95 backdrop-blur-sm border border-gray-800/50 shadow-xl",
          headerTitle: "text-gray-200",
          headerSubtitle: "text-gray-400",
          socialButtonsIconButton: "bg-gray-800/50 hover:bg-gray-700/50",
          formButtonPrimary: "bg-violet-600 hover:bg-violet-700",
          formFieldInput: "bg-gray-800/50 border-gray-700",
          formFieldLabel: "text-gray-300",
          footerActionText: "text-gray-400",
          footerActionLink: "text-violet-400 hover:text-violet-500",
          dividerLine: "bg-gray-800",
          dividerText: "text-gray-500",
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="dashboard-theme"
          >
            <ToastProvider />
            <ModalProvider />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
