
create extension if not exists vector;

create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile write" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  town text not null,
  lat double precision not null default 0,
  lng double precision not null default 0,
  description text not null,
  interests text[] not null default '{}',
  entry_fee_inr numeric not null default 0,
  suggested_duration_min int not null default 60,
  best_time text,
  hidden_gem boolean not null default false,
  source_url text,
  confidence text not null default 'approximate',
  created_at timestamptz not null default now()
);

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  town text not null,
  lat double precision not null default 0,
  lng double precision not null default 0,
  style text not null,
  approx_price_per_night_inr numeric not null,
  veg_friendly boolean not null default true,
  notes text,
  source_url text,
  confidence text not null default 'approximate',
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  town text not null,
  lat double precision not null default 0,
  lng double precision not null default 0,
  cuisine text not null,
  veg_type text not null,
  signature_dishes text[] not null default '{}',
  approx_cost_per_person_inr numeric not null,
  source_url text,
  confidence text not null default 'approximate',
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  town text not null,
  lat double precision not null default 0,
  lng double precision not null default 0,
  type text not null,
  intensity text not null,
  approx_cost_inr numeric not null default 0,
  duration_min int not null default 60,
  notes text,
  source_url text,
  confidence text not null default 'approximate',
  created_at timestamptz not null default now()
);

create table public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  from_town text not null,
  to_town text not null,
  mode text not null,
  approx_cost_inr numeric not null,
  approx_duration_min int not null,
  notes text,
  source_url text,
  confidence text not null default 'approximate'
);

create table public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  source text,
  embedding vector(3072),
  created_at timestamptz not null default now()
);
create index kb_chunks_embedding_idx on public.kb_chunks using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

grant select on public.places, public.stays, public.restaurants, public.activities, public.transport_routes, public.kb_chunks to anon, authenticated;
grant all on public.places, public.stays, public.restaurants, public.activities, public.transport_routes, public.kb_chunks to service_role;

alter table public.places enable row level security;
alter table public.stays enable row level security;
alter table public.restaurants enable row level security;
alter table public.activities enable row level security;
alter table public.transport_routes enable row level security;
alter table public.kb_chunks enable row level security;

create policy "kb public read" on public.places for select to anon, authenticated using (true);
create policy "kb public read" on public.stays for select to anon, authenticated using (true);
create policy "kb public read" on public.restaurants for select to anon, authenticated using (true);
create policy "kb public read" on public.activities for select to anon, authenticated using (true);
create policy "kb public read" on public.transport_routes for select to anon, authenticated using (true);
create policy "kb public read" on public.kb_chunks for select to anon, authenticated using (true);

create policy "admin manage places" on public.places for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage stays" on public.stays for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage restaurants" on public.restaurants for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage activities" on public.activities for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage kb" on public.kb_chunks for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  input jsonb not null,
  itinerary jsonb not null,
  budget jsonb not null,
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.trips to authenticated;
grant all on public.trips to service_role;
alter table public.trips enable row level security;
create policy "own trips" on public.trips for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  label text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, label)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  overall_rating int not null check (overall_rating between 1 and 5),
  usefulness text not null,
  destination_feedback text,
  hotel_feedback text,
  restaurant_feedback text,
  activity_feedback text,
  itinerary_feedback text,
  comments text,
  ranking_signal jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;
create policy "own feedback" on public.feedback for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "insert own feedback" on public.feedback for insert to authenticated with check (user_id = auth.uid());

create or replace function public.match_kb_chunks(query_embedding vector(3072), match_count int default 8)
returns table (id uuid, content text, metadata jsonb, source text, similarity float)
language sql stable set search_path = public as $$
  select c.id, c.content, c.metadata, c.source,
         1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from public.kb_chunks c
  where c.embedding is not null
  order by c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

