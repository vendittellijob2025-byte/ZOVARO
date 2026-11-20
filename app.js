
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const PRODUCT_PAGE_SIZE = 36;
let activeResults = [];
let activeResultsPage = 1;
let activeResultsTitle = "Popular Discoveries";
let activeResultsMeta = "";

const esc = s =>
  String(s).replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[m]
  );

function formatMoney(value, currency = "USD") {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  const code = String(currency || "USD").toUpperCase();

  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$"
  };

  const symbol = symbols[code] || `${code} `;

  return `${symbol}${number.toFixed(2)}`;
}

const ZOVARO_TRACKING_API = "https://zovaro.vercel.app/api/lead-track";

// Joined CJ advertisers with valid CJ tracking destinations are routed
// through ZOVARO's click recorder. The original CJ click URL is preserved.
const CJ_TRACKED_ADVERTISERS = Object.freeze({
  "8022425": "cj-kaiya-baby",
  "7969352": "cj-padel-iberico",
  "7287203": "cj-fragrance-shop",
  "5824323": "cj-unice",
  "6260179": "cj-abelssoft",
  "5357356": "cj-rexing",
  "5384937": "cj-ecosmetics"
});

// Preserve readable IDs for existing advertisers and automatically track
// every new joined CJ advertiser without requiring another code edit.
function getCjPartnerId(product) {
  const advertiserId = String(product.advertiserId || "").trim();
  if (!advertiserId) return "";

  const knownPartnerId = CJ_TRACKED_ADVERTISERS[advertiserId];
  if (knownPartnerId) return knownPartnerId;

  const merchantName = String(
    product.merchant || product.advertiserName || "advertiser"
  );
  const merchantSlug = merchantName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "advertiser";
  const safeAdvertiserId = advertiserId
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 16);
  return ("cj-" + merchantSlug + "-" + safeAdvertiserId).slice(0, 60);
}

// Match the server-side allowlist. If CJ returns a different tracking host,
// keep the original affiliate URL working rather than sending a broken redirect.
const CJ_TRACKING_HOSTS = new Set([
  "www.dpbolvw.net",
  "www.tkqlhce.com",
  "www.anrdoezrs.net",
  "www.jdoqocy.com",
  "www.kqzyfj.com"
]);

function getProductClickUrl(product) {
  const originalUrl = String(product.clickUrl || product.destination || "").trim();
  if (!originalUrl) return "#";

  const partnerId =
    String(product.source || "").toUpperCase() === "CJ"
      ? getCjPartnerId(product)
      : "";

  if (!partnerId) return originalUrl;

  try {
    const destination = new URL(originalUrl);
    if (destination.protocol !== "https:") return originalUrl;
    if (!CJ_TRACKING_HOSTS.has(destination.hostname.toLowerCase())) return originalUrl;

    const trackingUrl = new URL(ZOVARO_TRACKING_API);
    trackingUrl.searchParams.set("partner", partnerId);

    // The same unique referral ID is recorded by ZOVARO and sent to CJ as
    // its supported SID sub-ID so later commission records can be reconciled.
    const referralId =
      "zv-" + Date.now().toString(36) + "-" +
      Math.random().toString(36).slice(2, 12);

    destination.searchParams.set("SID", referralId);
    trackingUrl.searchParams.set("ref", referralId);
    trackingUrl.searchParams.set(
      "item",
      String(product.id || "product").replace(/[^a-z0-9_-]/gi, "-").slice(0, 100)
    );
    trackingUrl.searchParams.set("source", "website");
    trackingUrl.searchParams.set("campaign", "product-modal");
    trackingUrl.searchParams.set("to", destination.toString());
    return trackingUrl.toString();
  } catch {
    return originalUrl;
  }
}

// Keep category labels consistent even when older demo/seed records use aliases.
const CATEGORY_ALIASES = new Map([
  ["home", "Home & Living"],
  ["furniture", "Home & Living"],
  ["kitchen", "Home & Living"],
  ["kids & babies", "Babies"],
  ["baby", "Babies"],
  ["toys", "Toys & Games"],
  ["games", "Toys & Games"],
  ["cosmetics", "Beauty"],
  ["personal care", "Beauty"],
  ["fragrance", "Beauty"],
  ["cameras", "Electronics"],
  ["computers", "Electronics"],
  ["phones & tablets", "Electronics"],
  ["technology", "Electronics"],
  ["office", "Office & Technology"],
  ["tools", "Tools & DIY"],
  ["pet supplies", "Pets"],
  ["health", "Health & Wellness"],
  ["food", "Food & Grocery"],
  ["books", "Books & Media"],
  ["garden & outdoors", "Garden"]
]);

function categoryLabel(value) {
  const label = String(value || "").replace(/\s+/g, " ").trim();
  if (!label) return "";
  return CATEGORY_ALIASES.get(label.toLowerCase()) || label;
}

