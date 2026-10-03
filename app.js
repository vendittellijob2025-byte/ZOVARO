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
  viene intercettato, compresi:

  - immagine
  - testo
  - titolo
  - categoria
  - merchant
  - prezzo
  - sconto
  - badge
  - qualsiasi altro elemento interno
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
              ${[
                "◈",
                "◌",
                "✦",
                "⌂",
                "◒",
                "◇",
                "○",
                "△"
              ][i % 8]}
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
   INITIAL RENDER
   ========================================================= */

render();
