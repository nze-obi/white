import { NextRequest, NextResponse } from "next/server";
const base=(process.env.NOBUS_API_BASE_URL || "https://cloud-api.nobus.io").replace(/\/$/,"");
export const cookieOptions={ httpOnly:true, sameSite:"lax" as const, secure:process.env.NODE_ENV==="production", path:"/", maxAge:60*60*12 };
export async function callNobus(path:string, init:RequestInit={}){
  const headers=new Headers(init.headers); if(!headers.has("Accept")) headers.set("Accept","application/json"); if(init.body && typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type","application/json"); return fetch(`${base}${path}`, {...init, headers, cache:"no-store"});
}
export async function jsonResponse(res:Response){ const text=await res.text(); const headers=new Headers({"Content-Type":res.headers.get("content-type")||"application/json"}); return new NextResponse(text||null,{status:res.status,headers}); }
export function checkOrigin(req:NextRequest){ const origin=req.headers.get("origin"); if(!origin) return true; try{return new URL(origin).host===req.nextUrl.host}catch{return false} }
