import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garage | Fire Department Brief",
  description: "Live, source-linked fire department intelligence for sales calls.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
