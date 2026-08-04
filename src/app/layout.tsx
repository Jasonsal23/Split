import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Split — Train Honest";
const DESCRIPTION =
  "An adaptive running coach that rewrites your plan based on how you actually ran.";

export const metadata: Metadata = {
  metadataBase: new URL("https://split-nu-eight.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Split",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Split",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col bg-zinc-950 text-zinc-100"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <script
          // iOS reports an incorrect 100dvh on the very first paint after a
          // standalone-PWA launch, then corrects it on the first touch/scroll
          // — measuring the real height in JS up front avoids that jump.
          dangerouslySetInnerHTML={{
            __html: `(function(){function setAppVh(){document.documentElement.style.setProperty('--app-vh', window.innerHeight + 'px');}setAppVh();window.addEventListener('resize', setAppVh);window.addEventListener('orientationchange', setAppVh);})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
