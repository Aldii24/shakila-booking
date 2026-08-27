import {SuccessPage} from "@/components/booking-flow";import {Footer,Header} from "@/components/site-chrome";
export default async function Page({searchParams}:{searchParams:Promise<{bookingCode?:string}>}){const {bookingCode=""}=await searchParams;return <><Header/><main className="page-shell"><SuccessPage bookingCode={bookingCode}/></main><Footer/></>}