insert into public.places (slug,name,category,town,lat,lng,description,interests,entry_fee_inr,suggested_duration_min,best_time,hidden_gem,source_url,confidence) values
('malpe-beach','Malpe Beach','beach','Malpe',13.3494,74.7050,'Wide golden-sand beach near Udupi with a promenade, water sports operators and the jetty for St. Mary''s Island ferries.','{beaches,photography,adventure,food}',0,120,'evening',false,'https://en.wikipedia.org/wiki/Malpe','approximate'),
('st-marys-island','St. Mary''s Island','island','Malpe',13.3767,74.6725,'Geological monument of hexagonal basaltic columns, reached by a ferry from Malpe jetty. Ferry timings are weather dependent.','{beaches,photography,culture}',150,150,'morning',false,'https://en.wikipedia.org/wiki/St._Mary%27s_Islands','approximate'),
('krishna-temple-udupi','Sri Krishna Matha, Udupi','temple','Udupi',13.3409,74.7521,'13th-century Krishna temple founded by Madhvacharya, famous for darshan through the Kanakana Kindi window and its temple kitchen.','{temples,culture,food,photography}',0,90,'morning',false,'https://en.wikipedia.org/wiki/Krishna_Matha,_Udupi','approximate'),
('anantheshwara-temple','Anantheshwara Temple','temple','Udupi',13.3405,74.7517,'Ancient Shiva temple adjacent to the Krishna Matha complex, part of the Udupi temple triad.','{temples,culture}',0,45,'morning',false,null,'approximate'),
('kaup-beach','Kaup Beach & Lighthouse','beach','Kaup',13.2200,74.7400,'Rocky-and-sand beach with a 19th-century lighthouse offering a panoramic Arabian Sea sunset view.','{beaches,photography,culture}',20,90,'evening',false,'https://en.wikipedia.org/wiki/Kaup','approximate'),
('maravanthe-beach','Maravanthe Beach','beach','Maravanthe',13.7300,74.6400,'Rare stretch where NH-66 runs with the Arabian Sea on one side and the Souparnika river on the other.','{beaches,photography}',0,60,'evening',false,'https://en.wikipedia.org/wiki/Maravanthe','approximate'),
('kundapura-backwaters','Kundapura Backwaters','nature','Kundapura',13.6260,74.6910,'Estuary and backwater stretch near Kundapura with boat rides, mangroves and quiet fishing hamlets.','{nature,photography,wildlife}',0,90,'morning',true,null,'approximate'),
('mulki-surf','Mulki Surf Point','adventure','Mulki',13.0900,74.7900,'River-mouth surf break, home to a long-running surf school culture on the Karnataka coast.','{adventure,beaches}',0,120,'morning',false,null,'approximate'),
('panambur-beach','Panambur Beach','beach','Mangaluru',12.9300,74.8000,'Mangaluru''s busiest managed beach, known for water sports, kite festivals and food stalls.','{beaches,food,adventure,photography}',0,120,'evening',false,'https://en.wikipedia.org/wiki/Panambur_Beach','approximate'),
('tannirbhavi-beach','Tannirbhavi Beach','beach','Mangaluru',12.8880,74.8090,'Calm beach reachable by ferry or road, with a tree park and sunset viewing deck.','{beaches,photography}',0,90,'evening',false,null,'approximate'),
('someshwara-beach','Someshwara Beach','beach','Someshwara',12.7830,74.8600,'Rock-strewn beach beside the Someshwara temple where the Netravati meets the sea; strong currents.','{beaches,temples,photography}',0,75,'evening',false,null,'approximate'),
('sasihithlu-beach','Sasihithlu Beach','beach','Sasihithlu',13.0800,74.7800,'Sandbar beach at the Shambhavi-Nandini confluence, a national surfing venue.','{beaches,adventure,photography}',0,90,'evening',true,null,'approximate'),
('surathkal-lighthouse','Surathkal Beach & Lighthouse','beach','Surathkal',13.0100,74.7900,'Quiet beach below a hilltop lighthouse, popular for uncrowded sunsets.','{beaches,photography}',0,75,'evening',true,null,'approximate'),
('kadri-manjunath','Kadri Manjunath Temple','temple','Mangaluru',12.9040,74.8580,'10th-century temple with bronze Lokeshwara idol and the Kadri hilltop tanks.','{temples,culture,photography}',0,60,'morning',false,'https://en.wikipedia.org/wiki/Kadri_Manjunath_Temple','approximate'),
('mangaladevi','Mangaladevi Temple','temple','Mangaluru',12.8630,74.8420,'Temple that gives Mangaluru its name, central to the city''s Navaratri celebrations.','{temples,culture}',0,45,'morning',false,'https://en.wikipedia.org/wiki/Mangaladevi_Temple','approximate'),
('sultan-battery','Sultan Battery Watchtower','heritage','Mangaluru',12.8700,74.8250,'Tipu Sultan-era laterite watchtower on the Gurupura riverfront with ferry rides nearby.','{culture,photography}',0,45,'evening',true,null,'approximate'),
('manipal-endpoint','Manipal End Point','viewpoint','Manipal',13.3520,74.7930,'Landscaped valley viewpoint in the university town, lively at sunset.','{photography,culture}',0,60,'evening',false,null,'approximate'),
('manipal-museum','Museum of Anatomy & Pathology, Manipal','museum','Manipal',13.3520,74.7860,'Unusual academic museum open to visitors; timings vary with the university calendar.','{culture}',0,60,'afternoon',true,null,'approximate'),
('murudeshwar-temple','Murudeshwar Temple & Statue','temple','Murudeshwar',14.0940,74.4840,'Second-tallest Shiva statue in the world on a sea-facing headland, with a 20-storey gopura lift.','{temples,culture,photography,beaches}',0,120,'morning',false,'https://en.wikipedia.org/wiki/Murudeshwara','approximate'),
('netrani-diving','Netrani Island Diving','adventure','Murudeshwar',14.0170,74.3300,'Heart-shaped island reef, Karnataka''s main scuba site; boats run from Murudeshwar in fair weather.','{adventure,wildlife,photography}',3500,300,'morning',false,null,'approximate'),
('honnavar-mangroves','Honnavar Mangrove Boardwalk','nature','Honnavar',14.2800,74.4400,'Sharavathi estuary mangrove walk with birdlife and community-run boat trips.','{wildlife,nature,photography}',50,90,'morning',true,null,'approximate'),
('apsarakonda','Apsarakonda Falls & Beach','nature','Honnavar',14.2500,74.4300,'Small waterfall and hilltop park a short walk from a crescent beach.','{trekking,beaches,photography}',0,90,'morning',true,null,'approximate'),
('kumta-beach','Kumta (Nirvana) Beach','beach','Kumta',14.4200,74.4000,'Chain of small sandy coves between Kumta and Gokarna, reachable on foot.','{beaches,trekking,photography}',0,90,'evening',true,null,'approximate'),
('gokarna-mahabaleshwar','Mahabaleshwar Temple, Gokarna','temple','Gokarna',14.5480,74.3170,'Atmalinga temple, one of coastal Karnataka''s most important pilgrimage sites.','{temples,culture}',0,60,'morning',false,'https://en.wikipedia.org/wiki/Gokarna,_India','approximate'),
('om-beach','Om Beach','beach','Gokarna',14.5170,74.3170,'Om-shaped twin cove with shacks, boat rides and a cliff trail.','{beaches,adventure,food,photography}',0,150,'evening',false,'https://en.wikipedia.org/wiki/Om_Beach','approximate'),
('kudle-beach','Kudle Beach','beach','Gokarna',14.5300,74.3130,'Backpacker favourite reached by a short hill trail from Gokarna town.','{beaches,trekking,photography}',0,120,'evening',false,null,'approximate'),
('half-moon-beach','Half Moon & Paradise Beach','beach','Gokarna',14.5100,74.3080,'Remote coves on the Gokarna cliff trek, reachable on foot or by boat.','{beaches,trekking,photography}',0,150,'morning',true,null,'approximate'),
('yana-caves','Yana Rocks','trekking','Yana',14.5730,74.5800,'Twin black karst monoliths (Bhairaveshwara and Mohini Shikhara) in Sahyadri rainforest.','{trekking,temples,photography,wildlife}',0,180,'morning',false,'https://en.wikipedia.org/wiki/Yana,_India','approximate'),
('vibhooti-falls','Vibhooti Falls','nature','Yana',14.5600,74.5900,'Multi-tier cascade near Yana, best right after the monsoon.','{trekking,nature,photography}',30,90,'morning',true,null,'approximate'),
('karwar-rabindranath','Rabindranath Tagore Beach','beach','Karwar',14.8100,74.1300,'Karwar''s promenade beach with the INS Chapal warship museum and an aquarium.','{beaches,culture,photography}',60,120,'evening',false,'https://en.wikipedia.org/wiki/Karwar','approximate'),
('devbagh','Devbagh Beach','beach','Karwar',14.8300,74.1000,'Casuarina-fringed island beach off Karwar reached by boat; base for water sports.','{beaches,adventure,photography}',0,150,'morning',false,null,'approximate'),
('sadashivgad','Sadashivgad Hill Fort','heritage','Karwar',14.8380,74.1370,'Hilltop fort ruins and Durga temple overlooking the Kali river mouth.','{culture,trekking,photography}',0,60,'evening',true,null,'approximate'),
('kali-river-kayak','Kali River Backwaters','adventure','Karwar',14.8500,74.2000,'Estuary kayaking and boat safaris on the Kali river near Karwar.','{adventure,wildlife,nature}',900,150,'morning',false,null,'approximate'),
('pilikula','Pilikula Nisargadhama','wildlife','Mangaluru',12.9500,74.8900,'Biological park, lake and science centre on the outskirts of Mangaluru.','{wildlife,culture,photography}',150,180,'morning',false,'https://en.wikipedia.org/wiki/Pilikula_Nisargadhama','approximate'),
('kollur-mookambika','Kollur Mookambika Temple','temple','Kundapura',13.8630,74.8140,'Major Shakti temple at the foot of Kodachadri, an hour inland from Maravanthe.','{temples,culture}',0,90,'morning',false,'https://en.wikipedia.org/wiki/Mookambika_Temple,_Kollur','approximate');

