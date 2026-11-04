/* ---------- POPs overview ----------
   List of every POP in your network with router load, generator, metro diversity (sites A and B),
   breakouts and jump to the city panel. */

const foldP=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

function popStats(){const pops=Object.keys(S.pops);let routers=0,site2=0,gen=0,attention=0;
  for(const c of pops){const p=S.pops[c];routers+=p.routers||1;if(p.site2)site2++;if(p.gen)gen++;
    const cap=R.nodeCap[c]||nodeCap(c)||1,load=R.nodeLoad[c]||0;
    const isAttn=(load/cap)>=0.8||(p.down>S.day)||siteDown(c,'a')||(p.site2&&siteDown(c,'b'));
    if(isAttn)attention++;}
  return {n:pops.length,routers,site2,gen,attention};}

function popsSection(){const pops=Object.keys(S.pops);
  let h=`<div class="panel2" id="popsSec" style="margin-top:12px"><h3>${tr('common.pops')}</h3><p class="note" style="margin-top:0">${tr('dashboard.every_pop_in_your_network')}</p>`;
  if(!pops.length)return h+`<p class="empty">${tr('dashboard.no_pops_matching_filter')}</p></div>`;
  const st=popStats();
  h+=`<div class="dgrid" style="margin:0 0 8px"><div class="tile"><div class="lbl">${tr('common.pops')}</div><div class="val">${st.n}</div><div class="sub">${st.routers} ${tr('common.routers').toLowerCase()}</div></div><div class="tile"><div class="lbl">${tr('common.metro_diversity')}</div><div class="val" style="color:var(--pni,#7B61FF)">${st.site2}</div><div class="sub">${tr('common.dual_site')}</div></div><div class="tile"><div class="lbl">${tr('common.backup_generator')}</div><div class="val" style="color:var(--eye,#16A866)">${st.gen}</div><div class="sub">${tr('common.has_generator')}</div></div><div class="tile"><div class="lbl">${tr('dashboard.attention_n',{n:st.attention})}</div><div class="val" style="color:${st.attention?'var(--bad,#FF4D5E)':'inherit'}">${st.attention}</div><div class="sub">${tr('city_panel.router_maxed_out')} / ${tr('common.down')}</div></div></div>`;
  const F=UI.pf||{},qStr=F.q?foldP(F.q):'';
  const filterMatch=c=>{const p=S.pops[c];
    if(F.f==='attn'){const cap=R.nodeCap[c]||nodeCap(c)||1,load=R.nodeLoad[c]||0;if(!((load/cap)>=0.8||(p.down>S.day)||siteDown(c,'a')||(p.site2&&siteDown(c,'b'))))return false;}
    else if(F.f==='site2'){if(!p.site2)return false;}
    else if(F.f==='nogen'){if(p.gen)return false;}
    if(F.reg&&CITY[c].reg!==F.reg)return false;
    if(qStr){const C=CITY[c],m=foldP(C.name).includes(qStr)||foldP(C.cc).includes(qStr)||foldP(siteName(c,'a')).includes(qStr)||(p.site2&&foldP(siteName(c,'b')).includes(qStr))||(C.ix&&foldP(C.ix).includes(qStr));if(!m)return false;}
    return true;};
  const regKeys=[...new Set(pops.map(c=>CITY[c].reg))].sort();
  h+=`<div class="trsel" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><div class="seg">${btn(tr('dashboard.all_n',{n:st.n}),'popF',{v:''},!F.f?'pink sm':'ghost sm')}${btn(tr('dashboard.attention_n',{n:st.attention}),'popF',{v:'attn'},F.f==='attn'?'pink sm':'ghost sm')}${btn(tr('dashboard.dual_site_n',{n:st.site2}),'popF',{v:'site2'},F.f==='site2'?'pink sm':'ghost sm')}${btn(tr('dashboard.no_generator_n',{n:st.n-st.gen}),'popF',{v:'nogen'},F.f==='nogen'?'pink sm':'ghost sm')}</div><input class="t" id="popSearchIn" type="search" placeholder="${esc(tr('dashboard.search_pop_or_location'))}" value="${esc(F.q||'')}" style="max-width:180px;padding:3px 8px;font-size:12px" data-chg="popSearch" autocomplete="off" autocapitalize="off" spellcheck="false"><label>${tr('common.all_regions')} <select data-chg="popReg"><option value="">${tr('common.all_regions')}</option>${regKeys.map(r=>`<option value="${r}"${F.reg===r?' selected':''}>${esc(REG[r]||r)}</option>`).join('')}</select></label>${F.f||F.reg||F.q?btn(tr('common.clear_filters'),'popF',{v:'',reg:'',q:''},'ghost sm'):''}</div>`;
  const rows=pops.filter(filterMatch);
  const sk=UI.popSort||'use',dir=UI.popDir!==undefined?UI.popDir:-1;
  const val=c=>{const p=S.pops[c];if(sk==='city')return CITY[c].name.toLowerCase();if(sk==='cap')return R.nodeCap[c]||nodeCap(c)||1;if(sk==='routers')return p.routers||1;const cap=R.nodeCap[c]||nodeCap(c)||1;return (R.nodeLoad[c]||0)/cap;};
  rows.sort((a,b)=>{const A=val(a),B=val(b);return (A<B?-1:A>B?1:0)*dir||CITY[a].name.localeCompare(CITY[b].name);});
  if(!rows.length)return h+`<p class="empty">${tr('dashboard.no_pops_matching_filter')}</p></div>`;
  if(isPhone()){
    h+=`<div class="seg" style="margin-bottom:4px">${[['use',tr('common.load')],['city',tr('common.name')],['cap',tr('common.capacity')],['routers',tr('common.routers')]].map(([k,l])=>btn(l+(sk===k?(dir>0?' ▲':' ▼'):''),'popSort',{k},sk===k?'pink sm':'ghost sm')).join('')}</div>`;
    h+=rows.slice(0,listN('pops')).map(c=>{const p=S.pops[c],C=CITY[c],cap=R.nodeCap[c]||nodeCap(c)||1,load=R.nodeLoad[c]||0,u=load/cap;
      const isDown=p.down>S.day||(siteDown(c,'a')&&(!p.site2||siteDown(c,'b')));
      const siteTag=p.site2?`<span class="tag" style="background:#7B61FF;color:#fff">${tr('common.dual_site')}</span>`:`<span class="tag">${tr('common.site_a_only')}</span>`;
      const genTag=p.gen?`<span class="tag" style="background:#16A866;color:#fff">⚡ ${tr('common.has_generator')}</span>`:`<span class="meta">${tr('common.no_generator')}</span>`;
      const st=isDown?` <span class="tag restrictive">${tr('common.down')}</span>`:'';
      const rt=p.routers||1,g=p.rgen||0,rtCost=routerCost(g,rt);
      const addRtBtn=rt<2?btn(tr('dashboard.add_redundant_router_cost',{cost:fmt$(rtCost)}),'addRouter',{city:c},'pink sm',S.cash<rtCost):(rt<RMAX?btn(tr('dashboard.add_router_cost',{cost:fmt$(rtCost)}),'addRouter',{city:c},'ghost sm',S.cash<rtCost):'');
      const addGenBtn=!p.gen?btn(tr('dashboard.install_generator_cost',{cost:fmt$(GEN_COST)}),'addGen',{city:c},'pink sm',S.cash<GEN_COST):'';
      return `<div class="row"${isDown?' style="opacity:.65"':''}><div class="grow"><div class="nm">${esc(C.name)} <span class="meta">${esc(REG[C.reg]||C.reg)}</span>${st}</div><div class="meta" style="margin:2px 0">${siteTag} · ${genTag} · ${rt}× ${esc(RG[g].n)}</div><div class="meta">${esc(p.site2?siteName(c,'a')+' ⇄ '+siteName(c,'b'):siteName(c,'a'))}</div><div class="kv" style="margin-top:2px"><span>${tr('common.load')}</span><b>${fmtG(load)} / ${fmtCap(cap)} (${pct(u)})</b></div><div class="bar ${barCls(u)}"><i style="width:${Math.min(100,u*100)}%"></i></div><div class="btns" style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">${addGenBtn}${addRtBtn}${btn(tr('common.open'),'popGo',{city:c},'ghost sm')}</div></div></div>`;
    }).join('');
    return h+listMore('pops',rows.length,n=>trn('dashboard.n_more_pops',n))+`</div>`;}
  const th=(k,l,cls)=>`<th class="${cls||''}">${k?`<button class="thb" data-act="popSort" data-args="${esc(JSON.stringify({k}))}">${l}${sk===k?(dir>0?' ▲':' ▼'):''}</button>`:l}</th>`;
  h+=`<div class="tscroll"><table class="tbl"><thead><tr>${th('city',tr('common.where_6276'))}${th('routers',tr('common.routers'))}${th(null,tr('common.metro_diversity'))}${th(null,tr('common.backup_generator'))}${th('use',tr('common.forwarding_load'),'r')}${th(null,tr('common.router_ports'),'r')}${th(null,tr('common.connections'))}${th(null,'')}</tr></thead><tbody>`;
  h+=rows.slice(0,listN('pops')).map(c=>{const p=S.pops[c],C=CITY[c],cap=R.nodeCap[c]||nodeCap(c)||1,load=R.nodeLoad[c]||0,u=load/cap;
    const isDown=p.down>S.day||(siteDown(c,'a')&&(!p.site2||siteDown(c,'b')));
    const tCount=S.transit.filter(t=>t.city===c).length,pCount=S.pni.filter(x=>x.city===c).length,ixCount=S.ixp[c]?1:0,cCount=(S.caches||[]).filter(ch=>ch.city===c).length;
    const connsDesc=[tCount?`${tCount} ${tr('common.transit')}`:'',pCount?`${pCount} PNI`:'',ixCount?'IX':'',cCount?`${cCount} ${tr('common.cache')}`:'',p.bb?'Eyeballs':''].filter(Boolean).join(' · ')||'—';
    const siteCell=p.site2?`<span class="tag" style="background:#7B61FF;color:#fff">${tr('common.dual_site')}</span> <span class="meta">${esc(siteName(c,'a'))} · ${esc(siteName(c,'b'))}</span>`:`<span class="tag">${tr('common.site_a_only')}</span> <span class="meta">${esc(siteName(c,'a'))}</span>`;
    const rt=p.routers||1,g=p.rgen||0,rtCost=routerCost(g,rt);
    const rtBtn=rt<2?btn(tr('dashboard.add_redundant_router_cost',{cost:fmt$(rtCost)}),'addRouter',{city:c},'pink sm',S.cash<rtCost):(rt<RMAX?btn(tr('dashboard.add_router_cost',{cost:fmt$(rtCost)}),'addRouter',{city:c},'ghost sm',S.cash<rtCost):'');
    const genCell=p.gen?`<span class="tag" style="background:#16A866;color:#fff">⚡ ${tr('common.has_generator')}</span>`:`<div style="display:flex;align-items:center;gap:6px"><span class="meta">— ${tr('common.no_generator')}</span>${btn(tr('dashboard.install_generator_cost',{cost:fmt$(GEN_COST)}),'addGen',{city:c},'pink sm',S.cash<GEN_COST)}</div>`;
    const pu=portsUsed(c),pm=portsMax(c);
    return `<tr${isDown?' style="opacity:.65"':''}><td><span class="nmc"><b>${esc(C.name)}</b></span> <span class="meta">${esc(REG[C.reg]||C.reg)}</span>${isDown?` <span class="tag restrictive">${tr('common.down')}</span>`:''}</td><td><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="rgpic sm">${rgArt(g)}</span> <span><b>${rt}×</b> ${esc(RG[g].n)}</span>${rtBtn}</div></td><td>${siteCell}</td><td>${genCell}</td><td class="r" style="min-width:140px"><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end"><span>${fmtG(load)} / ${fmtCap(cap)}</span><b style="min-width:38px;text-align:right">${pct(u)}</b></div><div class="bar ${barCls(u)}" style="margin-top:2px"><i style="width:${Math.min(100,u*100)}%"></i></div></td><td class="r">${pu} / ${pm}</td><td><span class="meta">${esc(connsDesc)}</span></td><td class="r">${btn(tr('common.open'),'popGo',{city:c},'ghost sm')}</td></tr>`;
  }).join('');
  h+=`</tbody></table></div>`;
  return h+listMore('pops',rows.length,n=>trn('dashboard.n_more_pops',n))+`</div>`;}

document.addEventListener('input',e=>{if(e.target.id!=='popSearchIn')return;UI.pf=UI.pf||{};UI.pf.q=e.target.value;listReset('pops');renderDash();const el=$('popSearchIn');if(el){el.focus();el.selectionStart=el.selectionEnd=el.value.length;}});
