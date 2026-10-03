const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

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
          ${esc(p.category)}
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

  const cats = [
    ...new Set(
      PRODUCTS.map(
        p => p.category
      )
    )
  ];

  $("#categoryGrid").innerHTML =
    cats
      .map(
        (c, i) =>
          `
          <button
            class="category"
            data-cat="${esc(c)}"
          >
            <span class="symbol">
              ${
                [
                  "◈",
                  "◌",
                  "✦",
                  "⌂",
                  "◒",
                  "◇",
                  "○",
                  "△"
                ][i % 8]
              }
            </span>

            <strong>
              ${esc(c)}
            </strong>

            <span>
              Explore ${esc(
                c.toLowerCase()
              )}
            </span>

          </button>
          `
      )
      .join("");

  $$(".category").forEach(
    el =>
      el.addEventListener(
        "click",
        () =>
          showResults(
            PRODUCTS.filter(
              p =>
                p.category ===
                el.dataset.cat
            ),
            `${el.dataset.cat} picks`
          )
      )
  );
}


function showResults(
  items,
  title = "Trending Products",
  meta = ""
) {

  $("#resultsTitle").textContent =
    title;

  $("#resultsMeta").textContent =
    meta ||
    `${items.length} product${
      items.length === 1
        ? ""
        : "s"
    } in this preview catalog`;

  $("#trendingGrid").innerHTML =
    items.length
      ? items.map(card).join("")
      : `
        <div class="empty-state">
          <strong>
            No matching products
          </strong>

          <span>
            Try another search or category.
          </span>
        </div>
      `;

  $("#dealGrid").innerHTML = "";
  $("#newGrid").innerHTML = "";

  $("#trending").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function render() {

  renderCategories();

  showResults(
    PRODUCTS.filter(
      p => p.type === "trending"
    ),
    "Trending Products"
  );

  $("#dealGrid").innerHTML =
    PRODUCTS
      .filter(p => p.discount)
      .map(card)
      .join("");

  $("#newGrid").innerHTML =
    PRODUCTS
      .filter(p => p.type === "new")
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
    p.clickUrl ||
    p.destination ||
    "#";

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
   MOBILE MENU
   ========================================================= */

$("#mobileMenuBtn").addEventListener(
  "click",
  () => {

    const open =
      $("#mainNav").classList.toggle(
        "open"
      );

    $("#mobileMenuBtn").setAttribute(
      "aria-expanded",
      open
        ? "true"
        : "false"
    );
  }
);


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
    "SHARE VIDEO TO TIKTOK";

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
    "Ready to share the latest ZOVARO video.";

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
      "Authorize ZOVARO to send the current promotional video and its prepared caption to your TikTok account?"
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
        "SHARE VIDEO TO TIKTOK";
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
