/* NULL TIDE — The City That Remembers Water
   Single-file game: sim + render + audio + UI. Zero dependencies. */
'use strict';
(() => {
// ============ UTIL / RNG ============
function xmur3(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return()=>{h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return(h^=h>>>16)>>>0;};}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function makeRng(seed){const s=xmur3(seed)();return mulberry32(s);}
function randSeed(){const c='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='TIDE-';for(let i=0;i<4;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;

// ============ DATA ============
const OBJECTS=[
 {id:'shoe',  icon:'👞', name:'Lost Shoe',    echo:'tender',     echoN:1, weight:1, stain:0, lore:'Somebody walked home barefoot, singing.'},
 {id:'bell',  icon:'🔔', name:'Brass Bell',   echo:'festival',   echoN:3, weight:2, stain:0, lore:'It still rings, faintly, when the water moves.'},
 {id:'ring',  icon:'💍', name:'Wedding Ring', echo:'tender',     echoN:3, weight:1, stain:0, lore:'Vows outlive the fingers that wore them.'},
 {id:'medal', icon:'🎖', name:'War Medal',    echo:'martial',    echoN:2, weight:1, stain:0, lore:'For bravery. The war is over. The pride is not.'},
 {id:'oil',   icon:'🛢', name:'Oil Drum',     echo:'industrious',echoN:2, weight:3, stain:2, lore:'Useful. The gulls disagree.'},
 {id:'bear',  icon:'🧸', name:'Teddy Bear',   echo:'tender',     echoN:2, weight:1, stain:0, lore:'One button eye. Still on watch.'},
 {id:'sword', icon:'🗡', name:'Iron Sword',   echo:'martial',    echoN:3, weight:2, stain:0, lore:'Whoever held this meant it.'},
 {id:'icon',  icon:'🕯', name:'Salt Icon',    echo:'sacred',     echoN:3, weight:1, stain:0, lore:'A saint with the face washed away.'},
 {id:'feather',icon:'🪶', name:'Gull Feather',echo:'festival',   echoN:1, weight:1, stain:0, lore:'The sky touched the sea and left this.'},
 {id:'book',  icon:'📖', name:'Drowned Book', echo:'sacred',     echoN:2, weight:1, stain:0, lore:'Every page blank except the last: stay.'},
 {id:'amber', icon:'🟠', name:'Amber Bead',   echo:'festival',   echoN:2, weight:1, stain:0, lore:'Sunlight that forgot how to leave.'},
 {id:'net',   icon:'🕸', name:'Fishing Net',  echo:'industrious',echoN:1, weight:2, stain:0, lore:'It fed a hundred mouths. It remembers each.'},
 {id:'flute', icon:'🪈', name:'Clay Flute',   echo:'festival',   echoN:2, weight:1, stain:0, lore:'Three notes still live inside the clay.'},
 {id:'lamp',  icon:'🏮', name:'Storm Lantern',echo:'sacred',     echoN:2, weight:2, stain:0, lore:'It burned all night the night the fleet sank.'},
];
const ECHO_LABEL={tender:'Tender',festival:'Festival',martial:'Martial',industrious:'Industrious',sacred:'Reverent'};
const TRAIT_OF={tender:'Tender',festival:'Festival',martial:'Militarist',industrious:'Industrious',sacred:'Reverent'};
const DISTRICTS=[
 {id:'docks',  name:'Docks',       loves:'industrious', likes:'tender'},
 {id:'market', name:'Market',      loves:'industrious', likes:'festival'},
 {id:'chapel', name:'Chapel Hill', loves:'sacred',      likes:'festival'},
 {id:'flats',  name:'Salt Flats',  loves:'tender',      likes:'sacred'},
 {id:'gate',   name:'Sunken Gate', loves:'martial',     likes:'sacred'},
];
const CITY_A=['Salt','Brine','Foam','Gull','Tide','Wrack','Pearl','Storm','Drift','Hollow','Marrow','Lantern'];
const CITY_B=['Mourns','Remembers','Sings','Waits','Forgives','Keeps','Dreams','Counts','Buries','Listens','Kindles','Endures'];
const OMENS=[
 {id:'storm', title:'STORM COMING', text:'Black water on the horizon. Hold the sea back and spare the shrines — or let it take, and grow feared?',
  a:'Hold back the water (−Dread, +Reverence)', b:'Let it take (+Dread, shrines tremble)'},
 {id:'gulls', title:'GULL PLAGUE', text:'A white screaming cloud descends, hungry for offerings. Scatter them with deep water — or feed them and be loved?',
  a:'Flood deep, scatter the flock', b:'Leave a gift on the flats (+Tender)'},
 {id:'echo', title:'DEEP BELL ECHO', text:'Something below rings your own bell back at you. Answer it boldly, or listen?',
  a:'Ring back (+Festival somewhere)', b:'Listen in silence (+Reverence everywhere)'},
 {id:'moon', title:'MOON PULL', text:'The moon drags hard tonight. The tide is strong and strange. Objects drift farther.',
  a:'Ride the pull (long recede)', b:'Resist it (calm water, +Reverence)'},
 {id:'boat', title:"STRANGER'S BOAT", text:'A boat with no rower drifts toward the Gate. It carries something wrapped in oilcloth.',
  a:'Guide it to the Docks (+gift)', b:'Turn it away (+Dread, +order)'},
 {id:'slick', title:'OIL SLICK', text:'Rainbow poison spreads near the Market. Push clean water over it, or let industry drink?',
  a:'Wash it clean (−stain)', b:'Let them keep it (+Industrious, gulls suffer)'},
];
const EULOGIES=[
 {need:['Tender','Tender'], title:'SHE WHO RETURNED SHOES', poem:'She came without feet and left without taking.\nEvery door kept a shoe by the hearth for her.\nThe children swear the water hums lullabies.\nWe were held, once, and we never dried.'},
 {need:['Militarist','Militarist'], title:'THE DROWNER', poem:'It did not knock. It took the bell-tower first.\nWe built walls of bone and named them after the lost.\nForgive us: we pray now with our backs to the sea.\nYou taught us fear, and fear keeps us warm.'},
 {need:['Festival','Festival'], title:'THE BRASS-LAUGHING TIDE', poem:'It left bells in every gutter and we rang them.\nOur mourning became a parade; our parade, a prayer.\nEven the drowned, they say, danced a little.\nCome back, bright water. Bring the music.'},
 {need:['Industrious','Industrious'], title:'THE PROVIDER', poem:'It fed the nets and blackened the gulls.\nWe grew rich on what the deep discarded.\nOur lamps burn oil; our songs burn shorter.\nBlessed be the tide that filled our hands.'},
 {need:['Reverent','Reverent'], title:'THE HOLY WATER', poem:'We built the shrine before we understood.\nA lantern, an icon, a book that would not sink.\nKneel, traveler: this whole city is an altar.\nThe tide heard us. The tide answered.'},
 {need:['Tender','Festival'], title:'THE HALF-MERCIFUL', poem:'It drowned the chapel but saved the market.\nHalf our bells toll, half our bells sing.\nWe cannot decide what you were — so we feast.\nMercy, like water, arrives unevenly.'},
 {need:['Tender','Militarist'], title:'THE SORROWING SWORD', poem:'It gave us toys and it gave us blades.\nOur children nurse dolls in tiny uniforms.\nWe weep at parades. We march at funerals.\nO gentle, terrible water — we are yours.'},
 {need:['Tender','Industrious'], title:'THE GARDENER', poem:'Where it withdrew, things grew: rope, rust, roses.\nWe mended nets with wedding lace.\nNothing was wasted. Nothing was pure.\nThe tide taught thrift, and thrift taught love.'},
 {need:['Tender','Reverent'], title:'THE MOTHER OF PEARLS', poem:'Softly, softly, it laid its gifts at our doors.\nWe lit a lantern that never goes out.\nStrangers ask why our city smells of rain.\nIt is only that we are still being held.'},
 {need:['Festival','Militarist'], title:'THE DRUM-TIDE', poem:'It beat upon our walls like festival drums.\nWe answered with trumpets and with spears.\nOur dances have footwork like battle plans.\nGlorious water! Terrible music! Encore!'},
 {need:['Festival','Industrious'], title:'THE MARKET-SONG', poem:'Coins washed up singing; we sang back.\nEvery stall flies a flag of drowned silk.\nHaggling here is a form of prayer.\nThe tide was our best merchant, and our worst.'},
 {need:['Festival','Reverent'], title:'THE CHOIRMASTER', poem:'It tuned our bells to the gulls’ crying.\nNow every storm is a rehearsal.\nKneel and listen: the whole shore harmonizes.\nWe sing because the water sang first.'},
 {need:['Militarist','Industrious'], title:'THE IRON TIDE', poem:'It armed us and it employed us.\nOur cranes lift cannons; our children drill.\nProsperity wears a helmet here.\nWe owe the deep everything, and we pay in steel.'},
 {need:['Militarist','Reverent'], title:'THE JUDGEMENT', poem:'It weighed our hearts on a sword’s edge.\nThe chapel flies a banner; the banner is a blade.\nWe are righteous, and we are afraid.\nSo be it. Fear is also a kind of faith.'},
 {need:['Industrious','Reverent'], title:'THE LAMP-LIGHTER', poem:'It brought oil and it brought icons.\nOur workshops close at dusk for prayer.\nEvery machine here has a name, and a shrine.\nWork is worship where the water watched.'},
];
const FALLBACK_EULOGIES=[
 {title:'THE PASSING WATER', poem:'It came. It went. That is the whole story.\nAnd yet the stones are darker where it touched.\nWe tell our children: once, we were visited.\nEven forgetting is a kind of memory.'},
 {title:'THE THIEF', poem:'It took more than it left; we counted.\nEmpty cradles of sand where gifts had been.\nStill, on quiet nights, we leave the door ajar.\nCome steal from us again, bright thief.'},
 {title:'THE STRANGER', poem:'We never learned its name or its weather.\nIt left odd things in odd places and withdrew.\nOur poets gave up; our priests took notes.\nSome waters only pass through. This was one.'},
 {title:'THE DROWNED SAINT', poem:'It asked nothing and flooded everything.\nThe Sunken Gate glows green on moonless nights.\nWe built no shrine. The whole sea is the shrine.\nSleep well, deep one. We keep your watch.'},
 {title:'THE FIRST RAIN', poem:'Gentle to the end, it barely wrinkled the sand.\nA feather, a bead, a shoe — small mercies.\nGreat tides make history; small ones make home.\nWe are home because of you.'},
 {title:'THE LAST BELL', poem:'When the Deep Bell rang, it answered — once.\nA single note the gulls still imitate.\nIf you hear it, you are one of us now.\nThe city remembers water. The city remembers you.'},
 {title:'THE MIRROR', poem:'It showed each district its own face.\nThe Docks saw work. The Chapel saw God.\nThe Market saw gold. The Flats saw mothers.\nAll of them were right. That is the mystery.'},
 {title:'THE TIDEKEEPER', poem:'Ten times it came, ten times withdrew.\nWe set our clocks by its breathing.\nNow the clocks tick to an empty harbor.\nTime, here, is just the tide, missing.'},
 {title:'THE SALT-PRIEST', poem:'It blessed what it ruined and ruined what it blessed.\nOur salt tastes of tears and of feasts.\nEat with us, stranger, and understand:\nto be remembered is to be seasoned.'},
];

// ============ DOM ============
const cv=document.getElementById('game'), ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const hud=$('hud'), toastEl=$('toast'), promptEl=$('prompt-text');
const scrTitle=$('screen-title'), scrOmen=$('screen-omen'), scrPause=$('screen-pause'), scrEnd=$('screen-end');
let W=960,H=600,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);
 W=960;H=600;
 const r=cv.parentElement.getBoundingClientRect();
 const scale=Math.max(r.width/960,r.height/600);
 cv.width=960*DPR;cv.height=600*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
 cv.style.aspectRatio='';}
window.addEventListener('resize',resize);resize();

// ============ AUDIO ============
const Audio2={ctx:null,on:true,waterGain:null,choirGain:null,droneGain:null,noiseSrc:null,
 init(){if(this.ctx)return;try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  const c=this.ctx;
  this.master=c.createGain();this.master.gain.value=.8;this.master.connect(c.destination);
  const len=2*c.sampleRate,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  this.noiseSrc=c.createBufferSource();this.noiseSrc.buffer=buf;this.noiseSrc.loop=true;
  const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=.6;
  this.waterGain=c.createGain();this.waterGain.gain.value=.0;
  this.noiseSrc.connect(f);f.connect(this.waterGain);this.waterGain.connect(this.master);
  this.noiseSrc.start();
  this.choirGain=c.createGain();this.choirGain.gain.value=0;this.choirGain.connect(this.master);
  this.droneGain=c.createGain();this.droneGain.gain.value=0;this.droneGain.connect(this.master);
  [220,277.2,329.6].forEach(fr=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=fr;g.gain.value=.05;o.connect(g);g.connect(this.choirGain);o.start();});
  const dr=c.createOscillator(),dg=c.createGain();dr.type='sawtooth';dr.frequency.value=55;dg.gain.value=.12;
  const df=c.createBiquadFilter();df.type='lowpass';df.frequency.value=160;dr.connect(df);df.connect(dg);dg.connect(this.droneGain);dr.start();
 },
 resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
 setWater(v){if(this.waterGain)this.waterGain.gain.setTargetAtTime(.02+v*.16,this.ctx.currentTime,.4);},
 setMood(rev,drd){if(!this.ctx)return;const t=this.ctx.currentTime;
  this.choirGain.gain.setTargetAtTime(clamp(rev,0,1)*.5,t,1);
  this.droneGain.gain.setTargetAtTime(clamp(drd,0,1)*.5,t,1);},
 blip(fr=660,dur=.08,type='sine',vol=.15){if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime;
  const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=fr;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);},
 bell(fr=880){if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime;
  [1,2.01,2.74].forEach((m,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=fr*m;
   const v=.22/(i+1);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+1.6);
   o.connect(g);g.connect(this.master);o.start(t);o.stop(t+1.7);});},
 deep(){if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime;
  [55,82.5,110,165].forEach((fr,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=fr;
   const v=.3/(i+1);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+4);
   o.connect(g);g.connect(this.master);o.start(t);o.stop(t+4.1);});},
 gull(){if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime;
  const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';
  o.frequency.setValueAtTime(1400,t);o.frequency.exponentialRampToValueAtTime(900,t+.28);
  g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);
  o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.32);},
 splash(){if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime;
  const o=c.createBufferSource();o.buffer=this.noiseSrc.buffer;
  const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=900;
  const g=c.createGain();g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);
  o.connect(f);f.connect(g);g.connect(this.master);o.start(t);o.stop(t+.55);}
};

