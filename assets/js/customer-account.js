/* VELTRIXS WATCHES | Customer accounts backed by Supabase Auth + owner-only RLS.
   A browser must never act as the source of truth for customer profile/orders. */
(()=>{'use strict';
if(document.body.dataset.page!=='account')return;
const N=window.VXNET, V=window.VX, $=id=>document.getElementById(id);
const esc=s=>V.escape(String(s??''));
const fields=['customerLoginForm','customerRegisterForm','customerRecoverForm','customerResetForm','customerSignedIn'];
const views={login:'customerLoginForm',register:'customerRegisterForm',recover:'customerRecoverForm',reset:'customerResetForm',signedin:'customerSignedIn'};
const captions={login:['Welcome back.','Sign in securely to view your purchases and manage your private profile.'],register:['Create an account.','Join VELTRIXS WATCHES and manage every order in one place.'],recover:['Reset your password.','A one-time recovery link will be sent to your email.'],reset:['Choose a new password.','Secure your account with a fresh password.'],signedin:['Your private collection.','Your profile, addresses and order updates are below.']};
let user=null,profile=null,addresses=[],view='login',recoveryToken=null,busy=false;
const params=new URLSearchParams(location.search);
// Continue checkout after email confirmation without changing Supabase's existing allowed redirect URLs.
const checkoutIntentKey='vx_checkout_intent_v1';
if(params.get('next')==='checkout.html')try{localStorage.setItem(checkoutIntentKey,String(Date.now()))}catch{}
let savedCheckoutIntent=false;
try{const since=Number(localStorage.getItem(checkoutIntentKey)||0);savedCheckoutIntent=since>0&&Date.now()-since<2*60*60*1000;if(!savedCheckoutIntent)localStorage.removeItem(checkoutIntentKey)}catch{}
const pendingCheckout=params.get('next')==='checkout.html'||savedCheckoutIntent?'checkout.html':null;
function returnToCheckout(){if(pendingCheckout){try{localStorage.removeItem(checkoutIntentKey)}catch{}location.assign('checkout.html')}}
const showMessage=(id,text,bad=false)=>{const el=$(id);if(!el)return;el.textContent=text||'';el.style.color=bad?'#a43f35':'#346248'};
function show(name){view=name;for(const [k,id] of Object.entries(views))$(id).hidden=k!==name; $('authTabs').hidden=!['login','register'].includes(name);document.querySelectorAll('.auth-tab').forEach(x=>{const chosen=x.dataset.authView===name;x.classList.toggle('is-active',chosen);x.setAttribute('aria-selected',String(chosen))});$('authHeading').textContent=captions[name][0];$('authSubtitle').textContent=captions[name][1]}
function guarded(form,cb){form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;const btn=form.querySelector('[type=submit]');if(btn)btn.disabled=true;try{await cb(e)}catch(error){showMessage('customerAuthStatus',error.message||'Unable to complete your request.',true)}finally{busy=false;if(btn)btn.disabled=false}})}
async function getRows(table,filter){return N.customerApi(table,filter)}
async function saveRow(table,row,filter){return N.customerApi(table,filter||'',{method:filter?'PATCH':'POST',headers:{Prefer:filter?'return=representation':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)})}
const clean=v=>String(v||'').trim();
async function loadProfile(){
 const rows=await getRows('customer_profiles','select=id,full_name,phone&id=eq.'+encodeURIComponent(user.id));
 profile=rows[0]||null;
 $('profileName').value=profile?.full_name||user.user_metadata?.full_name||'';
 $('profilePhone').value=profile?.phone||'';$('profileEmail').value=user.email||'';
 $('dashboardEmail').textContent=user.email||'';
 $('dashboardName').textContent=(profile?.full_name||user.user_metadata?.full_name||'Collector').split(/\s+/)[0];
 $('welcomeName').textContent='Welcome, '+(profile?.full_name||user.user_metadata?.full_name||'Collector')+'.';
 $('signedInEmail').textContent=user.email||'';
}
async function loadAddresses(){
 addresses=await getRows('customer_addresses','select=*&user_id=eq.'+encodeURIComponent(user.id)+'&order=is_default.desc,created_at.desc');
 const box=$('savedAddresses');box.replaceChildren();
 if(!addresses.length){const p=document.createElement('p');p.className='vx-helper';p.textContent='No address saved yet. Add your first delivery address below.';box.append(p);return}
 for(const a of addresses){const card=document.createElement('div');card.className='vx-address-card';
   const main=document.createElement('div');main.innerHTML=`<strong>${esc(a.label)} ${a.is_default?'· DEFAULT':''}</strong><p>${esc([a.recipient_name,a.address_line,[a.city,a.province,a.postal_code].filter(Boolean).join(', '),a.phone].filter(Boolean).join('\n'))}</p>`;
   const actions=document.createElement('div');actions.className='vx-address-card-actions';
   for(const [name,action] of [['Edit','edit'],['Delete','delete']]){const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.addressAction=action;b.dataset.addressId=a.id;actions.append(b)}
   card.append(main,actions);box.append(card)}
}
function editAddress(a){$('editAddressId').value=a.id;$('addressLabel').value=a.label;$('addressRecipient').value=a.recipient_name||'';$('addressPhone').value=a.phone||'';$('addressStreet').value=a.address_line;$('addressCity').value=a.city;$('addressProvince').value=a.province||'';$('addressPostal').value=a.postal_code||'';$('addressDefault').checked=Boolean(a.is_default);$('saveAddressButton').textContent='UPDATE ADDRESS';$('addressForm').scrollIntoView({behavior:'smooth',block:'nearest'})}
function clearAddress(){$('addressForm').reset();$('editAddressId').value='';$('addressLabel').value='Home';$('saveAddressButton').textContent='SAVE ADDRESS'}
async function loadOrders(){
 if(!user)return;showMessage('ordersStatus','Syncing order history…');
 const rows=await getRows('orders','select=id,order_number,date,status,total,payment,payment_status,tracking_carrier,tracking_number,tracking_url&user_id=eq.'+encodeURIComponent(user.id)+'&order=date.desc&limit=50');
 const box=$('customerOrders');box.replaceChildren();
 showMessage('ordersStatus',rows.length?'Updated from your online account.':'');
 if(!rows.length){box.innerHTML='<p class="vx-helper">No orders linked to this account yet. Orders placed while signed in appear automatically. For a previous guest purchase, use the verified receipt option below.</p>';return}
 const statusSteps=['Pending','Processing','Shipped','Delivered'];
 for(const order of rows){
   const card=document.createElement('article');card.className='vx-order-card';
   const ts=new Date(order.date);const date=Number.isNaN(ts.valueOf())?'—':ts.toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'});
   const stage=Math.max(0,statusSteps.indexOf(order.status));const cancelled=order.status==='Cancelled';
   let link='';const u=String(order.tracking_url||'');
   try{const uri=new URL(u);if(uri.protocol==='https:')link=`<a class="vx-tracking-link" href="${esc(uri.href)}" rel="noopener noreferrer" target="_blank">TRACK ON COURIER WEBSITE ↗</a>`}catch{}
   const tracking=(order.tracking_number||order.tracking_carrier)?`<p><strong>Carrier:</strong> ${esc(order.tracking_carrier||'Not specified')} · <strong>Tracking:</strong> ${esc(order.tracking_number||'Awaiting reference')}</p>${link}`:'<p>Courier tracking will appear once provided by the store.</p>';
   card.innerHTML=`<div class="vx-order-top"><span class="vx-kicker">${esc(date)}</span><span class="vx-order-status" data-status="${esc(order.status)}">${esc(order.status)}</span></div><h3>${esc(order.order_number)}</h3><p><strong>${V.fmt(order.total)}</strong> · ${esc(order.payment||'Cash on Delivery')} · ${esc(order.payment_status||'Unpaid')}</p><div class="vx-timeline" aria-label="Order progress">${statusSteps.map((label,i)=>`<span title="${label}" class="${!cancelled&&i<=stage?'done':''}"></span>`).join('')}</div>${tracking}<button class="vx-ghost-button" type="button" data-order-items="${esc(order.id)}">VIEW ORDER ITEMS</button><div class="vx-order-items" hidden></div>`;
   box.append(card);
 }
}
async function accountReady(){
 show('signedin');$('authShell').hidden=true;$('accountDetails').hidden=false;
 await Promise.allSettled([loadProfile(),loadAddresses(),loadOrders()]).then(results=>{
  const err=results.find(x=>x.status==='rejected');if(err)showMessage('ordersStatus','Account signed in, but private data could not load. Run the included Supabase migration and check RLS: '+(err.reason?.message||'Database error'),true)
 });
}
async function authenticate(){
 try{user=await N.currentUser();if(user?.id)await accountReady();else throw Error('Not signed in')}
 catch(err){user=null;$('accountDetails').hidden=true;$('authShell').hidden=false;show('login');if(!/sign in/i.test(err.message))showMessage('customerAuthStatus','Please sign in to access private account information.',false)}
}
async function signOut(){N.signOut();user=null;profile=null;addresses=[];
 $('customerOrders').replaceChildren();$('savedAddresses').replaceChildren();
 for(const id of ['profileName','profilePhone','profileEmail','dashboardEmail','dashboardName','securityEmail'])$(id).value!==undefined?$(id).value='':$(id).textContent='';
 $('accountDetails').hidden=true;$('authShell').hidden=false;show('login');$('customerPassword').value='';showMessage('customerAuthStatus','You have signed out securely.')}
