import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSATM CodePulse | MCA Placement Analytics",
  description: "Coding activity and placement analytics for DSATM MCA students.",
  icons: {
    icon: "/dsi_logo.png",
  },
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
