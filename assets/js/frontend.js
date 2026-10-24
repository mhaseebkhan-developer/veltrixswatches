/* VELTRIXS WATCHES — shared public-page behavior. Catalog, prices, orders and inventory read from live Supabase database. */
(()=>{'use strict';const V=window.VX;if(!V)throw Error('store.js missing');const $=id=>document.getElementById(id);const page=document.body.dataset.page||'';const e=V.escape;
let activeProduct=null,qty=1,activeStrap='Steel Bracelet';
function toast(message,error=false){let el=$('veltrixToast');if(!el){el=document.createElement('div');el.id='veltrixToast';el.style.cssText='position:fixed;z-index:130;bottom:24px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:14px 22px;font:11px Inter,Arial;letter-spacing:.5px;box-shadow:0 12px 35px #0004;max-width:90vw';document.body.append(el)}el.textContent=message;el.style.background=error?'#8a2929':'#111';el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3200)}
function updateCount(){if($('count'))$('count').textContent=V.count();if($('cartHeaderCount'))$('cartHeaderCount').textContent=V.count()}
function closeCart(){if($('cart'))$('cart').classList.remove('open');if($('overlay'))$('overlay').style.display='none'}
function openCart(){closeSearch();renderDrawer();if($('cart'))$('cart').classList.add('open');if($('overlay'))$('overlay').style.display='block'}
function closeSearch(){if($('search'))$('search').classList.remove('open')}
function openSearch(){closeCart();if($('search')){$('search').classList.add('open');$('q')?.focus()}}
function closeFilters(){if($('filtersPanel'))$('filtersPanel').classList.remove('open');if($('overlay'))$('overlay').style.display='none'}
function openFilters(){if($('filtersPanel'))$('filtersPanel').classList.add('open');if($('overlay'))$('overlay').style.display='block'}
function closeAll(){closeCart();closeFilters();closeSearch()}
function renderDrawer(){const box=$('cart');if(!box)return;const rows=V.cart(),sum=V.subtotal();box.innerHTML=`<div class="cart-head"><span>YOUR CART (${V.count()})</span><button type="button" class="icon-btn" onclick="closeCart()" aria-label="Close cart">✕</button></div><div class="cart-list">${rows.length?rows.map(i=>`<div class="cart-mini"><a href="product.html?product=${encodeURIComponent(i.slug)}"><img src="${e(i.img)}" alt="${e(i.name)}"></a><div><strong>${e(i.name)}</strong><p>${e(i.strap||'Standard')} · Qty ${Number(i.quantity)||1}</p><p>${V.fmt(i.price*(Number(i.quantity)||1))}</p></div></div>`).join(''):'<p class="small muted" style="padding:30px 0">Your cart is empty. Explore our collection.</p>'}</div><div class="cart-total"><div class="summary-line"><span>SUBTOTAL</span><b>${V.fmt(sum)}</b></div><button class="checkout" onclick="location.href='cart.html'">VIEW CART & CHECKOUT</button></div>`;updateCount()}
function searchProducts(){const input=$('q');if(!input||!$('results'))return;const q=input.value.trim();$('results').innerHTML=q?(V.find(q).slice(0,8).map(p=>`<a href="product.html?product=${encodeURIComponent(p.slug)}">${e(p.name)} — ${V.fmt(p.price)}</a>`).join('')||'<p class="small muted">No timepieces found.</p>'):'<p class="small muted">Try “automatic”, “gold”, or a watch name.</p>'}
function syncHearts(){document.querySelectorAll('[data-wish]').forEach(btn=>{const saved=V.wishlist().includes(btn.dataset.wish);btn.textContent=saved?'♥':'♡';btn.classList.toggle('saved',saved);btn.setAttribute('aria-pressed',String(saved));btn.setAttribute('aria-label',(saved?'Remove from':'Add to')+' wishlist')})}
function displayCards(id,ps){if($(id)){$(id).innerHTML=ps.length?ps.map(V.card).join(''):'<div class="empty-state"><h2>No timepieces found</h2><p>Try a different search or collection.</p><a href="shop.html" class="btn">SHOP ALL</a></div>';syncHearts()}}
function showCartAdded(slug){if(V.add(slug,1)){updateCount();toast('Added to your cart');}else toast('Unable to add this product',true)}
document.addEventListener('click',event=>{const wish=event.target.closest('[data-wish]');if(wish){event.preventDefault();V.toggleWish(wish.dataset.wish);syncHearts();if(page==='wishlist')renderWishlist();return}const add=event.target.closest('[data-add]');if(add){event.preventDefault();showCartAdded(add.dataset.add);return}});
function setupCommon(){const hamburger=$('hamb');if(hamburger)hamburger.onclick=()=>{$('links')?.classList.toggle('open');hamburger.setAttribute('aria-expanded',String($('links')?.classList.contains('open')))};document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeAll();if(ev.key==='Enter'&&ev.target===$('q'))location.href='search.html?q='+encodeURIComponent(ev.target.value.trim())});window.addEventListener('storage',()=>{updateCount();syncHearts();if(page==='wishlist')renderWishlist();if(page==='cart')renderCartPage()});window.addEventListener('veltrix-change',()=>{updateCount();syncHearts()});updateCount();syncHearts();const settings=V.read('settings');if(settings.brand && !/^veltrixs?(?:[\s-]*watches)?$/i.test(String(settings.brand).trim())){document.querySelectorAll('.logo,.flogo').forEach(node=>node.textContent=settings.brand)}}
function getChecked(cls){return [...document.querySelectorAll('.'+cls+':checked')].map(el=>el.value)}
function applyFilters(){const cats=getChecked('f-cat'),cols=getChecked('f-col'),price=document.querySelector('input[name="price"]:checked')?.value||'all',sort=$('sortSelect')?.value||'featured';let list=V.products().filter(p=>{const route=new URLSearchParams(location.search).get('category');if(!cats.length&&!cols.length&&route==='new'&&!(p.tags||[]).includes('new'))return false;if(!cats.length&&!cols.length&&route==='timepieces'&&(p.tags||[]).includes('accessories'))return false;if(cats.length&&!cats.some(t=>p.tags?.includes(t)))return false;if(cols.length&&!cols.some(t=>p.tags?.includes(t)))return false;if(price!=='all'){const [min,max]=price.split('-').map(Number);if(Number(p.price)<min||Number(p.price)>max)return false}return true});if(sort==='low')list.sort((a,b)=>a.price-b.price);if(sort==='high')list.sort((a,b)=>b.price-a.price);if(sort==='new')list.sort((a,b)=>Number((b.tags||[]).includes('new'))-Number((a.tags||[]).includes('new')));displayCards('productGrid',list);if($('resultCount'))$('resultCount').textContent='Showing '+list.length+' item'+(list.length===1?'':'s');const filter=[...cats,...cols];const landing=new URLSearchParams(location.search).get('category');if($('shopTitle'))$('shopTitle').textContent=filter.length===1?filter[0].replace(/^./,c=>c.toUpperCase())+' Timepieces':filter.length?'Filtered Timepieces':landing==='new'?'New Arrivals':landing==='timepieces'?'All Timepieces':'All Timepieces';if($('crumbLabel'))$('crumbLabel').textContent=filter.length===1?filter[0].toUpperCase():landing?.toUpperCase()||'SHOP'}
function clearFilters(){document.querySelectorAll('.f-cat,.f-col,.f-cat-m,.f-col-m').forEach(c=>c.checked=false);document.querySelectorAll('input[name="price"],input[name="price-m"]').forEach(c=>c.checked=c.value==='all');if($('sortSelect'))$('sortSelect').value='featured';applyFilters()}
function syncMobile(el,cls){const dest=[...document.querySelectorAll('.'+cls)].find(i=>i.value===el.value);if(dest){dest.checked=el.checked;applyFilters()}}
function syncPriceMobile(el){document.querySelectorAll('input[name="price"]').forEach(i=>i.checked=i.value===el.value);applyFilters()}
function initShop(){const cat=new URLSearchParams(location.search).get('category');if(cat){const input=[...document.querySelectorAll('.f-cat,.f-col')].find(i=>i.value===cat);if(input){input.checked=true;document.querySelectorAll('.f-cat-m,.f-col-m').forEach(i=>{if(i.value===cat)i.checked=true})}}applyFilters()}
function specsFor(p){return [['Movement',(p.tags||[]).includes('automatic')?'Automatic (Self-Winding)':'Precision Quartz'],['Case Material',(p.tags||[]).includes('gold')?'Gold-Tone Stainless Steel':(p.tags||[]).includes('black')?'Black Coated Steel':'Stainless Steel'],['Case Diameter','40mm'],['Water Resistance','50m / 5 ATM'],['Glass','Scratch-Resistant Sapphire Coating'],['Warranty','2-Year International Warranty']]}
function selectThumb(el,src){if($('mainImg'))$('mainImg').src=src;document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));el.classList.add('active')}
function selectOpt(el){activeStrap=el.textContent.trim();el.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.remove('active'));el.classList.add('active')}
function changeQty(delta){qty=Math.min(99,Math.max(1,qty+delta));if($('qtyVal'))$('qtyVal').textContent=qty;if($('btnPrice'))$('btnPrice').textContent=V.fmt((activeProduct?.price||0)*qty)}
function toggleAcc(el){el.parentElement.classList.toggle('open')}
function addToCart(){if(!activeProduct)return;if(!V.add(activeProduct.slug,qty,activeStrap)){toast('Cannot save your cart',true);return}updateCount();if($('addedMsg'))$('addedMsg').style.display='block';openCart()}
function initProduct(){const p=V.product(new URLSearchParams(location.search).get('product'))||V.products()[0];if(!p){if($('pName'))$('pName').textContent='Product unavailable';document.querySelector('.add-cart')?.setAttribute('disabled','true');return}activeProduct=p;activeStrap=(p.tags||[]).includes('accessories')?'Standard':'Steel Bracelet';document.title=p.name+' — VELTRIXS WATCHES';[['crumbName',p.name.toUpperCase()],['pName',p.name],['pSub',p.desc],['pDesc',p.long||p.desc],['accDesc',p.long||p.desc],['btnPrice',V.fmt(p.price)]].forEach(([id,value])=>{if($(id))$(id).textContent=value});if($('pPrice'))$('pPrice').innerHTML=(p.oldPrice?`<span class="old">${V.fmt(p.oldPrice)}</span>`:'')+V.fmt(p.price);if($('pBadge')){if(p.badge){$('pBadge').style.display='inline-block';$('pBadge').textContent=p.badge}else $('pBadge').style.display='none'}const others=V.products().filter(x=>x.slug!==p.slug);const imgs=[p.img,...others.slice(0,2).map(x=>x.img)];if($('mainImg')){$('mainImg').src=p.img;$('mainImg').alt=p.name}if($('thumbs'))$('thumbs').innerHTML=imgs.map((img,i)=>`<button type="button" class="thumb${i===0?' active':''}" onclick="selectThumb(this,${JSON.stringify(img).replaceAll('"','&quot;')})"><img src="${e(img)}" alt="View ${e(p.name)} image ${i+1}"></button>`).join('');if($('strapOpts'))$('strapOpts').innerHTML=((p.tags||[]).includes('accessories')?['Standard']:['Steel Bracelet','Leather Strap']).map((str,i)=>`<button type="button" class="opt${i===0?' active':''}" onclick="selectOpt(this)">${e(str)}</button>`).join('');if($('accSpecs'))$('accSpecs').innerHTML=specsFor(p).map(([k,v])=>`<div class="spec-row"><span>${e(k)}</span><span>${e(v)}</span></div>`).join('');const related=others.filter(x=>(x.tags||[]).some(t=>(p.tags||[]).includes(t))).slice(0,4);others.forEach(x=>{if(related.length<4&&!related.includes(x))related.push(x)});displayCards('relatedGrid',related);document.querySelector('.wish-btn')?.addEventListener('click',()=>{V.toggleWish(p.slug);syncProductWish()});syncProductWish()}
function syncProductWish(){if(!activeProduct)return;const btn=document.querySelector('.wish-btn');if(btn)btn.textContent=V.wishlist().includes(activeProduct.slug)?'♥ REMOVE FROM WISHLIST':'♡ ADD TO WISHLIST'}
function renderSearch(){const input=$('searchPageInput'),params=new URLSearchParams(location.search),q=params.get('q')||'';if(!input)return;if(document.activeElement!==input)input.value=q;displayCards('searchPageGrid',q?V.find(q):V.products());if($('searchPageCount'))$('searchPageCount').textContent=q?'Results for “'+q+'”':'Explore all timepieces'}
function searchPageGo(ev){ev?.preventDefault();const q=$('searchPageInput').value.trim();history.replaceState(null,'','search.html'+(q?'?q='+encodeURIComponent(q):''));renderSearch()}
function renderWishlist(){const ids=V.wishlist();displayCards('wishGrid',ids.map(V.product).filter(Boolean));if($('wishCount'))$('wishCount').textContent=ids.length+' saved item'+(ids.length===1?'':'s')}
function renderCartPage(){const items=V.cart();const box=$('cartPageItems');if(!box)return;if(!items.length){box.innerHTML='<div class="empty-state"><h2>Your cart is empty.</h2><p>Explore the collection and find your next timepiece.</p><a class="btn btn-dark" href="shop.html">SHOP NOW</a></div>'}else box.innerHTML=items.map(i=>`<article class="line-item"><a href="product.html?product=${encodeURIComponent(i.slug)}"><img src="${e(i.img)}" alt="${e(i.name)}"></a><div><h3><a href="product.html?product=${encodeURIComponent(i.slug)}">${e(i.name)}</a></h3><p class="sub">${e(i.strap||'Standard')}</p><div class="quantity-control"><button aria-label="Decrease quantity" data-qty="-1" data-id="${e(i.slug)}" data-strap="${e(i.strap||'Standard')}">−</button><span>${i.quantity}</span><button aria-label="Increase quantity" data-qty="1" data-id="${e(i.slug)}" data-strap="${e(i.strap||'Standard')}">+</button></div><div style="margin-top:13px"><button class="link-button" data-remove="${e(i.slug)}" data-strap="${e(i.strap||'Standard')}">REMOVE</button></div></div><strong class="line-total">${V.fmt(i.price*i.quantity)}</strong></article>`).join('');const sub=V.subtotal(),settings=V.read('settings'),ship=sub>=V.num(settings.shippingThreshold)?0:V.num(settings.shippingFee);if($('cartPageSub'))$('cartPageSub').textContent=V.fmt(sub);if($('cartPageShipping'))$('cartPageShipping').textContent=sub?ship===0?'COMPLIMENTARY':V.fmt(ship):'—';if($('cartPageTotal'))$('cartPageTotal').textContent=V.fmt(sub+(sub?ship:0));if($('cartCheckoutBtn')){$('cartCheckoutBtn').style.pointerEvents=items.length?'auto':'none';$('cartCheckoutBtn').style.opacity=items.length?'1':'.4';$('cartCheckoutBtn').setAttribute('aria-disabled',String(!items.length))}updateCount()}
function bindCart(){document.querySelector('#cartPageItems')?.addEventListener('click',ev=>{const btn=ev.target.closest('[data-qty],[data-remove]');if(!btn)return;const item=V.cart().find(i=>i.slug===btn.dataset.id||i.slug===btn.dataset.remove);if(!item)return;if(btn.dataset.remove)V.updateCart(item.slug,item.strap,0);else V.updateCart(item.slug,item.strap,item.quantity+Number(btn.dataset.qty));renderCartPage()})}
function totalsCheckout(){const sub=V.subtotal(),settings=V.read('settings'),ship=sub>=V.num(settings.shippingThreshold)?0:V.num(settings.shippingFee);const code=$('couponCode')?.value.trim().toUpperCase()||'';const c=(V.read('coupons')||[]).find(x=>x.active&&x.code.toUpperCase()===code);const discount=c?(c.type==='percent'?Math.round(sub*Number(c.value)/100):Math.min(sub,Number(c.value))):0;if($('checkoutLines'))$('checkoutLines').innerHTML=V.cart().map(i=>`<div class="summary-line"><span>${e(i.name)} × ${i.quantity}</span><span>${V.fmt(i.price*i.quantity)}</span></div>`).join('');if($('checkoutSub'))$('checkoutSub').textContent=V.fmt(sub);if($('checkoutShipping'))$('checkoutShipping').textContent=ship?V.fmt(ship):'FREE';if($('checkoutDiscount'))$('checkoutDiscount').textContent=discount?'- '+V.fmt(discount):'—';if($('checkoutTotal'))$('checkoutTotal').textContent=V.fmt(sub+ship-discount);if($('couponMsg'))$('couponMsg').textContent=code?(c?'Code applied.':'Code not found or inactive.'):'Enter a code if you have one';return {code,c}}
function initCheckout(){
 if(window.VXNET.state.error){if($('checkoutStatus'))$('checkoutStatus').textContent='Checkout is unavailable until live inventory is loaded. No order has been placed.';document.querySelector('#checkoutForm button[type=submit]')?.setAttribute('disabled','true');return}
 if(!V.cart().length){location.replace('cart.html');return}
 const saved=V.read('customer')||{};
 ['name','email','phone','address','city','postal'].forEach(k=>{if($('ch_'+k))$('ch_'+k).value=saved[k]||''});
 totalsCheckout();$('couponCode')?.addEventListener('input',()=>{totalsCheckout();if($('couponMsg'))$('couponMsg').textContent='Discount will be confirmed by the server when placing the order.'});
 $('checkoutForm')?.addEventListener('submit',async ev=>{
 ev.preventDefault();const form=ev.currentTarget,btn=form.querySelector('[type=submit]');
 if(!V.cart().length)return;
 const data=Object.fromEntries(new FormData(form).entries());
 let requestKey=sessionStorage.getItem('vx_pending_checkout_key');
 if(!requestKey){requestKey=crypto.randomUUID();sessionStorage.setItem('vx_pending_checkout_key',requestKey)}
 const payload={idempotency_key:requestKey,customer:data,coupon:$('couponCode')?.value.trim().toUpperCase()||'',items:V.cart().map(i=>({slug:i.slug,quantity:i.quantity,strap:i.strap||'Standard'}))};
 if(btn)btn.disabled=true;if($('checkoutStatus'))$('checkoutStatus').textContent='Submitting your Cash on Delivery order securely…';
 try{
   const result=await window.VXNET.placeOrder(payload);
   if(!result.ok||!result.order_number||!result.receipt_token)throw Error('The server did not confirm your order.');
   sessionStorage.setItem('vx_receipt_'+result.order_number,result.receipt_token);
   V.save('customer',data);V.save('cart',[]);sessionStorage.removeItem('vx_pending_checkout_key');
   location.href='order-success.html?order='+encodeURIComponent(result.order_number);
 }catch(error){if($('checkoutStatus'))$('checkoutStatus').textContent=(error.message||'Checkout failed')+' — No order confirmation received; check with the store before retrying.'}
 finally{if(btn)btn.disabled=false}
 });
}
async function initSuccess(){
 const id=new URLSearchParams(location.search).get('order'),token=id&&sessionStorage.getItem('vx_receipt_'+id);
 if(!id||!token){$('orderSuccessData').textContent='A verified order receipt is not available in this browser. Contact VELTRIXS WATCHES with your order details.';return}
 try{const reply=await window.VXNET.receipt(id,token),o=reply.order;
 document.querySelector('.page-banner h1').textContent='Thank You';document.querySelector('.page-banner p').textContent='Your Cash on Delivery order has been confirmed.';
 $('orderSuccessData').innerHTML=`<p class="small">Order confirmed in our database</p><h2 style="font:32px var(--r)">${e(o.order_number)}</h2><p>${V.fmt(o.total)}</p><p class="note">Payment: ${e(o.payment)} · Status: ${e(o.status)}. This order was received by VELTRIXS WATCHES. Please retain this number.</p>`;
 }catch(err){$('orderSuccessData').textContent='Unable to verify receipt right now. Please contact VELTRIXS WATCHES before placing another order.'}
}
async function initAccount(){
 const customer=V.read('customer')||{};
 ['name','email','phone','address','city','postal'].forEach(k=>{if($('acc_'+k))$('acc_'+k).value=customer[k]||''});
 $('accountForm')?.addEventListener('submit',ev=>{
   ev.preventDefault();V.save('customer',Object.fromEntries(new FormData(ev.currentTarget).entries()));
   $('accountStatus').textContent='Your shipping details have been saved on this device.';
 });
 const views={login:$('customerLoginForm'),register:$('customerRegisterForm'),recover:$('customerRecoverForm'),reset:$('customerResetForm'),signedin:$('customerSignedIn')};
 const descriptions={
   login:['Welcome back.','Sign in to view your purchases and manage your profile.'],
   register:['Join the collection.','Create your collector profile and discover a considered way to shop.'],
   recover:['Recover your account.','We will email you a secure link to choose a new password.'],
   reset:['Choose a new password.','Enter a new password to secure your VELTRIXS WATCHES account.'],
   signedin:['Your private collection.','You are signed in. Your orders and preferences are just below.']
 };
 let recoveryToken=null;
 let currentView='login';
 const msg=(text='',error=false)=>{const el=$('customerAuthStatus');if(el){el.textContent=text;el.className='auth-msg'+(error?' error':text?' good':'')}};
 function show(view){currentView=view;Object.entries(views).forEach(([name,el])=>{if(el)el.hidden=name!==view});
   $('authTabs').hidden=!['login','register'].includes(view);
   document.querySelectorAll('.auth-tab').forEach(el=>{const selected=el.dataset.authView===view;el.classList.toggle('is-active',selected);el.setAttribute('aria-selected',String(selected))});
   $('authHeading').textContent=descriptions[view][0];$('authSubtitle').textContent=descriptions[view][1];msg('');
 }
 document.querySelectorAll('[data-auth-view]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.authView)));
 document.querySelectorAll('[data-reveal]').forEach(btn=>btn.addEventListener('click',()=>{
   const input=$(btn.dataset.reveal);if(!input)return;const visible=input.type==='text';input.type=visible?'password':'text';btn.textContent=visible?'SHOW':'HIDE';btn.setAttribute('aria-label',visible?'Show password':'Hide password');
 }));
 async function refreshOrders(){try{
    const user=await VXNET.currentUser();
    const rows=await VXNET.api('orders','select=order_number,date,status,total&user_id=eq.'+encodeURIComponent(user.id)+'&order=date.desc',{admin:true});
    $('accountOrders').innerHTML=rows.length?rows.map(o=>`<tr><td>${e(o.order_number)}</td><td>${new Date(o.date).toLocaleDateString('en-PK')}</td><td>${e(o.status)}</td><td>${V.fmt(o.total)}</td><td>COD</td></tr>`).join(''):'<tr><td colspan="5">No orders linked to this account yet. Explore the collection.</td></tr>';
   }catch(err){$('accountOrders').innerHTML='<tr><td colspan="5">Order history is temporarily unavailable. Please try signing in again.</td></tr>';console.warn('Account order history unavailable:',err?.message)}
 }
 async function showSignedIn(){try{
   const user=await VXNET.currentUser();
   $('signedInEmail').textContent=user.email||'';
   const display=user.user_metadata?.full_name||user.email?.split('@')[0]||'Collector';
   $('welcomeName').textContent='Welcome, '+display+'.';
   $('accountIdentity').textContent=user.email||'Your account';
   $('accountSignedInBar').hidden=false;
   if(!$('acc_email').value)$('acc_email').value=user.email||'';
   if(!$('acc_name').value && user.user_metadata?.full_name)$('acc_name').value=user.user_metadata.full_name;
   show('signedin'); await refreshOrders();return true;
 }catch{$('accountSignedInBar').hidden=true;return false}}
 const redirect=VXNET.adoptAuthRedirect();
 if(redirect.type==='recovery'){recoveryToken=redirect.accessToken;show('reset')}
 else if(redirect.type==='error'){show('login');msg(redirect.message,true)}
 else {if(!(await showSignedIn()))show('login')}
 $('customerLoginForm').addEventListener('submit',async ev=>{
   ev.preventDefault();const btn=ev.currentTarget.querySelector('[type=submit]');btn.disabled=true;msg('Signing you in…');
   try{await VXNET.signIn($('customerEmail').value.trim(),$('customerPassword').value);await showSignedIn();msg('Welcome to VELTRIXS WATCHES.');}
   catch(err){msg(err.message||'Unable to sign in. Please check your details.',true)}finally{btn.disabled=false}
 });
 $('customerRegisterForm').addEventListener('submit',async ev=>{
   ev.preventDefault();const btn=ev.currentTarget.querySelector('[type=submit]'),name=$('registerName').value.trim(),email=$('registerEmail').value.trim(),pass=$('registerPassword').value;
   if(name.length<2){msg('Please enter your full name.',true);return}
   if(pass.length<12){msg('Please use at least 12 characters for your password.',true);return}
   if(pass!==$('registerConfirm').value){msg('Passwords do not match.',true);return}
   btn.disabled=true;msg('Creating your account…');
   try{const res=await VXNET.signUp(email,pass,name);
     if(res.access_token){await VXNET.signIn(email,pass);await showSignedIn();msg('Your collector account is ready.');}
     else{show('login');$('customerEmail').value=email;msg('Account request received. Please check your email to verify it, then sign in.');}
   }catch(err){msg(err.message||'Registration could not be completed.',true)}finally{btn.disabled=false}
 });
 $('customerRecoverForm').addEventListener('submit',async ev=>{
   ev.preventDefault();const btn=ev.currentTarget.querySelector('[type=submit]');btn.disabled=true;msg('Requesting your password reset email…');
   try{const redirectURL=location.origin+location.pathname;await VXNET.sendRecoveryEmail($('recoverEmail').value,redirectURL);msg('If this account exists, a password reset email has been sent. Check your inbox and spam folder.');}
   catch(err){msg(err.message||'Recovery email could not be sent.',true)}finally{btn.disabled=false}
 });
 $('customerResetForm').addEventListener('submit',async ev=>{
   ev.preventDefault();const password=$('resetPassword').value;if(password.length<12){msg('Use at least 12 characters.',true);return}if(password!==$('resetConfirm').value){msg('Passwords do not match.',true);return}
   const btn=ev.currentTarget.querySelector('[type=submit]');btn.disabled=true;msg('Updating password…');
   try{await VXNET.updateRecoveredPassword(recoveryToken,password);recoveryToken=null;VXNET.signOut();$('resetPassword').value='';$('resetConfirm').value='';show('login');msg('Your password has been updated. Please sign in with your new password.');}
   catch(err){msg(err.message||'Password update failed. Request a fresh reset email.',true)}finally{btn.disabled=false}
 });
 $('signOutCustomer').addEventListener('click',()=>{VXNET.signOut();$('accountSignedInBar').hidden=true;$('accountOrders').innerHTML='<tr><td colspan="5">Sign in to view your orders.</td></tr>';show('login');msg('You have signed out securely.');});
}

function initContact(){
 $('contactForm')?.addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.currentTarget,d=Object.fromEntries(new FormData(f).entries());if($('contactStatus'))$('contactStatus').textContent='Sending message…';try{await VXNET.sendContact({kind:'contact',...d});$('contactStatus').textContent='Your message was received by VELTRIXS WATCHES.';f.reset()}catch(error){$('contactStatus').textContent='Your message could not be sent: '+error.message}});
 const topic=new URLSearchParams(location.search).get('topic');if(topic&&$('contactTopic'))$('contactTopic').value=topic;
}
Object.assign(window,{openCart,closeCart,openSearch,closeSearch,closeAll,searchProducts,openFilters,closeFilters,applyFilters,clearFilters,syncMobile,syncPriceMobile,selectThumb,selectOpt,changeQty,toggleAcc,addToCart});
window.VXNET.ready.then(()=>{setupCommon();if(page==='shop')initShop();if(page==='product')initProduct();if(page==='search'){renderSearch();$('searchPageForm')?.addEventListener('submit',searchPageGo)}if(page==='wishlist')renderWishlist();if(page==='cart'){renderCartPage();bindCart()}if(page==='checkout')initCheckout();if(page==='order-success')initSuccess();if(page==='account')initAccount();if(page==='contact')initContact();});
})();
