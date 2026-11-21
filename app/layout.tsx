import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRAVAH | Mumbai Monsoon Road Repair Audit & Citizen Accountability",
  description:
    "Minimal civic-tech audit and citizen accountability copilot for BMC monsoon road repairs and DLP warranty enforcement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
