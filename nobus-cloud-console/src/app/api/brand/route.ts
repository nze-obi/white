import { NextRequest,NextResponse } from "next/server";
import { brand as defaults } from "@/lib/brand";
export async function GET(req:NextRequest){let overrides:Record<string,unknown>={};try{const map=JSON.parse(process.env.WHITE_LABEL_CONFIG_JSON||"{}");const host=(req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();overrides=map[host]||{}}catch{}return NextResponse.json({...defaults,...overrides},{headers:{'Cache-Control':'private, max-age=60'}})}
