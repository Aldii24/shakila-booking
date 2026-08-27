import {handleAdmin} from "@/lib/admin-http";
type Context={params:Promise<{segments:string[]}>};
export async function GET(request:Request,{params}:Context){return handleAdmin(request,(await params).segments)}
export async function POST(request:Request,{params}:Context){return handleAdmin(request,(await params).segments)}
export async function PATCH(request:Request,{params}:Context){return handleAdmin(request,(await params).segments)}
export async function DELETE(request:Request,{params}:Context){return handleAdmin(request,(await params).segments)}
