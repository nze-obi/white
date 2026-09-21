import { NextRequest } from "next/server"; import { callNobus,jsonResponse } from "@/lib/server-api";
export async function POST(req:NextRequest){ const body=await req.text(); return jsonResponse(await callNobus("/api/v3/auth/login/initiate",{method:"POST",body})); }