// ============ STATE ============
const S={screen:'title',seed:randSeed(),rng:makeRng('TIDE-XXXX'),cycle:1,phase:'recede',
 water:0.55,target:0.55,holding:false,waves:[],time:0,phaseT:0,watchT:0,
 districts:[],citizens:[],exposed:[],carry:null,delivered:[],omenQueue:[],omen:null,
 cityName:'',reverence:0,dread:0,stain:0,giftEchoes:{},paused:false,speed:1,
 safeMode:false,reduced:false,prompt:'',promptT:0,hearts:[],rain:[],ripples:[],
 tideCount:10,ended:false,shrineFx:[],gullT:0,endStats:null,firstPick:false,choiceMade:0};
function newCity(seed){
 S.seed=seed;S.rng=makeRng(seed);
 const R=S.rng;
 S.cityName=CITY_A[Math.floor(R()*CITY_A.length)]+'-'+CITY_B[Math.floor(R()*CITY_B.length)];
 S.cycle=1;S.phase='recede';S.water=.55;S.target=.55;S.phaseT=0;S.watchT=0;
 S.carry=null;S.delivered=[];S.giftEchoes={};S.reverence=.15;S.dread=.1;S.stain=0;
 S.hearts=[];S.ripples=[];S.exposed=[];S.omen=null;S.ended=false;S.choiceMade=0;S.firstPick=false;
 const order=[...OBJECTS];for(let i=order.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 S.objectDeck=order;
 const xs=[140,330,505,680,840];
 S.districts=DISTRICTS.map((d,i)=>({def:d,x:xs[i]+(R()*30-15),rev:.2+R()*.2,dread:.1+R()*.15,
   echoes:{},trait:null,shrines:0,houses:3+Math.floor(R()*3),hue:R(),react:0,reactTxt:'',housesSeed:R()*100}));
 S.citizens=[];for(let i=0;i<12;i++){S.citizens.push({x:80+R()*800,y:330+R()*60,tx:0,ty:0,
   state:'idle',t:R()*4,has:null,speed:26+R()*20,hood:R(),face:1,frame:0});}
 const oids=[...OMENS].sort(()=>R()-.5).slice(0,4);S.omenQueue=oids;
 S.waves=new Array(120).fill(0);
 S.rain=[];for(let i=0;i<70;i++)S.rain.push({x:R()*960,y:R()*600,s:200+R()*250});
 $('city-name').textContent=S.cityName;
}
function curOmenCycle(){return S.cycle===3||S.cycle===5||S.cycle===7||S.cycle===9;}

// ============ INPUT ============
let pDown=false,pDownPos=null,pickupDrag=null;
function evPos(e){const r=cv.getBoundingClientRect();
 const cx=(e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX;
 const cy=(e.touches&&e.touches[0])?e.touches[0].clientY:e.clientY;
 return {x:(cx-r.left)/r.width*960,y:(cy-r.top)/r.height*600};}
cv.addEventListener('pointerdown',e=>{Audio2.init();Audio2.resume();
 if(S.screen!=='play'||S.paused)return;
 pDown=true;document.body.classList.add('holding');S.holding=true;
 pDownPos=evPos(e);pickupDrag=pDownPos;
 // check object tap handled on pointerup (tap vs hold). Also allow immediate pickup if directly on object:
 const o=objAt(pDownPos);
 if(o&&S.water<0.42){pickup(o);}
 cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(!pDown)return;pickupDrag=evPos(e);});
window.addEventListener('pointerup',e=>{pDown=false;document.body.classList.remove('holding');S.holding=false;
 if(S.screen!=='play'||S.paused)return;
 const p=evPos(e);
 const dist=Math.hypot(p.x-(pDownPos?pDownPos.x:p.x),p.y-(pDownPos?pDownPos.y:p.y));
 if(dist<24){ // TAP
   if(S.carry){const d=districtAt(p);if(d){deliver(d);} }
   else{const o=objAt(p);if(o&&S.water<0.5)pickup(o);}
 }});
window.addEventListener('keydown',e=>{
 if(e.code==='Space'){e.preventDefault();if(S.screen==='play'&&!S.paused){S.holding=true;document.body.classList.add('holding');}}
 if(e.key==='e'||e.key==='E'){if(S.screen==='play'&&!S.ended)endRun();}
 if(e.key==='Escape'){togglePause();}
 if(e.key==='m'||e.key==='M'){toggleMute();}});
window.addEventListener('keyup',e=>{if(e.code==='Space'){S.holding=false;document.body.classList.remove('holding');}});
function objAt(p){for(const o of S.exposed){if(!o.taken&&Math.hypot(o.x-p.x,o.y-p.y)<34)return o;}return null;}
function districtAt(p){for(const d of S.districts){if(Math.abs(d.x-p.x)<95&&p.y>180&&p.y<480)return d;}return null;}

// ============ ACTIONS ============
function toast(html,ms=2600){toastEl.innerHTML=html;toastEl.classList.add('show');
 clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),ms);}
