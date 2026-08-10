import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "./component/layout/Navbar";
import Footer from "./component/layout/Footer";
import { AuthProvider } from "./context/authContext";
import { Providers } from "./providers";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASRT.CO | Sim Racing Competition Platform",
  description: "Organize races, track leaderboards, build grids, and chase tenths with ASRT.CO Sim Racing Platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0e131f] text-[#dee2f3] font-inter">
        <Providers>
          <AuthProvider>
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
