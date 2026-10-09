// Corner Shop – POS & Web Store
// Sections: data → helpers → views → navigation → actions → events

// ============================================================
// DATA: seed products, saved state, UI state
// ============================================================

const $ = (s) => document.querySelector(s);
const money = (n) => Math.round(+n).toLocaleString("en-US") + " ₭"; // Lao Kip, no decimals
const dt = (t) => new Date(t).toLocaleString("lo-LA-u-nu-latn");
const STATUS = { pending: "ລໍຖ້າ", paid: "ຊຳລະແລ້ວ", cancelled: "ຍົກເລີກ" };
const stLabel = (s) => STATUS[s] || s;
const seed = {
  next: 100,
  profile: { name: "", phone: "" },
  products: [
    { id: 1, name: "ກາເຟ", emoji: "☕", price: 15000, stock: 50, cat: "coffee", sold: 34 },
    { id: 9, name: "ລາເຕ້", emoji: "🥛", price: 25000, stock: 40, cat: "coffee", sold: 28 },
    { id: 2, name: "ຄົວຊອງ", emoji: "🥐", price: 20000, stock: 20, cat: "food", sold: 22 },
    { id: 3, name: "ແຊນວິດ", emoji: "🥪", price: 30000, stock: 15, cat: "food", sold: 19 },
    { id: 4, name: "ນ້ຳໝາກກ້ຽງ", emoji: "🍊", price: 20000, stock: 25, cat: "drinks", sold: 15 },
    { id: 5, name: "ຄຸກກີ້", emoji: "🍪", price: 10000, stock: 40, cat: "food", sold: 12 },
    { id: 6, name: "ນ້ຳດື່ມ", emoji: "💧", price: 5000, stock: 80, cat: "drinks", sold: 8 },
    { id: 7, name: "ເຄັກຊິ້ນ", emoji: "🍰", price: 35000, stock: 10, cat: "food", sold: 25 },
    { id: 8, name: "ຊາ", emoji: "🍵", price: 12000, stock: 40, cat: "drinks", sold: 11 },
  ],
  orders: [],
};
let S;
try {
  S = JSON.parse(localStorage.getItem("shop_state_lo"));
} catch (e) {}
if (!S || !S.products) S = JSON.parse(JSON.stringify(seed));
const CATS = {
  ກາເຟ: "coffee",
  ລາເຕ້: "coffee",
  ຊາ: "drinks",
  ນ້ຳດື່ມ: "drinks",
  ນ້ຳໝາກກ້ຽງ: "drinks",
};
S.profile = S.profile || { name: "", phone: "" };
S.products.forEach((p) => {
  p.cat = p.cat || CATS[p.name] || "food";
  p.sold = p.sold || 0;
});
const save = () => {
  try {
    localStorage.setItem("shop_state_lo", JSON.stringify(S));
  } catch (e) {}
};
const ui = { tab: "home", cat: "all", staff: false, sc: {}, pc: {}, disc: 0, cash: "", name: "" };

// ============================================================
// CART HELPERS
// ============================================================

const P = (id) => S.products.find((p) => p.id == id);
const lines = (c) =>
  Object.entries(c)
    .map(([id, q]) => ({ p: P(id), q }))
    .filter((l) => l.p && l.q > 0);
const sub = (c) => lines(c).reduce((s, l) => s + l.p.price * l.q, 0);
const posTotal = () => Math.round(sub(ui.pc) * (1 - Math.min(100, Math.max(0, ui.disc)) / 100));
const count = (c) => lines(c).reduce((s, l) => s + l.q, 0);

function add(c, id) {
  const p = P(id);
  if ((c[id] || 0) >= p.stock) return;
  c[id] = (c[id] || 0) + 1;
}

// ============================================================
// VIEWS: product cards + cart
// ============================================================

