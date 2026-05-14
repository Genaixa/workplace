import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Work Place – Shared Office Space, Gateshead",
  description: "A shared office space for dynamic women. Drop-in desk passes, hot desks and fixed desks in Gateshead.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