function setPrompt(t){promptEl.textContent=t;}
function pickup(o){if(S.carry)return;o.taken=true;S.carry=o;S.firstPick=true;
 Audio2.blip(520,.12,'triangle',.2);
 $('carry-bar').classList.remove('hidden');$('carry-name').textContent=o.name+' — '+o.lore;
 $('carry-icon').textContent=o.icon;
 const dHint=S.districts.slice().sort((a,b)=>echoScore(o,b)-echoScore(o,a))[0];
 setPrompt(o.icon+' '+o.name+': '+o.lore+' — '+dHint.def.name+' will love this.');
 toast('Picked up <b>'+o.name+'</b> — tap a district to bestow it');}
function echoScore(o,d){if(d.def.loves===o.echo)return 3;if(d.def.likes===o.echo)return 2;return 1;}
function deliver(d){
 const o=S.carry;if(!o)return;S.carry=null;$('carry-bar').classList.add('hidden');
 o.taken=true;o.gone=true;S.exposed=S.exposed.filter(x=>x!==o);
 d.echoes[o.echo]=(d.echoes[o.echo]||0)+1;
 const score=echoScore(o,d);
 if(score===3){d.rev=clamp(d.rev+.22,0,1);d.shrines++;pushHeart(d.x,300,'💛');Audio2.bell(740);
   d.react=3;d.reactTxt='love';toast('The <b>'+d.def.name+'</b> adores the '+o.name+' <b>+'+ECHO_LABEL[o.echo]+'</b>');}
 else if(score===2){d.rev=clamp(d.rev+.12,0,1);if(S.rng()<.5)d.shrines++;pushHeart(d.x,300,'🤍');Audio2.blip(660,.15,'sine',.18);
   d.react=3;d.reactTxt='like';toast('The <b>'+d.def.name+'</b> accepts the '+o.name+' · +'+ECHO_LABEL[o.echo]);}
 else{d.dread=clamp(d.dread+.12,0,1);pushHeart(d.x,300,'😶');Audio2.blip(220,.2,'square',.08);
   d.react=3;d.reactTxt='meh';toast('The <b>'+d.def.name+'</b> does not understand the '+o.name+'…');}
 if(o.stain){d.dread=clamp(d.dread+.1*o.stain,0,1);S.stain+=o.stain;pushHeart(d.x,260,'☠');}
 // trait lock: 2 of same echo
 let best=null,bn=0;for(const k in d.echoes){if(d.echoes[k]>bn){bn=d.echoes[k];best=k;}}
 if(bn>=2&&!d.trait){d.trait=TRAIT_OF[best];Audio2.bell(587);Audio2.bell(880);
   toast('🏮 The <b>'+d.def.name+'</b> becomes <b>'+d.trait+'</b>!');S.shrineFx.push({x:d.x,y:250,t:0});}
 S.reverence=avg(S.districts.map(d=>d.rev));S.dread=avg(S.districts.map(d=>d.dread));
 S.delivered.push({obj:o.id,district:d.def.name,echo:o.echo,cycle:S.cycle});
 Audio2.setMood(S.reverence,S.dread);
 // assign carrier celebration: nearest citizen worships
 const c=nearestCitizen(d.x);if(c){c.state='worship';c.t=4;c.tx=d.x;c.ty=340;}
 if(S.phase==='recede'){S.phase='flood';S.phaseT=0;setPrompt('Release — let the water return.');}
}
function nearestCitizen(x){let b=null,bd=1e9;for(const c of S.citizens){const d=Math.abs(c.x-x);if(d<bd){bd=d;b=c;}}return b;}
function pushHeart(x,y,t){S.hearts.push({x:x+(S.rng()*40-20),y,t:0,txt:t});}
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;