insert into public.stays (name,town,lat,lng,style,approx_price_per_night_inr,veg_friendly,notes,confidence) values
('Malpe Beach View Homestay','Malpe',13.3494,74.7050,'budget',1400,true,'Family-run rooms a short walk from the beach promenade.','approximate'),
('Udupi Heritage Lodge','Udupi',13.3409,74.7521,'budget',1200,true,'Simple lodge near the Krishna Matha, walkable to temple street.','approximate'),
('Malpe Beachfront Resort','Malpe',13.3500,74.7040,'comfortable',3800,true,'Beachfront mid-range category near Malpe jetty.','approximate'),
('Manipal Campus Guest Stay','Manipal',13.3520,74.7860,'comfortable',2600,true,'Business-style rooms near End Point.','approximate'),
('Kundapura Riverside Rooms','Kundapura',13.6260,74.6910,'budget',1300,true,'Riverside guesthouse close to NH-66.','approximate'),
('Maravanthe Sea & River Resort','Maravanthe',13.7300,74.6400,'comfortable',3500,true,'Rooms facing the highway sea stretch.','approximate'),
('Mangaluru City Business Hotel','Mangaluru',12.8700,74.8420,'comfortable',3200,false,'Central location near Hampankatta.','approximate'),
('Mangaluru Budget Inn','Mangaluru',12.8650,74.8400,'budget',1500,false,'Near the railway station, basic AC rooms.','approximate'),
('Panambur Sea Facing Resort','Mangaluru',12.9300,74.8000,'luxury',7500,false,'Upper-tier sea-facing property near the port.','approximate'),
('Surathkal Beach Homestay','Surathkal',13.0100,74.7900,'budget',1100,true,'Quiet homestay near the lighthouse.','approximate'),
('Sasihithlu Surf Camp','Sasihithlu',13.0800,74.7800,'backpacking',700,true,'Dorm beds and tents for surfers.','approximate'),
('Murudeshwar Temple Trust Rooms','Murudeshwar',14.0940,74.4840,'budget',1000,true,'Pilgrim accommodation near the temple complex.','approximate'),
('Murudeshwar Sea View Hotel','Murudeshwar',14.0930,74.4850,'comfortable',3000,true,'Rooms facing the statue and beach.','approximate'),
('Gokarna Om Beach Huts','Gokarna',14.5170,74.3170,'backpacking',800,true,'Beach shack huts, seasonal (closed in peak monsoon).','approximate'),
('Gokarna Cliffside Boutique Stay','Gokarna',14.5300,74.3130,'luxury',8500,true,'Small luxury property on the cliff trail.','approximate'),
('Kumta Farm Homestay','Kumta',14.4200,74.4000,'budget',1200,true,'Areca farm homestay inland from the beaches.','approximate'),
('Yana Forest Guesthouse','Yana',14.5730,74.5800,'budget',1000,true,'Basic forest-edge rooms, book ahead.','approximate'),
('Karwar Beachfront Resort','Karwar',14.8100,74.1300,'comfortable',3600,false,'Near Tagore beach promenade.','approximate'),
('Karwar Backpacker Hostel','Karwar',14.8120,74.1290,'backpacking',650,true,'Dorms near the bus stand.','approximate'),
('Honnavar Estuary Homestay','Honnavar',14.2800,74.4400,'budget',1300,true,'Family homestay near the mangrove boardwalk.','approximate');

