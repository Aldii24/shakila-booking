import {AdminApp} from "@/components/admin-app";export default async function Page({params}:{params:Promise<{id:string}>}){return <AdminApp view="customer" id={(await params).id}/>}
