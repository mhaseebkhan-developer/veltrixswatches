/* VELTRIXS WATCHES — account status for hamburger-only tablet/mobile navigation.
 * Auth links are rendered exclusively inside #links on viewport widths <=1100px.
 * No customer private data is exposed to navigation. */
(()=>{'use strict';
const links=document.querySelectorAll('#links .vx-auth-menu-item');
if(!links.length||!window.VXNET)return;
const change=(user)=>{
  const [signin,register]=links;
  if(user?.id){
    if(signin){signin.href='account.html';signin.textContent='MY ACCOUNT';}
    if(register){register.href='account.html#vxOrders';register.textContent='MY ORDERS';}
  }else{
    if(signin){signin.href='account.html?view=login';signin.textContent='SIGN IN / MY ACCOUNT';}
    if(register){register.href='account.html?view=register';register.textContent='CREATE ACCOUNT';}
  }
};
window.VXNET.currentUser().then(change).catch(()=>change(null));
})();