// ============ PHASES ============
function spawnExposed(){
 S.exposed=[];
 const n=S.cycle===1?1:2;
 for(let i=0;i<n;i++){
   const o=S.objectDeck[((S.cycle-1)*2+i)%S.objectDeck.length];if(!o)continue;
   S.exposed.push({...o,x:200+S.rng()*560,y:470+S.rng()*40,taken:false,gone:false,bob:S.rng()*TAU,idx:i});
 }
}
function update(dt){
 if(S.paused||S.screen!=='play')return;
 S.time+=dt;S.phaseT+=dt*S.speed;
 const hold=S.holding;
 const rate=dt*(0.28*S.speed)*(hold?1.6:1);
 if(S.phase==='recede'){
   S.target=hold?0.12:clamp(S.target+dt*.25,.12,.55);
   S.water+=(S.target-S.water)*Math.min(1,dt*2.2);
   if(S.exposed.length===0&&S.phaseT>.8)spawnExposed();
   setPrompt(S.carry?'Tap a glowing district to bestow your gift.':
     (S.water<0.42?'The seabed glints — tap a glowing object!':'HOLD to pull the sea back…'));
   if(S.phaseT>14||(S.carry&&S.phaseT>20)){S.phase='flood';S.phaseT=0;}
   if(S.phaseT>10&&!S.carry&&S.exposed.length){/* auto nudge */}
 }else if(S.phase==='flood'){
   S.target=.78;S.water+=(S.target-S.water)*Math.min(1,dt*1.4);
   Audio2.setWater(S.water);
   setPrompt(S.carry?'The water rises! Quickly — tap a district!':'Release… watch what they find.');
   // citizens fetch unclaimed objects
   for(const o of S.exposed){if(!o.taken&&!o.claimed){const c=S.citizens.find(c=>c.state==='idle');
     if(c){o.claimed=true;c.state='fetch';c.has=o;c.tx=o.x;c.ty=o.y;}}}
   if(S.phaseT>4){S.phase='watch';S.phaseT=0;S.watchT=8;
     if(!S.carry&&S.exposed.some(o=>!o.taken)){/* left behind: dread */}
   }
 }else if(S.phase==='watch'){
   S.water=lerp(S.water,.6+Math.sin(S.time*.5)*.03,dt);
   S.watchT-=dt*S.speed;
   const left=S.exposed.filter(o=>!o.taken&&!o.gone);
   setPrompt(left.length&&!S.carry?'Citizens wade out… they will take what you left.':'The city argues, builds, remembers…');
   if(S.watchT<=0){
     // resolve leftovers: nearest district absorbs
     for(const o of left){const d=S.districts[Math.floor(S.rng()*5)];
       d.echoes[o.echo]=(d.echoes[o.echo]||0)+.5;d.rev=clamp(d.rev+.03,0,1);}
     S.exposed=[];
     if(curOmenCycle()&&S.omenQueue.length){openOmen();}
     else nextCycle();
   }
 }else if(S.phase==='omen'){
   // frozen while modal open (DOM). water gently moves
   S.water=lerp(S.water,.6,dt);
 }
 // water waves
 for(let i=0;i<S.waves.length;i++)S.waves[i]=Math.sin(S.time*2+i*.35)*6+Math.sin(S.time*3.7+i*1.1)*2.5;
 // citizens
 for(const c of S.citizens){
   c.t-=dt;c.frame+=dt*6;
   if(c.state==='idle'){
     if(c.t<=0){c.tx=80+S.rng()*800;c.ty=340+S.rng()*80;c.t=2+S.rng()*3;}
     moveToward(c,dt);
     if(S.phase==='watch'&&S.rng()<dt*.15){c.state='wander';c.t=3;}
   }else if(c.state==='fetch'&&c.has){
     moveToward(c,dt,1.4);
     if(Math.hypot(c.x-c.tx,c.y-c.ty)<12){
       if(S.carry!==c.has&&!c.has.gone){ // citizen claims it if player didn't
         const o=c.has;o.gone=true;S.exposed=S.exposed.filter(x=>x!==o);
         const d=S.districts[Math.floor(S.rng()*5)];
         d.echoes[o.echo]=(d.echoes[o.echo]||0)+1;d.rev=clamp(d.rev+.08,0,1);
         pushHeart(d.x,300,o.icon);Audio2.blip(500,.1,'triangle',.15);
         toast('A citizen carries the <b>'+o.name+'</b> to the <b>'+d.def.name+'</b>');
         checkTrait(d);
         S.reverence=avg(S.districts.map(d=>d.rev));
       }
       c.has=null;c.state='worship';c.t=2.5;
     }
   }else if(c.state==='worship'){if(c.t<=0)c.state='idle';
   }else if(c.state==='wander'){moveToward(c,dt,.6);if(c.t<=0)c.state='idle';}
 }
 for(const h of S.hearts){h.t+=dt;h.y-=dt*22;}
 S.hearts=S.hearts.filter(h=>h.t<2.2);
 for(const r of S.ripples){r.t+=dt;r.r+=dt*60;}
 S.ripples=S.ripples.filter(r=>r.t<1.4);
 for(const f of S.shrineFx)f.t+=dt;
 S.gullT-=dt;if(S.gullT<=0){S.gullT=6+Math.random()*10;if(Math.random()<.6)Audio2.gull();}
 Audio2.setWater(S.holding?.9:.4);
 // ring HUD
 const prog=S.phase==='recede'?clamp(S.phaseT/14,0,1):S.phase==='flood'?clamp(S.phaseT/4,0,1):S.phase==='watch'?1-S.watchT/8:0;
 $('tide-arc').style.strokeDashoffset=String(163.3*(1-prog));
 $('tide-num').textContent=S.cycle;
 $('tide-label').textContent=S.phase==='recede'?(S.holding?'RECEDING…':'HOLD TO RECEDE'):S.phase==='flood'?'FLOODING…':S.phase==='watch'?'THEY REMEMBER':'OMEN';
 // tutorial toasts
 if(S.cycle===1&&S.phase==='recede'&&!S.firstPick&&S.phaseT>1&&!S._t1){S._t1=true;setPrompt('HOLD anywhere — pull the sea back.');}
}
function moveToward(c,dt,m=1){const dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy);
 if(d>4){c.x+=dx/d*c.speed*m*dt;c.y+=dy/d*c.speed*m*dt;c.face=dx>=0?1:-1;}}
