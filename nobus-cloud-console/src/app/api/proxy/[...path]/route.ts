import { NextRequest,NextResponse } from "next/server"; import { callNobus,jsonResponse,checkOrigin } from "@/lib/server-api";
async function forward(req:NextRequest, context:{params:Promise<{path:string[]}>}){
  if(req.method!=="GET" && !checkOrigin(req)) return NextResponse.json({message:"Origin validation failed"},{status:403});
  const key=req.cookies.get("nobus_api_key")?.value; if(!key) return NextResponse.json({message:"Authentication required"},{status:401});
  const {path}=await context.params; const target=`/${path.join("/")}${req.nextUrl.search}`;
  const isBody=["GET","HEAD"].includes(req.method)===false; const contentType=req.headers.get("content-type")||""; const body=isBody ? (contentType.includes("multipart/form-data") ? await req.arrayBuffer() : await req.text()) : undefined;
  const headers:Record<string,string>={Authorization:`Bearer ${key}`}; if(contentType) headers["Content-Type"]=contentType;
  const res=await callNobus(target,{method:req.method,headers,body});
  if(res.status===401) { const r=await jsonResponse(res); r.cookies.set("nobus_api_key","",{path:"/",maxAge:0}); return r; }
  return jsonResponse(res);
}
export const GET=forward; export const POST=forward; export const PUT=forward; export const PATCH=forward; export const DELETE=forward;
