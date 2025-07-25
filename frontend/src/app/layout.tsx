// src/app/layout.tsx
import { ReactNode } from "react";

export const metadata = {
  title: "RAG Legal Chatbot",
  description: "Zero-cost legal assistant built using RAG",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