insert into public.restaurants (name,town,lat,lng,cuisine,veg_type,signature_dishes,approx_cost_per_person_inr,confidence) values
('Mitra Samaj Bhojanalaya','Udupi',13.3410,74.7530,'Udupi vegetarian','veg','{"Goli baje","Masala dosa","Filter coffee"}',150,'approximate'),
('Diana Restaurant','Udupi',13.3390,74.7480,'Udupi vegetarian','veg','{"Gadbad ice cream","Neer dosa"}',250,'approximate'),
('Woodlands Udupi','Udupi',13.3400,74.7500,'South Indian','veg','{"Thali meals","Idli sambar"}',200,'approximate'),
('Malpe Fish Shacks','Malpe',13.3490,74.7060,'Coastal seafood','nonveg','{"Anjal tawa fry","Ghee roast"}',400,'approximate'),
('Hotel Ashoka Manipal','Manipal',13.3510,74.7860,'North & South Indian','both','{"Chicken sukka","Veg pulao"}',300,'approximate'),
('Dollops Manipal','Manipal',13.3530,74.7880,'Cafe & Mangalorean','both','{"Kori rotti","Cold coffee"}',350,'approximate'),
('Machali Mangaluru','Mangaluru',12.8700,74.8420,'Mangalorean seafood','nonveg','{"Fish curry meals","Squid masala"}',500,'approximate'),
('Giri Manjas','Mangaluru',12.8790,74.8420,'Mangalorean seafood','nonveg','{"Anjal fry","Prawn ghee roast"}',700,'approximate'),
('Kudla Veg Kitchen','Mangaluru',12.8720,74.8430,'Mangalorean vegetarian','veg','{"Neer dosa with sagu","Patrode"}',220,'approximate'),
('Ideals Ice Cream','Mangaluru',12.8730,74.8460,'Desserts','veg','{"Gadbad","Tender coconut ice cream"}',180,'approximate'),
('Maravanthe Highway Mess','Maravanthe',13.7290,74.6410,'Coastal home-style','both','{"Fish thali","Kori gassi"}',280,'approximate'),
('Kundapura Chicken Kabab House','Kundapura',13.6250,74.6900,'Kundapura style','nonveg','{"Kundapura chicken","Boti fry"}',350,'approximate'),
('Murudeshwar Beach Canteen','Murudeshwar',14.0930,74.4850,'Coastal & Udupi','both','{"Rice bhakri","Fish thali"}',250,'approximate'),
('Gokarna Prema Restaurant','Gokarna',14.5480,74.3180,'Multi-cuisine backpacker','veg','{"Thali","Banana pancake"}',250,'approximate'),
('Namaste Cafe Om Beach','Gokarna',14.5170,74.3175,'Beach cafe','both','{"Grilled catch of the day","Fresh juices"}',450,'approximate'),
('Karwar Fish Market Eateries','Karwar',14.8110,74.1310,'Karwari seafood','nonveg','{"Karwari fish curry","Rava fry"}',400,'approximate'),
('Amruth Veg Karwar','Karwar',14.8120,74.1290,'Konkani vegetarian','veg','{"Konkani thali","Solkadhi"}',200,'approximate'),
('Kumta Bhojanalaya','Kumta',14.4210,74.4010,'Konkani home-style','both','{"Rice rotti","Kane fry"}',230,'approximate');