function checkTrait(d){let best=null,bn=0;for(const k in d.echoes)if(d.echoes[k]>bn){bn=d.echoes[k];best=k;}
 if(bn>=2&&!d.trait){d.trait=TRAIT_OF[best];S.shrineFx.push({x:d.x,y:250,t:0});Audio2.bell(587);
  toast('🏮 The <b>'+d.def.name+'</b> becomes <b>'+d.trait+'</b>!');}}
function nextCycle(){
 S._t1=false;S.phaseT=0;
 if(S.cycle>=S.tideCount){endRun();return;}
 S.cycle++;S.phase='recede';S.carry=null;$('carry-bar').classList.add('hidden');
 S.exposed=[];S.phaseT=0;
 Audio2.splash();
 toast('— tide <b>'+S.cycle+' / '+S.tideCount+'</b> —');
}
function openOmen(){
 S.phase='omen';const om=S.omenQueue.shift()||OMENS[Math.floor(Math.random()*OMENS.length)];
 S.omen=om;
 $('omen-kicker').textContent='OMEN · TIDE '+S.cycle+' OF '+S.tideCount;
 $('omen-title').textContent=om.title;$('omen-text').textContent=om.text;
 $('omen-a').textContent='◈ '+om.a;$('omen-b').textContent='◈ '+om.b;
 scrOmen.classList.remove('hidden');Audio2.deep();
}
function resolveOmen(choice){
 scrOmen.classList.add('hidden');const id=S.omen.id;S.omen=null;
 const all=S.districts;
 if(id==='storm'){if(choice==='a'){all.forEach(d=>{d.rev=clamp(d.rev+.08,0,1);d.dread=clamp(d.dread-.08,0,1);});
   toast('You held the sea. The shrines stand. <b>+Reverence</b>');}
  else{all.forEach(d=>{d.dread=clamp(d.dread+.12,0,1);});S.shrineFx.push({x:480,y:250,t:0});Audio2.splash();
   toast('The storm took an offering. They fear you. <b>+Dread</b>');}}
 else if(id==='gulls'){if(choice==='a'){S.target=.85;toast('Deep water scatters the flock.');Audio2.splash();}
  else{const f=S.districts[3];f.echoes.tender=(f.echoes.tender||0)+1;f.rev=clamp(f.rev+.1,0,1);checkTrait(f);toast('You fed the gulls on the flats. <b>+Tender</b>');}}
 else if(id==='echo'){if(choice==='a'){const d=all[Math.floor(Math.random()*5)];d.echoes.festival=(d.echoes.festival||0)+1;checkTrait(d);Audio2.bell(660);toast('You rang back. Somewhere, a <b>Festival</b> begins.');}
  else{all.forEach(d=>d.rev=clamp(d.rev+.07,0,1));toast('You listened. The whole city exhales. <b>+Reverence</b>');}}
 else if(id==='moon'){if(choice==='a'){S.target=.08;toast('You ride the moon-pull. The seabed lies bare.');}
  else{all.forEach(d=>d.rev=clamp(d.rev+.06,0,1));toast('You resist. The water lies calm. <b>+Reverence</b>');}}
 else if(id==='boat'){if(choice==='a'){const d=S.districts[0];d.shrines++;d.rev=clamp(d.rev+.12,0,1);d.echoes.sacred=(d.echoes.sacred||0)+1;checkTrait(d);Audio2.bell(520);toast('The boat docks. Inside: a <b>Storm Lantern</b>. They weep.');}
  else{all.forEach(d=>d.dread=clamp(d.dread+.08,0,1));toast('You turn the boat away. The Gate understands order. <b>+Dread</b>');}}
 else{if(choice==='a'){S.stain=Math.max(0,S.stain-2);toast('Clean water washes the rainbow away. The gulls return.');}
  else{const m=S.districts[1];m.echoes.industrious=(m.echoes.industrious||0)+1;checkTrait(m);S.stain+=1;toast('The Market drinks deep. <b>+Industrious</b>, but the water stains.');}}
 S.choiceMade++;S.reverence=avg(all.map(d=>d.rev));S.dread=avg(all.map(d=>d.dread));
 Audio2.setMood(S.reverence,S.dread);
 nextCycle();
}

