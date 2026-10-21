import type { Metadata, Viewport } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import { brandConfig } from "@nexora/config";
import { AlphaBadge } from "../components/alpha-badge";
import { AuthHydrator } from "../components/providers";
import { isAlpha } from "../lib/release";
import "./globals.css";

const display = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: isAlpha ? brandConfig.alphaLabel : brandConfig.fullName,
  description: `${brandConfig.tagline} RPG de genética evolutiva no navegador.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07060c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <AuthHydrator>
          {children}
          <AlphaBadge />
        </AuthHydrator>
      </body>
    </html>
  );
}
