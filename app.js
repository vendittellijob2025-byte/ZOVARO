const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function card(p){
  const old = p.oldPrice ? `<del class="old">$${p.oldPrice.toFixed(2)}</del>` : "";
  const disc = p.discount ? `<span class="discount">-${p.discount}%</span>` : "";
  return `<article class="product" data-id="${p.id}">
    <img class="product-img" src="${p.image}" alt="${esc(p.name)}" loading="lazy">
    <div class="product-info">
      <span class="product-tag">${esc(p.category)}</span>
      <h3>${esc(p.name)}</h3>
      <p class="merchant">${esc(p.merchant)}</p>
      <div class="price-row"><span class="price">$${p.price.toFixed(2)}</span>${old}${disc}</div>
    </div>
  </article>`;
}
function render(){
  const cats=[...new Set(PRODUCTS.map(p=>p.category))];
  $("#categoryGrid").innerHTML=cats.map((c,i)=>`<a class="category" href="#trending" data-cat="${esc(c)}"><span class="symbol">${["◈","◌","✦","⌂","◒","◇","○","△"][i%8]}</span><strong>${esc(c)}</strong><span>Explore ${esc(c.toLowerCase())}</span></a>`).join("");
  $("#trendingGrid").innerHTML=PRODUCTS.filter(p=>p.type==="trending").map(card).join("");
  $("#dealGrid").innerHTML=PRODUCTS.filter(p=>p.discount).map(card).join("");
  $("#newGrid").innerHTML=PRODUCTS.filter(p=>p.type==="new").map(card).join("");
  document.querySelectorAll(".product").forEach(el=>el.addEventListener("click",()=>openProduct(Number(el.dataset.id))));
}
function openProduct(id){
  const p=PRODUCTS.find(x=>x.id===id); if(!p)return;
  $("#modalImage").src=p.image; $("#modalImage").alt=p.name;
  $("#modalCategory").textContent=p.category.toUpperCase();
  $("#modalName").textContent=p.name; $("#modalMerchant").textContent=p.merchant;
  $("#modalPrice").textContent=`$${p.price.toFixed(2)}`;
  $("#modalOldPrice").textContent=p.oldPrice?`$${p.oldPrice.toFixed(2)}`:"";
  $("#modalDiscount").textContent=p.discount?`-${p.discount}%`:"";
  $("#modalDescription").textContent=p.description;
  // Replace this placeholder with the real CJ deep link from the product feed.
  $("#modalLink").href="#";
  $("#productModal").classList.add("open"); $("#productModal").setAttribute("aria-hidden","false");
}
function closeModal(){ $("#productModal").classList.remove("open"); $("#productModal").setAttribute("aria-hidden","true"); }
document.addEventListener("click",e=>{if(e.target.matches("[data-close]"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("#searchForm").addEventListener("submit",e=>{
  e.preventDefault();
  const q=$("#searchInput").value.trim().toLowerCase();
  if(!q){render();return}
  const found=PRODUCTS.filter(p=>`${p.name} ${p.category} ${p.merchant}`.toLowerCase().includes(q));
  $("#trendingGrid").innerHTML=found.length?found.map(card).join(""):`<p>No demo products matched “${esc(q)}”.</p>`;
  $("#dealGrid").innerHTML=""; $("#newGrid").innerHTML="";
  document.querySelector("#trending").scrollIntoView({behavior:"smooth"});
  document.querySelectorAll(".product").forEach(el=>el.addEventListener("click",()=>openProduct(Number(el.dataset.id))));
});
document.querySelectorAll(".category").forEach(()=>{});
$("#year").textContent=new Date().getFullYear();
render();
