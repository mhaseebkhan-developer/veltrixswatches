// VELTRIX server-side Cash on Delivery checkout. Never trust browser totals or stock.
import {createClient} from 'npm:@supabase/supabase-js@2.57.2';
const originHeaders={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const json=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...originHeaders,'Content-Type':'application/json; charset=utf-8'}});
const url=Deno.env.get('SUPABASE_URL')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const fail=(message:string,status=400)=>json({message},status);
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:originHeaders});
  if(req.method!=='POST')return fail('Method not allowed',405);
  if(Number(req.headers.get('content-length')||0)>18000)return fail('Request too large',413);
  try {
    const body=await req.json();
    if(!body||typeof body!=='object')return fail('Invalid checkout request');
    if(body.action==='receipt'){
      if(!/^[A-Z0-9-]{8,28}$/.test(String(body.order_number||''))||!/^[-a-f0-9]{36}$/i.test(String(body.receipt_token||'')))return fail('Invalid receipt');
      const {data,error}=await db.from('orders').select('order_number,receipt_token,date,subtotal,shipping,discount,total,payment,payment_status,status').eq('order_number',body.order_number).eq('receipt_token',body.receipt_token).maybeSingle();
      if(error||!data)return fail('Order receipt not found',404);
      const {receipt_token:unused,...safe}=data;return json({order:safe});
    }
    if(body.action!=='create')return fail('Invalid action');
    // Cheap spam trap for automated submissions; humans leave it empty.
    if(body.website)return fail('Unable to place this order');
    if(!Array.isArray(body.items)||body.items.length<1||body.items.length>25)return fail('Cart must contain 1–25 products');
    if(!/^[a-f0-9-]{36}$/i.test(String(body.idempotency_key||'')))return fail('Invalid order identifier');
    const customer=body.customer||{};
    if(!['name','email','phone','address','city'].every(k=>typeof customer[k]==='string'))return fail('Enter complete shipping details');
    const orderItems=body.items.map((x:{slug?:unknown;quantity?:unknown;strap?:unknown})=>({
      slug:String(x.slug||'').slice(0,100),
      quantity:x.quantity,
      strap:String(x.strap||'Standard').slice(0,80)
    }));
    if(orderItems.some((x:{slug:string;quantity:unknown})=>!/^[-a-z0-9]{1,100}$/.test(x.slug)||!Number.isInteger(x.quantity)||Number(x.quantity)<1||Number(x.quantity)>20))return fail('Invalid cart item');
    let user_id=null;
    const bearer=req.headers.get('authorization')||'';
    if(bearer.startsWith('Bearer ')){
      const {data}=await db.auth.getUser(bearer.slice(7));
      if(data.user)user_id=data.user.id;
    }
    const payload={idempotency_key:body.idempotency_key,customer:{name:customer.name,email:customer.email,phone:customer.phone,address:customer.address,city:customer.city,postal:String(customer.postal||'')},coupon:String(body.coupon||'').slice(0,40),items:orderItems};
    const {data,error}=await db.rpc('veltrix_submit_cod_order',{p_payload:payload,p_user_id:user_id});
    if(error){console.error('Checkout rejected:',error.code);return fail(error.message?.includes('stock')?error.message:error.message?.includes('coupon')?error.message:'Could not place the order. Please review your details or try again.',400)}
    return json({ok:true,order_number:data.order_number,receipt_token:data.receipt_token,total:data.total,currency:'PKR',payment:'Cash on Delivery'});
  }catch(err){console.error('checkout unexpected error:',err instanceof Error?err.message:err);return fail('Checkout unavailable. Your order was NOT placed.',503)}
});