async function initialize(){
 window.VXCustomerAccount=true;
 document.querySelectorAll('[data-auth-view]').forEach(x=>x.addEventListener('click',()=>show(x.dataset.authView)));
 document.querySelectorAll('[data-reveal]').forEach(x=>x.addEventListener('click',()=>{const input=$(x.dataset.reveal);input.type=input.type==='password'?'text':'password';x.textContent=input.type==='password'?'SHOW':'HIDE'}));
 $('signOutCustomer').onclick=signOut;$('customerSignOutDashboard').onclick=signOut;
 guarded($('customerLoginForm'),async()=>{showMessage('customerAuthStatus','Signing in…');await N.signIn(clean($('customerEmail').value),$('customerPassword').value,{remember:$('rememberAccount').checked});user=await N.currentUser();await accountReady();showMessage('ordersStatus','You are securely signed in.');returnToCheckout();});
 guarded($('customerRegisterForm'),async()=>{if($('registerPassword').value!==$('registerConfirm').value)throw Error('Passwords do not match.');const email=clean($('registerEmail').value);const pass=$('registerPassword').value;const name=clean($('registerName').value);if(name.length<2)throw Error('Enter your full name.');const data=await N.signUp(email,pass,name);$('registerPassword').value='';$('registerConfirm').value='';
  if(data?.access_token){await N.signIn(email,pass,{remember:true});user=await N.currentUser();await accountReady();showMessage('customerAuthStatus','Account created successfully.');returnToCheckout();}
  else{show('login');$('customerEmail').value=email;showMessage('customerAuthStatus','If the address can be registered, a confirmation email will arrive. Open the link to activate your account.');}
 });
 guarded($('customerRecoverForm'),async()=>{await N.sendRecoveryEmail(clean($('recoverEmail').value),location.origin+location.pathname);showMessage('customerAuthStatus','If this email exists, a reset link will arrive. Please check inbox and spam.');});
 guarded($('customerResetForm'),async()=>{const pass=$('resetPassword').value;if(pass!==$('resetConfirm').value)throw Error('Passwords do not match.');await N.updateRecoveredPassword(recoveryToken,pass);recoveryToken=null;N.signOut();$('resetPassword').value='';$('resetConfirm').value='';show('login');showMessage('customerAuthStatus','Password successfully updated. Sign in with the new password.');});
 guarded($('customerProfileForm'),async()=>{if(!user)throw Error('Please sign in.');const row={id:user.id,full_name:clean($('profileName').value),phone:clean($('profilePhone').value),updated_at:new Date().toISOString()};await saveRow('customer_profiles',row);await loadProfile();showMessage('profileStatus','Saved privately to your account.');});
 guarded($('addressForm'),async()=>{
   if(!user)throw Error('Please sign in.');const id=$('editAddressId').value;const isDefault=$('addressDefault').checked||!addresses.length;
   const row={user_id:user.id,label:clean($('addressLabel').value),recipient_name:clean($('addressRecipient').value),phone:clean($('addressPhone').value),address_line:clean($('addressStreet').value),city:clean($('addressCity').value),province:clean($('addressProvince').value),postal_code:clean($('addressPostal').value),is_default:isDefault,updated_at:new Date().toISOString()};
   if(isDefault){for(const a of addresses.filter(a=>a.is_default&&a.id!==id)){await saveRow('customer_addresses',{is_default:false},'id=eq.'+encodeURIComponent(a.id))}}
   if(id)await saveRow('customer_addresses',row,'id=eq.'+encodeURIComponent(id));else await saveRow('customer_addresses',row);
   clearAddress();await loadAddresses();showMessage('addressStatus','Address saved to your account.');
 });
 $('cancelAddressEdit').onclick=clearAddress;
 $('savedAddresses').addEventListener('click',async ev=>{const btn=ev.target.closest('[data-address-action]');if(!btn)return;const a=addresses.find(x=>x.id===btn.dataset.addressId);if(!a)return;if(btn.dataset.addressAction==='edit'){editAddress(a);return}if(!confirm('Delete this saved address?'))return;
  try{await N.customerApi('customer_addresses','id=eq.'+encodeURIComponent(a.id),{method:'DELETE'});await loadAddresses();showMessage('addressStatus','Address deleted.')}catch(err){showMessage('addressStatus',err.message,true)}
 });
 $('refreshOrders').onclick=()=>loadOrders().catch(err=>showMessage('ordersStatus',err.message,true));
 $('customerOrders').addEventListener('click',async ev=>{const btn=ev.target.closest('[data-order-items]');if(!btn)return;const box=btn.nextElementSibling;if(!box.hidden){box.hidden=true;btn.textContent='VIEW ORDER ITEMS';return}try{const rows=await getRows('order_items','select=name,quantity,price,strap&order_id=eq.'+encodeURIComponent(btn.dataset.orderItems));box.innerHTML=rows.length?rows.map(x=>`<p>${esc(x.name)} · ${esc(x.strap)} × ${Number(x.quantity)} — ${V.fmt(Number(x.price)*Number(x.quantity))}</p>`).join(''):'<p>No items found.</p>';box.hidden=false;btn.textContent='HIDE ORDER ITEMS'}catch(error){showMessage('ordersStatus',error.message,true)}});
 guarded($('claimOrderForm'),async()=>{const num=clean($('claimOrderNumber').value).toUpperCase();const tok=clean($('claimReceiptToken').value)||sessionStorage.getItem('vx_receipt_'+num)||'';if(!tok)throw Error('Private receipt token required.');await N.claimOrder(num,tok);$('claimReceiptToken').value='';showMessage('claimStatus','Verified! This order is now linked to your account.');await loadOrders()});
 $('claimOrderNumber').addEventListener('change',()=>{const num=clean($('claimOrderNumber').value).toUpperCase();const tok=sessionStorage.getItem('vx_receipt_'+num);if(tok)$('claimReceiptToken').value=tok});
 // List previously verified receipts on this browser without printing sensitive tokens.
 const claims=$('claimOrderForm');const receipts=[];
 for(let i=0;i<sessionStorage.length;i++){const key=sessionStorage.key(i);if(key?.startsWith('vx_receipt_'))receipts.push(key.slice(11))}
 if(receipts.length){const chooser=document.createElement('select');chooser.id='savedReceiptSelect';chooser.setAttribute('aria-label','Select a receipt saved in this browser');chooser.innerHTML='<option value="">Choose a receipt saved on this browser</option>'+receipts.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  chooser.style.cssText='grid-column:1/-1;min-height:44px;padding:10px;border:1px solid #ddd;border-radius:8px';
  claims.prepend(chooser);chooser.addEventListener('change',()=>{if(!chooser.value)return;$('claimOrderNumber').value=chooser.value;$('claimReceiptToken').value=sessionStorage.getItem('vx_receipt_'+chooser.value)||''});
 }
 guarded($('changePasswordForm'),async()=>{const pw=$('securityPassword').value;if(pw!==$('securityConfirm').value)throw Error('Passwords do not match.');await N.updateAccountPassword(pw);$('securityPassword').value='';$('securityConfirm').value='';showMessage('securityStatus','Password updated. Re-sign in if requested by Supabase.');});
 guarded($('changeEmailForm'),async()=>{const email=clean($('securityEmail').value);if(email===user.email)throw Error('This is already your email.');await N.requestEmailChange(email);showMessage('emailChangeStatus','Confirmation email requested. Email will only change after verification.');});
 // Process Supabase recovery and signup callbacks BEFORE attempting a stored session.
 const redirect=N.adoptAuthRedirect();
 if(redirect.type==='recovery'){recoveryToken=redirect.accessToken;show('reset');showMessage('customerAuthStatus','Recovery link verified. Choose a new password.');}
 else if(redirect.type==='error'){show('login');showMessage('customerAuthStatus',redirect.message,true)}
 else{await authenticate();if(redirect.type==='confirmation')showMessage('customerAuthStatus','Email confirmed. You are signed in.');if(user){returnToCheckout();}else if(params.get('view')==='register'){show('register');}else if(params.get('view')==='recover'){show('recover');}}
 // Poll only authenticated users, only while page is visible; no fake realtime status.
 setInterval(()=>{if(user&&!document.hidden)loadOrders().catch(()=>{})},45000);
}
initialize().catch(e=>{show('login');showMessage('customerAuthStatus',e.message,true)});
})();