insert into public.activities (name,town,lat,lng,type,intensity,approx_cost_inr,duration_min,notes,confidence) values
('St. Mary''s Island ferry ride','Malpe',13.3500,74.7040,'boat','relaxed',400,120,'Ferry operations depend on sea conditions; suspended in monsoon.','approximate'),
('Malpe water sports combo','Malpe',13.3494,74.7050,'watersports','moderate',900,60,'Banana boat, jet ski and parasailing packages vary by operator.','approximate'),
('Surf lesson at Mulki','Mulki',13.0900,74.7900,'watersports','moderate',1800,120,'Beginner lessons with board and instructor.','approximate'),
('Sasihithlu stand-up paddling','Sasihithlu',13.0800,74.7800,'watersports','moderate',1200,90,'Flat-water paddling in the river mouth.','approximate'),
('Panambur beach jet ski','Mangaluru',12.9300,74.8000,'watersports','moderate',700,30,'Managed beach with lifeguards.','approximate'),
('Netrani scuba dive','Murudeshwar',14.0170,74.3300,'diving','high',4500,300,'Season roughly October to May; certification not required for try-dives.','approximate'),
('Murudeshwar gopura lift & statue viewpoint','Murudeshwar',14.0940,74.4840,'sightseeing','relaxed',100,60,'Small ticket for the tower lift.','approximate'),
('Gokarna beach trek (Om to Paradise)','Gokarna',14.5170,74.3170,'trekking','moderate',0,180,'Cliff trail; carry water, avoid midday heat.','approximate'),
('Om Beach boat hop','Gokarna',14.5170,74.3170,'boat','relaxed',500,90,'Shared boats to Half Moon and Paradise beaches.','approximate'),
('Yana rock trek','Yana',14.5730,74.5800,'trekking','moderate',0,180,'Forest path with steps; leech socks useful in monsoon.','approximate'),
('Honnavar mangrove kayak','Honnavar',14.2800,74.4400,'kayaking','moderate',800,90,'Community-run trips, book a day ahead.','approximate'),
('Devbagh island boat & snorkel','Karwar',14.8300,74.1000,'watersports','moderate',1500,180,'Boat transfer included by most operators.','approximate'),
('Kali river kayaking','Karwar',14.8500,74.2000,'kayaking','moderate',900,150,'Calm estuary sections suitable for beginners.','approximate'),
('Kaup lighthouse climb','Kaup',13.2200,74.7400,'sightseeing','relaxed',20,45,'Opening hours vary; usually closed midday.','approximate'),
('Pilikula boat ride & park','Mangaluru',12.9500,74.8900,'sightseeing','relaxed',200,180,'Good for families.','approximate'),
('Udupi temple street food walk','Udupi',13.3405,74.7520,'food','relaxed',300,90,'Self-guided walk around Car Street.','approximate');

