/* Vinod General Stores: shelves, slip and WhatsApp ordering.
   Products and the WhatsApp number come from _data/products.yml and _data/store.yml
   (the layout passes them in as window.SITE). Edit those files, not this one. */
const WHATSAPP = window.SITE.whatsapp;
// [category, item, unit, price, in stock?, emoji, quantity, brand]
const PRODUCTS = window.SITE.products.map(p => {
  const qty = p.quantity == null ? 999 : p.quantity;
  return [p.category, p.name, p.unit || "", p.price, qty > 0 && p.in_stock !== false, p.emoji || "🛒", qty, p.brand || ""];
});

const $ = id => document.getElementById(id);
const cats = ["All", ...new Set(PRODUCTS.map(p => p[0]))];
const cart = {};
let cat = "All";

function updateStatus(){
 const parts = new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",weekday:"short",hour:"numeric",hour12:false}).formatToParts(new Date());
 const day = parts.find(p => p.type==="weekday").value;
 const hr = parseInt(parts.find(p => p.type==="hour").value,10) % 24;
 const open = day !== "Sun" && hr >= 8 && hr < 22;
 $("status").className = "hang " + (open ? "open" : "closed");
 $("statusText").textContent = open ? "We’re open!" : "Sorry, we’re closed";
 $("statusSub").textContent = open ? "Until 10 PM tonight" : "Back 8 AM, Monday to Saturday";
}

function renderChips(){
 $("chips").innerHTML = cats.map(c => `<button class="chip" type="button" aria-pressed="${c===cat}" data-c="${c}">${c==="All"?"All shelves":c}</button>`).join("");
}

function renderShelves(){
 const q = $("search").value.trim().toLowerCase();
 const items = PRODUCTS.filter(p => (cat==="All" || p[0]===cat) && (p[1] + " " + p[7]).toLowerCase().includes(q));
 if(!items.length){ $("shelves").innerHTML = `<div class="empty">We couldn’t find that on the shelves. Message us on WhatsApp and we will check.</div>`; return; }
 $("shelves").innerHTML = cats.slice(1).map(c => {
  const here = items.filter(p => p[0]===c);
  if(!here.length) return "";
  return `<div class="shelf"><h3>${c}</h3><div class="row">` + here.map(([,n,u,p,s,e,qmax,b]) => {
   const qty = cart[n] || 0;
   const act = !s ? `<button class="add" disabled>Sold out</button>`
    : qty ? `<span class="step"><button type="button" data-d="-1" data-n="${n}" aria-label="Remove one ${n}">−</button><span>${qty}</span><button type="button" data-d="1" data-n="${n}" aria-label="Add one ${n}"${qty >= qmax ? " disabled" : ""}>+</button></span>`
    : `<button class="add" type="button" data-d="1" data-n="${n}">Add</button>`;
   return `<div class="item${s?"":" sold"}"><div class="pack" aria-hidden="true">${e}</div><b>${n}</b><small>${[b && !n.toLowerCase().includes(b.toLowerCase()) ? b : "", u, s ? (qmax <= 10 ? "Only " + qmax + " left" : "In stock") : "Out of stock"].filter(Boolean).join(" · ")}</small><span class="tag">${p==null?"ask us":"₹"+p}</span>${act}</div>`;
  }).join("") + `</div></div>`;
 }).join("");
}

function renderCart(){
 const names = Object.keys(cart);
 const count = names.reduce((a,n) => a + cart[n], 0);
 $("fcount").textContent = count;
 $("float").classList.toggle("show", count > 0);
 if(!names.length){ $("cart").innerHTML = `<h3>Shopping slip</h3><p>Empty so far. <a href="#shop">Pick from the shelves</a>.</p>`; return; }
 let total = 0, allPriced = true;
 const lis = names.map(n => {
  const p = PRODUCTS.find(x => x[1]===n);
  if(p[3]==null) allPriced = false; else total += p[3]*cart[n];
  return `<li><span>${n} × ${cart[n]}</span><span>${p[3]==null ? "" : "₹"+(p[3]*cart[n])}</span></li>`;
 }).join("");
 $("cart").innerHTML = `<h3>Shopping slip</h3><ul>${lis}</ul><p>${allPriced ? "Total: ₹"+total : "We will confirm prices."}</p>`;
}

function change(n,d){
 cart[n] = Math.min(PRODUCTS.find(x => x[1]===n)[6], (cart[n]||0) + d);
 if(cart[n] <= 0) delete cart[n];
 renderShelves(); renderCart();
}

function waLink(text){ return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`; }
function sendOrder(){
 const err = $("err"); err.textContent = "";
 const names = Object.keys(cart);
 if(!names.length){ err.textContent = "Add at least one item to your slip first."; return; }
 if(!$("name").value.trim()){ err.textContent = "Please enter your name."; $("name").focus(); return; }
 if(!$("addr").value.trim()){ err.textContent = "Please enter your delivery address."; $("addr").focus(); return; }
 if(/X/.test(WHATSAPP)){ err.textContent = "WhatsApp number not set yet. Edit the WHATSAPP value in index.html."; return; }
 const lines = names.map(n => `- ${n} (${PRODUCTS.find(x => x[1]===n)[2]}) × ${cart[n]}`);
 const msg = `Hello Vinod General Stores, I would like to order:\n${lines.join("\n")}\n\nName: ${$("name").value.trim()}\nAddress: ${$("addr").value.trim()}\nPayment: ${$("pay").value}` + ($("note").value.trim() ? `\nNote: ${$("note").value.trim()}` : "");
 window.open(waLink(msg), "_blank", "noopener");
}

$("chips").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if(!b) return; cat = b.dataset.c; renderChips(); renderShelves(); });
$("shelves").addEventListener("click", e => { const b = e.target.closest("[data-d]"); if(b) change(b.dataset.n, +b.dataset.d); });
$("search").addEventListener("input", renderShelves);
$("send").addEventListener("click", sendOrder);
$("wa2").href = waLink("Hello Vinod General Stores, I have a question.");
$("wa2").target = "_blank"; $("wa2").rel = "noopener";
$("yr").textContent = new Date().getFullYear();

updateStatus(); setInterval(updateStatus, 60000);
renderChips(); renderShelves(); renderCart();
