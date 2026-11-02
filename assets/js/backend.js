/* VELTRIX live Supabase backend. Public frontend key only; never put secret keys here. */
(()=>{'use strict';
const URL='https://hpjferomelaupnpuvupu.supabase.co';
const KEY='sb_publishable_h70iRnmjMH4MJfK0kyRLGw_byL9bH7m';
const HEAD={'apikey':KEY,'Content-Type':'application/json'};
let tokens=null;
try {tokens=JSON.parse(sessionStorage.getItem('vx_auth_session')||'null')}catch{}
const state={products:[],settings:null,loaded:false,error:null};
function errText(data,status){return data?.message||data?.error_description||data?.error||data?.hint||`Request failed (${status})`}
async function request(path,opt={}){
  const res=await fetch(URL+path,{...opt,headers:{...HEAD,...(opt.headers||{})}});
  const raw=await res.text(); let data=null;try{data=raw?JSON.parse(raw):null}catch{data={message:raw}}
  if(!res.ok)throw Error(errText(data,res.status));return data;
}
async function api(table,query='',opt={}){const tok=opt.admin?await authToken():null;return request(`/rest/v1/${table}${query?('?'+query):''}`,{...opt,headers:{...opt.headers,...(tok?{Authorization:'Bearer '+tok}:{})}})}
function mapProduct(row){return {id:row.id,slug:row.slug,name:row.name,price:Number(row.price),oldPrice:row.old_price===null?undefined:Number(row.old_price),img:row.image_url||'',desc:row.short_description||'',long:row.description||'',tags:row.tags||[],badge:row.badge||'',stock:Number(row.stock)||0,is_active:row.is_active};}
async function loadPublic(){try{
  const [products,settings]=await Promise.all([
    api('products','select=*&is_active=eq.true&order=created_at.asc'),
    api('store_settings','select=value&key=eq.main')]);
  state.products=products.map(mapProduct);state.settings=settings[0]?.value||null;
  state.loaded=true;state.error=null;
  document.dispatchEvent(new Event('vx-data-ready'));
}catch(err){state.loaded=true;state.products=[];state.error=err.message;
  console.error('VELTRIX: live database unavailable',err);
  if(!document.body.classList.contains('login-page')) {
    const warn=document.createElement('div');warn.style.cssText='position:sticky;top:0;z-index:110;background:#5c1818;color:#fff;text-align:center;padding:12px;font:12px Arial,sans-serif';warn.textContent='The store is temporarily unable to load live inventory. Checkout is unavailable.';document.body.prepend(warn);
  }
}}
async function signUp(email,password,fullName=''){
  const redirect=location.origin+location.pathname;
  return request('/auth/v1/signup?redirect_to='+encodeURIComponent(redirect),{
    method:'POST',body:JSON.stringify({email,password,data:{full_name:String(fullName).trim().slice(0,100)}})
  });
}
function adoptAuthRedirect(){
  const p=new URLSearchParams(location.hash.replace(/^#/,''));
  const typ=p.get('type')||'';
  const error=p.get('error_description')||p.get('error');
  const access=p.get('access_token');
  if(location.hash)history.replaceState(null,'',location.pathname+location.search);
  if(error)return {type:'error',message:error};
  if(!access)return {type:'none'};
  if(typ==='recovery')return {type:'recovery',accessToken:access};
  const refresh=p.get('refresh_token');
  const exp=Math.max(120,Number(p.get('expires_in')||3600));
  if(!refresh)return {type:'error',message:'Your confirmation link is incomplete. Please sign in.'};
  tokens={access_token:access,refresh_token:refresh,expires_at:Math.floor(Date.now()/1000)+exp};
  sessionStorage.setItem('vx_auth_session',JSON.stringify(tokens));
  return {type:typ||'confirmation'};
}
async function sendRecoveryEmail(email,redirectURL){
  if(!/^https:\/\//.test(redirectURL))throw Error('Password recovery requires an HTTPS website URL.');
  // GoTrue sends a one-time recovery email; the destination must be allowlisted in Supabase Auth.
  return request('/auth/v1/recover?redirect_to='+encodeURIComponent(redirectURL),{
    method:'POST',body:JSON.stringify({email:email.trim()})
  });
}
async function updateRecoveredPassword(accessToken,newPassword){
  if(!accessToken)throw Error('Recovery link expired or invalid. Request a new password reset email.');
  return request('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+accessToken},body:JSON.stringify({password:newPassword})});
}
async function currentUser(){return request('/auth/v1/user',{headers:{Authorization:'Bearer '+await authToken()}})}
async function signIn(email,password){const d=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});tokens={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(d.expires_in||3600)};sessionStorage.setItem('vx_auth_session',JSON.stringify(tokens));return d}
async function refresh(){if(!tokens?.refresh_token)throw Error('Please sign in.');const d=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:tokens.refresh_token})});tokens={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(d.expires_in||3600)};sessionStorage.setItem('vx_auth_session',JSON.stringify(tokens));return tokens.access_token}
async function authToken(){if(!tokens?.access_token)throw Error('Please sign in.');if(Date.now()/1000>tokens.expires_at-100)return refresh();return tokens.access_token}
function signOut(){tokens=null;sessionStorage.removeItem('vx_auth_session')}
async function isAdmin(){const tok=await authToken();const u=await request('/auth/v1/user',{headers:{Authorization:'Bearer '+tok}});const a=await api('admin_users','select=user_id&user_id=eq.'+encodeURIComponent(u.id),{admin:true});return a.length>0}
async function requireAdmin(){try{if(!(await isAdmin()))throw Error('Access denied. This account is not an administrator.');document.body.style.visibility='visible';return true}catch(e){signOut();location.replace('index.html?error='+encodeURIComponent(e.message));return false}}
async function placeOrder(order){const token=tokens?.access_token?await authToken().catch(()=>null):null;return request('/functions/v1/place-order',{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:JSON.stringify({action:'create',...order})})}
async function receipt(orderNumber,receiptToken){return request('/functions/v1/place-order',{method:'POST',body:JSON.stringify({action:'receipt',order_number:orderNumber,receipt_token:receiptToken})})}
async function sendContact(data){return request('/functions/v1/contact-submit',{method:'POST',body:JSON.stringify(data)})}
window.VXNET={URL,KEY,state,request,api,mapProduct,signIn,signUp,adoptAuthRedirect,sendRecoveryEmail,updateRecoveredPassword,currentUser,signOut,authToken,isAdmin,requireAdmin,placeOrder,receipt,sendContact,ready:loadPublic()};
})();
