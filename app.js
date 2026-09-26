const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function card(p){
  const old = p.oldPrice ? `<del class="old">$${p.oldPrice.toFixed(2)}</del>` : "";
  const disc = p.discount ? `<span class="discount">-${p.discount}</span>` : "";
  return `<article class="product" data-id="${p.id}" tabindex="0" role="button" aria-label="View ${esc(p.name)}">
    <div class="product-media"><img class="product-img" src="${p.image}" alt="${esc(p.name)}" loading="lazy"><span class="media-badge">AFFILIATE</span></div>
    <div class="product-info"><span class="product-tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p class="merchant">${esc(p.merchant)}</p><div class="price-row"><span class="price">$${p.price.toFixed(2)}</span>${old}${disc}</div></div>
  </article>`;
}
function bindProducts(){
  $$('.product').forEach(el=>{el.addEventListener('click',()=>openProduct(Number(el.dataset.id)));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProduct(Number(el.dataset.id));}})});
}
function renderCategories(){
  const cats=[...new Set(PRODUCTS.map(p=>p.category))];
  $('#categoryGrid').innerHTML=cats.map((c,i)=>`<button class="category" data-cat="${esc(c)}"><span class="symbol">${['◈','◌','✦','⌂','◒','◇','○','△'][i%8]}</span><strong>${esc(c)}</strong><span>Explore ${esc(c.toLowerCase())}</span></button>`).join('');
  $$('.category').forEach(el=>el.addEventListener('click',()=>showResults(PRODUCTS.filter(p=>p.category===el.dataset.cat),`${el.dataset.cat} picks`)));
}
let currentResults = [];

function showResults(items,title='Trending Products',meta='',sort='default'){
  currentResults = [...items];
  items = [...currentResults];

  if(sort==='price-asc'){
    items.sort((a,b)=>a.price-b.price);
  }
if(sort==='price-desc'){
  items.sort((a,b)=>b.price-a.price);
}

if(sort==='discount-desc'){
  items.sort((a,b)=>
    (parseFloat(b.discount)||0)-(parseFloat(a.discount)||0)
  );
}
  
  $('#resultsTitle').textContent=title;$('#resultsMeta').textContent=meta || `${items.length} product${items.length===1?'':'s'} in this preview catalog`;
  $('#trendingGrid').innerHTML=items.length?items.map(card).join(''):`<div class="empty-state"><strong>No matching products</strong><span>Try another search or category.</span></div>`;
  $('#dealGrid').innerHTML='';$('#newGrid').innerHTML='';bindProducts();
  $('#trending').scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
  renderCategories();
  showResults(PRODUCTS.filter(p=>p.type==='trending'),'Trending Products');
  $('#dealGrid').innerHTML=PRODUCTS.filter(p=>p.discount).map(card).join('');
  $('#newGrid').innerHTML=PRODUCTS.filter(p=>p.type==='new').map(card).join('');
  bindProducts();
}
function openProduct(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  $('#modalImage').src=p.image;$('#modalImage').alt=p.name;$('#modalCategory').textContent=p.category.toUpperCase();$('#modalName').textContent=p.name;$('#modalMerchant').textContent=p.merchant;$('#modalPrice').textContent=`$${p.price.toFixed(2)}`;$('#modalOldPrice').textContent=p.oldPrice?`$${p.oldPrice.toFixed(2)}`:'';$('#modalDiscount').textContent=p.discount?`-${p.discount}%`:'';$('#modalDescription').textContent=p.description;$('#modalLink').href=p.clickUrl||'#';$('#modalLink').target='_blank';$('#modalLink').rel='nofollow sponsored noopener';
  $('#productModal').classList.add('open');$('#productModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>$('.modal-close').focus(),50);
}
function closeModal(){$('#productModal').classList.remove('open');$('#productModal').setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');}
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#searchInput').value.trim().toLowerCase();if(!q){showResults(PRODUCTS.filter(p=>p.type==='trending'),'Trending Products');return;}const found=PRODUCTS.filter(p=>`${p.name} ${p.category} ${p.merchant} ${p.description}`.toLowerCase().includes(q));showResults(found,`Search results`, `Showing ${found.length} match${found.length===1?'':'es'} for “${esc(q)}”`);});
$('#viewAllBtn').addEventListener('click',()=>showResults(PRODUCTS,'All Products'));
$('#sortSelect').addEventListener('change',e=>{
  const sort=e.target.value;
  const title=$('#resultsTitle').textContent;
showResults(currentResults,title,'',sort);
});
document.addEventListener('click',e=>{if(e.target.matches('[data-close]'))closeModal();if(e.target.closest('#mainNav a'))$('#mainNav').classList.remove('open');});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
$('#mobileMenuBtn').addEventListener('click',()=>{const open=$('#mainNav').classList.toggle('open');$('#mobileMenuBtn').setAttribute('aria-expanded',open?'true':'false');});
$('#year').textContent=new Date().getFullYear();
render();
