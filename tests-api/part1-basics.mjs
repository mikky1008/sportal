// Run against a THROWAWAY database only (it creates users). API at http://localhost:8799, Node 22+.
const B = "http://localhost:8799";
const j = async (m, p, tok, body) => { const r = await fetch(B+p, {method:m, headers:{...(tok?{authorization:"Bearer "+tok}:{}),...(body?{"content-type":"application/json"}:{})}, body: body?JSON.stringify(body):undefined}); let d=null; try{d=await r.json()}catch{}; return {s:r.status, d}; };
let pass=0, fail=0;
const t=(name,cond,extra)=>{ if(cond){pass++;console.log("PASS",name)}else{fail++;console.log("FAIL",name,JSON.stringify(extra))} };
const reg = async (body)=>{ const r=await j("POST","/api/auth/register",null,{password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1",...body}); return r; };
const ts=Date.now();
const ath = await reg({accountType:"student_athlete",firstName:"Ana",lastName:"Cruz",email:`ana${ts}@test.ph`});
const uni = await reg({accountType:"university_representative",firstName:"Uli",lastName:"Rep",email:`uli${ts}@test.ph`,university:"Test University",designation:"Athletics Director"});
const ath2 = await reg({accountType:"student_athlete",firstName:"Ben",lastName:"Lee",email:`ben${ts}@test.ph`});
console.log("register", ath.s, uni.s, ath2.s, ath.d?.message||"");
const A=ath.d?.token, U=uni.d?.token, A2=ath2.d?.token;
t("registered", !!A && !!U && !!A2, {a:ath.d,u:uni.d});

// auth required
t("scholarships 401 anon", (await j("GET","/api/scholarships")).s===401);
t("notifications 401 anon", (await j("GET","/api/notifications")).s===401);
t("search 401 anon", (await j("GET","/api/search?q=ab")).s===401);

// empty list
let r=await j("GET","/api/scholarships",A); t("list empty ok", r.s===200 && r.d.items.length===0 && r.d.total===0, r);

// athlete cannot post
const body={name:"Athletic Excellence Scholarship",sport:"Basketball",coverage:"Full tuition",details:"d",eligibility:["GPA 2.5+","Top 50"],deadline:"2099-12-15"};
r=await j("POST","/api/scholarships",A,body); t("athlete cannot post (403)", r.s===403, r);
// validation
r=await j("POST","/api/scholarships",U,{...body,name:"ab"}); t("validation 400", r.s===400, r);
r=await j("POST","/api/scholarships",U,{...body,deadline:"2001-01-01"}); t("past deadline 400", r.s===400, r);
// create
r=await j("POST","/api/scholarships",U,body); t("uni creates 201", r.s===201 && r.d.scholarship.university==="Test University" && r.d.scholarship.eligibility.length===2, r);
const sid=r.d?.scholarship?.id;
// spoofed university ignored
r=await j("POST","/api/scholarships",U,{...body,name:"Second One",university:"Spoof U",sport:"Volleyball"}); t("rep cannot spoof university", r.d?.scholarship?.university==="Test University", r);
// list + filter + search q
r=await j("GET","/api/scholarships",A); t("list 2", r.d.total===2 && r.d.items[0].myApplication===null, r);
r=await j("GET","/api/scholarships?sport=volleyball",A); t("sport filter case-insens", r.d.total===1, r);
r=await j("GET","/api/scholarships?q=Excellence",A); t("q filter", r.d.total===1, r);
// apply
r=await j("POST",`/api/scholarships/${sid}/apply`,U); t("rep cannot apply 403", r.s===403, r);
r=await j("POST",`/api/scholarships/${sid}/apply`,A); t("athlete applies 201", r.s===201 && r.d.application.status==="submitted", r);
r=await j("POST",`/api/scholarships/${sid}/apply`,A); t("double apply 409", r.s===409 && r.d.code==="already_applied", r);
r=await j("GET","/api/scholarships",A); t("myApplication shows", r.d.items.find(i=>i.id===sid).myApplication?.status==="submitted", r);
r=await j("GET","/api/scholarships",A2); t("other athlete sees no application", r.d.items.find(i=>i.id===sid).myApplication===null, r);
r=await j("GET","/api/athletes/me/applications",A); t("my applications", r.d.total===1, r);
// notifications
r=await j("GET","/api/notifications/unread-count",A); t("athlete unread 1", r.d.unread===1, r);
r=await j("GET","/api/notifications/unread-count",U); t("rep unread 1", r.d.unread===1, r);
r=await j("GET","/api/notifications",U); t("rep list", r.d.items.length===1 && r.d.items[0].category==="application" && r.d.unread===1, r);
const nid=r.d.items[0]?.id;
r=await j("POST",`/api/notifications/${nid}/read`,A); t("cannot read others' (404)", r.s===404, r);
r=await j("POST",`/api/notifications/${nid}/read`,U); t("mark read", r.s===200 && r.d.notification.read===true, r);
r=await j("GET","/api/notifications/unread-count",U); t("rep unread 0", r.d.unread===0, r);
r=await j("GET","/api/notifications?category=bogus",A); t("bad category 400", r.s===400, r);
r=await j("GET","/api/notifications?category=application",A); t("category filter total", r.d.total===1, r);
r=await j("POST","/api/notifications/read-all",A); t("read-all", r.s===200 && r.d.updated===1, r);
// withdraw / reapply
r=await j("POST",`/api/scholarships/${sid}/withdraw`,A); t("withdraw", r.s===200 && r.d.application.status==="withdrawn", r);
r=await j("POST",`/api/scholarships/${sid}/withdraw`,A); t("withdraw twice 404", r.s===404, r);
r=await j("POST",`/api/scholarships/${sid}/apply`,A); t("reapply after withdraw", r.s===201, r);
// close
r=await j("POST",`/api/scholarships/${sid}/close`,A2); t("non-owner cannot close (404)", r.s===404, r);
r=await j("POST",`/api/scholarships/${sid}/close`,U); t("owner closes", r.s===200 && r.d.scholarship.isOpen===false, r);
r=await j("POST",`/api/scholarships/${sid}/apply`,A2); t("apply to closed 409", r.s===409 && r.d.code==="closed", r);
r=await j("GET","/api/scholarships",A2); t("closed hidden from list", !r.d.items.some(i=>i.id===sid), r);
r=await j("POST","/api/scholarships/nope/apply",A2); t("unknown id 404", r.s===404, r);
// search
r=await j("GET","/api/search?q=a",A); t("search too short empty", r.s===200 && r.d.athletes.length===0 && r.d.scholarships.length===0, r);
r=await j("GET","/api/search?q=Second",A); t("search finds scholarship", r.d.scholarships.length===1 && r.d.athletes.length===0, r);
r=await j("GET","/api/search?q=Ben",A); t("athlete search for non-coach empty", r.s===200 && r.d.athletes.length===0, r);
console.log(`\n${pass} passed, ${fail} failed`);