// ============ EULOGY / END ============
function computeEulogy(){
 const traits=S.districts.map(d=>d.trait).filter(Boolean);
 let pick=null;
 outer:for(const e of EULOGIES){
  const cnt={};traits.forEach(t=>cnt[t]=(cnt[t]||0)+1);
  const req={};e.need.forEach(n=>req[n]=(req[n]||0)+1);
  if(Object.keys(req).every(k=>(cnt[k]||0)>=req[k])){pick=e;break;}
 }
 if(!pick){
   // count trait frequency
   const cnt={};traits.forEach(t=>cnt[t]=(cnt[t]||0)+1);
   const sorted=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
   if(sorted.length>=2){pick=EULOGIES.find(e=>e.need.includes(sorted[0])&&e.need.includes(sorted[1]))||null;}
   if(!pick&&sorted.length===1){const t=sorted[0];
     pick=EULOGIES.find(e=>e.need[0]===t&&e.need[1]===t)||EULOGIES.find(e=>e.need.includes(t))||null;}
 }
 if(!pick){const R=S.rng;pick=FALLBACK_EULOGIES[Math.floor(R()*FALLBACK_EULOGIES.length)];}
 return {traits,pick};
}
function endRun(){
 if(S.ended)return;S.ended=true;S.screen='end';S.phase='done';
 Audio2.deep();setTimeout(()=>Audio2.bell(440),900);
 const {traits,pick}=computeEulogy();
 S.endStats={traits,pick};
 $('end-city').textContent=S.cityName+' remembers you';
 $('end-title').textContent=pick.title;
 $('end-poem').textContent=pick.poem;
 $('end-seed').textContent=S.seed;
 $('end-traits').innerHTML=S.districts.map(d=>'<span class="trait">'+d.def.name+' · '+(d.trait||'Unchanged')+'</span>').join('')+
   '<span class="trait">gifts given: '+S.delivered.length+'</span>';
 drawShareCard(pick);
 hudOff();scrEnd.classList.remove('hidden');
 try{const best=JSON.parse(localStorage.getItem('nulltide_best')||'null');
  if(!best||traits.length>(best.traits||[]).length){localStorage.setItem('nulltide_best',JSON.stringify({title:pick.title,seed:S.seed,traits}));}
 }catch(e){}
}
function drawShareCard(pick){
 const c=$('sharecard'),g=c.getContext('2d');
 const sky=g.createLinearGradient(0,0,0,630);sky.addColorStop(0,'#0a2036');sky.addColorStop(.55,'#123a55');sky.addColorStop(1,'#06121f');
 g.fillStyle=sky;g.fillRect(0,0,1200,630);
 g.fillStyle='rgba(232,179,75,.9)';g.beginPath();g.arc(960,140,60,0,TAU);g.fill();
 g.fillStyle='rgba(232,179,75,.25)';g.beginPath();g.arc(960,140,90,0,TAU);g.fill();
 // sea
 g.fillStyle='#0d3a52';g.fillRect(0,400,1200,230);
 g.fillStyle='rgba(255,255,255,.15)';for(let i=0;i<5;i++){g.fillRect(0,410+i*22,1200,3);}
 // skyline
 const R=makeRng(S.seed);let x=80;
 g.fillStyle='#0a1420';
 while(x<1120){const w=50+R()*70,h=60+R()*120;g.fillRect(x,400-h,w,h);
  g.fillStyle='#e8b34b';for(let wy=400-h+12;wy<390;wy+=22)for(let wx=x+8;wx<x+w-8;wx+=18)if(R()<.5)g.fillRect(wx,wy,7,10);
  g.fillStyle='#0a1420';x+=w+14;}
 g.fillStyle='#f4ead2';g.font='700 44px Georgia,serif';g.textAlign='center';
 g.fillText(pick.title,600,120);
 g.font='italic 26px Georgia,serif';g.fillStyle='#cfe0ee';
 const lines=pick.poem.split('\n');lines.forEach((l,i)=>g.fillText(l,600,180+i*40));
 g.font='20px monospace';g.fillStyle='#e8b34b';
 g.fillText('NULL TIDE · '+S.cityName+' · seed '+S.seed,600,580);
 $('share-preview').src=c.toDataURL('image/png');
}

// ============ RENDER ============
function skyColors(){
 const t=(S.cycle-1)/(S.tideCount-1); // 0 day → 1 night
 const top=[[126,178,208],[58,96,140],[16,32,64]][Math.min(2,Math.floor(t*3))];
 const bot=[[240,220,170],[232,150,90],[10,20,40]][Math.min(2,Math.floor(t*3))];
 return {top:`rgb(${top})`,bot:`rgb(${bot})`,t};
}
function waterY(x){const i=clamp(Math.floor(x/960*120),0,119);
 return 400-S.water*230+S.waves[i]*(0.4+S.water);}
