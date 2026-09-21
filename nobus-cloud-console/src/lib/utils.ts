import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function titleCase(value: string) { return value.replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase()); }
export function safeString(value: unknown) { if (value == null) return "—"; if (typeof value === "object") return JSON.stringify(value); return String(value); }
export function unwrapData(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const x=value as Record<string,unknown>;
  for (const key of ["data","items","results","servers","volumes","networks","projects","images","flavors","keypairs","containers","credentials"]) if (key in x) return x[key];
  return value;
}
export function findArray(value: unknown): Record<string,unknown>[] {
  const u=unwrapData(value);
  if (Array.isArray(u)) return u.filter(v=>v && typeof v==='object') as Record<string,unknown>[];
  if (u && typeof u==='object') {
    for (const v of Object.values(u as Record<string,unknown>)) if (Array.isArray(v)) return v.filter(x=>x && typeof x==='object') as Record<string,unknown>[];
    return [u as Record<string,unknown>];
  }
  return [];
}
