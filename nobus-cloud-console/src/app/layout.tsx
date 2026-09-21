import type { Metadata } from "next"; import "./globals.css"; import { Providers } from "@/components/providers"; import { brand } from "@/lib/brand";
export const metadata:Metadata={title:{default:brand.name,template:`%s | ${brand.name}`},description:"White-label cloud infrastructure console"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{"--brand-primary":brand.primary} as React.CSSProperties}><Providers>{children}</Providers></body></html>}
