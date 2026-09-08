import { GetObjectCommand,PutObjectCommand,S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PDFDocument,StandardFonts,rgb } from "pdf-lib";
import { sql } from "drizzle-orm";
import { getDb,type BookingDatabase } from "@booking/database";
import { getIntegrationMode } from "@booking/validation";

const rows=<T>(value:unknown)=>value as T[];
type InvoiceSnapshot={invoiceId:string;invoiceNumber:string;status:string;bookingCode:string;businessName:string;businessSlug:string;customerName:string;customerEmail:string;customerWhatsapp:string;bookingType:string;productName:string;startDate:string;endDate:string|null;departureTime:string|null;quantity:number;guestCount:number;unitPrice:number;subtotal:number;total:number;dpPercentage:number;paid:number;remaining:number;paymentStatus:string;issuedAt:string;r2ObjectKey:string|null;fileName:string|null};
function r2Config(){const accountId=process.env.R2_ACCOUNT_ID,accessKeyId=process.env.R2_ACCESS_KEY_ID,secretAccessKey=process.env.R2_SECRET_ACCESS_KEY,bucket=process.env.R2_BUCKET_NAME||process.env.R2_PAYMENT_PROOFS_BUCKET_NAME;if(!accountId||!accessKeyId||!secretAccessKey||!bucket)throw new Error("R2 storage is not configured.");return {bucket,client:new S3Client({region:"auto",endpoint:`https://${accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId,secretAccessKey}})};}
async function snapshot(bookingId:string,database:BookingDatabase){const item=rows<InvoiceSnapshot>(await database.execute(sql`select i.id as "invoiceId",i.invoice_number as "invoiceNumber",i.status,i.r2_object_key as "r2ObjectKey",i.file_name as "fileName",i.issued_at::text as "issuedAt",b.booking_code as "bookingCode",bu.name as "businessName",bu.slug as "businessSlug",b.customer_name as "customerName",b.customer_email as "customerEmail",b.customer_whatsapp as "customerWhatsapp",b.booking_type as "bookingType",coalesce(bd.product_name_snapshot,g.product_name_snapshot,j.package_name_snapshot) as "productName",coalesce(bd.check_in_date,g.check_in_date,j.tour_date)::text as "startDate",coalesce(bd.check_out_date,g.check_out_date)::text as "endDate",j.departure_time_snapshot::text as "departureTime",b.quantity,b.guest_count as "guestCount",coalesce(bd.unit_price_snapshot,g.unit_price_snapshot,j.unit_price_snapshot)::int as "unitPrice",b.subtotal_amount::int as subtotal,b.total_amount::int as total,b.dp_percentage as "dpPercentage",b.verified_paid_amount::int as paid,b.remaining_amount::int as remaining,b.payment_status as "paymentStatus" from invoices i join bookings b on b.id=i.booking_id join businesses bu on bu.id=b.business_id left join bundle_booking_details bd on bd.booking_id=b.id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id where b.id=${bookingId}::uuid and b.status in ('CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED') limit 1`))[0];if(!item)throw new Error("Confirmed booking invoice was not found.");return item;}
const rupiah=(value:number)=>`Rp${new Intl.NumberFormat("id-ID").format(value)}`;
export const invoicePaymentLabel = (remaining: number) => remaining > 0 ? "DP TERBAYAR" : "LUNAS";
export async function renderInvoicePdf(item:InvoiceSnapshot){
  const pdf=await PDFDocument.create(),page=pdf.addPage([595,842]);
  const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink=rgb(.08,.09,.08),muted=rgb(.38,.39,.36),line=rgb(.77,.76,.7),paper=rgb(.975,.97,.94);
  const accent=item.businessSlug==="glamping"?rgb(.15,.29,.2):rgb(.72,.27,.1);
  const right=(value:string,y:number,size=10,font=regular)=>page.drawText(value,{x:547-font.widthOfTextAtSize(value,size),y,size,font,color:ink});
  const date=(value:string)=>new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}).format(new Date(value.length===10?`${value}T00:00:00+07:00`:value));
  page.drawRectangle({x:0,y:0,width:595,height:842,color:paper});
  page.drawRectangle({x:42,y:42,width:4,height:758,color:accent});
  page.drawText(item.businessName.toUpperCase(),{x:70,y:765,size:13,font:bold,color:ink});
  page.drawText(item.businessSlug==="glamping"?"H O S P I T A L I T A S   B R O M O":"P E R J A L A N A N   B R O M O",{x:70,y:747,size:7,font:regular,color:muted});
  right("INVOIS",754,30,bold);
  right(item.invoiceNumber,726,11,bold);

  page.drawText("D I T A G I H K A N   K E P A D A",{x:70,y:674,size:7,font:bold,color:muted});
  page.drawText(item.customerName,{x:70,y:649,size:14,font:bold,color:ink});
  page.drawText(item.customerEmail,{x:70,y:631,size:9,font:regular,color:muted});
  page.drawText(item.customerWhatsapp,{x:70,y:616,size:9,font:regular,color:muted});
  page.drawText("D E T A I L   D O K U M E N",{x:342,y:674,size:7,font:bold,color:muted});
  page.drawText("Kode booking",{x:342,y:649,size:9,font:regular,color:muted});right(item.bookingCode,649,9,bold);
  page.drawText("Tanggal terbit",{x:342,y:630,size:9,font:regular,color:muted});right(date(item.issuedAt),630,9,bold);
  page.drawText("Status",{x:342,y:611,size:9,font:regular,color:muted});right(invoicePaymentLabel(item.remaining),611,9,bold);

  page.drawText("RINCIAN RESERVASI",{x:70,y:553,size:20,font:regular,color:ink});
  page.drawLine({start:{x:70,y:536},end:{x:547,y:536},thickness:.8,color:line});
  page.drawText("DESKRIPSI",{x:70,y:516,size:8,font:bold,color:muted});
  right("NILAI",516,8,bold);
  page.drawText(item.productName,{x:70,y:484,size:13,font:bold,color:ink});
  const schedule=item.endDate?`${date(item.startDate)} hingga ${date(item.endDate)}`:`${date(item.startDate)} / ${item.departureTime ? `${item.departureTime.slice(0,5)} WIB` : "Jadwal Keberangkatan"}`;
  page.drawText(schedule,{x:70,y:465,size:9,font:regular,color:muted});
  page.drawText(`${item.quantity} unit / ${item.guestCount} tamu / ${rupiah(item.unitPrice)} per unit`,{x:70,y:447,size:9,font:regular,color:muted});
  right(rupiah(item.subtotal),484,11,bold);
  page.drawLine({start:{x:70,y:421},end:{x:547,y:421},thickness:.8,color:line});

  const totalRow=(label:string,value:string,y:number,strong=false)=>{
    page.drawText(label,{x:335,y,size:strong?11:9,font:strong?bold:regular,color:strong?ink:muted});
    right(value,y,strong?12:10,strong?bold:regular);
  };
  totalRow("Subtotal",rupiah(item.subtotal),390);
  totalRow("Total reservasi",rupiah(item.total),363,true);
  totalRow("Pembayaran terverifikasi",rupiah(item.paid),332);
  page.drawLine({start:{x:335,y:314},end:{x:547,y:314},thickness:.8,color:line});
  totalRow("Sisa pembayaran",rupiah(item.remaining),286,true);

  page.drawRectangle({x:70,y:204,width:477,height:48,color:accent});
  page.drawText(item.remaining>0?"DP TERBAYAR":"LUNAS",{x:88,y:222,size:12,font:bold,color:rgb(1,1,1)});
  const paidText=`Terverifikasi ${rupiah(item.paid)}`;
  page.drawText(paidText,{x:529-regular.widthOfTextAtSize(paidText,9),y:223,size:9,font:regular,color:rgb(1,1,1)});

  page.drawText("C A T A T A N",{x:70,y:154,size:7,font:bold,color:muted});
  page.drawText("Dokumen ini diterbitkan dari snapshot reservasi dan pembayaran yang telah",{x:70,y:134,size:9,font:regular,color:muted});
  page.drawText("diverifikasi server. Simpan kode booking untuk pemeriksaan reservasi.",{x:70,y:119,size:9,font:regular,color:muted});
  page.drawLine({start:{x:70,y:88},end:{x:547,y:88},thickness:.5,color:line});
  page.drawText("Dokumen elektronik / Tidak memerlukan tanda tangan",{x:70,y:68,size:8,font:regular,color:muted});
  right(`Halaman 1 / 1`,68,8,regular);
  return pdf.save();
}
export async function generateAndStoreInvoice(bookingId:string,database:BookingDatabase=getDb()){
  const item=await snapshot(bookingId,database);if(item.status==="GENERATED"&&item.r2ObjectKey)return {invoiceNumber:item.invoiceNumber,objectKey:item.r2ObjectKey,duplicate:true};
  try{const bytes=await renderInvoicePdf(item),{client,bucket}=r2Config(),objectKey=`invoices/${item.businessSlug}/${item.bookingCode}/${item.invoiceNumber}.pdf`,fileName=`${item.invoiceNumber}.pdf`;await client.send(new PutObjectCommand({Bucket:bucket,Key:objectKey,Body:bytes,ContentType:"application/pdf",ContentDisposition:`attachment; filename="${fileName}"`}));await database.transaction(async tx=>{await tx.execute(sql`update invoices set status='GENERATED',r2_object_key=${objectKey},file_name=${fileName},mime_type='application/pdf',file_size=${bytes.length},generated_at=now(),updated_at=now() where id=${item.invoiceId}::uuid`);await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,'INVOICE_GENERATED','BACKGROUND_JOB','Invoice berhasil dibuat',${JSON.stringify({invoiceNumber:item.invoiceNumber})}::jsonb)`);});return {invoiceNumber:item.invoiceNumber,objectKey,duplicate:false};}catch(error){await database.transaction(async tx=>{await tx.execute(sql`update invoices set status='FAILED',updated_at=now() where id=${item.invoiceId}::uuid`);await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title) values (${bookingId}::uuid,'INVOICE_FAILED','BACKGROUND_JOB','Pembuatan invoice gagal')`);});throw error;}
}
export async function getInvoiceDownload(bookingId:string,database:BookingDatabase=getDb()){const item=rows<{invoiceNumber:string;status:string;objectKey:string|null;fileName:string|null}>(await database.execute(sql`select invoice_number as "invoiceNumber",status,r2_object_key as "objectKey",file_name as "fileName" from invoices where booking_id=${bookingId}::uuid limit 1`))[0];if(!item)return {status:"PENDING" as const};if(item.status!=="GENERATED"||!item.objectKey)return {status:item.status};const {client,bucket}=r2Config();return {status:"GENERATED" as const,invoiceNumber:item.invoiceNumber,fileName:item.fileName,url:await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:item.objectKey}),{expiresIn:300})};}

export async function generateDirectInvoice(
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  const item = await snapshot(bookingId, database);
  if (item.status === "GENERATED" && !item.r2ObjectKey) {
    return { invoiceNumber: item.invoiceNumber, fileName: item.fileName, duplicate: true };
  }
  try {
    const bytes = await renderInvoicePdf(item);
    const fileName = `${item.invoiceNumber}.pdf`;
    await database.transaction(async (tx) => {
      await tx.execute(sql`
        update invoices set status = 'GENERATED', r2_object_key = null,
          file_name = ${fileName}, mime_type = 'application/pdf', file_size = ${bytes.length},
          generated_at = now(), updated_at = now()
        where id = ${item.invoiceId}::uuid
      `);
      const exists = rows<{ exists: boolean }>(
        await tx.execute(sql`
          select exists(
            select 1 from booking_events
            where booking_id = ${bookingId}::uuid and event_type = 'INVOICE_GENERATED'
          ) as exists
        `),
      )[0];
      if (!exists?.exists) {
        await tx.execute(sql`
          insert into booking_events (booking_id, event_type, actor_type, title, metadata)
          values (${bookingId}::uuid, 'INVOICE_GENERATED', 'BACKGROUND_JOB',
            'Pratinjau PDF invoice siap',
            ${JSON.stringify({ invoiceNumber: item.invoiceNumber, storage: "DIRECT" })}::jsonb)
        `);
      }
    });
    return { invoiceNumber: item.invoiceNumber, fileName, duplicate: false };
  } catch (error) {
    await database.execute(sql`update invoices set status = 'FAILED', updated_at = now() where id = ${item.invoiceId}::uuid`);
    throw error;
  }
}

export async function prepareInvoice(
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  const mode = getIntegrationMode();
  if (mode.invoiceStorage === "direct") {
    if (mode.appMode !== "demo") throw new Error("Direct invoice storage requires APP_MODE=demo.");
    return generateDirectInvoice(bookingId, database);
  }
  return generateAndStoreInvoice(bookingId, database);
}

export async function getDirectInvoicePdf(
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  const mode = getIntegrationMode();
  if (mode.appMode !== "demo" || mode.invoiceStorage !== "direct") {
    throw new Error("Direct invoice download is not enabled.");
  }
  const item = await snapshot(bookingId, database);
  if (item.status !== "GENERATED") return { status: item.status as "PENDING" | "FAILED" };
  return {
    status: "GENERATED" as const,
    invoiceNumber: item.invoiceNumber,
    fileName: item.fileName ?? `${item.invoiceNumber}.pdf`,
    bytes: await renderInvoicePdf(item),
  };
}

export async function getSecureInvoicePdf(
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  const mode = getIntegrationMode();
  if (mode.invoiceStorage === "direct") return getDirectInvoicePdf(bookingId, database);
  const item = rows<{ invoiceNumber: string; status: string; objectKey: string | null; fileName: string | null }>(
    await database.execute(sql`
      select invoice_number as "invoiceNumber",status,r2_object_key as "objectKey",file_name as "fileName"
      from invoices where booking_id=${bookingId}::uuid limit 1
    `),
  )[0];
  if (!item) return { status: "PENDING" as const };
  if (item.status !== "GENERATED" || !item.objectKey) {
    return { status: item.status as "PENDING" | "FAILED" };
  }
  const { client, bucket } = r2Config();
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: item.objectKey }));
  if (!object.Body) throw new Error("Stored invoice PDF has no response body.");
  return {
    status: "GENERATED" as const,
    invoiceNumber: item.invoiceNumber,
    fileName: item.fileName ?? `${item.invoiceNumber}.pdf`,
    bytes: await object.Body.transformToByteArray(),
  };
}

export async function ensureSecureInvoicePdf(
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  const current = await getSecureInvoicePdf(bookingId, database);
  if (current.status === "GENERATED") return current;

  try {
    await prepareInvoice(bookingId, database);
  } catch {
    // Payment remains authoritative even when PDF storage is temporarily unavailable.
    // Returning the persisted invoice state lets the client offer a safe retry.
  }

  return getSecureInvoicePdf(bookingId, database);
}
