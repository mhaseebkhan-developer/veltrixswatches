/* VELTRIXS WATCHES mobile navigation enhancement, UI only. */
(()=>{'use strict';
const side=document.querySelector('.side'),toggle=document.getElementById('adminMenu');
if(!side||!toggle)return;
const backdrop=document.createElement('div');backdrop.className='admin-ui-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.append(backdrop);
toggle.setAttribute('aria-controls','adminSidebar');side.id='adminSidebar';toggle.setAttribute('aria-expanded','false');
const sync=()=>{let open=side.classList.contains('open')&&innerWidth<=780;backdrop.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':''};
function close(){side.classList.remove('open');sync()}
/* Existing admin.js owns the toggle behavior; this listener only synchronizes backdrop. */
toggle.addEventListener('click',()=>queueMicrotask(sync));
backdrop.addEventListener('click',close);
side.addEventListener('click',ev=>{if(ev.target.closest('a'))close()});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&side.classList.contains('open')){close();toggle.focus()}});
addEventListener('resize',()=>{if(innerWidth>780)close();else sync()},{passive:true});sync();
})();
