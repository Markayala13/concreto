import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#141414",
};

export const metadata: Metadata = {
  title: "M.A.N Concrete and Landscaping · Concrete Contractor in Omaha, NE",
  description:
    "Concrete and landscaping in the Omaha metro — driveways, sidewalks, garage & basement floors, retaining walls, patios and stamped concrete. Residential & commercial. Free estimates. Se habla español. (402) 301-2004.",
  openGraph: {
    title: "M.A.N Concrete and Landscaping — Built on a Strong Foundation",
    description:
      "Omaha concrete and landscaping, done right the first time. Driveways, floors, retaining walls, patios and stamped concrete. Free estimates. Se habla español.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Enables the scroll-reveal animations (CSS targets `html.js .reveal`).
            Runs before paint so content is never hidden for no-JS visitors. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.className+=' js';" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