function cartHTML(key) {
  const c = ui[key];
  const L = lines(c);
  if (!L.length) return '<p class="mu">ກະຕ່າຫວ່າງເປົ່າ.</p>';
  return L.map(
    (
      l,
    ) => `<div class="line"><span>${l.p.emoji} ${l.p.name}<br><span class="mu">${money(l.p.price)}</span></span>
  <button data-a="dec" data-c="${key}" data-id="${l.p.id}">−</button><b>${l.q}</b>
  <button data-a="inc" data-c="${key}" data-id="${l.p.id}">+</button></div>`,
  ).join("");
}
function prodCards(key, pos, list = S.products) {
  if (!list.length) return '<p class="mu">ຍັງບໍ່ມີລາຍການ.</p>';
  return list
    .map((p) => {
      const out = p.stock - (ui[key][p.id] || 0) <= 0;
      return `<div class="card prod" ${pos && !out ? `data-a="inc" data-c="${key}" data-id="${p.id}"` : ""} style="${out ? "opacity:.5" : ""}">
   <div class="e">${p.emoji}</div><b>${p.name}</b><div>${money(p.price)}</div>
   <div class="mu">${p.stock <= 0 ? "ສິນຄ້າໝົດ" : "ມີ " + p.stock + " ໃນສາງ"}</div>
   ${pos ? "" : `<button class="pri" style="margin-top:6px;width:100%" data-a="inc" data-c="${key}" data-id="${p.id}" ${out ? "disabled" : ""}>ເພີ່ມໃສ່ກະຕ່າ</button>`}</div>`;
    })
    .join("");
}

// ============================================================
// VIEWS: customer pages (Home, Menu, Cart, Profile)
// ============================================================

