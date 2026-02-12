import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "AcaRead - Convert Scientific Papers to IELTS/TOEIC Exams",
  description: "Transform academic papers into professional reading comprehension exams with AI-powered technology. Perfect for educators and test prep professionals.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
    shortcut: "/images/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/images/logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="shortcut icon" href="/images/logo.png" type="image/png" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

