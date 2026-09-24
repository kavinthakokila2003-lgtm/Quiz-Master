// Quizly's small shared backend. Uses local SQLite or Firebase Firestore storage.
// Cloud deploys need ADMIN_PASSWORD and FIREBASE_SERVICE_ACCOUNT_JSON environment variables.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const ROOT = __dirname, PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('Set ADMIN_PASSWORD to a private value of at least 12 characters before starting Quizly.');
  process.exit(1);
}
const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
const USE_FIREBASE = Boolean(FIREBASE_SERVICE_ACCOUNT_JSON);
let firestore = null;
if (USE_FIREBASE) {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  firestore = getFirestore(app);
}
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, 'quizly.sqlite');
let db = null;
if (!USE_FIREBASE) {
  db = new DatabaseSync(DB_PATH);
  db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS answers (id INTEGER PRIMARY KEY, team_code TEXT NOT NULL, round_no INTEGER NOT NULL, question_id TEXT NOT NULL, answer TEXT NOT NULL, correct INTEGER NOT NULL, points INTEGER NOT NULL, elapsed_ms INTEGER NOT NULL, submitted_at TEXT NOT NULL, UNIQUE(team_code, round_no, question_id));
`);
}
const initial = () => ({
  teams: [
    {name:'The Brainiacs',code:'BRAIN7',points:284,progress:'1/4',status:'In round 2',speed:42},
    {name:'Quiztopher Nolan',code:'QZ4821',points:261,progress:'1/4',status:'In round 2',speed:67},
    {name:'Ctrl Alt Elite',code:'CTRL09',points:248,progress:'1/4',status:'In round 2',speed:74},
    {name:'The Think Tank',code:'THINK3',points:227,progress:'1/4',status:'In round 2',speed:82},
    {name:'Trivia Titans',code:'TRIV88',points:206,progress:'1/4',status:'In round 2',speed:89},
    {name:'No Googling!',code:'NOGL42',points:183,progress:'1/4',status:'In round 2',speed:95}],
  rounds: [{name:'Warm Up',q:10,time:'08:00',status:'Completed',n:1,ended:true},
    {name:'Science & Nature',q:12,time:'10:00',status:'In progress',n:2,active:true},
    {name:'Around the World',q:12,time:'10:00',status:'Locked',n:3},
    {name:'The Final Sprint',q:8,time:'06:00',status:'Locked',n:4}],
  running:true, leaderboard:true, feedback:'after round', quizName:'Quiz night', duration:10,
  points:10, qcount:12, passwords:{}, answers:[], questions:[{id:'gold-01',round:2,text:'What is the chemical symbol for gold?',options:['Ag','Au','Fe','Gd'],answer:'Au',points:10}], phase:'admin', tab:'Overview'
});
const teamSessions = new Map();
async function readState() {
  if(USE_FIREBASE){const snap=await firestore.collection('quizly').doc('state').get();if(!snap.exists){const s=initial();await writeState(s);return s}return snap.get('body')}
  const row=db.prepare('SELECT body FROM app_state WHERE id=1').get();if(!row){const s=initial();await writeState(s);return s}return JSON.parse(row.body);
}
async function writeState(s) {
  if(USE_FIREBASE){await firestore.collection('quizly').doc('state').set({body:s,updatedAt:new Date().toISOString()});return}
  db.prepare('INSERT INTO app_state(id,body,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at').run(JSON.stringify(s),new Date().toISOString());
}
async function initializeStore(){await readState()}
const sessions = new Map();
function json(res, status, value) { const body=JSON.stringify(value); res.writeHead(status, {'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','access-control-allow-origin':'*'}); res.end(body); }
function parseCookies(req) { return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=').map(decodeURIComponent)).filter(a=>a.length===2)); }
function readBody(req) { return new Promise((resolve,reject)=>{let b='';req.on('data',x=>{b+=x;if(b.length>2_000_000)req.destroy()});req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch{reject(Error('Invalid JSON'))}});req.on('error',reject)}); }
function adminOK(req) { const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'')||parseCookies(req).quizly_admin; const row=token&&sessions.get(token); return Boolean(row&&row.kind==='admin'&&row.until>Date.now()); }
function teamCodeFor(req) { const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'')||parseCookies(req).quizly_team;const row=token&&teamSessions.get(token);return row&&row.expires>Date.now()?row.code:null; }
function safeState(s) { return {quizName:s.quizName,running:s.running,leaderboard:s.leaderboard,rounds:(s.rounds||[]).map(({name,q,time,status,n,active,ended,deadlineAt})=>({name,q,time,status,n,active,ended,deadlineAt})),teams:(s.teams||[]).map(({name,points,progress,status})=>({name,points,progress,status})),updatedAt:Date.now()}; }
function expireRound(s,r) { if(r?.active&&r.deadlineAt&&Date.now()>=r.deadlineAt){r.active=false;r.ended=true;r.status='Completed';return true}return false }
function csv(s) { return s.replace(/[\r\n,]/g,' ').trim(); }

async function handle(req,res){
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type,Authorization','access-control-allow-methods':'GET,POST,PUT,OPTIONS'});return res.end()}
  const url=new URL(req.url,'http://localhost');
  try {
    if(req.method==='POST'&&url.pathname==='/api/admin/login'){
      const b=await readBody(req); if(typeof b.password!=='string'||!crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(b.password).digest()),Buffer.from(crypto.createHash('sha256').update(ADMIN_PASSWORD).digest())))return json(res,401,{error:'Invalid admin password'});
      const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{kind:'admin',until:Date.now()+12*60*60*1000});return json(res,200,{token,expiresIn:43200});
    }
    if(req.method==='POST'&&url.pathname==='/api/team/login'){
      const b=await readBody(req),code=String(b.code||'').trim().toUpperCase(),s=await readState(),team=(s.teams||[]).find(t=>t.code===code);if(!team)return json(res,401,{error:'Team code not found'});
      const token=crypto.randomBytes(32).toString('hex');teamSessions.set(token,{code,expires:Date.now()+24*60*60*1000});return json(res,200,{token,team:{name:team.name,code:team.code,progress:team.progress},state:safeState(s)});
    }
    if(req.method==='GET'&&url.pathname==='/api/public/state')return json(res,200,safeState(await readState()));
    if(req.method==='GET'&&url.pathname==='/api/admin/state'){if(!adminOK(req))return json(res,401,{error:'Admin login required'});return json(res,200,await readState())}
    if(req.method==='PUT'&&url.pathname==='/api/admin/state'){
      if(!adminOK(req))return json(res,401,{error:'Admin login required'});const s=await readBody(req);if(!s||!Array.isArray(s.teams)||!Array.isArray(s.rounds))return json(res,400,{error:'Invalid tournament state'});const old=await readState();for(const team of s.teams){const saved=old.teams.find(t=>t.code===team.code);if(saved){team.points=Math.max(Number(team.points)||0,Number(saved.points)||0);const a=Number((team.progress||'0/0').split('/')[0])||0,b=Number((saved.progress||'0/0').split('/')[0])||0;if(b>a){team.progress=saved.progress;team.status=saved.status}}}await writeState(s);return json(res,200,{ok:true,updatedAt:Date.now()});
    }
    if(req.method==='POST'&&url.pathname==='/api/team/verify-round'){
      const code=teamCodeFor(req);if(!code)return json(res,401,{error:'Enter your team code first'});const b=await readBody(req),n=Number(b.round),s=await readState(),r=(s.rounds||[]).find(x=>x.n===n),expected=s.passwords&&s.passwords[`${n}-${code}`];if(expireRound(s,r)){await writeState(s);return json(res,409,{error:'This round is not open'})}if(!s.running||!r||!r.active)return json(res,409,{error:'This round is not open'});if(!expected||String(b.password||'').trim().toUpperCase()!==expected)return json(res,401,{error:'Incorrect team password'});return json(res,200,{ok:true,round:{name:r.name,n:r.n,questions:r.q,time:r.time,deadlineAt:r.deadlineAt},questions:(s.questions||[]).filter(q=>Number(q.round)===n).map((q,i)=>({id:String(q.id||i+1),text:q.text||q[1],options:q.options||q.slice?.(4,8)||[],points:Number(q.points||q[4]||s.points||10)}))});
    }
    if(req.method==='GET'&&url.pathname==='/api/team/state'){
      const code=teamCodeFor(req);if(!code)return json(res,401,{error:'Team login required'});const s=await readState(),t=s.teams.find(x=>x.code===code),rows=(s.answers||[]).filter(a=>a.team_code===code).sort((a,b)=>a.round_no-b.round_no||a.question_id.localeCompare(b.question_id));const reveal=s.feedback==='after tournament'?t?.progress==='4/4':true;return json(res,200,{team:t?{name:t.name,code:t.code,points:t.points,progress:t.progress,status:t.status}:null,state:safeState(s),answers:rows.map(a=>({...a,correct:reveal?a.correct:null})),revealAnswers:reveal});
    }
    if(req.method==='POST'&&url.pathname==='/api/team/answers'){
      const code=teamCodeFor(req);if(!code)return json(res,401,{error:'Team login required'});const b=await readBody(req),s=await readState(),r=s.rounds.find(x=>x.n===Number(b.round));if(!s.running||!r||!r.active)return json(res,409,{error:'Round is closed'});if(!Array.isArray(b.answers)||b.answers.length>100)return json(res,400,{error:'Invalid answer submission'});s.answers=s.answers||[];let score=0,elapsed=0;for(const a of b.answers){if(s.answers.some(x=>x.team_code===code&&x.round_no===r.n&&x.question_id===String(a.questionId)))continue;const q=(s.questions||[]).find(x=>String(x.id)===String(a.questionId)||String(x[0])===String(a.questionId)),expected=q?.answer||q?.[2]||'',ok=String(a.answer||'').trim().toLowerCase()===String(expected).trim().toLowerCase(),pts=ok?Number(q?.points||q?.[4]||s.points||10):0,ms=Math.max(0,Number(a.elapsedMs)||0);s.answers.push({team_code:code,round_no:r.n,question_id:String(a.questionId),answer:String(a.answer||'').slice(0,2000),correct:ok,points:pts,elapsed_ms:ms,submitted_at:new Date().toISOString()});score+=pts;elapsed+=ms}await writeState(s);return json(res,200,{ok:true,score,elapsedMs:elapsed,locked:true});
    }
    if(req.method==='POST'&&url.pathname==='/api/team/finish-round'){
      const code=teamCodeFor(req);if(!code)return json(res,401,{error:'Team login required'});const b=await readBody(req),s=await readState(),r=s.rounds.find(x=>x.n===Number(b.round)),team=s.teams.find(x=>x.code===code);if(expireRound(s,r)){await writeState(s);return json(res,409,{error:'Round is closed'})}if(!s.running||!r||!r.active)return json(res,409,{error:'Round is closed'});if(!team)return json(res,404,{error:'Team not found'});const count=Number((team.progress||'0/4').split('/')[0])||0;if(count>=r.n)return json(res,409,{error:'This round is already locked'});let score=0;s.answers=s.answers||[];const answer=b.answer===undefined?'':String(b.answer).slice(0,2000),q=(s.questions||[]).find(x=>Number(x.round||String(x[0]||'').match(/\d+/)?.[0])===r.n);if(q){const id=String(q.id||1);if(s.answers.some(x=>x.team_code===code&&x.round_no===r.n&&x.question_id===id))return json(res,409,{error:'Your answer is already locked'});const ok=answer.trim().toLowerCase()===String(q.answer||q[2]||'').trim().toLowerCase();score=ok?Number(q.points||q[4]||s.points||10):0;s.answers.push({team_code:code,round_no:r.n,question_id:id,answer,correct:ok,points:score,elapsed_ms:Math.max(0,Number(b.elapsedMs)||0),submitted_at:new Date().toISOString()})}team.points=Number(team.points||0)+score;const total=s.rounds.length;team.progress=`${Math.min(total,count+1)}/${total}`;team.status=count+1>=total?'Complete':`In round ${count+2}`;await writeState(s);return json(res,200,{ok:true,score,locked:true,progress:team.progress});
    }
    if(req.method==='GET'&&url.pathname==='/api/admin/export.csv'){
      if(!adminOK(req))return json(res,401,{error:'Admin login required'});const s=await readState(),rows=(s.answers||[]).sort((a,b)=>a.round_no-b.round_no||a.team_code.localeCompare(b.team_code)||a.question_id.localeCompare(b.question_id)).map(a=>({...a,team:s.teams.find(t=>t.code===a.team_code)?.name||''}));const head='Team,Team code,Round,Question ID,Answer,Correct,Points,Time (ms),Submitted at';res.writeHead(200,{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="quizly-answers.csv"','cache-control':'no-store'});res.end([head,...rows.map(x=>[x.team,x.team_code,x.round_no,x.question_id,x.answer,x.correct?'Yes':'No',x.points,x.elapsed_ms,x.submitted_at].map(v=>'"'+csv(String(v))+'"').join(','))].join('\r\n'));return;
    }
    if(req.method==='GET'&&url.pathname.startsWith('/api/'))return json(res,404,{error:'Not found'});
    let file=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/,''),allowed=new Set(['index.html','admin.html','participant.html','audience.html']);if(!allowed.has(file))return json(res,404,{error:'Not found'});const target=path.join(ROOT,file);res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'});fs.createReadStream(target).pipe(res);
  } catch(e){console.error(e);json(res,500,{error:'Server error'})}
}
let mutationQueue=Promise.resolve();
const server=http.createServer((req,res)=>{
  const mutating=req.method==='PUT'||(req.method==='POST'&&!req.url.startsWith('/api/admin/login')&&!req.url.startsWith('/api/team/login'));
  if(!mutating)return handle(req,res);
  const task=mutationQueue.then(()=>handle(req,res));mutationQueue=task.catch(err=>console.error(err));
});
initializeStore().then(()=>server.listen(PORT,'0.0.0.0',()=>console.log(`Quizly running on port ${PORT}`))).catch(err=>{console.error('Could not initialize tournament storage:',err.message);process.exit(1)});
