"use client";
import { createContext,useContext,useEffect,useState } from "react";
type State={projectId:string;availabilityZone:string;setProjectId:(v:string)=>void;setAvailabilityZone:(v:string)=>void};
const C=createContext<State|null>(null);
export function CloudContextProvider({children}:{children:React.ReactNode}){ const [projectId,setProjectIdState]=useState(""); const [availabilityZone,setAzState]=useState("nobus-wa-az1"); useEffect(()=>{ setProjectIdState(localStorage.getItem("nobus_project_id")||""); setAzState(localStorage.getItem("nobus_az")||"nobus-wa-az1")},[]); const setProjectId=(v:string)=>{setProjectIdState(v);localStorage.setItem("nobus_project_id",v)}; const setAvailabilityZone=(v:string)=>{setAzState(v);localStorage.setItem("nobus_az",v)}; return <C.Provider value={{projectId,availabilityZone,setProjectId,setAvailabilityZone}}>{children}</C.Provider> }
export function useCloudContext(){ const c=useContext(C); if(!c) throw new Error("Cloud context missing"); return c; }