insert into public.transport_routes (from_town,to_town,mode,approx_cost_inr,approx_duration_min,notes) values
('Bengaluru','Udupi','bus',900,480,'Overnight sleeper and semi-sleeper services are common on this corridor.'),
('Bengaluru','Udupi','train',450,540,'Via Mangaluru or Yesvantpur-Karwar services; routing varies by day.'),
('Bengaluru','Mangaluru','bus',850,450,'Frequent night departures.'),
('Bengaluru','Mangaluru','train',450,480,'Direct overnight services exist on some days.'),
('Bengaluru','Mangaluru','flight',3500,60,'Multiple daily departures to Mangaluru International.'),
('Bengaluru','Mangaluru','taxi',9000,420,'Private cab, one way.'),
('Udupi','Malpe','taxi',300,20,'Autos also available.'),
('Udupi','Manipal','bus',20,20,'City buses run every few minutes.'),
('Udupi','Kaup','bus',40,45,'NH-66 local buses.'),
('Udupi','Mangaluru','bus',120,90,'Frequent express buses.'),
('Udupi','Mangaluru','train',60,70,'Konkan Railway passenger services.'),
('Udupi','Kundapura','bus',60,60,'Regular services on NH-66.'),
('Kundapura','Maravanthe','bus',25,20,'Short hop north.'),
('Udupi','Murudeshwar','bus',180,180,'Via Kundapura and Bhatkal.'),
('Murudeshwar','Gokarna','bus',120,120,'Via Kumta.'),
('Gokarna','Karwar','bus',90,90,'Via Ankola.'),
('Gokarna','Yana','taxi',1800,120,'No convenient direct bus; shared taxi common.'),
('Mangaluru','Mulki','bus',45,45,'Local buses on NH-66.'),
('Mangaluru','Sasihithlu','taxi',700,50,'Autos from Mulki also possible.'),
('Mangaluru','Someshwara','bus',35,40,'Ullal route buses.'),
('Mangaluru','Bengaluru','bus',850,450,'Return leg.'),
('Karwar','Bengaluru','bus',1100,660,'Long overnight route.'),
('Honnavar','Gokarna','bus',70,75,'NH-66 buses.'),
('Kumta','Yana','taxi',1400,90,'Nearest road head to Yana rocks.');

