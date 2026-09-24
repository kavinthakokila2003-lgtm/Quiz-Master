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

const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const fail = (status,error) => json({error},status);
const csvCell = value => `"${String(value??'').replaceAll('"','""').replace(/[\r\n]/g,' ')}"`;
async function getState(env){
  await env.DB.prepare('INSERT OR IGNORE INTO app_state (id, body, version) VALUES (1, ?, 1)').bind(JSON.stringify(initial())).run();
  const row=await env.DB.prepare('SELECT body, version FROM app_state WHERE id=1').first();
  return {state:JSON.parse(row.body),version:row.version};
}
async function changeState(env, change){
  for(let i=0;i<8;i++){
    const {state,version}=await getState(env);const result=await change(state);
    const saved=await env.DB.prepare('UPDATE app_state SET body=?, version=version+1 WHERE id=1 AND version=?').bind(JSON.stringify(state),version).run();
    if(saved.meta.changes===1)return result;
  }
  throw new Error('The quiz is busy. Please try again.');
}
function safeState(s){return {quizName:s.quizName,running:s.running,leaderboard:s.leaderboard,rounds:(s.rounds||[]).map(({name,q,time,status,n,active,ended,deadlineAt})=>({name,q,time,status,n,active,ended,deadlineAt})),teams:(s.teams||[]).map(({name,points,progress,status})=>({name,points,progress,status})),updatedAt:Date.now()};}
function expireRound(s,r){if(r?.active&&r.deadlineAt&&Date.now()>=r.deadlineAt){r.active=false;r.ended=true;r.status='Completed';return true}return false}
async function token(req,env,kind){const value=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!value)return null;const row=await env.DB.prepare('SELECT kind, team_code, expires FROM sessions WHERE token=?').bind(value).first();if(!row||row.kind!==kind||row.expires<Date.now())return null;return {value,code:row.team_code};}
function makeToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(req){try{return await req.json()}catch{return null}}
async function handleApi(req,env,url){
 const p=url.pathname,m=req.method;
 if(m==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type,Authorization','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
 if(m==='POST'&&p==='/api/admin/login'){
   const b=await body(req);if(!b||typeof b.password!=='string'||b.password!==env.ADMIN_PASSWORD)return fail(401,'Invalid admin password');
   const t=makeToken();await env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()).run();await env.DB.prepare('INSERT INTO sessions(token,kind,team_code,expires) VALUES(?,?,?,?)').bind(t,'admin','',Date.now()+12*60*60*1000).run();return json({token:t,expiresIn:43200});
 }
 if(m==='POST'&&p==='/api/team/login'){
   const b=await body(req),code=String(b?.code||'').trim().toUpperCase(),{state}=await getState(env),team=(state.teams||[]).find(t=>t.code===code);if(!team)return fail(401,'Team code not found');
   const t=makeToken();await env.DB.prepare('INSERT INTO sessions(token,kind,team_code,expires) VALUES(?,?,?,?)').bind(t,'team',code,Date.now()+24*60*60*1000).run();return json({token:t,team:{name:team.name,code:team.code,progress:team.progress},state:safeState(state)});
 }
 if(m==='GET'&&p==='/api/public/state')return json(safeState((await getState(env)).state));
 if(m==='GET'&&p==='/api/admin/state'){if(!await token(req,env,'admin'))return fail(401,'Admin login required');return json((await getState(env)).state)}
 if(m==='PUT'&&p==='/api/admin/state'){
   if(!await token(req,env,'admin'))return fail(401,'Admin login required');const s=await body(req);if(!s||!Array.isArray(s.teams)||!Array.isArray(s.rounds))return fail(400,'Invalid tournament state');
   await changeState(env,old=>{for(const team of s.teams){const saved=old.teams.find(t=>t.code===team.code);if(saved){team.points=Math.max(Number(team.points)||0,Number(saved.points)||0);const a=Number((team.progress||'0/0').split('/')[0])||0,b=Number((saved.progress||'0/0').split('/')[0])||0;if(b>a){team.progress=saved.progress;team.status=saved.status}}}Object.assign(old,s);return null});return json({ok:true,updatedAt:Date.now()});
 }
 if(m==='POST'&&p==='/api/team/verify-round'){
   const ses=await token(req,env,'team');if(!ses)return fail(401,'Enter your team code first');const b=await body(req),{state}=await getState(env),n=Number(b?.round),r=(state.rounds||[]).find(x=>x.n===n),expected=state.passwords?.[`${n}-${ses.code}`];if(expireRound(state,r)){await changeState(env,s=>{expireRound(s,s.rounds.find(x=>x.n===n));return null});return fail(409,'This round is not open')}if(!state.running||!r||!r.active)return fail(409,'This round is not open');if(!expected||String(b.password||'').trim().toUpperCase()!==expected)return fail(401,'Incorrect team password');return json({ok:true,round:{name:r.name,n:r.n,questions:r.q,time:r.time,deadlineAt:r.deadlineAt},questions:(state.questions||[]).filter(q=>Number(q.round)===n).map((q,i)=>({id:String(q.id||i+1),text:q.text||q[1],options:q.options||q.slice?.(4,8)||[],points:Number(q.points||q[4]||state.points||10)}))});
 }
 if(m==='GET'&&p==='/api/team/state'){
   const ses=await token(req,env,'team');if(!ses)return fail(401,'Team login required');const {state:s}=await getState(env),t=s.teams.find(x=>x.code===ses.code),rows=(s.answers||[]).filter(a=>a.team_code===ses.code).sort((a,b)=>a.round_no-b.round_no||a.question_id.localeCompare(b.question_id)),reveal=s.feedback==='after tournament'?t?.progress==='4/4':true;return json({team:t?{name:t.name,code:t.code,points:t.points,progress:t.progress,status:t.status}:null,state:safeState(s),answers:rows.map(a=>({...a,correct:reveal?a.correct:null})),revealAnswers:reveal});
 }
 if(m==='POST'&&p==='/api/team/answers'){
   const ses=await token(req,env,'team');if(!ses)return fail(401,'Team login required');const b=await body(req);if(!Array.isArray(b?.answers)||b.answers.length>100)return fail(400,'Invalid answer submission');
   const result=await changeState(env,s=>{const r=s.rounds.find(x=>x.n===Number(b.round));if(!s.running||!r||!r.active)throw Object.assign(Error('Round is closed'),{status:409});s.answers=s.answers||[];let score=0,elapsed=0;for(const a of b.answers){if(s.answers.some(x=>x.team_code===ses.code&&x.round_no===r.n&&x.question_id===String(a.questionId)))continue;const q=(s.questions||[]).find(x=>String(x.id)===String(a.questionId)||String(x[0])===String(a.questionId)),expected=q?.answer||q?.[2]||'',ok=String(a.answer||'').trim().toLowerCase()===String(expected).trim().toLowerCase(),pts=ok?Number(q?.points||q?.[4]||s.points||10):0,ms=Math.max(0,Number(a.elapsedMs)||0);s.answers.push({team_code:ses.code,round_no:r.n,question_id:String(a.questionId),answer:String(a.answer||'').slice(0,2000),correct:ok,points:pts,elapsed_ms:ms,submitted_at:new Date().toISOString()});score+=pts;elapsed+=ms}return {ok:true,score,elapsedMs:elapsed,locked:true}});return json(result);
 }
 if(m==='POST'&&p==='/api/team/finish-round'){
   const ses=await token(req,env,'team');if(!ses)return fail(401,'Team login required');const b=await body(req),n=Number(b?.round);
   try{const result=await changeState(env,s=>{const r=s.rounds.find(x=>x.n===n),team=s.teams.find(x=>x.code===ses.code);if(expireRound(s,r))throw Object.assign(Error('Round is closed'),{status:409});if(!s.running||!r||!r.active)throw Object.assign(Error('Round is closed'),{status:409});if(!team)throw Object.assign(Error('Team not found'),{status:404});const count=Number((team.progress||'0/4').split('/')[0])||0;if(count>=r.n)throw Object.assign(Error('This round is already locked'),{status:409});let score=0;s.answers=s.answers||[];const answer=b.answer===undefined?'':String(b.answer).slice(0,2000),q=(s.questions||[]).find(x=>Number(x.round||String(x[0]||'').match(/\d+/)?.[0])===r.n);if(q){const id=String(q.id||1);if(s.answers.some(x=>x.team_code===ses.code&&x.round_no===r.n&&x.question_id===id))throw Object.assign(Error('Your answer is already locked'),{status:409});const ok=answer.trim().toLowerCase()===String(q.answer||q[2]||'').trim().toLowerCase();score=ok?Number(q.points||q[4]||s.points||10):0;s.answers.push({team_code:ses.code,round_no:r.n,question_id:id,answer,correct:ok,points:score,elapsed_ms:Math.max(0,Number(b.elapsedMs)||0),submitted_at:new Date().toISOString()})}team.points=Number(team.points||0)+score;const total=s.rounds.length;team.progress=`${Math.min(total,count+1)}/${total}`;team.status=count+1>=total?'Complete':`In round ${count+2}`;return {ok:true,score,locked:true,progress:team.progress}});return json(result)}catch(e){if(e.status)return fail(e.status,e.message);throw e}
 }
 if(m==='GET'&&p==='/api/admin/export.csv'){
   if(!await token(req,env,'admin'))return fail(401,'Admin login required');const {state:s}=await getState(env),rows=(s.answers||[]).sort((a,b)=>a.round_no-b.round_no||a.team_code.localeCompare(b.team_code)||a.question_id.localeCompare(b.question_id)).map(a=>({...a,team:s.teams.find(t=>t.code===a.team_code)?.name||''})),head='Team,Team code,Round,Question ID,Answer,Correct,Points,Time (ms),Submitted at';return new Response([head,...rows.map(x=>[x.team,x.team_code,x.round_no,x.question_id,x.answer,x.correct?'Yes':'No',x.points,x.elapsed_ms,x.submitted_at].map(csvCell).join(','))].join('\r\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="quizly-answers.csv"','cache-control':'no-store'}});
 }
 return fail(404,'Not found');
}

export default { async fetch(request,env){
 try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await handleApi(request,env,url);if(!['/','/index.html','/admin.html','/participant.html','/audience.html'].includes(url.pathname))return new Response('Not found',{status:404});return await env.ASSETS.fetch(request)}
 catch(e){console.error(e);return fail(e.status||500,e.status?e.message:'Server error')}
}};