function render(){
 const sky=skyColors();
 const gr=ctx.createLinearGradient(0,0,0,600);gr.addColorStop(0,sky.top);gr.addColorStop(.62,sky.bot);gr.addColorStop(.621,'rgba(0,0,0,0)');gr.addColorStop(1,'#04101c');
 ctx.fillStyle=sky.top;ctx.fillRect(0,0,960,600);
 ctx.fillStyle=gr;ctx.fillRect(0,0,960,600);
 // sun/moon
 ctx.fillStyle=sky.t<.5?'rgba(255,236,180,.9)':'rgba(240,240,255,.9)';
 ctx.beginPath();ctx.arc(lerp(760,200,sky.t),lerp(110,90,sky.t),sky.t<.5?34:24,0,TAU);ctx.fill();
 if(sky.t>.5){ctx.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<40;i++){const sx=(i*173)%960,sy=(i*97)%260;ctx.fillRect(sx,sy,2,2);}}
 // distant hills
 ctx.fillStyle='rgba(10,25,40,.55)';ctx.beginPath();ctx.moveTo(0,360);
 for(let x=0;x<=960;x+=40)ctx.lineTo(x,340+Math.sin(x*.01+S.cityName.length)*22);
 ctx.lineTo(960,420);ctx.lineTo(0,420);ctx.fill();
 // island shelf
 ctx.fillStyle='#3a2f22';ctx.beginPath();ctx.moveTo(20,600);ctx.lineTo(20,420);
 for(let x=20;x<=940;x+=20)ctx.lineTo(x,415+Math.sin(x*.02)*8);
 ctx.lineTo(940,600);ctx.closePath();ctx.fill();
 ctx.fillStyle='#5a4a30';ctx.beginPath();ctx.moveTo(60,600);ctx.lineTo(60,430);
 for(let x=60;x<=900;x+=20)ctx.lineTo(x,428+Math.sin(x*.025+2)*6);
 ctx.lineTo(900,600);ctx.closePath();ctx.fill();
 // districts: houses
 for(const d of S.districts){
   const baseY=430;
   for(let hi=0;hi<d.houses;hi++){
     const hx=d.x-70+hi*(140/Math.max(1,d.houses-1))-14+Math.sin(d.housesSeed+hi)*4;
     const hw=26,hh=26+((d.housesSeed*7+hi*13)%22);
     const pal=['#7a5c3e','#6b6f7e','#54687a','#8a6a4a'][Math.floor((d.housesSeed+hi)%4)];
     ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(hx+2,baseY-hh+3,hw,hh);
     ctx.fillStyle=pal;ctx.fillRect(hx,baseY-hh,hw,hh);
     ctx.fillStyle='rgba(0,0,0,.35)';
     if(hi%3===0){ctx.beginPath();ctx.moveTo(hx-3,baseY-hh);ctx.lineTo(hx+hw/2,baseY-hh-12);ctx.lineTo(hx+hw+3,baseY-hh);ctx.fill();}
     else ctx.fillRect(hx-2,baseY-hh-4,hw+4,5);
     const night=sky.t>.45;
     ctx.fillStyle=night?'#ffd97a':'#2b2b26';
     ctx.fillRect(hx+5,baseY-hh+8,6,8);ctx.fillRect(hx+15,baseY-hh+8,6,8);
     if(d.react>0){ctx.fillStyle='#fff';ctx.font='13px sans-serif';ctx.textAlign='center';
       ctx.fillText(d.reactTxt==='love'?'♥':d.reactTxt==='like'?'~':'·',hx+hw/2,baseY-hh-16-d.react*2);}
   }
   // shrines
   for(let s=0;s<d.shrines;s++){ctx.font='16px serif';ctx.textAlign='center';
     ctx.fillText('🏮',d.x-20+s*20,baseY-66);}
   // label
   const wy=waterY(d.x);
   const above=wy>330;
   ctx.font='700 14px system-ui';ctx.textAlign='center';
   const isTarget=S.carry?true:false;
   if(isTarget){ctx.fillStyle='rgba(232,179,75,'+(0.5+0.4*Math.sin(S.time*5))+')';
     ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=2;
     ctx.beginPath();ctx.ellipse(d.x,300,80,110,0,0,TAU);ctx.stroke();}
   ctx.fillStyle=above?'#fff':'rgba(255,255,255,.85)';
   ctx.shadowColor='#000';ctx.shadowBlur=6;
   ctx.fillText(d.def.name+(d.trait?' · '+d.trait:''),d.x,above?wy-170:200);
   ctx.shadowBlur=0;
   if(d.react>0){d.react-=1/60;}
 }
 // exposed objects on seabed
 for(const o of S.exposed){
   if(o.gone)continue;
   const wy=waterY(o.x);
   const visible=wy>o.y-10;
   const pulse=.6+.4*Math.sin(S.time*4+o.bob);
   if(S.water<0.55){
     ctx.save();
     if(!visible){ctx.globalAlpha=.95;}else ctx.globalAlpha=.35+.4*pulse;
     ctx.fillStyle='rgba(232,179,75,'+(.25+.3*pulse)+')';
     ctx.beginPath();ctx.ellipse(o.x,o.y,30,12,0,0,TAU);ctx.fill();
     if(!visible||S.water<0.45){
       ctx.globalAlpha=1;ctx.font='30px serif';ctx.textAlign='center';
       ctx.shadowColor='#e8b34b';ctx.shadowBlur=12;
       ctx.fillText(o.icon,o.x,o.y+Math.sin(S.time*3+o.bob)*3);
       ctx.shadowBlur=0;
       ctx.font='11px system-ui';ctx.fillStyle='#fff';
       ctx.fillText(o.name,o.x,o.y+22);
     }
     ctx.restore();
   }
 }
 // carried object follows finger / floats
 if(S.carry&&pickupDrag){ctx.font='34px serif';ctx.textAlign='center';
   ctx.fillText(S.carry.icon,pickupDrag.x,pickupDrag.y-20);}
 // citizens
 for(const c of S.citizens){
   const wy=waterY(c.x);
   const swim=wy<c.y+6;
   const bob=Math.sin(c.frame*.3)*1.5;
   ctx.save();ctx.translate(c.x,c.y+bob);ctx.scale(c.face,1);
   if(swim){ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(0,4,10,4,0,0,TAU);ctx.fill();}
   const hood=['#2b3a4a','#4a2b3a','#3a4a2b'][Math.floor(c.hood*3)];
   ctx.fillStyle='#1a120b';ctx.fillRect(-3,-12,6,14);
   ctx.fillStyle=hood;ctx.beginPath();ctx.moveTo(-6,2);ctx.lineTo(-4,-12);ctx.lineTo(4,-12);ctx.lineTo(6,2);ctx.fill();
   ctx.fillStyle='#f4d8a8';ctx.fillRect(-2,-10,4,5);
   const step=Math.sin(c.frame*.5)*2;
   ctx.fillStyle='#14100c';ctx.fillRect(-4+step*.4,2,3,4);ctx.fillRect(1-step*.4,2,3,4);
   if(c.state==='worship'){ctx.fillStyle='#ffd97a';ctx.font='12px sans-serif';ctx.fillText('✦',6,-14);}
   if(c.state==='fetch'){ctx.font='13px serif';ctx.fillText(c.has?c.has.icon:'·',8,-12);}
   ctx.restore();
 }
 // water bands
 const bands=[{a:.25,off:0},{a:.3,off:14},{a:.4,off:26},{a:.55,off:38}];
 for(let b=0;b<bands.length;b++){
   ctx.beginPath();ctx.moveTo(0,600);
   for(let x=0;x<=960;x+=8){const i=clamp(Math.floor(x/960*120),0,119);
     const y=400-S.water*230+S.waves[i]*(0.5+b*.25)+bands[b].off;
     ctx.lineTo(x,y);}
   ctx.lineTo(960,600);ctx.closePath();
   ctx.fillStyle=b===3?'rgba(28,110,150,'+bands[b].a+')':'rgba(20,80,115,'+bands[b].a+')';
   ctx.fill();
 }
 // foam line
 ctx.beginPath();
 for(let x=0;x<=960;x+=8){const y=waterY(x);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
 ctx.strokeStyle=S.safeMode?'rgba(255,255,255,.7)':'rgba(255,255,255,'+(.5+.3*Math.sin(S.time*6))+')';
 ctx.lineWidth=2.5;ctx.stroke();
 // stain slick
 if(S.stain>0){ctx.fillStyle='rgba(120,40,120,.25)';
   for(let i=0;i<S.stain;i++)ctx.fillRect(300+i*60,waterY(300+i*60),50,8);}
 // ripples
 if(!S.reduced)for(const r of S.ripples){ctx.strokeStyle='rgba(255,255,255,'+(.5*(1-r.t))+')';
   ctx.beginPath();ctx.ellipse(r.x,r.y,r.r,r.r*.3,0,0,TAU);ctx.stroke();}
 // rain
 if(!S.reduced&&S.phase==='omen'||sky.t>.6){ctx.strokeStyle='rgba(180,200,220,.35)';ctx.lineWidth=1;
   ctx.beginPath();for(const r of S.rain){ctx.moveTo(r.x,r.y);ctx.lineTo(r.x-4,r.y+14);}
   ctx.stroke();}
 // hearts
 ctx.textAlign='center';
 for(const h of S.hearts){ctx.globalAlpha=1-h.t/2.2;ctx.font=(18+h.t*8)+'px serif';ctx.fillText(h.txt,h.x,h.y);}
 ctx.globalAlpha=1;
 // shrine bursts
 for(const f of S.shrineFx){if(f.t<2){ctx.strokeStyle='rgba(232,179,75,'+(1-f.t/2)+')';ctx.lineWidth=3;
   ctx.beginPath();ctx.arc(f.x,f.y,f.t*70,0,TAU);ctx.stroke();}}
 // gulls
 ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='14px serif';
 for(let i=0;i<4;i++){const gx=(S.time*30*(i+1)+i*260)%1000-20,gy=80+i*28+Math.sin(S.time*2+i)*8;
   ctx.fillText('﹏',gx,gy);}
}

