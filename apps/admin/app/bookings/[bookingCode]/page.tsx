import {AdminApp} from "@/components/admin-app";export default async function Page({params}:{params:Promise<{bookingCode:string}>}){return <AdminApp view="booking" id={(await params).bookingCode}/>}
