-- VELTRIX: deploy in Supabase SQL Editor while signed in as the database owner.
-- Compatible with initial Step 3/4 public.products & public.admin_users.
-- IMPORTANT: reference products seeded with ZERO real-world stock. Set verified inventory before selling.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric(12,2) not null check(price >= 0),
  old_price numeric(12,2),
  image_url text,
  short_description text,
  description text,
  tags text[] not null default '{}',
  badge text,
  stock integer not null default 0 check(stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
-- Step 3 may already have created this exact table.
alter table public.products add column if not exists old_price numeric(12,2);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists tags text[] default '{}';
alter table public.products add column if not exists badge text;
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists is_active boolean not null default true;

create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.store_settings (
 key text primary key,
 value jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
create table if not exists public.coupons (
 code text primary key,
 type text not null check(type in ('percent','fixed')),
 value numeric(12,2) not null check(value >= 0),
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number text unique not null,
 user_id uuid references auth.users(id) on delete set null,
 idempotency_key uuid unique not null,
 receipt_token uuid not null default gen_random_uuid(),
 customer jsonb not null,
 subtotal numeric(12,2) not null,
 shipping numeric(12,2) not null,
 discount numeric(12,2) not null default 0,
 total numeric(12,2) not null,
 coupon text,
 payment text not null default 'Cash on Delivery',
 payment_status text not null default 'Unpaid',
 status text not null default 'Pending' check(status in ('Pending','Processing','Shipped','Delivered','Cancelled')),
 date timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 product_slug text not null,
 name text not null,
 img text,
 strap text not null default 'Standard',
 quantity int not null check(quantity > 0),
 price numeric(12,2) not null check(price >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists orders_date_idx on public.orders(date desc);
create index if not exists orders_user_idx on public.orders(user_id);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),
 name text not null, product text not null,
 rating int not null check(rating between 1 and 5),
 text text not null, created_at timestamptz not null default now()
);
create table if not exists public.contact_messages (
 id uuid primary key default gen_random_uuid(),
 name text not null,email text not null,topic text,message text not null,
 date timestamptz not null default now()
);

-- Keep the user's original reference hero and shipping copy until edited in admin.
insert into public.store_settings(key,value) values ('main',
 '{"brand":"VELTRIX","heroEyebrow":"THE ART OF TIME","heroTitle":"Timeless.\nRefined.","heroText":"Exceptional timepieces crafted for those who appreciate quiet luxury, precise detail, and enduring design.","heroImage":"https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=2200&q=90","shippingThreshold":25000,"shippingFee":650}'::jsonb
) on conflict (key) do nothing;

-- Seed products inserted below. Deliberately do not overwrite any existing products/inventory.
insert into public.products (slug,name,price,old_price,image_url,short_description,description,tags,badge,stock,is_active) values
('vanguard','Vanguard Automatic',48900,NULL,'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=90','Automatic · Steel','The Vanguard Automatic sets the tone for the modern VELTRIX collector — a self-winding movement housed in a brushed steel case, designed for those who notice the details. Every rotation of the rotor is visible through the exhibition caseback, a quiet reminder of the craftsmanship inside.',ARRAY['men','automatic','new']::text[],'NEW',0,true),
('elan','Élan Chronograph',59900,NULL,'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=90','Leather · Chronograph','Élan pairs a precision chronograph movement with a hand-finished leather strap, striking a balance between sport and formality. Its tachymeter bezel and dual sub-dials make it as functional as it is refined.',ARRAY['men']::text[],'',0,true),
('monarch','Monarch Gold',39900,NULL,'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=900&q=90','Gold Tone · Quartz','Monarch Gold is VELTRIX''s most-loved silhouette — a warm gold-tone case with a sunburst dial that catches the light with every gesture. Understated on the wrist, unmistakable in person.',ARRAY['women','gold']::text[],'BESTSELLER',0,true),
('nocturne','Nocturne',44900,NULL,'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=900&q=90','Black Steel · Automatic','Cast entirely in black steel, Nocturne is built for low light and long nights. The automatic movement runs silently beneath a sapphire-coated dial that resists glare in any setting.',ARRAY['men','black','automatic']::text[],'',0,true),
('regent','Regent Classic',35900,NULL,'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=90','Steel · Quartz','A clean, elegant profile created for everyday sophistication. Regent Classic is minimal by design and memorable by character — the timepiece you reach for on any occasion.',ARRAY['men']::text[],'',0,true),
('aurora','Aurora Rose',42900,NULL,'https://images.unsplash.com/photo-1751437774882-deeea4352018?auto=format&fit=crop&w=900&q=90','Rose Gold · Quartz','Aurora Rose softens the VELTRIX silhouette with a warm rose-gold finish and a mother-of-pearl dial. A quietly luxurious piece designed to catch the morning light.',ARRAY['women','gold','new']::text[],'NEW',0,true),
('sterling-bracelet','Sterling Link Bracelet',12900,NULL,'https://images.unsplash.com/photo-1613704193420-a53cab02d194?auto=format&fit=crop&w=900&q=90','Steel Accessory','A polished steel link bracelet designed to complement any VELTRIX case. Adjustable links ensure a precise, comfortable fit on any wrist.',ARRAY['accessories']::text[],'',0,true),
('tan-strap','Tan Leather Strap',6900,NULL,'https://images.unsplash.com/photo-1758887952896-8491d393afe2?auto=format&fit=crop&w=900&q=90','Genuine Leather','Hand-cut from genuine full-grain leather and finished with a brushed steel buckle, this strap ages beautifully with wear and pairs effortlessly with any VELTRIX case.',ARRAY['accessories']::text[],'',0,true),
('celeste','Celeste Diamond',89900,NULL,'https://images.unsplash.com/photo-1751437761644-460ae92e34c9?auto=format&fit=crop&w=900&q=90','Diamond Bezel · Gold','Celeste Diamond is the pinnacle of the VELTRIX women''s collection — a hand-set diamond bezel surrounding a mother-of-pearl dial, cased in warm gold-tone steel.',ARRAY['women','gold']::text[],'',0,true),
('voyager','Voyager GMT',64900,NULL,'https://images.unsplash.com/photo-1618215649540-2212685e4c14?auto=format&fit=crop&w=900&q=90','GMT · Black Steel','Built for movement across time zones, Voyager GMT combines a black steel case with a dual-time complication — a companion for the collector who is always somewhere new.',ARRAY['men','black','automatic']::text[],'BESTSELLER',0,true),
('heritage','Heritage Chrono',29900,38900,'https://images.unsplash.com/photo-1618215650201-8d552591218d?auto=format&fit=crop&w=900&q=90','Chronograph · Steel','A tribute to VELTRIX''s earliest chronograph designs, Heritage pairs a vintage-inspired dial with modern water resistance and a reinforced steel case.',ARRAY['men','sale']::text[],'SALE',0,true),
('petite','Petite Blanche',24900,32900,'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=900&q=90','Mother of Pearl · Quartz','Petite Blanche is designed for everyday elegance — a compact case, a luminous mother-of-pearl dial, and a slim profile that sits comfortably on any wrist.',ARRAY['women','sale']::text[],'SALE',0,true)
on conflict(slug) do nothing;

-- Security: tables in public are exposed through Data API only to granted operations and RLS.
do $$ declare t text; begin
  foreach t in array array['products','admin_users','store_settings','coupons','orders','order_items','reviews','contact_messages'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
  end loop;
end $$;
grant select on public.products, public.store_settings to anon, authenticated;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.products, public.store_settings, public.coupons, public.reviews to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.contact_messages to authenticated;

-- Admin membership is manually provisioned in SQL Editor; users cannot add themselves.
drop policy if exists "Admin can read own membership" on public.admin_users;
create policy "Admin can read own membership" on public.admin_users for select to authenticated
 using(user_id=(select auth.uid()));

-- Older policies from setup steps are recreated only when known by name.
drop policy if exists "Public can view active products" on public.products;
drop policy if exists "Admins manage products" on public.products;
create policy "Public can view active products" on public.products for select to anon, authenticated using(is_active=true);
drop policy if exists "Admin can read all products" on public.products;
create policy "Admin can read all products" on public.products for select to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Admins manage products" on public.products for all to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

drop policy if exists "Everyone reads storefront settings" on public.store_settings;
create policy "Everyone reads storefront settings" on public.store_settings for select to anon,authenticated using(key='main');
drop policy if exists "Admins edit settings" on public.store_settings;
create policy "Admins edit settings" on public.store_settings for all to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons" on public.coupons for all to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admin or owner reads orders" on public.orders;
create policy "Admin or owner reads orders" on public.orders for select to authenticated
 using(user_id=(select auth.uid()) or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admin updates order status" on public.orders;
create policy "Admin updates order status" on public.orders for update to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admin or owner reads order items" on public.order_items;
create policy "Admin or owner reads order items" on public.order_items for select to authenticated
 using(exists(select 1 from public.orders o where o.id=order_id and
   (o.user_id=(select auth.uid()) or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))));
drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews" on public.reviews for all to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admins read messages" on public.contact_messages;
create policy "Admins read messages" on public.contact_messages for select to authenticated
 using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

-- Orders should restore stock exactly once when an admin cancels an order.
create or replace function public.veltrix_reconcile_cancel() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare r record; begin
 if old.status is distinct from new.status then
   if new.status='Cancelled' and old.status<>'Cancelled' then
      for r in select product_slug,sum(quantity) qty from public.order_items where order_id=old.id group by product_slug loop
        update public.products set stock=stock+r.qty where slug=r.product_slug;
      end loop;
   elsif old.status='Cancelled' and new.status<>'Cancelled' then
      for r in select product_slug,sum(quantity) qty from public.order_items where order_id=old.id group by product_slug order by product_slug loop
        update public.products set stock=stock-r.qty where slug=r.product_slug and stock>=r.qty;
        if not found then raise exception 'Cannot restore order: stock is insufficient'; end if;
      end loop;
   end if;
 end if;
 return new;
end $$;
revoke all on function public.veltrix_reconcile_cancel() from public,anon,authenticated;
drop trigger if exists veltrix_order_status_inventory on public.orders;
create trigger veltrix_order_status_inventory after update of status on public.orders
for each row execute function public.veltrix_reconcile_cancel();

-- Real newsletter subscribers, not browser-only acknowledgments.
create table if not exists public.newsletter_subscribers (
 email text primary key,
 created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;

-- Prevent rapid repeated orders with identical contact details (alongside client idempotency).
create or replace function public.veltrix_submit_cod_order(p_payload jsonb, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  c jsonb := p_payload->'customer';
  items jsonb := p_payload->'items';
  key_id uuid := (p_payload->>'idempotency_key')::uuid;
  rec record;
  prod public.products%rowtype;
  sub numeric(12,2) := 0;
  shipping_amt numeric(12,2) := 0;
  disc numeric(12,2) := 0;
  total_amt numeric(12,2);
  code text := upper(trim(coalesce(p_payload->>'coupon','')));
  coup public.coupons%rowtype;
  opts jsonb;
  created public.orders%rowtype;
  prev public.orders%rowtype;
begin
  if key_id is null then raise exception 'Invalid order request'; end if;
  select * into prev from public.orders where idempotency_key=key_id;
  if found then return jsonb_build_object('order_number',prev.order_number,'receipt_token',prev.receipt_token,'total',prev.total,'id',prev.id); end if;
  if c is null or length(trim(coalesce(c->>'name',''))) not between 2 and 100 or
     length(trim(coalesce(c->>'email',''))) not between 5 and 160 or
     (c->>'email') not like '%@%.%' or
     length(trim(coalesce(c->>'phone',''))) not between 7 and 25 or
     length(trim(coalesce(c->>'address',''))) not between 8 and 250 or
     length(trim(coalesce(c->>'city',''))) not between 2 and 100 or
     length(coalesce(c->>'postal','')) > 24 then raise exception 'Invalid shipping information'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)<1 or jsonb_array_length(items)>25 then
    raise exception 'Cart must contain 1 to 25 items'; end if;
  -- Limit abusive repeated COD checkout submissions. Existing idempotent retries bypass this.
  if (select count(*) from public.orders where lower(customer->>'email')=lower(c->>'email')
      and date>now()-interval '1 hour') >= 4 then
    raise exception 'Too many orders from this email. Try again later';
  end if;
  -- Stable lock acquisition order prevents stock oversell from concurrent checkouts.
  for rec in select el->>'slug' as slug, sum((el->>'quantity')::integer) as qty
             from jsonb_array_elements(items) el group by el->>'slug' order by el->>'slug' loop
    if rec.qty<1 or rec.qty>20 or rec.slug is null then raise exception 'Invalid cart quantity'; end if;
    select * into prod from public.products where slug=rec.slug and is_active=true for update;
    if not found then raise exception 'A selected product is unavailable'; end if;
    if prod.stock < rec.qty then raise exception 'Insufficient stock for %',prod.name; end if;
    sub := sub + prod.price*rec.qty;
  end loop;
  select value into opts from public.store_settings where key='main';
  shipping_amt := case when sub >= coalesce((opts->>'shippingThreshold')::numeric,25000) then 0
      else coalesce((opts->>'shippingFee')::numeric,650) end;
  if code<>'' then
    select * into coup from public.coupons where coupons.code=code and active=true;
    if not found then raise exception 'This coupon is invalid or inactive'; end if;
    disc := case when coup.type='percent' then round(sub*least(coup.value,100)/100,2)
        else least(sub,coup.value) end;
  end if;
  total_amt := greatest(0,sub+shipping_amt-disc);
  insert into public.orders(order_number,idempotency_key,user_id,customer,subtotal,shipping,discount,total,coupon)
  values ('VX-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)), key_id,p_user_id,c,sub,shipping_amt,disc,total_amt,nullif(code,''))
  returning * into created;
  for rec in select el->>'slug' as slug,
                    coalesce(nullif(el->>'strap',''),'Standard') as strap,
                    sum((el->>'quantity')::integer) as qty
             from jsonb_array_elements(items) el group by el->>'slug',coalesce(nullif(el->>'strap',''),'Standard') loop
    if length(rec.strap)>80 or rec.qty<1 then raise exception 'Invalid item variant'; end if;
    select * into prod from public.products where slug=rec.slug;
    insert into public.order_items(order_id,product_slug,name,img,strap,quantity,price)
    values (created.id,prod.slug,prod.name,prod.image_url,rec.strap,rec.qty,prod.price);
  end loop;
  for rec in select el->>'slug' as slug,sum((el->>'quantity')::integer) as qty
             from jsonb_array_elements(items) el group by el->>'slug' loop
    update public.products set stock=stock-rec.qty where slug=rec.slug;
  end loop;
  return jsonb_build_object('order_number',created.order_number,'receipt_token',created.receipt_token,
    'total',created.total,'id',created.id);
end $$;
revoke all on function public.veltrix_submit_cod_order(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.veltrix_submit_cod_order(jsonb,uuid) to service_role;
