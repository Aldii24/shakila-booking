import React from "react";

export type ConfirmationEmailProps={brand:"glamping"|"jeep";businessName:string;customerName:string;bookingCode:string;reservation:string;paidAmount:string;remainingAmount:string;invoiceState:string;invoiceNumber?:string|null};

export function ConfirmationEmail(props:ConfirmationEmailProps){
  const glamping=props.brand==="glamping",accent=glamping?"#244b37":"#c65325",background=glamping?"#f5f1e8":"#f3efe7",ink=glamping?"#17251d":"#1d1c19";
  return <html>
    <head><title>{`Reservasi ${props.bookingCode} dikonfirmasi`}</title></head>
    <body style={{margin:0,backgroundColor:background,fontFamily:"Arial,sans-serif",color:ink}}>
      <div style={{display:"none",maxHeight:0,overflow:"hidden"}}>{`Reservasi ${props.bookingCode} telah dikonfirmasi`}</div>
      <div style={{maxWidth:"600px",margin:"36px auto",backgroundColor:"#ffffff",border:"1px solid #dedbd2"}}>
        <div style={{padding:"30px 40px 26px",borderTop:`6px solid ${accent}`}}>
          <table role="presentation" style={{width:"100%",borderCollapse:"collapse"}}><tbody><tr>
            <td><p style={{margin:0,color:accent,fontSize:"11px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase"}}>{props.businessName}</p></td>
            <td style={{textAlign:"right",fontSize:"11px",color:"#77756f"}}>KONFIRMASI RESERVASI</td>
          </tr></tbody></table>
          <h1 style={{color:ink,fontSize:"32px",lineHeight:"1.14",letterSpacing:"-1px",margin:"34px 0 0"}}>Perjalanan Anda<br/>telah diamankan.</h1>
        </div>
        <div style={{padding:"6px 40px 38px"}}>
          <p style={{fontSize:"16px",lineHeight:"1.65",margin:"0 0 8px"}}>{`Halo ${props.customerName},`}</p>
          <p style={{fontSize:"15px",lineHeight:"1.65",color:"#55534e",margin:"0 0 26px"}}>Pembayaran DP telah diverifikasi. Berikut detail reservasi yang sudah kami amankan untuk Anda.</p>
          <div style={{backgroundColor:background,border:`1px solid ${glamping?"#d7d2c5":"#ddd3c6"}`}}>
            <table role="presentation" style={{width:"100%",borderCollapse:"collapse"}}><tbody>
              <tr><td style={{padding:"16px 20px",fontSize:"10px",fontWeight:700,letterSpacing:"1.5px",color:"#74716a",borderBottom:"1px solid #d9d5cb"}}>KODE BOOKING</td><td style={{padding:"16px 20px",fontSize:"17px",fontWeight:700,textAlign:"right",color:ink,borderBottom:"1px solid #d9d5cb"}}>{props.bookingCode}</td></tr>
              <tr><td colSpan={2} style={{padding:"22px 20px"}}><p style={{margin:"0 0 7px",fontSize:"10px",fontWeight:700,letterSpacing:"1.5px",color:accent}}>DETAIL RESERVASI</p><p style={{margin:0,fontSize:"16px",lineHeight:"1.55",fontWeight:600,color:ink}}>{props.reservation}</p></td></tr>
            </tbody></table>
          </div>
          <table role="presentation" style={{width:"100%",borderCollapse:"collapse",marginTop:"22px"}}><tbody>
            <tr><td style={{padding:"11px 0",fontSize:"14px",color:"#66635d",borderBottom:"1px solid #e4e1da"}}>DP terverifikasi</td><td style={{padding:"11px 0",fontSize:"15px",fontWeight:700,textAlign:"right",color:ink,borderBottom:"1px solid #e4e1da"}}>{props.paidAmount}</td></tr>
            <tr><td style={{padding:"11px 0",fontSize:"14px",color:"#66635d",borderBottom:"1px solid #e4e1da"}}>Sisa pembayaran</td><td style={{padding:"11px 0",fontSize:"15px",fontWeight:700,textAlign:"right",color:ink,borderBottom:"1px solid #e4e1da"}}>{props.remainingAmount}</td></tr>
            <tr><td style={{padding:"11px 0",fontSize:"14px",color:"#66635d"}}>Invoice</td><td style={{padding:"11px 0",fontSize:"13px",fontWeight:700,textAlign:"right",color:accent}}>{props.invoiceState}{props.invoiceNumber?` · ${props.invoiceNumber}`:""}</td></tr>
          </tbody></table>
          <p style={{fontSize:"12px",lineHeight:"1.6",color:"#77746d",margin:"28px 0 0",paddingTop:"18px",borderTop:"1px solid #e4e1da"}}>Simpan kode booking ini. Detail reservasi hanya dapat dibuka dengan kode booking serta email atau WhatsApp yang digunakan saat memesan.</p>
        </div>
      </div>
    </body>
  </html>;
}
