import {createClient} from 'npm:@supabase/supabase-js@2.57.2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const json=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers:{...cors,'Content-Type':'application/json'}});
const db=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',{auth:{persistSession:false}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return json({message:'Method not allowed'},405);
 try{
  const x=await req.json();
  if(x.website)return json({message:'Unable to process submission'},400);
  if(x.kind==='contact'){
   const {name,email,topic,message}=x;
   if(String(name||'').length<2||String(name||'').length>100||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email||''))||String(message||'').length<8||String(message||'').length>2000)return json({message:'Please enter valid contact details'},400);
   const {count}=await db.from('contact_messages').select('id',{count:'exact',head:true}).eq('email',email).gte('date',new Date(Date.now()-86400000).toISOString());
   if((count||0)>=5)return json({message:'Too many messages from this email today'},429);
   const {error}=await db.from('contact_messages').insert({name,email,topic:String(topic||'general').slice(0,100),message});
   if(error)throw error;
   return json({ok:true});
  }
  if(x.kind==='newsletter'){
   const email=String(x.email||'').trim().toLowerCase();
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>160)return json({message:'Enter a valid email'},400);
   const {error}=await db.from('newsletter_subscribers').upsert({email},{onConflict:'email'});
   if(error)throw error;return json({ok:true});
  }
  return json({message:'Invalid form type'},400);
 }catch(e){console.error('Form request failed',e);return json({message:'Unable to submit. Please try again later.'},503)}
});
