import { Sidebar } from "@/components/sidebar"; import { Topbar } from "@/components/topbar";
export default function ConsoleLayout({children}:{children:React.ReactNode}){return <div className="min-h-screen"><Sidebar/><div className="lg:pl-[var(--sidebar-width)]"><Topbar/><main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main></div></div>}
