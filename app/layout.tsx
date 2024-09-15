"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import { createNetworkConfig, SuiClientProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <EnokiFlowProvider apiKey={process.env.NEXT_PUBLIC_ENOKI_PUB_KEY!}>
        {/* <EnokiFlowProvider apiKey='enoki_public_11f2ef0dc9c84cc1ca735f3498a36097'> */}
          <body className={inter.className}>{children}</body>
          <Analytics />
          <Toaster closeButton  />
        </EnokiFlowProvider>
      </SuiClientProvider>
    </html>
  );
}