function card(p) {
  const old =
    p.oldPrice != null
      ? `<del class="old">${formatMoney(
          p.oldPrice,
          p.currency
        )}</del>`
      : "";

  const disc =
    p.discount
      ? `<span class="discount">-${esc(
          String(p.discount).replace("%", "")
        )}%</span>`
      : "";

  return `
    <article
      class="product"
      data-id="${esc(String(p.id))}"
      tabindex="0"
      role="button"
      aria-label="View ${esc(p.name)}"
    >

      <div class="product-media">
        <img
          class="product-img"
          src="${esc(p.image)}"
          alt="${esc(p.name)}"
          loading="lazy"
        >

        <span class="media-badge">AFFILIATE</span>
      </div>

      <div class="product-info">

        <span class="product-tag">
          ${esc(categoryLabel(p.category))}
        </span>

        <h3>
          ${esc(p.name)}
        </h3>

        <p class="merchant">
          ${esc(p.merchant)}
        </p>

        <div class="price-row">

          <span class="price">
            ${formatMoney(p.price, p.currency)}
          </span>

          ${old}

          ${disc}

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   PRODUCT CLICK SYSTEM
   ========================================================= */

function openProductFromElement(element) {
  if (!element) {
    return;
  }

  const id = String(
    element.getAttribute("data-id") || ""
  );

  if (!id) {
    return;
  }

  openProduct(id);
}


/*
  Event delegation:
  qualsiasi click effettuato dentro una scheda prodotto
  viene intercettato.
*/

document.addEventListener("click", event => {
  const product = event.target.closest(".product");

  if (product) {
    openProductFromElement(product);
    return;
  }

  if (event.target.matches("[data-close]")) {
    closeModal();
  }

  if (
    event.target.closest("#mainNav a")
  ) {
    $("#mainNav").classList.remove("open");
  }
});


/*
  Tastiera:
  ENTER e SPAZIO aprono il prodotto.
*/

document.addEventListener("keydown", event => {

  if (
    event.key === "Enter" ||
    event.key === " "
  ) {

    const product =
      event.target.closest(".product");

    if (product) {
      event.preventDefault();
      openProductFromElement(product);
      return;
    }
  }

  if (event.key === "Escape") {
    closeModal();
  }
});


let zovaroCategoryTree = [];
let zovaroCategoryView = { category: "", parentPath: "", level: 0 };

function findCategoryNode(category, path) {
  const root = zovaroCategoryTree.find(item => item && item.name === category);
  if (!root) return null;
  if (!path) return root;
  const parts = String(path).split(" > ").filter(Boolean);
  let nodes = Array.isArray(root.children) ? root.children : [];
  let found = null;
  for (const part of parts) {
    found = nodes.find(item => (typeof item === "string" ? item : item?.name) === part) || null;
    if (!found) return null;
    nodes = typeof found === "string" || !Array.isArray(found.children) ? [] : found.children;
  }
  return found;
}

function categoryProductsFor(category) {
  return (PRODUCTS || []).filter(product => categoryLabel(product.category) === category);
}

/* Curated editorial imagery for every generated department and subcategory.
   Images are illustrative category photography, never merchant/product endorsements. */
const CATEGORY_PHOTOS = {
  appliances: "photo-1586201375761-83865001e31c",
  automotive: "photo-1492144534655-ae79c964c9d7",
  babies: "photo-1519689680058-324335c77eba",
  beauty: "photo-1596462502278-27bfdc403348",
  "books & media": "photo-1507842217343-583bb7270b66",
  electronics: "photo-1511707171634-5f897ff02aa9",
  fashion: "photo-1483985988355-763728e1935b",
  "food & grocery": "photo-1542838132-92c53300491e",
  "food delivery": "photo-1513104890138-7c749659a591",
  "food delivery & restaurant orders": "photo-1513104890138-7c749659a591",
  gaming: "photo-1593305841991-05c297ba4575",
  garden: "photo-1416879595882-3373a0480b5b",
  "health & wellness": "photo-1505751172876-fa1923c5c528",
  "home & living": "photo-1600210492486-724fe5c67fb0",
  "office & technology": "photo-1498050108023-c5249f4df085",
  pets: "photo-1450778869180-41d0601e046e",
  "solo per la classe ricca": "photo-1511818966892-d7d671e672a2",
  sports: "photo-1461896836934-ffe607ba8211",
  "tools & diy": "photo-1504148455328-c376907d081c",
  "toys & games": "photo-1599623560574-39d485900c95",
  travel: "photo-1488646953014-85cb44e25828",
  "tvs & home cinema": "photo-1593359677879-a4bb92f829d1",
  "industrial & scientific": "photo-1581091226825-a6a2a5aee158",
  "real estate": "photo-1511818966892-d7d671e672a2",
  "luxury & prestige": "photo-1511818966892-d7d671e672a2",
  "accessible & adaptive living": "photo-1576091160399-112ba8d25d1d",
  "repair & circular economy": "photo-1581091226825-a6a2a5aee158",
  "musical instruments & studio": "photo-1511379938547-c1f69419868d",
  "arts, crafts & sewing": "photo-1513364776144-60967b0f800f",
  "security & safety": "photo-1557597774-9d273605dfa9",
  "energy, solar & electric mobility": "photo-1509391366360-2e959784a276",
  "refurbished, pre-owned & outlet": "photo-1517336714731-489689fd1ca8",
  "business, wholesale & bulk supply": "photo-1586528116311-ad8dd3c8310d"
};

const CATEGORY_DETAIL_PHOTOS = [
  [/perfume|fragrance|eau de|parfum/i, "photo-1541643600914-78b084683601"],
  [/makeup|cosmetic|skincare|beauty|nail|manicure|hair care/i, "photo-1596462502278-27bfdc403348"],
  [/phone|tablet|mobile/i, "photo-1511707171634-5f897ff02aa9"],
  [/laptop|computer|pc|monitor/i, "photo-1496181133206-80ce9b88a853"],
  [/camera|photography/i, "photo-1516035069371-29a1b244cc32"],
  [/rolex|patek philippe|audemars piguet|richard mille|vacheron constantin|cartier|watch|watches|jewelry|jewellery/i, "photo-1523170335258-f5ed11844a49"],
  [/shoe|sneaker|footwear/i, "photo-1542291026-7eec264c27ff"],
  [/bag|luggage|backpack/i, "photo-1553062407-98eeb64c6a62"],
  [/ferrari|lamborghini|rolls royce|bentley|bugatti|aston martin|mclaren|porsche|mercedes maybach|limousine|supercar|hypercars?|car|vehicle|automotive|motorcycle|tire|wheel/i, "photo-1492144534655-ae79c964c9d7"],
  [/baby|babies|nursery|stroller|diaper|maternity/i, "photo-1519689680058-324335c77eba"],
  [/dog|cat|pet|animal/i, "photo-1450778869180-41d0601e046e"],
  [/garden|plant|lawn|flower/i, "photo-1416879595882-3373a0480b5b"],
  [/padel|tennis|racket|racquet/i, "photo-1622279457486-62dcc4a431d6"],
  [/football|soccer|basketball|running|fitness|gym|sport/i, "photo-1461896836934-ffe607ba8211"],
  [/yacht|boat|marine|sailing/i, "photo-1567899378494-47b22a2ae96a"],
  [/jet|helicopter|aviation|aircraft/i, "photo-1436491865332-7a61a109cc05"],
  [/villa|castle|island|luxury|estate/i, "photo-1511818966892-d7d671e672a2"],
  [/book|library|reading/i, "photo-1507842217343-583bb7270b66"],
  [/food|grocery|supermarket|restaurant|meal|pizza/i, "photo-1542838132-92c53300491e"],
  [/game|console|gaming|controller/i, "photo-1593305841991-05c297ba4575"],
  [/tool|diy|workshop|hardware/i, "photo-1504148455328-c376907d081c"],
  [/sofa|furniture|home|kitchen|dining|decor|lighting/i, "photo-1600210492486-724fe5c67fb0"],
  [/solar|energy|battery|electric mobility/i, "photo-1509391366360-2e959784a276"],
  [/travel|suitcase|tourism|hotel/i, "photo-1488646953014-85cb44e25828"]
];

function categoryImageUrl(name, parentCategory = "", categoryPath = "", products = []) {
  const label = String(name || "").trim();
  const parent = String(parentCategory || "").trim();
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const brandLeaf = /^(rolex|patek philippe|audemars piguet|richard mille|vacheron constantin|cartier|ferrari|lamborghini|rolls royce|bentley|bugatti|aston martin|mclaren|porsche|mercedes maybach)$/i.test(normalizedLabel);
  const candidates = (Array.isArray(products) ? products : []).filter(product =>
    product && typeof product.image === "string" && /^https:\/\//i.test(product.image)
  );
  const exactProduct = candidates.find(product => {
    const identity = String(product.brand || "") + " " + String(product.name || "");
    return identity.toLowerCase().replace(/[^a-z0-9]+/g, " ").includes(normalizedLabel);
  });
  const representativeProduct = brandLeaf ? exactProduct : (exactProduct || candidates[0]);
  if (representativeProduct) return representativeProduct.image;

  const detail = CATEGORY_DETAIL_PHOTOS.find(([pattern]) => pattern.test(label));
  const parentKey = parent.toLowerCase();
  const rootKey = label.toLowerCase();
  const photo = detail?.[1] || CATEGORY_PHOTOS[rootKey] || CATEGORY_PHOTOS[parentKey] || CATEGORY_PHOTOS.electronics;
  return "https://images.unsplash.com/" + photo + "?auto=format&fit=crop&w=900&q=80";
}

function renderCategoryLevel(category, nodes, parentPath = "", level = 0) {
  const matching = categoryProductsFor(category);
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const parentProducts = parentPath
    ? matching.filter(product => {
        const sub = String(product.subcategory || "").trim();
        return sub === parentPath || sub.startsWith(parentPath + " > ");
      })
    : matching;
  const unclassified = matching.filter(product => {
    const sub = String(product.subcategory || "").trim();
    return !sub || sub === "Other";
  });

  const childrenHtml = safeNodes.map(node => {
    const name = typeof node === "string" ? node : String(node?.name || "");
    if (!name) return "";
    const path = parentPath ? parentPath + " > " + name : name;
    const children = typeof node === "string" || !Array.isArray(node.children) ? [] : node.children;
    const selected = matching.filter(product => {
      const sub = String(product.subcategory || "").trim();
      return sub === path || sub.startsWith(path + " > ");
    });
    return `
      <div class="category-node">
        <button type="button" class="category" data-tree-open="${esc(path)}">
          <img class="category-image" src="${esc(categoryImageUrl(name, category, path, selected))}" alt="" loading="lazy" decoding="async">
          <strong>${esc(name)}</strong>
          <span class="category-count">${selected.length} products</span>
        </button>
        <button type="button" class="category-products" data-tree-products="${esc(path)}">View products (${selected.length}) →</button>
        ${children.length ? `<button type="button" class="category-browse" data-tree-open="${esc(path)}">Open subcategories →</button>` : ""}
      </div>`;
  }).join("");

  zovaroCategoryView = { category, parentPath, level };
  const grid = $("#categoryGrid");
  grid.innerHTML = `
    <button type="button" class="category category-back" data-tree-back><strong>← Back</strong></button>
    <button type="button" class="category" data-tree-all>
      <strong>${parentPath ? "All products in this department" : "All products in this category"}</strong>
      <span class="category-count">${parentProducts.length} products</span>
    </button>
    ${unclassified.length ? `
      <button type="button" class="category" data-tree-unclassified>
        <strong>More products</strong>
        <span class="category-count">${unclassified.length} products</span>
      </button>` : ""}
    ${childrenHtml || '<p class="category-empty">No subcategories available yet.</p>'}
  `;
}

function renderCategories() {
  zovaroCategoryTree = Array.isArray(window.ZOVARO_CATEGORY_TREE) ? window.ZOVARO_CATEGORY_TREE : [];
  const products = PRODUCTS || [];
  const categories = [...new Set([
    ...zovaroCategoryTree.map(item => item?.name).filter(Boolean),
    ...products.map(product => categoryLabel(product.category)).filter(Boolean)
  ])]
    .filter(category => category !== "Other")
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  const grid = $("#categoryGrid");
  if (!grid.dataset.navigationBound) {
    grid.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || !grid.contains(button)) return;

      if (button.hasAttribute("data-root-category")) {
        const category = button.dataset.rootCategory;
        const root = zovaroCategoryTree.find(item => item?.name === category);
        if (root && Array.isArray(root.children) && root.children.length) {
          renderCategoryLevel(category, root.children, "", 0);
        } else {
          showResults(categoryProductsFor(category), `${category} picks`);
        }
        return;
      }

      if (button.hasAttribute("data-tree-back")) {
        const { category, parentPath, level } = zovaroCategoryView;
        if (level <= 0 || !parentPath) {
          renderCategories();
          return;
        }
        const parts = parentPath.split(" > ").filter(Boolean);
        parts.pop();
        const newParent = parts.join(" > ");
        const parentNode = findCategoryNode(category, newParent);
        const root = zovaroCategoryTree.find(item => item?.name === category);
        const nextNodes = newParent
          ? (parentNode && Array.isArray(parentNode.children) ? parentNode.children : [])
          : (root && Array.isArray(root.children) ? root.children : []);
        renderCategoryLevel(category, nextNodes, newParent, Math.max(0, level - 1));
        return;
      }

      if (button.hasAttribute("data-tree-all")) {
        const { category, parentPath } = zovaroCategoryView;
        const matching = categoryProductsFor(category);
        const selected = parentPath
          ? matching.filter(product => {
              const sub = String(product.subcategory || "").trim();
              return sub === parentPath || sub.startsWith(parentPath + " > ");
            })
          : matching;
        showResults(selected, parentPath ? `${category} · ${parentPath}` : `${category} · All products`);
        return;
      }

      if (button.hasAttribute("data-tree-unclassified")) {
        const { category } = zovaroCategoryView;
        const selected = categoryProductsFor(category).filter(product => {
          const sub = String(product.subcategory || "").trim();
          return !sub || sub === "Other";
        });
        showResults(selected, `${category} · Other / More products`);
        return;
      }

      if (button.hasAttribute("data-tree-products")) {
        const { category } = zovaroCategoryView;
        const path = button.dataset.treeProducts;
        const selected = categoryProductsFor(category).filter(product => {
          const sub = String(product.subcategory || "").trim();
          return sub === path || sub.startsWith(path + " > ");
        });
        showResults(selected, `${category} · ${path}`);
        return;
      }

      if (button.hasAttribute("data-tree-open")) {
        const { category, level } = zovaroCategoryView;
        const path = button.dataset.treeOpen;
        const node = findCategoryNode(category, path);
        const children = node && typeof node !== "string" && Array.isArray(node.children) ? node.children : [];
        if (children.length) {
          renderCategoryLevel(category, children, path, level + 1);
        } else {
          const selected = categoryProductsFor(category).filter(product => {
            const sub = String(product.subcategory || "").trim();
            return sub === path || sub.startsWith(path + " > ");
          });
          showResults(selected, `${category} · ${path}`);
        }
      }
    });
    grid.dataset.navigationBound = "true";
  }

  zovaroCategoryView = { category: "", parentPath: "", level: 0 };
  grid.innerHTML = categories.length ? categories.map(category => {
    const count = categoryProductsFor(category).length;
    return `
      <button type="button" class="category" data-root-category="${esc(category)}">
        <img class="category-image" src="${esc(categoryImageUrl(category))}" alt="" loading="lazy" decoding="async">
        <strong>${esc(category)}</strong>
        <span class="category-count">${count} products</span>
      </button>`;
  }).join("") : '<p class="category-empty">New verified product categories are being added. Please check back soon.</p>';
}

function renderResultPage(append = false) {
  const grid = $("#trendingGrid");
  const start = (activeResultsPage - 1) * PRODUCT_PAGE_SIZE;
  const visible = activeResults.slice(start, start + PRODUCT_PAGE_SIZE);

  if (append) {
    grid.insertAdjacentHTML("beforeend", visible.map(card).join(""));
  } else {
    grid.innerHTML = visible.length
      ? visible.map(card).join("")
      : `
        <div class="empty-state">
          <strong>No matching products</strong>
          <span>Try another search or category.</span>
        </div>
      `;
  }

  const previousButton = $("#loadMoreProducts");
  if (previousButton) previousButton.remove();

  const shown = Math.min(activeResultsPage * PRODUCT_PAGE_SIZE, activeResults.length);
  const countText = activeResults.length > PRODUCT_PAGE_SIZE
    ? `Showing ${shown.toLocaleString()} of ${activeResults.length.toLocaleString()} products`
    : `${activeResults.length.toLocaleString()} product${activeResults.length === 1 ? "" : "s"}`;

  $("#resultsMeta").textContent = activeResultsMeta
    ? `${activeResultsMeta} · ${countText}`
    : countText;

  if (shown < activeResults.length) {
    const button = document.createElement("button");
    button.id = "loadMoreProducts";
    button.type = "button";
    button.className = "text-btn";
    button.style.display = "block";
    button.style.margin = "28px auto 0";
    button.textContent = `Load more (${(activeResults.length - shown).toLocaleString()} remaining)`;
    button.addEventListener("click", () => {
      activeResultsPage += 1;
      renderResultPage(true);
    });
    grid.after(button);
  }
}


function showResults(
  items,
  title = "Popular Discoveries",
  meta = ""
) {
  activeResults = Array.isArray(items) ? items : [];
  activeResultsPage = 1;
  activeResultsTitle = title;
  activeResultsMeta = meta;

  const resultsTitle = $("#resultsTitle");
  if (resultsTitle) resultsTitle.textContent = activeResultsTitle;

  const resultsSection = $("#trending");
  if (resultsSection) resultsSection.classList.remove("hidden");

  renderResultPage(false);

  $("#trending").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function render() {
  // On entering SHOP, show only the category tiles.
  // Product results appear after an explicit search or category selection.
  renderCategories();
}


function openProduct(id) {

  const targetId = String(id);

  const p =
    PRODUCTS.find(
      x =>
        String(x.id) ===
        targetId
    );

  if (!p) {
    console.warn(
      "ZOVARO: product not found:",
      targetId
    );
    return;
  }

  $("#modalImage").src =
    p.image || "";

  $("#modalImage").alt =
    p.name || "";

  $("#modalCategory").textContent =
    String(
      p.category || "Featured"
    ).toUpperCase();

  $("#modalName").textContent =
    p.name || "";

  $("#modalMerchant").textContent =
    p.merchant || "";

  $("#modalPrice").textContent =
    formatMoney(
      p.price,
      p.currency
    );

  $("#modalOldPrice").textContent =
    p.oldPrice != null
      ? formatMoney(
          p.oldPrice,
          p.currency
        )
      : "";

  $("#modalDiscount").textContent =
    p.discount
      ? `-${String(
          p.discount
        ).replace("%", "")}%`
      : "";

  $("#modalDescription").textContent =
    p.description || "";

  $("#modalLink").href =
    getProductClickUrl(p);

  $("#modalLink").target =
    "_blank";

  $("#modalLink").rel =
    "nofollow sponsored noopener";

  $("#productModal").classList.add(
    "open"
  );

  $("#productModal").setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

  setTimeout(
    () => {
      const close =
        $(".modal-close");

      if (close) {
        close.focus();
      }
    },
    50
  );
}


function closeModal() {

  $("#productModal").classList.remove(
    "open"
  );

  $("#productModal").setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   SEARCH
   ========================================================= */

async function translateSearchQuery(query) {
  const language = (localStorage.getItem("zovaroWorldwideLanguage") || document.documentElement.lang || "en").toLowerCase();
  if (!language || language === "en") return query;
  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", query.slice(0, 500));
    url.searchParams.set("langpair", language + "|en");
    const response = await fetch(url.toString(), { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(4500) });
    if (!response.ok) return query;
    const data = await response.json();
    const translated = String(data?.responseData?.translatedText || "").trim();
    if (!translated || translated.toLowerCase() === query.toLowerCase()) return query;
    return translated;
  } catch {
    return query;
  }
}

const SEARCH_SYNONYMS = Object.freeze({
  "profumi":"perfume perfumes fragrance fragrances parfum parfums",
  "profumo":"perfume fragrance parfum",
  "fragranze":"fragrance fragrances perfume",
  "scarpe":"shoes footwear sneakers",
  "scarpa":"shoe footwear",
  "cellulare":"phone phones smartphone smartphones mobile mobiles iphone",
  "cellulari":"phone phones smartphone smartphones mobile mobiles iphone",
  "telefono":"phone phones smartphone smartphones mobile mobiles iphone",
  "telefoni":"phone phones smartphone smartphones mobile mobiles iphone",
  "phone":"phones smartphone smartphones mobile mobiles iphone",
  "phones":"phone smartphone smartphones mobile mobiles iphone",
  "smartphone":"smartphones phone phones mobile mobiles iphone",
  "smartphones":"smartphone phone phones mobile mobiles iphone",
  "mobile":"mobiles phone phones smartphone smartphones iphone",
  "mobiles":"mobile phone phones smartphone smartphones iphone",
  "computer":"computer laptop desktop pc",
  "portatile":"laptop notebook",
  "portatili":"laptops notebooks",
  "televisore":"tv television",
  "televisori":"tv televisions",
  "orologio":"watch wristwatch",
  "orologi":"watches wristwatches",
  "borsa":"bag handbag",
  "borse":"bags handbags",
  "vestiti":"clothing apparel clothes",
  "abbigliamento":"clothing apparel fashion",
  "trucco":"makeup cosmetics",
  "cosmetici":"cosmetics beauty",
  "cosmetico":"cosmetic beauty",
  "bellezza":"beauty cosmetics",
  "giocattoli":"toys",
  "giocattolo":"toy",
  "mobili":"furniture",
  "arredamento":"furniture",
  "cucina":"kitchen",
  "elettrodomestici":"appliances home appliance",
  "auto":"car automobile automotive",
  "accessori":"accessories",
  "giardino":"garden gardening",
  "attrezzi":"tools",
  "bicicletta":"bicycle bike",
  "biciclette":"bicycles bikes",
  "libri":"books",
  "libro":"book",
  "perfumes":"perfume fragrance fragrances",
  "parfum":"perfume fragrance",
  "chaussures":"shoes footwear",
  "parfums":"perfume fragrance",
  "zapatos":"shoes footwear",
  "perfume":"perfume fragrance fragrances",
  "fragancias":"fragrance perfume",
  "ropa":"clothing apparel",
  "bolsos":"bags handbags",
  "maquillaje":"makeup cosmetics",
  "belleza":"beauty cosmetics",
  "schuhe":"shoes footwear",
  "duft":"perfume fragrance",
  "parfüm":"perfume fragrance",
  "kleidung":"clothing apparel",
  "taschen":"bags handbags",
  "parfum":"perfume fragrance",
  "香水":"perfume fragrance",
  "靴":"shoes footwear",
  "化妆品":"cosmetics beauty"
});

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const SEARCH_STOP_WORDS = new Set([
  "a","an","and","the","for","of","to","with","in","on","me","i","want","need","find","show","looking",
  "il","lo","la","i","gli","le","un","uno","una","e","di","da","per","con","che","cerco","cerca","vorrei","voglio","mi","serve",
  "el","la","los","las","un","una","y","de","del","para","con","busco","quiero","necesito",
  "le","les","un","une","des","et","de","du","pour","avec","cherche","veux",
  "der","die","das","ein","eine","und","oder","mit","fur","für","ich","suche","brauche",
  "o","os","as","um","uma","e","de","do","da","para","com","quero","preciso"
]);

const SEARCH_EQUIVALENTS = Object.freeze({
  "profumo":["perfume","fragrance","parfum"],
  "profumi":["perfume","perfumes","fragrance","fragrances","parfum","parfums"],
  "fragranza":["fragrance","perfume"],
  "fragranze":["fragrances","fragrance","perfumes","perfume"],
  "televisore":["tv","television"],
  "televisori":["tv","televisions","television"],
  "televisione":["tv","television"],
  "television":["tv","televisions"],
  "televisions":["tv","television"],
  "tv":["television","televisions"],
  "cellulare":["phone","smartphone","mobile"],
  "cellulari":["phones","smartphones","mobiles","phone","smartphone","mobile"],
  "telefono":["phone","smartphone","mobile"],
  "telefoni":["phones","smartphones","mobiles","phone","smartphone","mobile"],
  "phone":["phones","smartphone","smartphones","mobile","mobiles"],
  "phones":["phone","smartphone","smartphones","mobile","mobiles"],
  "smartphone":["smartphones","phone","phones","mobile","mobiles"],
  "smartphones":["smartphone","phone","phones","mobile","mobiles"],
  "computer":["computers","pc","desktop","laptop"],
  "computers":["computer","pc","desktop","laptop","notebook"],
  "portatile":["laptop","notebook"],
  "portatili":["laptops","notebooks","laptop","notebook"],
  "laptop":["laptops","notebook","notebooks"],
  "scarpa":["shoe","footwear"],
  "scarpe":["shoes","footwear","sneaker","sneakers"],
  "shoe":["shoes","footwear"],
  "shoes":["shoe","footwear","sneakers"],
  "vestito":["clothing","dress","apparel"],
  "vestiti":["clothes","clothing","apparel"],
  "abbigliamento":["clothing","apparel","fashion"],
  "ropa":["clothing","apparel","clothes"],
  "zapatos":["shoes","footwear"],
  "chaussures":["shoes","footwear"],
  "schuhe":["shoes","footwear"],
  "parfum":["perfume","fragrance"],
  "parfums":["perfumes","fragrances","perfume"],
  "perfume":["perfumes","fragrance","fragrances"],
  "perfumes":["perfume","fragrance","fragrances"],
  "香水":["perfume","fragrance"],
  "化妆品":["cosmetics","beauty"],
  "靴":["shoes","footwear"]
});

function searchTokenForms(token) {
  const forms = new Set([token]);
  const equivalents = SEARCH_EQUIVALENTS[token];
  if (equivalents) equivalents.forEach(term => forms.add(term));
  // Conservative plural/singular normalization for common English catalog titles.
  if (token.length > 4 && token.endsWith("ies")) forms.add(token.slice(0, -3) + "y");
  if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) forms.add(token.slice(0, -1));
  if (token.length > 4 && token.endsWith("es")) forms.add(token.slice(0, -2));
  return [...forms];
}

function tokenizeSearchQuery(query) {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter(token => token.length > 1 && !SEARCH_STOP_WORDS.has(token));
}

const SEARCH_INTENT_EXCLUSIONS = [
  {
    terms:["tv","television","televisions","televisore","televisori"],
    exclude:["projector","projectors","antenna","amplifier","mount","mounts","stand","stands","remote","remote control","cable","cables","adapter","adapters","power supply","replacement","wall bracket","screen protector"]
  },
  {
    terms:["phone","phones","smartphone","smartphones","cellulare","cellulari","telefono","telefoni","iphone","galaxy","pixel"],
    exclude:["mount","mounts","holder","holders","clamp","case","cases","cover","covers","charger","chargers","cable","cables","screen protector","battery","batteries","repair","replacement","parts","web development","projector","tripod"]
  },
  {
    terms:["computer","computers","pc","laptop","laptops","notebook","notebooks","desktop","desktops","macbook"],
    exclude:["keyboard","keyboards","mouse","mice","power bank","powerbank","charger","chargers","cable","cables","sticker","stickers","case","cases","sleeve","sleeves","stand","stands","dock","docking station","memory","ram","ssd","hard drive","adapter","adapters","replacement","parts"]
  },
  {
    terms:["shoe","shoes","footwear","sneaker","sneakers","scarpa","scarpe"],
    exclude:["blusher","blush","cosmetic","cosmetics","makeup","eyeshadow","nail polish","lipstick","shade"]
  }
];

function hasWholePhrase(text, phrase) {
  return (" " + text + " ").includes(" " + normalizeSearchText(phrase) + " ");
}

function violatesSearchIntent(product, queryTokens, queryText) {
  const title = normalizeSearchText([
    product.name, product.title, product.englishTitle, product.brand
  ].join(" "));
  const taxonomy = normalizeSearchText([
    product.category, product.englishCategory,
    product.subcategory, product.englishSubcategory
  ].join(" "));
  const identity = title + " " + taxonomy;
  for (const intent of SEARCH_INTENT_EXCLUSIONS) {
    const requested = intent.terms.some(term => queryTokens.includes(term) ||
      queryTokens.some(token => searchTokenForms(token).includes(term)));
    if (!requested) continue;
    // Multi-word accessory intent must be checked against the complete query,
    // not one token at a time (e.g. "phone screen protector").
    const accessoryExplicitlyRequested = intent.exclude.some(term =>
      hasWholePhrase(queryText, term)
    );
    if (accessoryExplicitlyRequested) continue;
    if (intent.exclude.some(term => hasWholePhrase(identity, term))) return true;
  }
  return false;
}

function scoreProductSearch(product, queryVariants) {
  // Product identity is authoritative for multi-word product/model searches.
  // Taxonomy may satisfy a complete category phrase, but category words may
  // never be combined with unrelated title words to manufacture a match.
  const title = normalizeSearchText([
    product.name, product.title, product.englishTitle, product.brand
  ].join(" "));
  const taxonomy = normalizeSearchText([
    product.category, product.englishCategory,
    product.subcategory, product.englishSubcategory
  ].join(" "));
  const titleTokens = new Set(title.split(/\s+/).filter(Boolean));
  const taxonomyTokens = new Set(taxonomy.split(/\s+/).filter(Boolean));
  let best = 0;

  for (const query of queryVariants) {
    const tokens = tokenizeSearchQuery(query);
    if (!tokens.length) continue;
    const queryPhrase = tokens.join(" ");

    // Apply product-type exclusions before considering any match.
    if (violatesSearchIntent(product, tokens, queryPhrase)) continue;

    const titleChecks = tokens.map(token =>
      searchTokenForms(token).some(form => titleTokens.has(form))
    );
    const allTermsInTitle = titleChecks.every(Boolean);
    const exactTitlePhrase = hasWholePhrase(title, queryPhrase);
    const exactTaxonomyPhrase = hasWholePhrase(taxonomy, queryPhrase);
    const singleTermTaxonomyMatch = tokens.length === 1 &&
      searchTokenForms(tokens[0]).some(form => taxonomyTokens.has(form));

    // For multi-word searches, require the complete query in the product
    // identity OR as a contiguous taxonomy phrase. Never mix partial matches
    // across title and category fields.
    const isRelevant = allTermsInTitle || exactTaxonomyPhrase ||
      singleTermTaxonomyMatch;
    if (!isRelevant) continue;

    const titleMatches = titleChecks.filter(Boolean).length;
    const score = exactTitlePhrase
      ? 500 + titleMatches * 20
      : allTermsInTitle
        ? 300 + titleMatches * 15
        : exactTaxonomyPhrase
          ? 180
          : 100;
    best = Math.max(best, score);
  }
  return best;
}

$("#searchForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = $("#searchInput");
  const q = input.value.trim();
  if (!q) {
    showResults(PRODUCTS.filter(p => p.type === "trending"), "Popular Discoveries");
    return;
  }

  const button = $("#searchForm button[type='submit']");
  const previousLabel = button?.textContent;
  if (button) { button.disabled = true; button.textContent = "…"; }

  const translated = await translateSearchQuery(q);
  const queryVariants = [...new Set([q, translated])];
  const scored = PRODUCTS
    .map(product => ({ product, score: scoreProductSearch(product, queryVariants) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.product.name || "").localeCompare(String(b.product.name || "")));
  const found = scored.map(item => item.product);

  if (button) { button.disabled = false; button.textContent = previousLabel || "SEARCH"; }
  showResults(
    found,
    "Search results",
    found.length
      ? `Showing all ${found.length.toLocaleString()} relevant catalog references for “${esc(q)}”${translated.toLowerCase() !== q.toLowerCase() ? " · translated search" : ""}`
      : `No matching products were found in the currently imported partner catalog for “${esc(q)}”. Try another wording or category.`
  );
});


/* =========================================================
   VIEW ALL
   ========================================================= */

$("#viewAllBtn").addEventListener(
  "click",
  () =>
    showResults(
      PRODUCTS,
      "All Products"
    )
);


/* =========================================================
   MOBILE MENU - SAFE INITIALIZATION
   ========================================================= */

const mobileMenuButton =
  $("#mobileMenuBtn");

const mainNav =
  $("#mainNav");

if (mobileMenuButton && mainNav) {

  mobileMenuButton.addEventListener(
    "click",
    () => {

      const open =
        mainNav.classList.toggle("open");

      mobileMenuButton.setAttribute(
        "aria-expanded",
        open ? "true" : "false"
      );

    }
  );

}


/* =========================================================
   YEAR
   ========================================================= */

$("#year").textContent =
  new Date().getFullYear();


/* =========================================================
   TIKTOK DIRECT POST
   ========================================================= */

const TIKTOK_API =
  "https://zovaro.vercel.app/api/tiktok-direct-post";

const TIKTOK_STATUS_API =
  "https://zovaro.vercel.app/api/tiktok-status";

const ZOVARO_VIDEO_URL =
  "https://vendittellijob2025-byte.github.io/ZOVARO/data/tiktok-video.mp4";

const ZOVARO_PROMOTION_URL =
  "https://vendittellijob2025-byte.github.io/ZOVARO/data/promotion.json";


async function loadTikTokPromotion() {

  const response =
    await fetch(
      ZOVARO_PROMOTION_URL,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {
    throw new Error(
      "Impossibile leggere promotion.json."
    );
  }

  return response.json();
}


function getTikTokSession() {

  return sessionStorage.getItem(
    "zovaro_tiktok_session"
  );
}


function createTikTokButton() {

  const copy =
    document.querySelector(
      ".tiktok-copy"
    );

  if (!copy) {
    return;
  }

  if (
    document.getElementById(
      "zovaroTikTokShareBtn"
    )
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "zovaroTikTokShareBtn";

  button.type =
    "button";

  button.className =
    "tiktok-connect-btn";

  button.style.border =
    "0";

  button.style.cursor =
    "pointer";

  button.textContent =
    "SEND PRIVATE TEST TO TIKTOK";

  const status =
    document.createElement(
      "p"
    );

  status.id =
    "zovaroTikTokStatus";

  status.style.marginTop =
    "14px";

  status.style.fontSize =
    "12px";

  status.style.color =
    "#aaa";

  status.textContent =
    "Ready to send a private TikTok test. Public posting is not enabled yet.";

  const connectButton =
    document.querySelector(
      ".tiktok-connect-btn"
    );

  if (connectButton) {
    connectButton.after(
      button
    );
    button.after(
      status
    );
  } else {
    copy.appendChild(
      button
    );

    copy.appendChild(
      status
    );
  }

  button.addEventListener(
    "click",
    shareLatestTikTokVideo
  );
}


async function shareLatestTikTokVideo() {

  const button =
    document.getElementById(
      "zovaroTikTokShareBtn"
    );

  const status =
    document.getElementById(
      "zovaroTikTokStatus"
    );

  const setStatus =
    message => {
      if (status) {
        status.textContent =
          message;
      }
    };

  const sessionToken =
    getTikTokSession();

  if (!sessionToken) {

    setStatus(
      "Connect TikTok first, then try again."
    );

    return;
  }

  const confirmed =
    window.confirm(
      "Send the current ZOVARO video and caption to TikTok using SELF_ONLY privacy? This is a private test and will not be publicly visible."
    );

  if (!confirmed) {

    setStatus(
      "TikTok sharing cancelled."
    );

    return;
  }

  try {

    if (button) {
      button.disabled =
        true;

      button.style.opacity =
        "0.6";

      button.textContent =
        "PREPARING TIKTOK POST...";
    }

    setStatus(
      "Loading the current ZOVARO promotion..."
    );

    const promotion =
      await loadTikTokPromotion();

    const caption =
      promotion?.tiktok?.caption ||
      promotion?.content?.caption ||
      promotion?.title ||
      "ZOVARO";

    if (!caption.trim()) {
      throw new Error(
        "TikTok caption is empty."
      );
    }

    if (caption.length > 2200) {
      throw new Error(
        "TikTok caption exceeds the 2200-character limit."
      );
    }

    setStatus(
      "Initializing the TikTok Direct Post..."
    );

    const initResponse =
      await fetch(
        TIKTOK_API,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "X-ZOVARO-SESSION":
              sessionToken
          },
          body: JSON.stringify({
            consent: true,

            privacy_level:
              "SELF_ONLY",

            title:
              caption,

            video_url:
              ZOVARO_VIDEO_URL,

            disable_comment:
              false,

            disable_duet:
              false,

            disable_stitch:
              false,

            brand_content_toggle:
              false,

            brand_organic_toggle:
              false,

            is_aigc:
              false
          })
        }
      );

    const initData =
      await initResponse.json();

    if (!initResponse.ok) {

      throw new Error(
        initData?.error?.message ||
        initData?.error ||
        "TikTok Direct Post initialization failed."
      );
    }

    const publishId =
      initData?.publish_id;

    if (!publishId) {
      throw new Error(
        "TikTok did not return a publish_id."
      );
    }

    setStatus(
      "TikTok is processing the video..."
    );

    await monitorTikTokPublish(
      sessionToken,
      publishId,
      setStatus
    );

  } catch (error) {

    console.error(
      "ZOVARO TikTok share error:",
      error
    );

    setStatus(
      error.message ||
      "TikTok sharing failed."
    );

  } finally {

    if (button) {
      button.disabled =
        false;

      button.style.opacity =
        "1";

      button.textContent =
        "SEND PRIVATE TEST TO TIKTOK";
    }
  }
}


async function monitorTikTokPublish(
  sessionToken,
  publishId,
  setStatus
) {

  const maxAttempts =
    18;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          10000
        )
    );

    const response =
      await fetch(
        TIKTOK_STATUS_API,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "X-ZOVARO-SESSION":
              sessionToken
          },
          body: JSON.stringify({
            publish_id:
              publishId
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data?.error?.message ||
        data?.error ||
        "TikTok status check failed."
      );
    }

    const status =
      data?.status || "";

    if (
      status ===
      "PUBLISH_COMPLETE"
    ) {

      setStatus(
        "TikTok post completed successfully."
      );

      return;
    }

    if (
      status ===
      "FAILED"
    ) {

      throw new Error(
        data.fail_reason ||
        "TikTok processing failed."
      );
    }

    if (
      status ===
      "PROCESSING_UPLOAD"
    ) {

      setStatus(
        "TikTok is processing the video upload..."
      );

    } else if (
      status ===
      "PROCESSING_DOWNLOAD"
    ) {

      setStatus(
        "TikTok is downloading the ZOVARO video..."
      );

    } else if (
      status ===
      "SEND_TO_USER_INBOX"
    ) {

      setStatus(
        "TikTok has sent the video to the creator inbox..."
      );

    } else {

      setStatus(
        `TikTok status: ${
          status || "PROCESSING"
        }`
      );
    }
  }

  setStatus(
    "TikTok is still processing the video. Check TikTok again shortly."
  );
}


/* =========================================================
   INITIAL RENDER
   ========================================================= */

render();

createTikTokButton();
