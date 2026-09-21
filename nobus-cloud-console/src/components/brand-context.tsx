"use client";
import { createContext,useContext,useEffect,useState } from "react";
import { brand as defaults } from "@/lib/brand";
type Brand=typeof defaults;
const C=createContext<Brand>(defaults);
export function BrandProvider({children}:{children:React.ReactNode}){const [brand,setBrand]=useState(defaults);useEffect(()=>{fetch('/api/brand',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(v){setBrand({...defaults,...v});if(v.primary)document.documentElement.style.setProperty('--brand-primary',v.primary)}}).catch(()=>{})},[]);return <C.Provider value={brand}>{children}</C.Provider>}
export function useBrand(){return useContext(C)}
