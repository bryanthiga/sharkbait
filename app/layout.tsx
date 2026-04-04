import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sharkbait — Shark sightings near you",
  description:
    "Track shark sightings around the world. Map-first, mobile-friendly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