function topWeek() {
  const wk = Date.now() - 7 * 864e5,
    m = {};
  S.orders.forEach((o) => {
    if (o.status !== "cancelled" && o.time > wk)
      o.items.forEach((i) => (m[i.pid] = (m[i.pid] || 0) + i.q));
  });
  return S.products
    .filter((p) => p.stock > 0)
    .map((p) => ({ p, n: (p.sold || 0) + (m[p.id] || 0) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((x) => x.p);
}
const CATL = {
  all: "ທັງໝົດ",
  coffee: "☕ ກາເຟ",
  drinks: "🥤 ເຄື່ອງດື່ມ",
  food: "🍽 ອາຫານ",
  top: "🔥 ຂາຍດີປະຈຳອາທິດ",
};
function viewHome() {
  return `<div class="card" style="text-align:center;padding:32px 16px;background:var(--ac2)"><div style="font-size:48px">☕🥐</div>
  <h2 style="margin:6px 0">ຍິນດີຕ້ອນຮັບ${S.profile.name ? " " + S.profile.name : ""}!</h2><p class="mu">ກາເຟ ເຄື່ອງດື່ມ ແລະ ຂະໜົມ ເຮັດສົດໃໝ່ທຸກມື້.</p>
  <button class="pri" data-a="tab" data-id="menu">ສັ່ງຊື້ເລີຍ</button></div>
  <h3>ເບິ່ງຕາມໝວດໝູ່</h3><div class="row">${["coffee", "drinks", "food"].map((c) => `<button data-a="gocat" data-id="${c}" style="padding:18px">${CATL[c]}</button>`).join("")}</div>
  <h3>🔥 ຂາຍດີປະຈຳອາທິດ</h3><div class="grid">${prodCards("sc", false, topWeek())}</div>`;
}
function viewMenu() {
  const list =
    ui.cat === "all"
      ? S.products
      : ui.cat === "top"
        ? topWeek()
        : S.products.filter((p) => p.cat === ui.cat);
  return `<div class="lay"><div><div class="row" style="margin-bottom:12px">${Object.entries(CATL)
    .map(
      ([k, v]) =>
        `<button class="${ui.cat === k ? "on" : ""}" data-a="cat" data-id="${k}" style="flex:0 0 auto">${v}</button>`,
    )
    .join("")}</div>
  <div class="grid">${prodCards("sc", false, list)}</div></div>
  <div class="card side"><h3 style="margin-top:0">🛒 ກະຕ່າ (${count(ui.sc)})</h3>${cartHTML("sc")}
  <div class="tot"><span>ລວມ</span><span>${money(sub(ui.sc))}</span></div>
  <button class="pri" style="width:100%" data-a="tab" data-id="cart" ${count(ui.sc) ? "" : "disabled"}>ໄປທີ່ກະຕ່າ</button></div></div>`;
}
function viewCart() {
  return `<div class="card" style="max-width:520px;margin:0 auto"><h2 style="margin-top:0">🛒 ກະຕ່າຂອງທ່ານ</h2>${cartHTML("sc")}
  <div class="tot"><span>ລວມ</span><span>${money(sub(ui.sc))}</span></div>
  <input id="cname" placeholder="ຊື່ຂອງທ່ານ" value="${ui.name || S.profile.name}">
  <button class="pri" style="width:100%" data-a="order" ${count(ui.sc) ? "" : "disabled"}>ຢືນຢັນການສັ່ງຊື້</button>
  <button style="width:100%;margin-top:6px" data-a="tab" data-id="menu">← ເລືອກຊື້ຕໍ່</button></div>`;
}
function viewProfile() {
  const mine = S.orders.filter((o) => o.user).reverse(),
    spent = mine.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.total, 0);
  return `<div class="lay"><div class="card"><h2 style="margin-top:0">👤 ໂປຣໄຟລ໌ຂອງຂ້ອຍ</h2>
  <span class="mu">ຊື່</span><input id="pn" value="${S.profile.name}" placeholder="ຊື່ຂອງທ່ານ">
  <span class="mu">ເບີໂທ</span><input id="pp" value="${S.profile.phone}" placeholder="ເບີໂທລະສັບ">
  <button class="pri" data-a="saveprof">ບັນທຶກໂປຣໄຟລ໌</button>
  <div class="stats" style="margin-top:14px"><div class="card mu">ຄຳສັ່ງຊື້<b>${mine.length}</b></div><div class="card mu">ຍອດໃຊ້ຈ່າຍລວມ<b>${money(spent)}</b></div></div></div>
  <div><h3 style="margin-top:0">ຄຳສັ່ງຊື້ຂອງຂ້ອຍ</h3>${
    mine.length
      ? mine
          .map(
            (
              o,
            ) => `<div class="card" style="margin-bottom:8px"><div class="row" style="align-items:center"><b>#${o.id}</b>
  <span class="mu">${dt(o.time)}</span><span class="tag ${o.status === "pending" ? "p" : o.status === "cancelled" ? "c" : ""}" style="flex:0">${stLabel(o.status)}</span></div>
  <div class="mu">${o.items.map((i) => i.q + "× " + i.name).join(", ")}</div><div class="row" style="align-items:center"><b>${money(o.total)}</b><button data-a="receipt" data-id="${o.id}">ໃບເສັດ</button></div></div>`,
          )
          .join("")
      : '<p class="mu">ຍັງບໍ່ມີຄຳສັ່ງຊື້.</p>'
  }</div></div>`;
}

// ============================================================
// VIEWS: staff pages (POS, Orders, Products)
// ============================================================

function viewPOS() {
  const t = posTotal(),
    cash = parseFloat(ui.cash) || 0;
  return `<div class="lay pos"><div><div class="grid">${prodCards("pc", true)}</div></div>
  <div class="card side"><h3 style="margin-top:0">ການຂາຍປັດຈຸບັນ</h3>${cartHTML("pc")}
  <div class="row"><div><span class="mu">ສ່ວນຫຼຸດ %</span><input id="disc" type="number" min="0" max="100" value="${ui.disc || ""}" placeholder="0"></div>
  <div><span class="mu">ເງິນສົດທີ່ໄດ້ຮັບ</span><input id="cash" type="number" min="0" value="${ui.cash}" placeholder="0"></div></div>
  <div class="row"><button data-a="exact">ພໍດີ</button><button data-a="q" data-v="20000">20,000 ₭</button><button data-a="q" data-v="50000">50,000 ₭</button><button data-a="q" data-v="100000">100,000 ₭</button></div>
  <div class="tot"><span>ລວມ</span><span id="ptot">${money(t)}</span></div>
  <div class="tot" style="font-size:15px;font-weight:400"><span>ເງິນທອນ</span><span id="chg">${cash >= t ? money(cash - t) : "—"}</span></div>
  <div class="row"><button class="dn" data-a="clear">ລ້າງ</button><button class="pri" id="charge" data-a="charge" ${count(ui.pc) && cash >= t ? "" : "disabled"}>ຮັບເງິນ</button></div></div></div>`;
}
function viewOrders() {
  const today = new Date().toDateString();
  const paid = S.orders.filter((o) => o.status !== "cancelled" && o.status !== "pending");
  const td = paid.filter((o) => new Date(o.time).toDateString() === today);
  const pend = S.orders.filter((o) => o.status === "pending").length;
  const tag = { pending: "p", cancelled: "c" };
  return `<div class="stats"><div class="card mu">ຍອດຂາຍມື້ນີ້<b>${money(td.reduce((s, o) => s + o.total, 0))}</b></div>
  <div class="card mu">ຄຳສັ່ງຊື້ມື້ນີ້<b>${td.length}</b></div><div class="card mu">ອອນລາຍທີ່ລໍຖ້າ<b>${pend}</b></div></div>
  ${
    S.orders.length
      ? [...S.orders]
          .reverse()
          .map(
            (o) => `<div class="card" style="margin-bottom:8px">
   <div class="row" style="align-items:center"><b>#${o.id} · ${o.type === "online" ? "🌐 " + (o.name || "ລູກຄ້າທົ່ວໄປ") : "🧾 ຂາຍໜ້າຮ້ານ"}</b>
   <span class="mu">${dt(o.time)}</span><span class="tag ${tag[o.status] || ""}" style="flex:0">${stLabel(o.status)}</span></div>
   <div class="mu">${o.items.map((i) => i.q + "× " + i.name).join(", ")}${o.disc ? " · ສ່ວນຫຼຸດ " + o.disc + "%" : ""}</div>
   <div class="row" style="align-items:center;margin-top:6px"><b>${money(o.total)}</b>
   ${o.status === "pending" ? `<button class="pri" data-a="paid" data-id="${o.id}">ຢືນຢັນຊຳລະແລ້ວ</button><button class="dn" data-a="cancel" data-id="${o.id}">ຍົກເລີກ</button>` : ""}
   <button data-a="receipt" data-id="${o.id}">ໃບເສັດ</button></div></div>`,
          )
          .join("")
      : '<p class="mu">ຍັງບໍ່ມີຄຳສັ່ງຊື້.</p>'
  }`;
}
function viewProducts() {
  return `<div class="card"><table><tr><th></th><th>ຊື່</th><th>ລາຄາ (₭)</th><th>ຈຳນວນໃນສາງ</th><th></th></tr>
  ${S.products
    .map(
      (p) => `<tr><td>${p.emoji}</td><td>${p.name}</td>
  <td><input type="number" min="0" data-f="price" data-id="${p.id}" value="${p.price}"></td>
  <td><input type="number" min="0" data-f="stock" data-id="${p.id}" value="${p.stock}"></td>
  <td><button class="dn" data-a="del" data-id="${p.id}">✕</button></td></tr>`,
    )
    .join("")}</table>
  <h3>ເພີ່ມສິນຄ້າ</h3><div class="row"><input id="ne" placeholder="ອີໂມຈິ" maxlength="4" style="max-width:80px"><select id="nc" style="flex:0 0 auto;padding:8px;border-radius:8px"><option value="coffee">ກາເຟ</option><option value="drinks">ເຄື່ອງດື່ມ</option><option value="food">ອາຫານ</option></select><input id="nn" placeholder="ຊື່">
  <input id="np" type="number" placeholder="ລາຄາ (₭)"><input id="ns" type="number" placeholder="ຈຳນວນ"><button class="pri" data-a="addp">ເພີ່ມ</button></div>
  <p><button class="dn" data-a="reset">ລ້າງຂໍ້ມູນທັງໝົດ</button></p></div>`;
}

// ============================================================
// NAVIGATION + RENDER
// ============================================================

const tabs = {
  home: ["🏠 ໜ້າຫຼັກ", viewHome],
  menu: ["📖 ເມນູ", viewMenu],
  cart: ["🛒 ກະຕ່າ", viewCart],
  profile: ["👤 ໂປຣໄຟລ໌", viewProfile],
  pos: ["🧾 ຂາຍໜ້າຮ້ານ", viewPOS],
  orders: ["📋 ຄຳສັ່ງຊື້", viewOrders],
  products: ["📦 ສິນຄ້າ", viewProducts],
};
const staffTabs = ["pos", "orders", "products"];
function render() {
  $("#nav").innerHTML =
    Object.entries(tabs)
      .filter(([k]) => ui.staff || !staffTabs.includes(k))
      .map(
        ([k, v]) =>
          `<button class="${ui.tab === k ? "on" : ""}" data-a="tab" data-id="${k}">${k === "cart" ? v[0] + " (" + count(ui.sc) + ")" : v[0]}</button>`,
      )
      .join("") +
    `<button data-a="staff" style="opacity:.7">${ui.staff ? "✕ ພະນັກງານ" : "🔧 ພະນັກງານ"}</button>`;
  $("#app").innerHTML = tabs[ui.tab][1]();
}

// ============================================================
// ACTIONS: orders + receipts
// ============================================================

function makeOrder(type, cart, extra) {
  const L = lines(cart);
  L.forEach((l) => (l.p.stock -= l.q));
  const o = {
    id: S.next++,
    type,
    time: Date.now(),
    items: L.map((l) => ({ pid: l.p.id, name: l.p.name, q: l.q, price: l.p.price })),
    ...extra,
  };
  S.orders.push(o);
  save();
  return o;
}
function receipt(o) {
  $("#modal").innerHTML =
    `<div class="modal"><div class="card"><div style="text-align:center"><b>🏪 ຮ້ານມຸມຖະໜົນ</b><br>ຄຳສັ່ງຊື້ #${o.id}<br>${dt(o.time)}</div><hr>
  ${o.items.map((i) => `<div class="row"><span style="flex:3">${i.q}× ${i.name}</span><span style="text-align:right">${money(i.q * i.price)}</span></div>`).join("")}<hr>
  ${o.disc ? `<div class="row"><span>ສ່ວນຫຼຸດ</span><span style="text-align:right">${o.disc}%</span></div>` : ""}
  <div class="row"><b>ລວມທັງໝົດ</b><b style="text-align:right">${money(o.total)}</b></div>
  ${o.cash ? `<div class="row"><span>ເງິນສົດ</span><span style="text-align:right">${money(o.cash)}</span></div><div class="row"><span>ເງິນທອນ</span><span style="text-align:right">${money(o.cash - o.total)}</span></div>` : ""}
  <p style="text-align:center">ຂອບໃຈ!</p><div class="row"><button onclick="window.print()">ພິມ</button><button class="pri" onclick="$('#modal').innerHTML=''">ປິດ</button></div></div></div>`;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a,
    id = b.dataset.id,
    c = b.dataset.c;
  if (a === "tab") ui.tab = id;
  else if (a === "inc") add(ui[c], id);
  else if (a === "dec") {
    ui[c][id]--;
    if (ui[c][id] <= 0) delete ui[c][id];
  } else if (a === "order") {
    const n = ($("#cname").value || "").trim();
    if (n) S.profile.name = n;
    const o = makeOrder("online", ui.sc, {
      name: n,
      user: 1,
      status: "pending",
      total: sub(ui.sc),
    });
    ui.sc = {};
    ui.name = "";
    ui.tab = "profile";
    alert("ສັ່ງຊື້ #" + o.id + " ສຳເລັດແລ້ວ! ລວມ " + money(o.total));
  } else if (a === "cat") ui.cat = id;
  else if (a === "gocat") {
    ui.cat = id;
    ui.tab = "menu";
  } else if (a === "staff") {
    ui.staff = !ui.staff;
    if (!ui.staff && staffTabs.includes(ui.tab)) ui.tab = "home";
  } else if (a === "saveprof") {
    S.profile = { name: $("#pn").value.trim(), phone: $("#pp").value.trim() };
    save();
    alert("ບັນທຶກໂປຣໄຟລ໌ແລ້ວ");
  } else if (a === "exact") ui.cash = String(posTotal());
  else if (a === "q") ui.cash = b.dataset.v;
  else if (a === "clear") {
    ui.pc = {};
    ui.disc = 0;
    ui.cash = "";
  } else if (a === "charge") {
    const t = posTotal();
    const o = makeOrder("pos", ui.pc, {
      status: "paid",
      total: t,
      disc: ui.disc || 0,
      cash: parseFloat(ui.cash) || t,
    });
    ui.pc = {};
    ui.disc = 0;
    ui.cash = "";
    receipt(o);
  } else if (a === "paid") {
    S.orders.find((o) => o.id == id).status = "paid";
    save();
  } else if (a === "cancel") {
    const o = S.orders.find((o) => o.id == id);
    o.status = "cancelled";
    o.items.forEach((i) => {
      const p = P(i.pid);
      if (p) p.stock += i.q;
    });
    save();
  } else if (a === "receipt") receipt(S.orders.find((o) => o.id == id));
  else if (a === "del") {
    if (confirm("ລຶບສິນຄ້ານີ້ບໍ?")) {
      S.products = S.products.filter((p) => p.id != id);
      save();
    }
  } else if (a === "addp") {
    const n = $("#nn").value.trim(),
      pr = parseFloat($("#np").value);
    if (!n || isNaN(pr)) return alert("ກະລຸນາໃສ່ຊື່ ແລະ ລາຄາ");
    S.products.push({
      id: S.next++,
      name: n,
      emoji: $("#ne").value || "📦",
      cat: $("#nc").value,
      sold: 0,
      price: pr,
      stock: parseInt($("#ns").value) || 0,
    });
    save();
  } else if (a === "reset") {
    if (confirm("ລຶບສິນຄ້າ ແລະ ຄຳສັ່ງຊື້ທັງໝົດບໍ?")) {
      S = JSON.parse(JSON.stringify(seed));
      save();
      ui.sc = {};
      ui.pc = {};
    }
  }
  render();
});
document.addEventListener("input", (e) => {
  if (e.target.id === "cname") ui.name = e.target.value;
  if (e.target.id === "disc" || e.target.id === "cash") {
    if (e.target.id === "disc") ui.disc = parseFloat(e.target.value) || 0;
    else ui.cash = e.target.value;
    const t = posTotal(),
      cash = parseFloat(ui.cash) || 0;
    $("#ptot").textContent = money(t);
    $("#chg").textContent = cash >= t ? money(cash - t) : "—";
    $("#charge").disabled = !(count(ui.pc) && cash >= t);
  }
});
document.addEventListener("change", (e) => {
  const f = e.target.dataset.f;
  if (!f) return;
  P(e.target.dataset.id)[f] = Math.max(0, parseFloat(e.target.value) || 0);
  save();
});
// Start the app
render();