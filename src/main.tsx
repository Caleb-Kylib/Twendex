import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{QRCodeSVG}from'qrcode.react';
import{AirVent,AlertTriangle,ArrowLeft,Bus,Calendar,Check,ChevronRight,Clock3,DoorOpen,HeartHandshake,Luggage,MapPin,Menu,Phone,Radio,ShieldCheck,Ticket,Timer,Usb,Users,Wallet,Lock,Armchair,MonitorPlay,X,Star,Search as SearchIcon,Smartphone,CreditCard,QrCode,Sparkles,Route,Globe,Mail,Facebook,Twitter,Instagram,Send,ArrowRight}from'lucide-react';
import'./styles.css';
import{cacheTicket}from'./storage';
import{Button}from'@/components/ui/button';
import{Card}from'@/components/ui/card';
import{Badge}from'@/components/ui/badge';
import{Input,Select}from'@/components/ui/input';
import{SeatSelection}from'@/features/seats/SeatSelection';
import type{VehicleType}from'@/features/seats/seatMaps';

type State='available'|'held'|'taken'|'unavailable';
type Vehicle={id:string;kind:string;short:string;capacity:number;time:string;fare:number;remaining:number;pickup:string;duration:string;plate:string;driver:string;layout:'taxi'|'shuttle'|'coaster'|'coach'|'premium';amenities:string[];seats:Record<string,State>};
const seats=(n:number,h:string[]=[],t:string[]=[])=>Object.fromEntries(Array.from({length:n},(_,i)=>{let x=''+(i+1);return[x,h.includes(x)?'held':t.includes(x)?'taken':i%13===0?'unavailable':'available']}))as Record<string,State>;
const vehicles:Vehicle[]=[{id:'taxi',kind:'Shared taxi / minivan',short:'Toyota Hiace',capacity:14,time:'07:15',fare:12000,remaining:7,pickup:'Kitoro Taxi Park',duration:'1h 50m',plate:'UAZ 916D',driver:'Nabirye Sarah',layout:'taxi',amenities:['Verified driver','AC'],seats:seats(14,['5'],['2','11'])},{id:'shuttle',kind:'Executive shuttle',short:'Mercedes Sprinter',capacity:18,time:'08:00',fare:18000,remaining:9,pickup:'Entebbe Road Stage',duration:'1h 45m',plate:'UBK 482R',driver:'Mugisha Ronald',layout:'shuttle',amenities:['AC','Charging','Luggage','Verified driver'],seats:seats(18,['3','14'],['7'])},{id:'coaster',kind:'Coaster bus',short:'Toyota Coaster',capacity:30,time:'08:45',fare:15000,remaining:16,pickup:'Entebbe Road Stage',duration:'1h 40m',plate:'UBA 302L',driver:'Okello David',layout:'coaster',amenities:['AC','Charging','Luggage','Verified crew'],seats:seats(30,['9','22'],['1','17','28'])},{id:'coach',kind:'Standard coach',short:'Isuzu Journey',capacity:45,time:'10:30',fare:22000,remaining:24,pickup:'Abayita Ababiri',duration:'1h 35m',plate:'UBD 746K',driver:'Kato Henry',layout:'coach',amenities:['AC','Charging','Luggage','Verified crew'],seats:seats(45,['16','34'],['4','19','42'])},{id:'premium',kind:'Premium coach',short:'Scania Comfort',capacity:36,time:'12:15',fare:32000,remaining:21,pickup:'Kitoro Taxi Park',duration:'1h 30m',plate:'UCF 581M',driver:'Ayo Grace',layout:'premium',amenities:['Reclining seats','AC','Charging','Entertainment','Luggage'],seats:seats(36,['8'],['13','29'])}];
const money=(n:number)=>`UGX ${n.toLocaleString()}`;
const amenity=(x:string)=>x==='AC'?<AirVent/>:x==='Charging'?<Usb/>:x==='Luggage'?<Luggage/>:x==='Entertainment'?<MonitorPlay/>:x==='Reclining seats'?<Armchair/>:<ShieldCheck/>;

function useRoute(){const[p,setP]=useState(location.pathname);useEffect(()=>{let f=()=>setP(location.pathname);addEventListener('popstate',f);return()=>removeEventListener('popstate',f)},[]);return{p,go:(x:string)=>{history.pushState({},'',x);setP(x);scrollTo(0,0)}}}

/* ---------- shared bits ---------- */
const Eyebrow=({children,light}:{children:React.ReactNode;light?:boolean})=><p className={'text-[11px] font-bold tracking-[0.16em] uppercase mb-2 '+(light?'text-brand-200':'text-brand-600')}>{children}</p>;
const SectionHead=({eyebrow,title,sub}:{eyebrow:string;title:React.ReactNode;sub?:string})=><div className="max-w-2xl mx-auto text-center mb-10"><Eyebrow>{eyebrow}</Eyebrow><h2 className="text-[clamp(28px,3.6vw,44px)] leading-[1.03] font-semibold tracking-tight text-cocoa">{title}</h2>{sub&&<p className="text-muted text-[17px] leading-relaxed mt-3">{sub}</p>}</div>;