insert into public.kb_chunks (content, metadata, source) values
('Udupi cuisine is strictly vegetarian and temple-derived: masala dosa, goli baje, neer dosa, kadubu, and gadbad ice cream are signature items. Mitra Samaj near the Krishna Matha is a long-standing spot for goli baje and filter coffee.', '{"topic":"cuisine","town":"Udupi"}','Curated project dataset'),
('Mangalorean non-vegetarian cooking centres on coconut, kokum and roasted spice: kori gassi (chicken curry with neer dosa), kori rotti, anjal (seer fish) tawa fry, prawn ghee roast and squid masala.', '{"topic":"cuisine","town":"Mangaluru"}','Curated project dataset'),
('Kundapura chicken is a distinct dry-fried, pepper-heavy preparation from the Kundapura belt, different from Mangaluru ghee roast.', '{"topic":"cuisine","town":"Kundapura"}','Curated project dataset'),
('Karwari and Konkani food on the northern coast leans on solkadhi, rava-fried fish and coconut-based curries, with strong Goan influence.', '{"topic":"cuisine","town":"Karwar"}','Curated project dataset'),
('Best travel season for coastal Karnataka is October to February: dry, moderate humidity and reliable ferry and boat operations. March to May is hot. June to September is heavy monsoon: waterfalls and greenery peak, but sea activities, ferries and Netrani diving usually stop.', '{"topic":"season"}','Curated project dataset'),
('Sea safety: Someshwara, Surathkal and parts of Maravanthe have strong currents and no lifeguards. Panambur and Malpe are managed beaches with lifeguards and designated swim zones.', '{"topic":"safety"}','Curated project dataset'),
('Getting around: NH-66 is the coastal spine linking Mangaluru, Udupi, Kundapura, Bhatkal, Murudeshwar, Honnavar, Kumta, Gokarna and Karwar. Konkan Railway parallels it. Local buses are cheap and frequent between towns; Yana and inland waterfalls usually need a taxi.', '{"topic":"transport"}','Curated project dataset'),
('Temple etiquette: Udupi Krishna Matha and Gokarna Mahabaleshwara expect modest clothing; men may be asked to remove shirts at some sanctums. Photography is restricted inside sanctums. Some sanctums in Gokarna restrict entry.', '{"topic":"culture"}','Curated project dataset'),
('Gokarna beach trek links Gokarna town beach, Kudle, Om, Half Moon and Paradise beaches over roughly 6 to 8 km of cliff path. Boats replace the trek in bad weather. Paradise beach has periodically restricted camping.', '{"topic":"trekking","town":"Gokarna"}','Curated project dataset'),
('Yana rocks are two karst monoliths inside the Sahyadri forest, reached via Kumta or Sirsi. A short forest walk of about 30 minutes leads to Bhairaveshwara Shikhara. Leeches are common in the monsoon.', '{"topic":"trekking","town":"Yana"}','Curated project dataset'),
('St. Mary''s Island ferries depart from Malpe jetty in daylight hours only and require a ticket that includes island entry. Services are suspended during monsoon and rough seas. Overnight stay on the island is not permitted.', '{"topic":"logistics","town":"Malpe"}','Curated project dataset'),
('Netrani Island scuba and snorkelling trips run from Murudeshwar roughly October to May. Try-dives need no certification but do need a medical self-declaration. Trips are cancelled in poor visibility.', '{"topic":"adventure","town":"Murudeshwar"}','Curated project dataset'),
('Budget guidance for coastal Karnataka: dorm beds and basic homestays sit around 700 to 1500 rupees a night, mid-range rooms 2500 to 4000, upper-tier sea-facing properties 6000 and up. Local meals cost 150 to 350 per person; seafood restaurants 400 to 700.', '{"topic":"budget"}','Curated project dataset'),
('Money-saving levers on this coast: use KSRTC and private buses instead of taxis between towns, eat at bhojanalayas and temple canteens, stay a night inland at Kumta or Kundapura instead of a beachfront resort, and pick free beaches over ticketed water sports.', '{"topic":"budget"}','Curated project dataset'),
('Hidden gems: Sasihithlu sandbar, Apsarakonda falls near Honnavar, Sadashivgad fort at Karwar, Surathkal lighthouse beach, the Honnavar mangrove boardwalk and Vibhooti falls near Yana see far fewer visitors than Gokarna or Malpe.', '{"topic":"hidden_gems"}','Curated project dataset'),
('Packing for the coast: light cotton, a wide-brim hat, reef-safe sunscreen, sandals plus one pair of grippy shoes for cliff and rock walks, a dry bag for boat rides, mosquito repellent, and a rain shell between June and September.', '{"topic":"packing"}','Curated project dataset'),
('Vegetarian travel is easy across the whole coast: Udupi-style bhojanalayas serve pure-vegetarian thalis in every town, and temple canteens at Udupi, Kollur and Murudeshwar serve prasada meals.', '{"topic":"food_preference"}','Curated project dataset'),
('Route logic: travelling south to north along NH-66 in the order Mangaluru, Mulki, Udupi, Malpe, Kundapura, Maravanthe, Murudeshwar, Honnavar, Kumta, Gokarna, Yana, Karwar avoids backtracking. Reverse it when arriving from the north.', '{"topic":"route"}','Curated project dataset'),
('Places on the way between Udupi and Mangaluru: Kaup lighthouse beach, Mulki surf point, Sasihithlu sandbar, Surathkal lighthouse and Panambur beach all sit within a few kilometres of NH-66.', '{"topic":"route"}','Curated project dataset'),
('Places on the way between Udupi and Gokarna: Maravanthe sea-and-river stretch, Kollur Mookambika temple detour, Murudeshwar statue, Apsarakonda falls, Honnavar mangroves and the Kumta coves.', '{"topic":"route"}','Curated project dataset');