// ============ LOOP ============
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;
 try{if(S.screen==='play')update(dt);render();}catch(e){}
 requestAnimationFrame(loop);}

// ============ FLOW / UI ============
function hudOn(){hud.classList.remove('hidden');}
function hudOff(){hud.classList.add('hidden');}
function startGame(seed){
 Audio2.init();Audio2.resume();
 newCity(seed||randSeed());
 scrTitle.classList.add('hidden');scrEnd.classList.add('hidden');scrPause.classList.add('hidden');scrOmen.classList.add('hidden');
 S.screen='play';S.paused=false;hudOn();
 toast('You are the tide. <b>HOLD</b> to recede.');
 setPrompt('HOLD anywhere — pull the sea back.');
}
function togglePause(){if(S.screen!=='play')return;S.paused=!S.paused;
 scrPause.classList.toggle('hidden',!S.paused);}
function toggleMute(){Audio2.on=!Audio2.on;$('btn-mute').textContent=Audio2.on?'♪':'✕';
 if(Audio2.master)Audio2.master.gain.value=Audio2.on?.8:0;}
$('btn-begin').addEventListener('click',()=>{const v=$('seed-input').value.trim().toUpperCase()||randSeed();
 startGame(v);});
$('btn-new-seed').addEventListener('click',()=>{$('seed-input').value=randSeed();});
$('btn-how').addEventListener('click',()=>$('howto').classList.toggle('hidden'));
$('btn-settings').addEventListener('click',()=>{togglePauseSafe();});
function togglePauseSafe(){if(S.screen!=='play'){toast('Settings live in pause menu during play. Tide speed is even.');return;}}
$('btn-credits').addEventListener('click',()=>toast('NULL TIDE · made from water, bells & procedural pixels · 100% original, $0 spent',3200));
$('btn-pause').addEventListener('click',togglePause);
$('btn-mute').addEventListener('click',toggleMute);
$('btn-bell').addEventListener('click',()=>{if(S.screen==='play')endRun();});
$('btn-resume').addEventListener('click',togglePause);
$('btn-restart').addEventListener('click',()=>{S.paused=false;scrPause.classList.add('hidden');startGame(S.seed);});
$('btn-quit').addEventListener('click',()=>{S.paused=false;S.screen='title';scrPause.classList.add('hidden');hudOff();scrTitle.classList.remove('hidden');});
$('omen-a').addEventListener('click',()=>resolveOmen('a'));
$('omen-b').addEventListener('click',()=>resolveOmen('b'));
$('btn-copy-seed').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(S.seed+' — '+S.cityName+' remembers you as '+S.endStats.pick.title);
 toast('Seed copied — dare a friend to beat your eulogy.');}catch(e){toast('Seed: <b>'+S.seed+'</b>');}});
$('btn-png').addEventListener('click',()=>{const a=document.createElement('a');
 a.download='nulltide-'+S.seed+'.png';a.href=$('sharecard').toDataURL('image/png');a.click();
 toast('Memory-card saved. Post it. ♥');});
$('btn-again').addEventListener('click',()=>startGame(randSeed()));
$('btn-visit').addEventListener('click',()=>{const v=$('visit-input').value.trim().toUpperCase();if(v)startGame(v);});
$('set-speed').addEventListener('change',e=>S.speed=parseFloat(e.target.value));
$('set-safe').addEventListener('change',e=>{S.safeMode=e.target.checked;document.body.classList.toggle('safe',S.safeMode);});
$('set-reduced').addEventListener('change',e=>S.reduced=e.target.checked);
// rain drift
setInterval(()=>{for(const r of S.rain){r.y+=8;r.x-=2;if(r.y>600){r.y=-10;r.x=Math.random()*960;}}},50);
// prevent scroll/zoom gestures on canvas
document.addEventListener('touchmove',e=>{if(e.target===cv)e.preventDefault();},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());
// show best
try{const best=JSON.parse(localStorage.getItem('nulltide_best')||'null');
 if(best){$('best-line').classList.remove('hidden');
  $('best-line').textContent='↳ your best tide: '+best.title+' · '+best.seed;}}catch(e){}
// boot with a preview city behind title
newCity('TIDE-7F3K');S.screen='title';
requestAnimationFrame(loop);
// idle ambient render behind title: gentle tide
setInterval(()=>{if(S.screen==='title'){S.time+=.05;S.water=.5+Math.sin(S.time*.6)*.15;
 for(let i=0;i<S.waves.length;i++)S.waves[i]=Math.sin(S.time*2+i*.35)*6;}},50);

// ---- test seam (additive; game behaviour unchanged) ----
if(typeof window!=='undefined'){window.__NT={S,newCity,computeEulogy,deliver,pickup,districtAt,echoScore,checkTrait,nextCycle,resolveOmen,openOmen,makeRng,randSeed,spawnExposed,startGame,endRun,update,render,loop,OBJECTS,DISTRICTS,EULOGIES,FALLBACK_EULOGIES,OMENS,CITY_A,CITY_B,TRAIT_OF,ECHO_LABEL};}
})();
