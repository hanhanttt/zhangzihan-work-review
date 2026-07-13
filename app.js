const state={data:null,media:null,projectIndex:0,activeGroup:'全部',lightboxItems:[],lightboxIndex:0,touchStartX:0};
const $=s=>document.querySelector(s);
async function load(){const [data,media]=window.PORTFOLIO_DATA&&window.MEDIA_MAP?[window.PORTFOLIO_DATA,window.MEDIA_MAP]:await Promise.all([fetch('data/portfolio-data.json',{cache:'no-store'}).then(r=>r.json()),fetch('data/media-map.json',{cache:'no-store'}).then(r=>r.json())]);state.data=data;state.media=media;render();}
function render(){renderMetrics();renderProjects();renderLoops();renderFuturePlans();renderPlatforms();}
function renderMetrics(){
  $('#metric-grid').innerHTML=state.data.dashboard.metrics.map(m=>`<article class="metric-card"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div><div class="metric-note">${m.note}</div></article>`).join('');
  const rows=state.data.servicePackage.assistedProducts; const max=Math.max(...rows.map(x=>x.useCount));
  $('#package-bars').innerHTML=rows.map(x=>`<div class="bar-row"><span>${x.name}</span><div class="bar-track"><div class="bar-fill" style="width:${x.useCount/max*100}%"></div></div><strong>${x.useCount.toLocaleString()} 次</strong></div>`).join('');
}
function renderProjects(){
  $('#project-tabs').innerHTML=state.data.projects.map((p,i)=>`<button class="tab ${i===state.projectIndex?'active':''}" data-index="${i}" role="tab">${p.shortTitle}</button>`).join('');
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{state.projectIndex=+b.dataset.index;state.activeGroup='全部';renderProjects()});
  renderProjectView();
}
function mediaFor(id){return state.media.projects.find(p=>p.projectId===id)?.items||[]}
function countLabel(items){const images=items.filter(x=>x.type==='image').length,videos=items.filter(x=>x.type==='video').length;if(images&&videos)return `${items.length}项`;if(videos)return `${videos}条`;return `${images}张`}
function renderProjectView(){
  const p=state.data.projects[state.projectIndex],items=mediaFor(p.id),groups=[...new Set(items.map(x=>x.group||'项目素材'))];
  if(state.activeGroup!=='全部'&&!groups.includes(state.activeGroup))state.activeGroup='全部';
  const filtered=state.activeGroup==='全部'?items:items.filter(x=>(x.group||'项目素材')===state.activeGroup);
  const filters=items.length?`<div class="gallery-filters" aria-label="素材分类筛选"><button class="filter-button ${state.activeGroup==='全部'?'active':''}" data-group="全部">全部（${countLabel(items)}）</button>${groups.map(g=>{const gi=items.filter(x=>(x.group||'项目素材')===g);return `<button class="filter-button ${state.activeGroup===g?'active':''}" data-group="${g}">${g}（${countLabel(gi)}）</button>`}).join('')}</div>`:'';
  const cards=filtered.length?filtered.map((x,i)=>x.type==='video'?`<article class="media-card video-card"><div class="media-frame"><video controls preload="metadata" src="${x.src}" aria-label="${x.title}"></video></div><h5>${x.title}</h5><p>${x.caption||''}</p></article>`:`<button class="media-card image-card" data-image-index="${i}" aria-label="放大查看：${x.title}"><span class="media-frame"><img src="${x.src}" alt="${x.title}" loading="lazy"></span><span class="media-title">${x.title}</span><span class="media-description">${x.caption||''}</span></button>`).join(''):`<div class="placeholder">该分类暂时没有素材。</div>`;
  $('#project-view').innerHTML=`<div class="project-title-row"><div><h3>${p.title}</h3><p class="project-summary">${p.summary}</p></div><span class="status">${p.status}</span></div><section class="media-gallery">${filters}<div class="gallery-heading"><h4>${state.activeGroup}（${countLabel(filtered)}）</h4></div><div class="media-grid">${cards}</div></section><div class="project-details"><div class="detail-box"><strong>业务问题</strong><p>${p.problem}</p></div><div class="detail-box"><strong>核心行动</strong><p>${p.action}</p></div><div class="detail-box"><strong>结果 / 证据</strong><p>${p.result}</p></div></div>`;
  document.querySelectorAll('.filter-button').forEach(b=>b.onclick=()=>{state.activeGroup=b.dataset.group;renderProjectView()});
  state.lightboxItems=filtered.filter(x=>x.type==='image');
  document.querySelectorAll('[data-image-index]').forEach(b=>{const item=filtered[+b.dataset.imageIndex];b.onclick=()=>openLightbox(item,state.lightboxItems.indexOf(item))});
}
function openLightbox(item,index){state.lightboxIndex=index;updateLightbox();$('#lightbox').showModal()}
function updateLightbox(){const item=state.lightboxItems[state.lightboxIndex];if(!item)return;$('#lightbox-image').src=item.src;$('#lightbox-image').alt=item.title;$('#lightbox-caption').textContent=`${state.lightboxIndex+1} / ${state.lightboxItems.length} · ${item.caption||item.title}`}
function moveLightbox(delta){const len=state.lightboxItems.length;if(!len)return;state.lightboxIndex=(state.lightboxIndex+delta+len)%len;updateLightbox()}
$('#lightbox-close').onclick=()=>$('#lightbox').close();
$('#lightbox-prev').onclick=()=>moveLightbox(-1);
$('#lightbox-next').onclick=()=>moveLightbox(1);
$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')moveLightbox(-1);if(e.key==='ArrowRight')moveLightbox(1)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#lightbox').open)$('#lightbox').close()});
$('#lightbox').addEventListener('touchstart',e=>{state.touchStartX=e.changedTouches[0].screenX},{passive:true});
$('#lightbox').addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-state.touchStartX;if(Math.abs(dx)>50)moveLightbox(dx>0?-1:1)},{passive:true});
function renderLoops(){const steps=state.data.businessLoop;$('#loop-flow').innerHTML=steps.map((s,i)=>`<div class="loop-step">${String(i+1).padStart(2,'0')}<br>${s}</div>`).join('');$('#project-loops').innerHTML=state.data.projects.slice(0,4).map(p=>`<article class="loop-card"><h3>${p.shortTitle}</h3><dl><dt>问题</dt><dd>${p.problem}</dd><dt>行动</dt><dd>${p.action}</dd><dt>结果</dt><dd>${p.result}</dd><dt>下一步</dt><dd>${p.next}</dd></dl></article>`).join('')}
function renderFuturePlans(){$('#future-plan-grid').innerHTML=state.data.futurePlans.map((p,i)=>`<article class="future-plan-card"><div class="future-plan-number">0${i+1}</div><p class="future-plan-type">${p.type}</p><h3>${p.title}</h3><p class="future-plan-summary">${p.summary}</p>${p.image?`<figure class="future-plan-visual"><img src="${p.image}" alt="${p.imageAlt||p.title}" loading="lazy"></figure>`:''}${p.basis?`<div class="future-plan-block plan-basis"><strong>方案依据</strong><p>${p.basis}</p></div>`:''}<div class="future-plan-block"><strong>协作与输入</strong><p>${p.input}</p></div><div class="future-plan-block"><strong>重点行动</strong><ul>${p.actions.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="future-plan-block"><strong>目标闭环</strong><p>${p.loop}</p></div>${p.channels?`<div class="channel-list">${p.channels.map(x=>`<span>${x}</span>`).join('')}</div>`:''}</article>`).join('')}
function renderPlatforms(){$('#platform-grid').innerHTML=state.data.platforms.map(p=>`<article class="platform-card"><span class="status">${p.status}</span><h3>${p.name}</h3><p>${p.summary}</p><p>${p.accessNote}</p><a href="${p.url}" target="_blank" rel="noreferrer">打开平台 ↗</a></article>`).join('')}
load().catch(e=>{$('main').innerHTML=`<section class="section"><h1>需要通过本地服务器预览</h1><p>运行 README 中的一行命令即可。错误：${e.message}</p></section>`});
