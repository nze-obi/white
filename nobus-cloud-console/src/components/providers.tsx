"use client";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query"; import { useState } from "react"; import { CloudContextProvider } from "@/components/cloud-context"; import { BrandProvider } from "@/components/brand-context";
export function Providers({children}:{children:React.ReactNode}){ const [client]=useState(()=>new QueryClient({defaultOptions:{queries:{staleTime:15000,retry:1,refetchOnWindowFocus:false}}})); return <QueryClientProvider client={client}><BrandProvider><CloudContextProvider>{children}</CloudContextProvider></BrandProvider></QueryClientProvider> }
