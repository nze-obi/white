import { NextRequest,NextResponse } from "next/server"; export async function GET(req:NextRequest){ return NextResponse.json({authenticated:Boolean(req.cookies.get("nobus_api_key")?.value)}); }
