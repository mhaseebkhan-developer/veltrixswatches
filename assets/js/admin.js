/* VELTRIX live Supabase admin. No browser-local fake order/product changes. */
(()=>{'use strict';
const N=window.VXNET,V=window.VX,$=id=>document.getElementById(id),e=V.escape,page=document.body.dataset.adminPage;
let orders=[],products=[],settings={},coupons=[],reviews=[],messages=[];
function msg(t,err=false){const x=$('feedback');if(x){x.textContent=t;x.className='feedback'+(err?' error':'')}else alert(t)}
function date(s){return s?new Date(s).toLocaleDateString('en-PK'):'—'}
function money(n){return V.fmt(Number(n)||0)}
function arr(id,html,cols=8){if($(id))$(id).innerHTML=html||`<tr><td colspan="${cols}">No records found.</td></tr>`}
function status(s){return `<span class="status-pill ${['Shipped','Delivered'].includes(s)?'shipped':s==='Cancelled'?'cancelled':''}">${e(s)}</span>`}
async function get(table,q='select=*'){return N.api(table,q,{admin:true})}
async function save(table,method,filter,data){return N.api(table,filter,{admin:true,method,headers:{'Prefer':'return=representation'},body:JSON.stringify(data)})}
async function del(table,filter){return N.api(table,filter,{admin:true,method:'DELETE'})}
async function reload(){[products,orders,coupons,reviews,messages]=await Promise.all([
 get('products','select=*&order=created_at.asc'),get('orders','select=*,order_items(*)&order=date.desc'),get('coupons'),get('reviews'),get('contact_messages','select=*&order=date.desc')]);
 settings=(await get('store_settings','select=value&key=eq.main'))[0]?.value||{};
}
function pView(p){return N.mapProduct(p)}
function fillDashboard(){
 $('totalOrders').textContent=orders.length;
 $('totalRevenue').textContent=money(orders.filter(o=>o.status!=='Cancelled').reduce((a,b)=>a+Number(b.total||0),0));
 $('totalProducts').textContent=products.length;
 $('totalCustomers').textContent=new Set(orders.map(o=>String(o.customer?.email||'').toLowerCase()).filter(Boolean)).size;
 arr('recentOrders',orders.slice(0,8).map(o=>`<tr><td><a href="order-details.html?order=${encodeURIComponent(o.id)}">${e(o.order_number)}</a></td><td>${e(o.customer?.name)}</td><td>${date(o.date)}</td><td>${money(o.total)}</td><td>${status(o.status)}</td></tr>`).join(''));
 arr('lowStock',products.filter(p=>Number(p.stock)<=5).map(p=>`<tr><td>${e(p.name)}</td><td>${Number(p.stock)}</td><td><a href="inventory.html">MANAGE</a></td></tr>`).join(''));
}
function renderProducts(){const q=($('productFilter')?.value||'').toLowerCase();arr('adminProducts',products.filter(p=>(p.name+' '+p.slug).toLowerCase().includes(q)).map(p=>`<tr><td><div class="mini-product"><img src="${e(p.image_url||'')}" alt=""><span><strong>${e(p.name)}</strong><br><small class="muted">${e(p.slug)}</small></span></div></td><td>${money(p.price)}</td><td>${Number(p.stock)}</td><td>${e((p.tags||[]).join(', '))}</td><td class="actions"><a href="edit-product.html?product=${encodeURIComponent(p.slug)}">EDIT</a> <button data-delete="${e(p.slug)}">DELETE</button></td></tr>`).join(''));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Permanently delete this product? Orders retain item snapshots.'))return;try{await del('products','slug=eq.'+encodeURIComponent(b.dataset.delete));await reload();renderProducts();msg('Product deleted from the database.')}catch(err){msg(err.message,true)}});
}
function productForm(){const editing=page==='edit-product';const slug=new URLSearchParams(location.search).get('product');const p=editing?products.find(x=>x.slug===slug):null;
 if(editing&&!p){msg('Product not found.',true);$('productForm')?.remove();return}
 if(p){const a={name:p.name,slug:p.slug,price:p.price,oldPrice:p.old_price||'',stock:p.stock,img:p.image_url||'',desc:p.short_description||'',long:p.description||'',badge:p.badge||'',tags:(p.tags||[]).join(', ')};
 Object.entries(a).forEach(([k,v])=>{if($('p_'+k))$('p_'+k).value=v});$('p_slug').readOnly=true;if($('imagePreview'))$('imagePreview').src=p.image_url||''}
 $('p_img')?.addEventListener('input',ev=>{if($('imagePreview'))$('imagePreview').src=ev.target.value});
 $('productForm')?.addEventListener('submit',async ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target).entries());const clean=String(d.slug||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
 if(!clean){msg('Product slug required',true);return}
 const row={name:d.name.trim(),slug:clean,price:Number(d.price),old_price:d.oldPrice?Number(d.oldPrice):null,stock:Math.max(0,Math.floor(Number(d.stock))),image_url:d.img,short_description:d.desc||'',description:d.long||'',badge:d.badge||'',tags:String(d.tags||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),is_active:true};
 try{if(editing)await save('products','PATCH','slug=eq.'+encodeURIComponent(slug),row);else await save('products','POST','',row);location.href='products.html?saved=1'}catch(err){msg('Database rejected product: '+err.message,true)}
 });
}
function renderOrders(){const f=$('orderFilter')?.value||'all';arr('adminOrders',orders.filter(o=>f==='all'||o.status===f).map(o=>`<tr><td><a href="order-details.html?order=${encodeURIComponent(o.id)}">${e(o.order_number)}</a></td><td>${e(o.customer?.name||'')}<br><small>${e(o.customer?.email||'')}</small></td><td>${date(o.date)}</td><td>${money(o.total)}</td><td>${status(o.status)}</td><td><a href="order-details.html?order=${encodeURIComponent(o.id)}">DETAILS</a></td></tr>`).join(''))}
function renderOrderDetail(){const id=new URLSearchParams(location.search).get('order'),o=orders.find(o=>o.id===id);if(!o){$('orderDetail').textContent='Order not found in online database.';return}
 const c=o.customer||{};
 $('orderDetail').innerHTML=`<div class="grid-2"><section class="panel"><h2>${e(o.order_number)}</h2><p>${date(o.date)} · ${e(o.payment)} · ${e(o.payment_status)}</p><div class="field"><label for="statusSelect">Order Status</label><select id="statusSelect">${['Pending','Processing','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></div><button class="btn btn-dark" id="saveStatus">SAVE STATUS</button></section><section class="panel"><h2>Customer Details</h2><p>${e(c.name)}</p><p>${e(c.email)}</p><p>${e(c.phone)}</p><p>${e(c.address)}, ${e(c.city)} ${e(c.postal||'')}</p></section></div><section class="panel"><h2>Items</h2><table class="table"><thead><tr><th>Product</th><th>Strap</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${(o.order_items||[]).map(i=>`<tr><td>${e(i.name)}</td><td>${e(i.strap)}</td><td>${i.quantity}</td><td>${money(Number(i.price)*i.quantity)}</td></tr>`).join('')}</tbody></table><div class="kpi-row"><span>Subtotal</span><strong>${money(o.subtotal)}</strong></div><div class="kpi-row"><span>Shipping</span><strong>${money(o.shipping)}</strong></div><div class="kpi-row"><span>Discount</span><strong>${money(o.discount)}</strong></div><div class="kpi-row"><span>Total</span><strong>${money(o.total)}</strong></div></section>`;
 $('saveStatus').onclick=async()=>{try{await save('orders','PATCH','id=eq.'+encodeURIComponent(o.id),{status:$('statusSelect').value});await reload();renderOrderDetail();msg('Order status saved to live database.')}catch(err){msg(err.message,true)}};
}
function renderCustomers(){const map=new Map();orders.forEach(o=>{const c=o.customer||{},key=String(c.email||'').toLowerCase(),x=map.get(key)||{...c,count:0,total:0};x.count++;x.total+=Number(o.total)||0;map.set(key,x)});
 arr('adminCustomers',[...map.values()].map(c=>`<tr><td>${e(c.name)}</td><td>${e(c.email)}</td><td>${e(c.phone)}</td><td>${e(c.city)}</td><td>${c.count}</td><td>${money(c.total)}</td></tr>`).join(''));
 arr('adminMessages',messages.map(m=>`<tr><td>${e(m.name)}</td><td>${e(m.email)}</td><td>${e(m.topic)}</td><td>${e(m.message)}</td><td>${date(m.date)}</td></tr>`).join(''));
}
function renderInventory(){arr('adminInventory',products.map(p=>`<tr><td><div class="mini-product"><img src="${e(p.image_url||'')}" alt=""><strong>${e(p.name)}</strong></div></td><td>${e(p.slug)}</td><td><input type="number" min="0" max="99999" data-stock="${e(p.slug)}" value="${Number(p.stock)}" style="max-width:100px;padding:10px;border:1px solid #ddd"></td><td>${Number(p.stock)===0?'OUT OF STOCK':Number(p.stock)<=5?'LOW STOCK':'IN STOCK'}</td></tr>`).join(''));
 $('saveInventory')?.addEventListener('click',async()=>{try{for(const i of document.querySelectorAll('[data-stock]')){const p=products.find(p=>p.slug===i.dataset.stock),n=Math.max(0,Math.floor(Number(i.value)));if(p&&n!==Number(p.stock))await save('products','PATCH','slug=eq.'+encodeURIComponent(p.slug),{stock:n})}await reload();renderInventory();msg('Stock saved to live database.')}catch(err){msg(err.message,true)}});
}
function renderCoupons(){arr('adminCoupons',coupons.map(c=>`<tr><td>${e(c.code)}</td><td>${e(c.type)}</td><td>${c.type==='percent'?Number(c.value)+'%':money(c.value)}</td><td>${c.active?'ACTIVE':'INACTIVE'}</td><td class="actions"><button data-toggle="${e(c.code)}">${c.active?'DISABLE':'ENABLE'}</button><button data-delete-coupon="${e(c.code)}">DELETE</button></td></tr>`).join(''));
 document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{try{const c=coupons.find(x=>x.code===b.dataset.toggle);await save('coupons','PATCH','code=eq.'+encodeURIComponent(c.code),{active:!c.active});await reload();renderCoupons()}catch(err){msg(err.message,true)}});
 document.querySelectorAll('[data-delete-coupon]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this coupon?'))return;try{await del('coupons','code=eq.'+encodeURIComponent(b.dataset.deleteCoupon));await reload();renderCoupons()}catch(err){msg(err.message,true)}});
 $('couponForm')?.addEventListener('submit',async ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target).entries());try{await save('coupons','POST','',{code:d.code.trim().toUpperCase(),type:d.type,value:Number(d.value),active:true});await reload();renderCoupons();ev.target.reset();msg('Coupon saved online.')}catch(err){msg(err.message,true)}});
}
function renderReviews(){arr('adminReviews',reviews.map(r=>`<tr><td>${e(r.name)}</td><td>${e(r.product)}</td><td>${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating))))}</td><td>${e(r.text)}</td><td><button data-delete-review="${e(r.id)}">DELETE</button></td></tr>`).join(''));
 document.querySelectorAll('[data-delete-review]').forEach(b=>b.onclick=async()=>{try{await del('reviews','id=eq.'+encodeURIComponent(b.dataset.deleteReview));await reload();renderReviews()}catch(err){msg(err.message,true)}});
 $('reviewForm')?.addEventListener('submit',async ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target).entries());try{await save('reviews','POST','',{...d,rating:Number(d.rating)});await reload();renderReviews();ev.target.reset();msg('Review saved online.')}catch(err){msg(err.message,true)}});
}
function editSettings(type){const keys=type==='homepage'?['heroEyebrow','heroTitle','heroText','heroImage']:['brand','shippingThreshold','shippingFee'];const prefix=type==='homepage'?'home_':'setting_';keys.forEach(k=>{if($(prefix+k))$(prefix+k).value=settings[k]??''});
 $(type==='homepage'?'homepageForm':'settingsForm')?.addEventListener('submit',async ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target).entries());for(const key of ['shippingThreshold','shippingFee'])if(d[key]!==undefined)d[key]=Math.max(0,Number(d[key]));try{await save('store_settings','PATCH','key=eq.main',{value:{...settings,...d}});settings={...settings,...d};msg('Changes saved to live database.')}catch(err){msg(err.message,true)}});
}
async function start(){document.querySelector('#adminMenu')?.addEventListener('click',()=>document.querySelector('.side')?.classList.toggle('open'));
 if(!(await N.requireAdmin()))return;
 try{await reload();
  if(page==='dashboard')fillDashboard();if(page==='products'){renderProducts();$('productFilter')?.addEventListener('input',renderProducts)}
  if(page==='add-product'||page==='edit-product')productForm();
  if(page==='orders'){renderOrders();$('orderFilter')?.addEventListener('change',renderOrders)}
  if(page==='order-details')renderOrderDetail();if(page==='customers')renderCustomers();
  if(page==='inventory')renderInventory();if(page==='coupons')renderCoupons();
  if(page==='reviews')renderReviews();if(page==='settings'||page==='homepage')editSettings(page);
  const logout=document.createElement('button');logout.textContent='SIGN OUT';logout.className='btn';logout.style.cssText='position:fixed;right:14px;bottom:14px;z-index:150;background:#111;color:#fff';logout.onclick=()=>{N.signOut();location.href='index.html'};document.body.append(logout);
 }catch(err){msg('Unable to load live admin data: '+err.message,true)}
}
start();
})();
