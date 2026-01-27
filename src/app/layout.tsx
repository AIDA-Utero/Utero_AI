import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Utero AI Avatar | PT Utero Kreatif Indonesia",
  description: "Virtual Assistant berbasis AI untuk PT Utero Kreatif Indonesia. Tanya jawab seputar layanan desain grafis, branding, dan digital marketing.",
  keywords: ["Utero", "AI", "Avatar", "Virtual Assistant", "Creative Agency", "Malang", "Desain Grafis", "Branding"],
  authors: [{ name: "PT Utero Kreatif Indonesia" }],
  openGraph: {
    title: "Utero AI Avatar",
    description: "Virtual Assistant berbasis AI untuk PT Utero Kreatif Indonesia",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport = {
  themeColor: "#991b1b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
