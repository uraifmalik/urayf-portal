import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Spline_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand fonts — Part 3. Self-hosted and optimised by next/font.
// Only the weights the brand system uses are loaded, nothing extra.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "urayf — business intelligence for owners and franchisees",
  description:
    "urayf is a boutique business intelligence firm. Custom-crafted reports for store owners who want to understand their business down to the hour.",
};

/* Set the theme, motion, and sidebar attributes on <html>
   SYNCHRONOUSLY, before first paint, so a returning user never
   sees a frame of the default. Mount effects reconcile to the
   same values. Keys: urayf-theme, urayf-motion, urayf-sidebar. */
const themeInitScript = `(function(){try{var t=localStorage.getItem('urayf-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var m=localStorage.getItem('urayf-motion');if(m==='full'||m==='reduced'){document.documentElement.setAttribute('data-motion',m);}else if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','reduced');}var s=localStorage.getItem('urayf-sidebar');document.documentElement.setAttribute('data-sidebar',(s==='rail'||s==='hidden'||s==='open')?s:'open');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${splineSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