function Bg(){return <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"><div className="absolute -top-24 -left-24 w-[38rem] h-[38rem] rounded-full bg-brand-300/30 blur-3xl animate-blob"/><div className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full bg-rose-500/20 blur-3xl animate-blob" style={{animationDelay:'-6s'}}/><div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-gold-500/20 blur-3xl animate-blob" style={{animationDelay:'-11s'}}/></div>}

const NAV=[{label:'Book a trip',href:'/trips'},{label:'How it works',href:'/#how'},{label:'Routes',href:'/#routes'},{label:'Safety',href:'/#safety'},{label:'My trips',href:'/my-trips'}];
const Brand=({onClick,light}:{onClick:()=>void;light?:boolean})=><button onClick={onClick} className={'flex items-center gap-2.5 font-bold text-[22px] tracking-tight '+(light?'text-cream':'text-cocoa')}><span className="grid place-items-center size-8 rounded-xl bg-gradient-to-br from-brand-400 to-clay-600 text-white font-[Newsreader] text-2xl shadow-lg shadow-brand-500/30">t</span>Twendex</button>;

function Header({go}:{go:(x:string)=>void}){const[open,setOpen]=useState(false);const[solid,setSolid]=useState(false);useEffect(()=>{let f=()=>setSolid(scrollY>12);f();addEventListener('scroll',f,{passive:true});return()=>removeEventListener('scroll',f)},[]);const nav=(href:string)=>{setOpen(false);if(href.startsWith('/#')){go('/');requestAnimationFrame(()=>document.getElementById(href.slice(2))?.scrollIntoView({behavior:'smooth'}))}else go(href)};return <>
<header className={'sticky top-0 z-30 h-[70px] px-[max(5%,20px)] flex items-center justify-between transition-all duration-300 '+(solid?'glass-strong shadow-lg shadow-brand-900/5':'border-b border-transparent')}>
  <Brand onClick={()=>nav('/')}/>
  <nav className="hidden lg:flex items-center gap-1">{NAV.map(n=><button key={n.href} onClick={()=>nav(n.href)} className="px-3.5 py-2 rounded-lg text-sm font-semibold text-ink/70 hover:text-brand-700 hover:bg-brand-100/60 transition">{n.label}</button>)}</nav>
  <div className="flex items-center gap-3">
    <span className="hidden md:flex items-center gap-1.5 text-xs font-bold text-muted"><MapPin className="size-4 text-brand-500"/>Entebbe ↔ Kampala</span>
    <Button size="sm" className="hidden sm:inline-flex" onClick={()=>nav('/trips')}>Find a ride <ChevronRight/></Button>
    <button className="lg:hidden grid place-items-center size-11 rounded-xl glass" aria-label="Menu" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>{open?<X className="size-5"/>:<Menu className="size-5"/>}</button>
  </div>
</header>
{open&&<div className="lg:hidden sticky top-[70px] z-20 glass-strong px-[max(5%,20px)] py-3 flex flex-col gap-1 shadow-lg shadow-brand-900/10">{NAV.map(n=><button key={n.href} onClick={()=>nav(n.href)} className="flex items-center justify-between py-3 px-1 font-semibold text-ink border-b border-brand-100/70"><span>{n.label}</span><ChevronRight className="size-4 text-muted"/></button>)}<Button className="mt-3" onClick={()=>nav('/trips')}>Find a ride <ChevronRight/></Button></div>}
</>}

function Footer({go}:{go:(x:string)=>void}){const[email,setEmail]=useState('');const[sent,setSent]=useState(false);const nav=(href:string)=>{if(href.startsWith('/#')){go('/');requestAnimationFrame(()=>document.getElementById(href.slice(2))?.scrollIntoView({behavior:'smooth'}))}else go(href)};const link='flex items-center gap-2 py-1.5 text-sm text-cream/70 hover:text-cream transition [&_svg]:size-4 [&_svg]:text-brand-300 [&_svg]:shrink-0';return <footer className="glass-dark mt-16 text-cream/80">
<div className="max-w-6xl mx-auto px-[5%] py-12 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10">
  <div><Eyebrow light>Stay in the loop</Eyebrow><h2 className="text-cream text-3xl font-semibold tracking-tight">New routes, fare drops and travel tips.</h2><p className="text-cream/60 mt-2">Join the Twendex list — no spam, just the useful stuff.</p></div>
  <form className="flex flex-col sm:flex-row gap-2.5 md:min-w-[380px]" onSubmit={e=>{e.preventDefault();setSent(true)}}>{sent?<span className="flex items-center gap-2 font-bold text-brand-300 py-3"><Check className="size-5"/>You're on the list. Karibu!</span>:<><div className="flex items-center gap-2 flex-1 rounded-xl bg-white/10 border border-white/20 px-3.5"><Mail className="size-4 text-brand-300"/><input aria-label="Email address" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} className="flex-1 min-w-0 bg-transparent py-3 text-cream placeholder:text-cream/40 focus:outline-none"/></div><Button variant="light" type="submit">Subscribe <Send/></Button></>}</form>
</div>
<div className="max-w-6xl mx-auto px-[5%] py-12 grid gap-8 grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.3fr]">
  <div className="col-span-2 lg:col-span-1"><Brand onClick={()=>nav('/')} light/><p className="text-sm leading-relaxed text-cream/60 max-w-xs my-4">Reliable, verified travel between Entebbe and Kampala. Book a seat, pay with mobile money, and board with a ticket that works even offline.</p><div className="flex gap-2.5">{[Facebook,Twitter,Instagram].map((I,i)=><a key={i} href="#" aria-label="social" className="grid place-items-center size-9 rounded-lg bg-white/10 border border-white/15 text-cream/80 hover:bg-brand-500 hover:text-white transition"><I className="size-4"/></a>)}</div></div>
  <div><h4 className="text-cream font-semibold mb-3">Travel</h4><button className={link} onClick={()=>nav('/trips')}>Book a trip</button><button className={link} onClick={()=>nav('/#routes')}>Popular routes</button><button className={link} onClick={()=>nav('/#vehicles')}>Vehicle types</button><button className={link} onClick={()=>nav('/my-trips')}>My trips</button></div>
  <div><h4 className="text-cream font-semibold mb-3">Company</h4><button className={link} onClick={()=>nav('/#how')}>How it works</button><button className={link} onClick={()=>nav('/#safety')}>Safety &amp; trust</button><button className={link} onClick={()=>nav('/#stats')}>Why Twendex</button><a className={link} href="#">Careers</a></div>
  <div><h4 className="text-cream font-semibold mb-3">Support</h4><a className={link} href="tel:+256800100200"><Phone/>+256 800 100 200</a><a className={link} href="mailto:hello@twendex.co"><Mail/>hello@twendex.co</a><span className={link}><MapPin/>Kampala Road, Kampala</span><span className={link}><Globe/>English · Luganda</span></div>
</div>
<div className="max-w-6xl mx-auto px-[5%] py-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-[13px] text-cream/50"><span>© {new Date().getFullYear()} Twendex. Travel within reach.</span><div className="flex gap-5">{['Privacy','Terms','Refunds'].map(x=><a key={x} href="#" className="hover:text-cream transition">{x}</a>)}</div></div>
</footer>}

function Steps({n}:{n:number}){return <div className="flex items-center mb-8 flex-wrap gap-y-2">{['Trip','Vehicle','Seat','Payment'].map((x,i)=><span key={x} className={'flex items-center gap-2 text-[13px] '+(i<n?'text-brand-700 font-bold':'text-muted')}><i className={'grid place-items-center size-6 rounded-full not-italic text-[11px] font-bold '+(i+1<n?'bg-brand-600 text-white':i<n?'bg-brand-600 text-white':'border border-brand-200 text-muted')}>{i+1<n?<Check className="size-3.5"/>:i+1}</i>{x}{i<3&&<em className="w-8 md:w-11 h-px bg-brand-200 mx-2 not-italic"/>}</span>)}</div>}

/* ---------- vehicle illustrations (distinct SVG per type) ---------- */
/* Bolt/Uber-style FLAT geometric vehicle icons.
   Three silhouettes: hiace (widest/tallest), minivan (mid, sliding-door break), noah (shortest/roundest).
   Shared Twendex accent = orange (#ff7a1a) stripe + window tint so the set reads as one family.
   Body colors rotate: soft blue-grey / muted orange / white. */
const ACCENT='#ff7a1a';
const TIRE='#2a333c';
type Shape='hiace'|'minivan'|'noah';
const SHAPE:Record<Vehicle['layout'],Shape>={taxi:'hiace',shuttle:'minivan',coaster:'noah',coach:'minivan',premium:'hiace'};
// body = main fill, dark = rocker panel / lower shade, win = glass tint, rim = wheel rim color
const BODY:Record<Shape,{fill:string;dark:string;win:string;rim:string;outline?:string}>={
  hiace:{fill:'#a7bccd',dark:'#8ba3b6',win:'#3a4a58',rim:'#c9d7e2'},
  minivan:{fill:'#f2923f',dark:'#d9762a',win:'#7a3f18',rim:'#ffd0a2'},
  noah:{fill:'#fbfcfd',dark:'#e7ecf1',win:'#46586a',rim:'#eef2f6',outline:'#dbe1e8'},
};
const Wheel=({cx,r,rim}:{cx:number;r:number;rim:string})=><g>
  <circle cx={cx} cy="102" r={r} fill={TIRE}/>
  <circle cx={cx} cy="102" r={r*0.52} fill={rim}/>
  <circle cx={cx} cy="102" r={r*0.2} fill={TIRE}/>
</g>;
function VehicleSVG({layout,className}:{layout:Vehicle['layout'];className?:string}){
  const shape=SHAPE[layout];const c=BODY[shape];
  const uid=React.useId().replace(/:/g,'');
  const sh=`vsh_${uid}`,gl=`vgl_${uid}`;
  const defs=<defs>
    <filter id={sh} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#5a3d24" floodOpacity="0.18"/></filter>
    <linearGradient id={gl} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.35"/><stop offset="0.55" stopColor="#ffffff" stopOpacity="0"/></linearGradient>
  </defs>;
  let art:React.ReactNode;
  if(shape==='hiace'){
    const body="M22 46 Q22 34 36 34 L212 34 Q234 34 236 56 L237 88 Q237 98 227 98 L30 98 Q22 98 22 90 Z";
    art=<g>
      <g filter={`url(#${sh})`}>
        <path d={body} fill={c.fill}/>
        {c.outline&&<path d={body} fill="none" stroke={c.outline} strokeWidth="2"/>}
      </g>
      <path d="M22 82 L237 82 L237 88 Q237 98 227 98 L30 98 Q22 98 22 90 Z" fill={c.dark}/>
      <path d="M40 43 Q40 40 44 40 L206 40 Q219 40 220 54 L220 63 L40 63 Z" fill={c.win}/>
      <path d="M44 42 L214 42 L214 50 L44 52 Z" fill={`url(#${gl})`}/>
      <rect x="92" y="40" width="4" height="23" rx="1.5" fill={c.fill}/>
      <rect x="146" y="40" width="4" height="23" rx="1.5" fill={c.fill}/>
      <rect x="24" y="70" width="211" height="4.5" rx="2.25" fill={ACCENT}/>
      <rect x="228" y="60" width="9" height="9" rx="2.5" fill="#ffd76b"/>
      <rect x="22" y="60" width="6" height="8" rx="2" fill="#e2574e"/>
      <path d="M50 98 Q50 78 74 78 Q98 78 98 98 Z" fill={c.dark}/>
      <path d="M172 98 Q172 78 196 78 Q220 78 220 98 Z" fill={c.dark}/>
      <Wheel cx={74} r={20} rim={c.rim}/><Wheel cx={196} r={20} rim={c.rim}/>
    </g>;
  } else if(shape==='minivan'){
    const body="M34 50 Q34 42 46 40 L172 34 Q202 33 222 54 L232 68 Q237 74 237 84 L237 88 Q237 98 227 98 L44 98 Q34 98 34 90 Z";
    art=<g>
      <g filter={`url(#${sh})`}>
        <path d={body} fill={c.fill}/>
      </g>
      <path d="M34 82 L237 82 L237 88 Q237 98 227 98 L44 98 Q34 98 34 90 Z" fill={c.dark}/>
      <path d="M52 46 L172 40 Q196 40 208 56 L213 63 L52 63 Z" fill={c.win}/>
      <path d="M56 45 L172 41 L200 56 L56 54 Z" fill={`url(#${gl})`}/>
      <rect x="116" y="42" width="4" height="21" rx="1.5" fill={c.fill}/>
      <rect x="120" y="64" width="3" height="18" fill={c.dark}/>
      <rect x="122" y="70" width="13" height="4" rx="2" fill={c.dark}/>
      <rect x="36" y="70" width="199" height="4.5" rx="2.25" fill={ACCENT}/>
      <rect x="229" y="62" width="8" height="9" rx="2.5" fill="#ffd76b"/>
      <rect x="34" y="62" width="6" height="8" rx="2" fill="#c0361f"/>
      <path d="M58 98 Q58 78 82 78 Q106 78 106 98 Z" fill={c.dark}/>
      <path d="M172 98 Q172 78 196 78 Q220 78 220 98 Z" fill={c.dark}/>
      <Wheel cx={82} r={20} rim={c.rim}/><Wheel cx={196} r={20} rim={c.rim}/>
    </g>;
  } else {
    const body="M60 54 Q62 42 86 40 Q140 36 166 42 Q194 48 208 64 Q214 72 214 82 L214 88 Q214 98 204 98 L66 98 Q60 98 60 90 Z";
    art=<g>
      <g filter={`url(#${sh})`}>
        <path d={body} fill={c.fill}/>
        {c.outline&&<path d={body} fill="none" stroke={c.outline} strokeWidth="2"/>}
      </g>
      <path d="M60 82 L214 82 L214 88 Q214 98 204 98 L66 98 Q60 98 60 90 Z" fill={c.dark}/>
      <path d="M76 48 Q120 42 158 46 Q184 50 196 63 L76 63 Z" fill={c.win}/>
      <path d="M80 47 Q120 43 158 47 L186 60 L80 55 Z" fill={`url(#${gl})`}/>
      <rect x="126" y="43" width="4" height="20" rx="1.5" fill={c.fill}/>
      <rect x="62" y="70" width="152" height="4.5" rx="2.25" fill={ACCENT}/>
      <rect x="206" y="62" width="8" height="9" rx="2.5" fill="#ffd76b"/>
      <rect x="60" y="62" width="6" height="8" rx="2" fill="#e2574e"/>
      <path d="M74 98 Q74 79 96 79 Q118 79 118 98 Z" fill={c.dark}/>
      <path d="M160 98 Q160 79 182 79 Q204 79 204 98 Z" fill={c.dark}/>
      <Wheel cx={96} r={19} rim={c.rim}/><Wheel cx={182} r={19} rim={c.rim}/>
    </g>;
  }
  return <svg viewBox="0 0 260 128" className={className} role="img" aria-label={shape+' vehicle'} preserveAspectRatio="xMidYMid meet">{defs}{art}</svg>;
}
function Art({v,tall,badge}:{v:Vehicle;tall?:boolean;badge?:string}){return <div className={'vehicle-art '+v.layout+(tall?' vehicle-art-tall':'')}><VehicleSVG layout={v.layout} className="w-[92%] max-h-full transition-transform duration-300 group-hover:scale-[1.04]"/><span className="vehicle-tag">{v.layout==='premium'?'PREMIUM':'TWENDEX'}</span>{badge&&<span className="absolute z-[3] top-2 right-2 rounded-full bg-white/70 border border-white/70 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-brand-800 flex items-center gap-1"><Users className="size-3"/>{badge}</span>}</div>}
function Amenities({v}:{v:Vehicle}){return <div className="flex gap-2 flex-wrap">{v.amenities.map(x=><span key={x} className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 border border-brand-200/70 text-brand-800 px-2.5 py-1 text-xs font-semibold [&_svg]:size-3.5 [&_svg]:text-brand-600">{amenity(x)}{x}</span>)}</div>}

/* ---------- homepage data ---------- */
const STEPS_HOW=[{icon:<SearchIcon/>,t:'Search your trip',d:'Pick your date and see every departure between Entebbe and Kampala in one view.'},{icon:<Armchair/>,t:'Choose a seat',d:'See the real cabin layout and reserve the exact seat you want — held while you pay.'},{icon:<CreditCard/>,t:'Pay with mobile money',d:'Confirm a secure MTN MoMo or Airtel Money prompt right from your phone.'},{icon:<QrCode/>,t:'Board with a QR ticket',d:'Your ticket is cached on your device, so it scans even with no signal at the stage.'}];
const ROUTES=[{from:'Entebbe',to:'Kampala · Namboole',fare:12000,dur:'1h 50m',trips:'22 trips / day'},{from:'Entebbe',to:'Kampala · City Centre',fare:14000,dur:'1h 40m',trips:'18 trips / day'},{from:'Kampala',to:'Entebbe Airport',fare:15000,dur:'1h 35m',trips:'20 trips / day'},{from:'Entebbe',to:'Kampala · Ntinda',fare:16000,dur:'2h 05m',trips:'12 trips / day'}];
const STATS=[{n:'120k+',l:'Seats booked'},{n:'4.8★',l:'Average trip rating'},{n:'98%',l:'On-time departures'},{n:'350+',l:'Verified drivers'}];
const REVIEWS=[{q:'Booked a seat on my way out the door and the QR still scanned when the network dropped at the stage. Smooth.',n:'Amina N.',r:'Commuter · Entebbe'},{q:'Seeing the actual cabin layout meant I got a window seat every time. No more guessing.',n:'Ronald M.',r:'Weekly traveller'},{q:'Paying with MoMo took seconds and I could share my trip with my sister. Felt safe the whole way.',n:'Grace A.',r:'Student · Kampala'}];

function Search({go}:{go:(x:string)=>void}){return <main>
{/* hero */}
<section className="relative px-[5%] pt-16 pb-24 text-center">
  <div className="max-w-3xl mx-auto">
    <Badge variant="glass" className="mb-5"><Sparkles className="text-gold-500"/>Now serving 5 vehicle types on the corridor</Badge>
    <Eyebrow>Entebbe ↔ Kampala</Eyebrow>
    <h1 className="text-[clamp(40px,6vw,72px)] leading-[.95] font-semibold tracking-[-0.02em] text-cocoa">Every trip,<br/><span className="text-gradient">within reach.</span></h1>
    <p className="text-muted text-lg leading-relaxed max-w-xl mx-auto mt-5">Choose a reliable ride that fits your day — from a quick shared taxi to a spacious coach. Verified crews, real seat maps, and tickets that work offline.</p>
  </div>
  <Card variant="strong" className="max-w-4xl mx-auto mt-9 p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_190px] text-left">
    <label className="flex flex-col gap-1.5 text-xs font-bold text-cocoa/70">From<Select><option>Entebbe</option><option>Kampala</option></Select></label>
    <label className="flex flex-col gap-1.5 text-xs font-bold text-cocoa/70">To<Select><option>Kampala · Namboole</option><option>Kampala · City Centre</option><option>Entebbe Airport</option></Select></label>
    <label className="flex flex-col gap-1.5 text-xs font-bold text-cocoa/70">Date<Input type="date" defaultValue="2026-09-19"/></label>
    <label className="flex flex-col gap-1.5 text-xs font-bold text-transparent">.<Button onClick={()=>go('/trips')}>Find departures <ChevronRight/></Button></label>
  </Card>
  <div className="max-w-4xl mx-auto"><Card variant="dark" className="-mt-1 mt-4 p-4 flex flex-wrap justify-center sm:justify-around gap-4 text-cream/90 text-sm">{[[<ShieldCheck/>,'Verified crews'],[<Ticket/>,'Tickets work offline'],[<HeartHandshake/>,'Safety tools on every trip']].map((c,i)=><span key={i} className="flex items-center gap-2 [&_svg]:size-5 [&_svg]:text-brand-300">{c[0]}{c[1]}</span>)}</Card></div>
</section>

{/* how it works */}
<section id="how" className="max-w-6xl mx-auto px-[5%] py-16 scroll-mt-20">
  <SectionHead eyebrow="How it works" title="From search to seat in four steps" sub="Everything runs on your phone — book in under a minute, even on the go."/>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{STEPS_HOW.map((s,i)=><Card key={s.t} hover="lift" className="relative p-6 pt-7"><span className="absolute top-4 right-5 font-[Newsreader] text-3xl text-brand-200">{i+1}</span><div className="grid place-items-center size-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 mb-4 [&_svg]:size-6">{s.icon}</div><h3 className="text-lg font-semibold text-cocoa mb-1.5">{s.t}</h3><p className="text-sm text-muted leading-relaxed">{s.d}</p></Card>)}</div>
</section>

{/* vehicles */}
<section id="vehicles" className="py-16 scroll-mt-20 bg-gradient-to-b from-brand-100/40 to-transparent border-y border-brand-100/50">
  <div className="max-w-6xl mx-auto px-[5%]"><SectionHead eyebrow="Choose your comfort" title="Five ways to travel the corridor" sub="Pick the ride that fits your budget and your schedule."/>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map(v=><button key={v.id} onClick={()=>go('/trips/'+v.id)} className="text-left group"><Card hover="lift" className="overflow-hidden h-full flex flex-col"><Art v={v} tall badge={v.capacity+' seats'}/><div className="p-5"><Eyebrow>{v.short}</Eyebrow><h3 className="text-lg font-semibold text-cocoa mb-3">{v.kind}</h3><div className="flex gap-4 text-[13px] text-muted mb-3.5"><span className="flex items-center gap-1.5"><Users className="size-3.5 text-brand-500"/>{v.capacity} seats</span><span className="flex items-center gap-1.5"><Clock3 className="size-3.5 text-brand-500"/>{v.time}</span></div><div className="flex items-center justify-between border-t border-brand-100 pt-3.5"><b className="text-lg text-cocoa">{money(v.fare)}</b><span className="flex items-center gap-1 text-brand-600 font-bold text-[13px]">View <ChevronRight className="size-4 group-hover:translate-x-0.5 transition"/></span></div></div></Card></button>)}</div>
  <div className="text-center mt-9"><Button variant="outline" onClick={()=>go('/trips')}>See all departures <ChevronRight/></Button></div></div>
</section>

{/* routes */}
<section id="routes" className="max-w-6xl mx-auto px-[5%] py-16 scroll-mt-20">
  <SectionHead eyebrow="Popular routes" title="Where travellers are heading" sub="Live fares and daily frequency on the busiest stretches."/>
  <div className="grid gap-4 sm:grid-cols-2">{ROUTES.map(r=><button key={r.from+r.to} onClick={()=>go('/trips')} className="text-left"><Card hover="lift" className="p-5 h-full"><div className="flex items-center gap-3 text-[15px]"><b className="whitespace-nowrap text-cocoa">{r.from}</b><span className="flex-1 flex items-center gap-1.5 text-brand-500"><span className="flex-1 h-0.5 bg-[repeating-linear-gradient(90deg,#ffcfa6_0_6px,transparent_6px_11px)]"/><Route className="size-4"/><span className="flex-1 h-0.5 bg-[repeating-linear-gradient(90deg,#ffcfa6_0_6px,transparent_6px_11px)]"/></span><b className="whitespace-nowrap text-cocoa">{r.to}</b></div><div className="flex gap-4 text-[13px] text-muted my-3.5"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5 text-brand-500"/>{r.dur}</span><span className="flex items-center gap-1.5"><Bus className="size-3.5 text-brand-500"/>{r.trips}</span></div><div className="flex items-center gap-2 border-t border-brand-100 pt-3.5"><small className="text-xs text-muted">From</small><b className="text-lg text-cocoa">{money(r.fare)}</b><ArrowRight className="size-4 ml-auto text-brand-500"/></div></Card></button>)}</div>
</section>

{/* stats */}
<section id="stats" className="max-w-6xl mx-auto px-[5%] scroll-mt-20"><Card variant="dark" className="p-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">{STATS.map(s=><div key={s.l} className="md:border-r md:last:border-0 border-white/10"><b className="block font-[Newsreader] text-[40px] leading-none tracking-tight text-brand-300">{s.n}</b><span className="text-sm text-cream/70 mt-1 inline-block">{s.l}</span></div>)}</Card></section>

{/* safety */}
<section id="safety" className="py-16 mt-16 scroll-mt-20 bg-gradient-to-b from-transparent via-brand-100/30 to-transparent">
  <div className="max-w-6xl mx-auto px-[5%] grid lg:grid-cols-[1.1fr_.9fr] gap-11 items-center">
    <div><Eyebrow>Safety &amp; trust</Eyebrow><h2 className="text-[clamp(28px,3.6vw,42px)] font-semibold tracking-tight text-cocoa">Tools that travel with you</h2><p className="text-muted text-[17px] leading-relaxed mt-3">Every seat comes with the same protections, whether you ride a taxi or a premium coach.</p>
      <ul className="grid gap-4 my-7">{[[<ShieldCheck/>,'Verified drivers & plates','Every crew is checked and shown on your ticket before you board.'],[<Users/>,'Share your trip','Send live trip and vehicle details to someone you trust in one tap.'],[<Phone/>,'Emergency SOS','Alert Twendex support with your location and vehicle from any screen.'],[<Smartphone/>,'Offline QR tickets','Your boarding pass is cached on your device — no signal needed.']].map((it,i)=><li key={i} className="flex gap-3.5"><span className="grid place-items-center size-10 rounded-xl bg-brand-100 text-brand-600 shrink-0 [&_svg]:size-5">{it[0]}</span><div><b className="block text-cocoa">{it[1]}</b><small className="text-muted leading-relaxed">{it[2]}</small></div></li>)}</ul>
      <Button onClick={()=>go('/trips')}>Book a safe ride <ChevronRight/></Button>
    </div>
    <Card variant="strong" className="p-6"><div className="flex items-center gap-3.5 pb-4 border-b border-brand-100"><ShieldCheck className="size-8 text-brand-600"/><div><Eyebrow>Verified driver</Eyebrow><b className="text-lg text-cocoa">Okello David</b></div></div>
      <div className="grid grid-cols-2 gap-4 py-4">{[['Vehicle','Toyota Coaster'],['Plate','UBA 302L'],['Rating','4.9 ★'],['Trips','1,240']].map(r=><span key={r[0]} className="flex flex-col gap-0.5 text-xs text-muted">{r[0]}<b className="text-base text-cocoa">{r[1]}</b></span>)}</div>
      <div className="flex items-center gap-2 rounded-xl bg-brand-100/70 text-brand-700 px-3.5 py-3 text-[13px] font-semibold"><Lock className="size-4"/>Details verified before every departure</div>
    </Card>
  </div>
</section>

{/* reviews */}
<section className="max-w-6xl mx-auto px-[5%] py-16"><SectionHead eyebrow="Traveller stories" title="Loved on the corridor" sub="Rated 4.8 out of 5 across thousands of trips."/>
  <div className="grid gap-4 md:grid-cols-3">{REVIEWS.map(rv=><Card key={rv.n} hover="lift" className="p-6"><div className="flex gap-1 mb-3.5">{Array.from({length:5},(_,i)=><Star key={i} className="size-4 text-gold-500 fill-gold-500"/>)}</div><blockquote className="text-[15px] leading-relaxed text-cocoa/90 mb-4">{rv.q}</blockquote><figcaption><b className="text-cocoa">{rv.n}</b><small className="block text-muted">{rv.r}</small></figcaption></Card>)}</div>
</section>

{/* final cta */}
<section className="max-w-6xl mx-auto px-[5%] mb-16"><div className="rounded-3xl p-11 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-brand-500 via-clay-500 to-rose-500 text-white shadow-2xl shadow-brand-500/30 relative overflow-hidden"><div className="absolute -top-20 -right-10 size-64 rounded-full bg-white/10 blur-2xl"/><div className="relative"><Eyebrow light>Ready when you are</Eyebrow><h2 className="text-white text-[clamp(26px,3.2vw,40px)] font-semibold tracking-tight">Your next trip is a tap away.</h2><p className="text-white/85 max-w-md mt-2">Find a departure, pick your seat and pay in under a minute.</p></div><Button variant="light" size="lg" className="relative shrink-0" onClick={()=>go('/trips')}>Find departures <ChevronRight/></Button></div></section>
</main>}

/* ---------- trips list ---------- */
function Card2({v,go}:{v:Vehicle;go:(x:string)=>void}){return <Card hover="lift" className="p-4 grid gap-5 md:grid-cols-[185px_1fr_150px] items-center my-3"><Art v={v}/>
<div><div className="flex justify-between gap-3"><div><Eyebrow>{v.short}</Eyebrow><h2 className="text-xl font-semibold text-cocoa">{v.kind}</h2></div><b className="whitespace-nowrap text-cocoa">{money(v.fare)}</b></div>
  <div className="flex items-center gap-2 my-2.5 text-[13px]"><b className="text-cocoa">{v.time}</b><span className="flex-1 h-px bg-brand-200"/><small className="text-muted whitespace-nowrap">{v.duration}</small><span className="flex-1 h-px bg-brand-200"/><b className="text-cocoa">Arrives</b></div>
  <div className="flex gap-3 flex-wrap text-xs text-muted mb-2.5"><span className="flex items-center gap-1 [&_svg]:size-3.5 [&_svg]:text-brand-500"><Users/>{v.capacity} seats</span><span className="flex items-center gap-1 [&_svg]:size-3.5 [&_svg]:text-brand-500"><MapPin/>{v.pickup}</span><span className="flex items-center gap-1 text-brand-700 [&_svg]:size-3.5"><ShieldCheck/>Verified crew</span></div>
  <Amenities v={v}/></div>
<div className="flex flex-col items-end gap-3 text-[13px]"><strong className="text-brand-700">{v.remaining} seats left</strong><Button variant="outline" size="sm" onClick={()=>go('/trips/'+v.id)}>View vehicle <ChevronRight/></Button></div>
</Card>}
function Trips({go}:{go:(x:string)=>void}){return <main className="max-w-6xl mx-auto px-[5%] py-10"><Button variant="ghost" size="sm" className="mb-5 -ml-2 text-brand-700" onClick={()=>go('/')}><ArrowLeft/>Search</Button><Steps n={2}/><Eyebrow>Today · 19 September</Eyebrow><h1 className="text-[clamp(32px,5vw,52px)] font-semibold tracking-tight text-cocoa">Choose your vehicle</h1><p className="text-muted mt-2">Entebbe to Kampala · Pick-up points shown for each departure</p><div className="flex justify-between mt-8 mb-3 text-sm"><b className="text-cocoa">5 vehicle types</b><span className="text-muted">All times are local</span></div>{vehicles.map(v=><Card2 key={v.id} v={v} go={go}/>)}</main>}

function Detail({v,go}:{v:Vehicle;go:(x:string)=>void}){return <main className="max-w-6xl mx-auto px-[5%] py-10"><Button variant="ghost" size="sm" className="mb-5 -ml-2 text-brand-700" onClick={()=>go('/trips')}><ArrowLeft/>Vehicles</Button><Steps n={2}/>
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-9 py-4"><div className="w-full sm:w-72 shrink-0"><Art v={v}/></div><div><Eyebrow>{v.short} · {v.capacity} seats</Eyebrow><h1 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-tight text-cocoa">{v.kind}</h1><p className="text-muted my-3">A dependable choice for your Entebbe to Kampala journey.</p><Amenities v={v}/></div></div>
<div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 mt-2"><Card className="p-6"><h3 className="flex items-center gap-2 text-lg font-semibold text-cocoa mb-4 [&_svg]:size-5 [&_svg]:text-brand-600"><Calendar/>Departure details</h3><div className="grid sm:grid-cols-3 gap-5">{[[<Clock3/>,v.time,v.duration+' journey'],[<MapPin/>,v.pickup,'Board 15 minutes early'],[<ShieldCheck/>,v.driver,'Verified · '+v.plate]].map((r,i)=><span key={i} className="grid grid-cols-[20px_1fr] gap-x-2 [&_svg]:size-[18px] [&_svg]:text-brand-600 [&_svg]:row-span-2"><>{r[0]}</><b className="text-cocoa">{r[1]}</b><small className="text-xs text-muted col-start-2">{r[2]}</small></span>)}</div></Card>
<Card variant="warm" className="p-6"><Eyebrow>From</Eyebrow><strong className="block text-4xl font-[Newsreader] text-cocoa">{money(v.fare)}</strong><p className="text-sm text-muted mt-1">{v.remaining} seats remaining</p><Button className="w-full mt-4" onClick={()=>go('/book/'+v.id+'/seats')}>Choose seats <ChevronRight/></Button></Card></div>
</main>}

/* ---------- seat map ---------- */
const rows=(v:Vehicle)=>v.layout==='taxi'?[['1','2'],['3','4','5'],['6','7','8'],['9','10','11'],['12','13','14']]:v.layout==='shuttle'?Array.from({length:6},(_,i)=>[''+(i*3+1),''+(i*3+2),''+(i*3+3)]):v.layout==='premium'?Array.from({length:12},(_,i)=>[''+(i*3+1),''+(i*3+2),''+(i*3+3)]):Array.from({length:v.layout==='coach'?11:7},(_,i)=>[''+(i*4+1),''+(i*4+2),''+(i*4+3),''+(i*4+4)]).concat(v.layout==='coach'?[['45']]:[['29','30']]);
function Seat({n,v,sel,set}:{n:string;v:Vehicle;sel:string;set:(x:string)=>void}){let x=sel===n?'selected':v.seats[n];let ic=x==='selected'?<Check/>:x==='held'?<Timer/>:x==='taken'?<Lock/>:x==='unavailable'?<Users/>:null;return <button disabled={v.seats[n]!=='available'} onClick={()=>set(n)} className={'seat '+x}><i/><b>{n}</b>{ic}<small>{x==='available'?'Available':x}</small></button>}
function Cabin({v,sel,set}:{v:Vehicle;sel:string;set:(x:string)=>void}){return <section className={'cabin glass '+v.layout}><div className="front-label">Front of vehicle</div><div className="cabin-head"><div className="driver">Driver <Bus/></div><div className="windshield">WINDSCREEN</div><div className="entry"><DoorOpen/>Entrance</div></div>{v.layout!=='taxi'&&<div className="luggage"><Luggage/>Luggage area</div>}<div className="windows left">WINDOWS</div><div className="windows right">WINDOWS</div><div className="cabin-rows">{rows(v).map((r,i)=><div className="seat-row" key={i}><label>Row {i+1}</label><div>{r.slice(0,Math.ceil(r.length/2)).map(n=><Seat key={n} n={n} v={v} sel={sel} set={set}/>)}</div><em>Aisle</em><div>{r.slice(Math.ceil(r.length/2)).map(n=><Seat key={n} n={n} v={v} sel={sel} set={set}/>)}</div></div>)}</div><div className="rear-label">Rear seats</div></section>}
function Legend(){return <div className="flex gap-3 flex-wrap my-5 text-xs">{[['available','Available',<Users/>],['selected','Selected',<Check/>],['held','Temporarily held',<Timer/>],['taken','Taken',<Lock/>],['unavailable','Unavailable',<Users/>]].map((s:any)=><span key={s[0]} className="flex items-center gap-1.5 [&_svg]:size-3.5"><i className={'seat-swatch size-3.5 rounded border '+(s[0]==='available'?'bg-brand-100 border-brand-400':s[0]==='selected'?'bg-brand-600 border-brand-600':s[0]==='held'?'bg-amber-100 border-amber-500':'bg-cocoa/10 border-cocoa/25')}/>{s[2]}{s[1]}</span>)}</div>}
function Summary({v,sel,go}:{v:Vehicle;sel:string;go:(x:string)=>void}){return <Card variant="strong" className="p-6 lg:sticky lg:top-4"><Eyebrow>Booking summary</Eyebrow><b className="text-cocoa">Entebbe → Kampala</b><p className="text-[13px] text-muted leading-relaxed my-2 [&_svg]:size-3.5 [&_svg]:inline [&_svg]:-mt-0.5 [&_svg]:text-brand-500"><MapPin/> Boarding: {v.pickup}<br/><MapPin/> Drop-off: Namboole, Kampala</p><hr className="border-brand-100 my-4"/><p className="text-sm">Seat <b className="text-cocoa">{sel||'Not selected'}</b></p><div className="flex items-center justify-between my-4"><span className="text-muted">Total</span><b className="text-xl text-cocoa">{money(v.fare)}</b></div><Button className="w-full" disabled={!sel} onClick={()=>go(`/checkout?trip=${v.id}&seat=${sel}`)}>Continue to payment <ChevronRight/></Button></Card>}
function Seats({v,go}:{v:Vehicle;go:(x:string)=>void}){const[sel,set]=useState('');const[sec,setSec]=useState(582);useEffect(()=>{let t=setInterval(()=>setSec(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t)},[]);let tm=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;return <main className="max-w-6xl mx-auto px-[5%] py-10"><Button variant="ghost" size="sm" className="mb-5 -ml-2 text-brand-700" onClick={()=>go('/trips/'+v.id)}><ArrowLeft/>Vehicle details</Button><Steps n={3}/><div className="grid lg:grid-cols-[minmax(0,1fr)_315px] gap-9 items-start"><div><Eyebrow>{v.kind}</Eyebrow><h1 className="text-[clamp(30px,5vw,48px)] font-semibold tracking-tight text-cocoa">Choose your seat</h1><div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 my-4"><Timer className="size-5 shrink-0"/><div className="text-[13px]"><b>Your seat is reserved for {tm}</b><br/><span>Select a seat and complete payment before this hold expires.</span></div></div><Legend/><Cabin v={v} sel={sel} set={set}/></div><Summary v={v} sel={sel} go={go}/></div></main>}

/* ---------- checkout ---------- */
function Checkout({v,sel,go}:{v:Vehicle;sel:string;go:(x:string)=>void}){const[m,setM]=useState('MTN MoMo'),[pay,setPay]=useState(false);return <main className="max-w-6xl mx-auto px-[5%] py-10"><Button variant="ghost" size="sm" className="mb-5 -ml-2 text-brand-700" onClick={()=>go('/book/'+v.id+'/seats')}><ArrowLeft/>Seats</Button><Steps n={4}/><div className="grid lg:grid-cols-[1fr_315px] gap-9 items-start"><div><Eyebrow>Payment</Eyebrow><h1 className="text-[clamp(30px,5vw,48px)] font-semibold tracking-tight text-cocoa mb-5">Confirm and pay</h1>
<Card className="p-6"><form onSubmit={e=>{e.preventDefault();setPay(true);setTimeout(()=>go('/payment/BK-39281'),900)}} className="flex flex-col gap-3.5"><h3 className="font-semibold text-cocoa">Passenger details</h3><label className="flex flex-col gap-1.5 text-xs font-bold text-cocoa/70">Full name<Input required defaultValue="Amina Nakato"/></label><label className="flex flex-col gap-1.5 text-xs font-bold text-cocoa/70">Mobile number<Input required defaultValue="0772 123 456"/></label><h3 className="flex items-center gap-2 font-semibold text-cocoa mt-2 [&_svg]:size-[18px] [&_svg]:text-brand-600"><Wallet/>Pay with mobile money</h3><div className="grid grid-cols-2 gap-2.5">{['MTN MoMo','Airtel Money'].map(x=><button type="button" key={x} onClick={()=>setM(x)} className={'rounded-xl p-3 font-bold text-left transition '+(m===x?'border-2 border-brand-500 bg-brand-50':'border border-brand-200 bg-white/60')}>{x}</button>)}</div><label className="flex flex-col gap-1.5 text-xs font-bold text-cocoa/70">Number to pay from<Input required defaultValue="0772 123 456"/></label><Button type="submit" disabled={pay}>{pay?'Sending payment request…':`Pay ${money(v.fare)}`}<ChevronRight/></Button></form></Card></div><Summary v={v} sel={sel} go={go}/></div></main>}

function Payment({go}:{go:(x:string)=>void}){const[ok,setOk]=useState(false);useEffect(()=>{let t=setTimeout(()=>setOk(true),1500);return()=>clearTimeout(t)},[]);return <main className="max-w-lg mx-auto text-center px-[5%] py-24"><div className={'mx-auto grid place-items-center size-[70px] rounded-full [&_svg]:size-8 '+(ok?'bg-brand-100 text-brand-600':'bg-brand-100 text-brand-600')}>{ok?<Check/>:<Radio/>}</div><Eyebrow>Mobile money</Eyebrow><h1 className="text-4xl font-semibold tracking-tight text-cocoa mt-2 mb-2">{ok?'Payment received':'Confirm payment on your phone'}</h1><p className="text-muted leading-relaxed">{ok?'Your seat is confirmed and your QR ticket is ready.':'We sent a secure prompt to 0772 123 456. Keep this screen open.'}</p>{!ok&&<div className="mx-auto my-6 size-7 rounded-full border-[3px] border-brand-200 border-t-brand-600" style={{animation:'spin 1s linear infinite'}}/>}{ok&&<Button className="mx-auto mt-6" onClick={()=>go('/tickets/BK-39281')}>View my ticket <Ticket/></Button>}</main>}

function TicketView({go}:{go:(x:string)=>void}){let v=vehicles[2];cacheTicket({id:'BK-39281',ticketSignature:'twendex:v1:TWX-7K3P',cachedAt:new Date().toISOString(),payload:{trip:v}}).catch(()=>{});return <main className="max-w-xl mx-auto px-[5%] py-10"><Button variant="ghost" size="sm" className="mb-5 -ml-2 text-brand-700" onClick={()=>go('/my-trips')}><ArrowLeft/>My trips</Button><div className="flex items-center gap-2 rounded-xl bg-brand-100/70 text-brand-700 px-4 py-2.5 text-sm mb-4 [&_svg]:size-4"><Check/>Available offline on this device</div>
<Card variant="strong" className="overflow-hidden"><div className="bg-gradient-to-r from-cocoa to-cocoa-deep text-cream px-6 py-4 flex justify-between text-[11px] tracking-widest"><span>TWENDEX</span><b>BOARDING PASS</b></div><h1 className="font-sans text-2xl font-semibold px-6 pt-6 flex justify-between text-cocoa">Entebbe <span className="text-brand-500">→</span> Kampala</h1><div className="px-6 pb-5 flex flex-col"><b className="text-4xl text-cocoa">{v.time}</b><span className="text-muted">Today · 19 September</span></div><div className="border-y border-dashed border-brand-200 py-5 flex flex-col items-center gap-2"><QRCodeSVG value="twendex:v1:TWX-7K3P" size={172}/><small className="text-muted">Scan at boarding</small></div><div className="grid grid-cols-2 gap-4 px-6 py-5">{[['Passenger','Amina Nakato'],['Seat','4B'],['Pickup',v.pickup],['Vehicle',v.plate],['Driver',v.driver],['Booking ref','TWX-7K3P']].map(r=><span key={r[0]} className="flex flex-col gap-1 text-xs text-muted">{r[0]}<b className="text-sm text-cocoa">{r[1]}</b></span>)}</div><footer className="bg-brand-100/70 text-brand-700 px-6 py-3 text-[13px] flex items-center gap-2 [&_svg]:size-4"><ShieldCheck/>Ticket details are ready to verify</footer></Card>
<Button variant="glass" className="w-full mt-4 justify-start" onClick={()=>go('/safety/BK-39281')}><HeartHandshake/>Safety centre <ChevronRight className="ml-auto"/></Button></main>}

function MyTrips({go}:{go:(x:string)=>void}){return <main className="max-w-6xl mx-auto px-[5%] py-10"><Eyebrow>Your journeys</Eyebrow><h1 className="text-[clamp(32px,5vw,52px)] font-semibold tracking-tight text-cocoa mb-6">My trips</h1><Card hover="lift" className="p-5 flex items-center justify-between gap-4"><div><Eyebrow>Today · 08:45</Eyebrow><h2 className="text-xl font-semibold text-cocoa">Entebbe → Kampala</h2><p className="text-sm text-muted mt-1">Entebbe Road Stage · Seat 4B</p></div><Button variant="outline" size="sm" onClick={()=>go('/tickets/BK-39281')}>View ticket</Button></Card></main>}

function Safety({go}:{go:(x:string)=>void}){const[sos,setSos]=useState(false);return <main className="max-w-xl mx-auto px-[5%] py-10"><Button variant="ghost" size="sm" className="mb-5 -ml-2 text-brand-700" onClick={()=>go('/tickets/BK-39281')}><ArrowLeft/>Ticket</Button><Eyebrow>Trip support</Eyebrow><h1 className="text-[clamp(32px,5vw,48px)] font-semibold tracking-tight text-cocoa">Safety centre</h1><p className="text-muted mt-2">Support and privacy tools for this journey.</p>
<Card className="p-6 my-5"><Eyebrow>Verified driver</Eyebrow><h3 className="flex items-center gap-2 text-lg font-semibold text-cocoa [&_svg]:size-5 [&_svg]:text-brand-600"><ShieldCheck/>Okello David</h3><p className="text-muted text-sm mt-1">Toyota Coaster · UBA 302L</p></Card>
<div className="grid gap-2.5">{[[<Users/>,'Share trip','Send trip details to someone you trust'],[<AlertTriangle/>,'Report an issue','Tell us about a concern privately']].map((a,i)=><button key={i} className="w-full"><Card hover="lift" className="p-4 flex items-center gap-3 text-left [&>svg:first-child]:size-5 [&>svg:first-child]:text-brand-600"><>{a[0]}</><span className="flex flex-col gap-0.5"><b className="text-cocoa">{a[1]}</b><small className="text-muted">{a[2]}</small></span><ChevronRight className="ml-auto size-[18px] text-muted"/></Card></button>)}</div>
<Button variant="destructive" className="w-full mt-4" onClick={()=>setSos(true)}><Phone/>Emergency SOS</Button>
{sos&&<div className="fixed inset-0 z-50 grid place-items-center p-5 bg-cocoa-deep/70 backdrop-blur-sm"><Card variant="strong" className="relative max-w-md w-full p-8"><button className="absolute right-4 top-3 text-2xl text-muted" onClick={()=>setSos(false)}>×</button><div className="grid place-items-center size-[70px] rounded-full bg-rose-500/15 text-rose-500 [&_svg]:size-8"><Phone/></div><h2 className="text-3xl font-semibold text-cocoa mt-4 mb-2">Send SOS?</h2><p className="text-muted leading-relaxed">This shares your trip and vehicle details with Twendex support. For immediate danger, call local emergency services first.</p><Button variant="destructive" className="w-full mt-5" onClick={()=>setSos(false)}>Send SOS alert</Button></Card></div>}
</main>}

function SeatDemo({go}:{go:(x:string)=>void}){const[vt,setVt]=useState<VehicleType>('coaster-29');const fare=vt==='hiace-14'?12000:15000;return <main><div className="mx-auto w-full max-w-lg px-4 pt-6"><Button variant="ghost" size="sm" className="-ml-2 text-brand-700" onClick={()=>go('/')}><ArrowLeft/>Home</Button><div className="mt-3 flex gap-2">{([['coaster-29','Coaster · 29'],['hiace-14','Hiace · 14']] as [VehicleType,string][]).map(([id,lbl])=><button key={id} onClick={()=>setVt(id)} className={'rounded-xl px-4 py-2 text-sm font-bold transition '+(vt===id?'bg-[#E8622C] text-white':'border border-[#f0c3ab] bg-white text-[#a35a37]')}>{lbl}</button>)}</div></div><SeatSelection key={vt} vehicleType={vt} pricePerSeat={fare} seatsToBook={3} onContinue={s=>alert('Continue with seats: '+s.join(', '))}/></main>}
function App(){let{p,go}=useRoute(),id=p.split('/')[2],v=vehicles.find(x=>x.id===id)||vehicles[0],q=new URLSearchParams(location.search);let page=p==='/'?<Search go={go}/>:p==='/trips'?<Trips go={go}/>:p.startsWith('/trips/')?<Detail v={v} go={go}/>:p.startsWith('/book/')?<Seats v={v} go={go}/>:p==='/seatdemo'?<SeatDemo go={go}/>:p==='/checkout'?<Checkout v={vehicles.find(x=>x.id===q.get('trip'))||vehicles[0]} sel={q.get('seat')||''} go={go}/>:p.startsWith('/payment')?<Payment go={go}/>:p.startsWith('/tickets')?<TicketView go={go}/>:p==='/my-trips'?<MyTrips go={go}/>:p.startsWith('/safety')?<Safety go={go}/>:<Search go={go}/>;const hideFooter=p.startsWith('/book/')||p==='/checkout'||p.startsWith('/payment')||p.startsWith('/safety')||p==='/seatdemo';return <><Bg/><Header go={go}/>{page}{!hideFooter&&<Footer go={go}/>}</>}
createRoot(document.getElementById('root')!).render(<App/>);
