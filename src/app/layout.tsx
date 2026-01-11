import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Clonehaus OSR",
    description: "AI Organization OS",
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
