import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garage automatico",
  description:
    "Un garage automatico in pianta isometrica: binari, piattaforme girevoli, ascensore nascosto e parcheggi sul tetto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <a href="#contenuto" className="skip-link">
          Salta al contenuto
        </a>
        {children}
      </body>
    </html>
  );
}
