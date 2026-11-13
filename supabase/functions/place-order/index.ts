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
      const {data,error}=await db.from('orders').select('order_number,receipt_token,date,subtotal,shipping,discount,total,payment,payment_status,status,tracking_carrier,tracking_number,tracking_url').eq('order_number',body.order_number).eq('receipt_token',body.receipt_token).maybeSingle();
      if(error||!data)return fail('Order receipt not found',404);
      const {receipt_token:unused,...safe}=data;return json({order:safe});
    }
    if(body.action==='claim'){
      const bearer=req.headers.get('authorization')||'';
      if(!bearer.startsWith('Bearer '))return fail('Sign in to link an order',401);
      const {data:identity,error:identityError}=await db.auth.getUser(bearer.slice(7));
      if(identityError||!identity.user)return fail('Session expired. Sign in again.',401);
      if(!/^[A-Z0-9-]{8,28}$/.test(String(body.order_number||''))||
         !/^[-a-f0-9]{36}$/i.test(String(body.receipt_token||'')))return fail('Invalid order receipt');
      const {data:existing,error:lookupError}=await db.from('orders')
        .select('id,user_id').eq('order_number',body.order_number).eq('receipt_token',body.receipt_token).maybeSingle();
      if(lookupError||!existing)return fail('No matching verified receipt found',404);
      if(existing.user_id&&existing.user_id!==identity.user.id)return fail('This order is linked to another account',403);
      if(!existing.user_id){
        const {data:linked,error:linkError}=await db.from('orders').update({user_id:identity.user.id})
           .eq('id',existing.id).is('user_id',null).select('id').maybeSingle();
        if(linkError)return fail('Unable to link this order',503);
        if(!linked){const {data:now}=await db.from('orders').select('user_id').eq('id',existing.id).single();
          if(now?.user_id!==identity.user.id)return fail('This order cannot be linked',403)}
      }
      return json({ok:true});
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
    // Account REQUIRED for new orders. Do not accept a browser-supplied user_id.
    // This check remains mandatory even when gateway Verify JWT is off for receipt/claim actions.
    const bearer=req.headers.get('authorization')||'';
    if(!bearer.startsWith('Bearer '))return fail('Please sign in or create an account before ordering.',401);
    const {data:identity,error:identityError}=await db.auth.getUser(bearer.slice(7));
    if(identityError||!identity?.user?.id||!identity.user.email)return fail('Your session expired. Please sign in again.',401);
    const user_id=identity.user.id;
    const payload={idempotency_key:body.idempotency_key,customer:{name:customer.name,email:identity.user.email,phone:customer.phone,address:customer.address,city:customer.city,postal:String(customer.postal||'')},coupon:String(body.coupon||'').slice(0,40),items:orderItems};
    const {data,error}=await db.rpc('veltrix_submit_cod_order',{p_payload:payload,p_user_id:user_id});
    if(error){console.error('Checkout rejected:',error.code);return fail(error.message?.includes('stock')?error.message:error.message?.includes('coupon')?error.message:'Could not place the order. Please review your details or try again.',400)}
    return json({ok:true,order_number:data.order_number,receipt_token:data.receipt_token,total:data.total,currency:'PKR',payment:'Cash on Delivery'});
  }catch(err){console.error('checkout unexpected error:',err instanceof Error?err.message:err);return fail('Checkout unavailable. Your order was NOT placed.',503)}
});
