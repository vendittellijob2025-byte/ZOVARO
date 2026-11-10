
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const PRODUCT_PAGE_SIZE = 36;
let activeResults = [];
let activeResultsPage = 1;
let activeResultsTitle = "Trending Products";
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


function renderCategories() {
  const products = PRODUCTS || [];
  const tree = Array.isArray(window.ZOVARO_CATEGORY_TREE) ? window.ZOVARO_CATEGORY_TREE : [];
  const categories = [
    ...new Set([
      ...tree.map(item => item.name),
      ...products.map(product => categoryLabel(product.category)).filter(Boolean)
    ])
  ].sort((a,b) => a.localeCompare(b,"en",{sensitivity:"base"}));

  const productCount = items => items.length;
  const categoryProducts = category => products.filter(p => categoryLabel(p.category) === category);
  const renderLevel = (category, nodes, parentPath = "", level = 0) => {
    const matching = categoryProducts(category);
    const html = nodes.map(node => {
      const name = typeof node === "string" ? node : node.name;
      const path = parentPath ? parentPath + " > " + name : name;
      const children = typeof node === "string" ? [] : (node.children || []);
      const selected = matching.filter(p => {
        const sub = String(p.subcategory || "").trim();
        return sub === path || sub.startsWith(path + " >");
      });
      const count = selected.length;
      return `
        <div class="category-node">
          <button type="button" class="category" data-tree-path="${esc(path)}" data-tree-level="${level}">
            <strong>${esc(name)}</strong>
            <span class="category-count">${count} products</span>
          </button>
          ${selected.length ? `<button type="button" class="category-products" data-tree-products="${esc(path)}">View products (${count}) →</button>` : ""}
          ${children.length ? `<button type="button" class="category-browse" data-tree-browse="${esc(path)}">Open subcategories →</button>` : ""}
        </div>`;
    }).join("");
    const parentProducts = parentPath
      ? matching.filter(p => {
          const sub = String(p.subcategory || "").trim();
          return sub === parentPath || sub.startsWith(parentPath + " >");
        })
      : matching;
    const unclassifiedProducts = matching.filter(p => {
      const sub = String(p.subcategory || "").trim();
      return !sub || sub === "Other";
    });
    $("#categoryGrid").innerHTML = `
      <button type="button" class="category category-back" data-tree-back="${level}"><strong>← Back</strong></button>
      <button type="button" class="category" data-tree-all="${esc(parentPath || category)}">
        <strong>${parentPath ? "All products in this department" : "All products in this category"}</strong>
        <span class="category-count">${productCount(parentProducts)} products</span>
      </button>
      ${unclassifiedProducts.length ? `
        <button type="button" class="category" data-tree-unclassified="${esc(category)}">
          <strong>Other / More products</strong>
          <span class="category-count">${productCount(unclassifiedProducts)} products</span>
        </button>` : ""}
      ${html || '<p class="category-empty">No subcategories available yet.</p>'}
    `;
    $$("[data-tree-back]").forEach(el => el.addEventListener("click", () => {
      if (level === 0) renderCategories();
      else {
        const parts = parentPath.split(" > ");
        const parent = parts.slice(0,-1).join(" > ");
        const categoryNode = tree.find(item => item.name === category);
        let nodes = categoryNode?.children || [];
        for (const part of parts.slice(0,-1)) {
          const found = nodes.find(item => (typeof item === "string" ? item : item.name) === part);
          nodes = typeof found === "string" || !found ? [] : (found.children || []);
        }
        renderLevel(category, nodes, parent, level - 1);
      }
    }));
    $("[data-tree-all]").forEach(el => el.addEventListener("click", () =>
      showResults(parentProducts, parentPath ? `${category} · ${parentPath}` : `${category} · All products`)));
    $("[data-tree-unclassified]").forEach(el => el.addEventListener("click", () =>
      showResults(unclassifiedProducts, `${category} · Other / More products`)));
    $$("[data-tree-path]").forEach(el => el.addEventListener("click", () => {
      const path = el.dataset.treePath;
      const node = nodes.find(item => (typeof item === "string" ? item : item.name) === path.split(" > ").at(-1));
      const children = typeof node === "string" || !node ? [] : (node.children || []);
      const selected = matching.filter(p => {
        const sub = String(p.subcategory || "").trim();
        return sub === path || sub.startsWith(path + " >");
      });
      if (children.length) {
        renderLevel(category, children, path, level + 1);
      } else {
        showResults(selected, `${category} · ${path}`);
      }
    }));
    $("#categoryGrid [data-tree-browse]").forEach(el => el.addEventListener("click", () => {
      const path = el.dataset.treeBrowse;
      const node = nodes.find(item => (typeof item === "string" ? item : item.name) === path.split(" > ").at(-1));
      const children = typeof node === "string" || !node ? [] : (node.children || []);
      if (children.length) renderLevel(category, children, path, level + 1);
    }));
    $("#categoryGrid [data-tree-products]").forEach(el => el.addEventListener("click", () => {
      const path = el.dataset.treeProducts;
      const selected = matching.filter(p => {
        const sub = String(p.subcategory || "").trim();
        return sub === path || sub.startsWith(path + " >");
      });
      showResults(selected, `${category} · ${path}`);
    }));
  };

  $("#categoryGrid").innerHTML = categories.map(category => {
    const count = categoryProducts(category).length;
    return `
      <button type="button" class="category" data-root-category="${esc(category)}">
        <strong>${esc(category)}</strong>
        <span class="category-count">${count} products</span>
      </button>`;
  }).join("");
  $$("[data-root-category]").forEach(el => el.addEventListener("click", () => {
    const category = el.dataset.rootCategory;
    const node = tree.find(item => item.name === category);
    if (node?.children?.length) renderLevel(category, node.children, "", 0);
    else showResults(categoryProducts(category), `${category} picks`);
  }));
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
  title = "Trending Products",
  meta = ""
) {
  activeResults = Array.isArray(items) ? items : [];
  activeResultsPage = 1;
  activeResultsTitle = title;
  activeResultsMeta = meta;

  $("#resultsTitle").textContent = activeResultsTitle;
  renderResultPage(false);

  $("#dealGrid").innerHTML = "";
  $("#newGrid").innerHTML = "";
  const staleDealsButton = $("#viewAllDealsButton");
  if (staleDealsButton) staleDealsButton.remove();

  $("#trending").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function render() {
  renderCategories();

  showResults(
    PRODUCTS.filter(p => p.type === "trending"),
    "Trending Products"
  );

  const deals = PRODUCTS.filter(p => p.discount);
  $("#dealGrid").innerHTML = deals
    .slice(0, PRODUCT_PAGE_SIZE)
    .map(card)
    .join("");

  if (deals.length > PRODUCT_PAGE_SIZE) {
    const moreDeals = document.createElement("button");
    moreDeals.id = "viewAllDealsButton";
    moreDeals.type = "button";
    moreDeals.className = "text-btn";
    moreDeals.style.display = "block";
    moreDeals.style.margin = "24px auto 0";
    moreDeals.textContent = `View all ${deals.length.toLocaleString()} deals`;
    moreDeals.addEventListener("click", () => showResults(deals, "Best Deals"));
    $("#dealGrid").after(moreDeals);
  }

  const newArrivals = PRODUCTS.filter(p => p.type === "new");
  $("#newGrid").innerHTML = newArrivals
    .slice(0, PRODUCT_PAGE_SIZE)
    .map(card)
    .join("");
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

$("#searchForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const q =
      $("#searchInput")
        .value
        .trim()
        .toLowerCase();

    if (!q) {

      showResults(
        PRODUCTS.filter(
          p =>
            p.type ===
            "trending"
        ),
        "Trending Products"
      );

      return;
    }

    const found =
      PRODUCTS.filter(
        p =>
          `
          ${p.name}
          ${p.category}
          ${p.merchant}
          ${p.description}
          `
            .toLowerCase()
            .includes(q)
      );

    showResults(
      found,
      "Search results",
      `Showing ${
        found.length
      } match${
        found.length === 1
          ? ""
          : "es"
      } for “${esc(q)}”`
    );
  }
);


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
