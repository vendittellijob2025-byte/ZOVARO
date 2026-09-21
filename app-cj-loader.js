(function () {
  const CATALOG_URL = "./data/catalog.json";

  const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

  function normalizeProduct(product, index) {
    const numericId = Number(product.id);

    const isKaiya = product.advertiserId === "8022425";
    const isPadel = product.advertiserId === "7969352";

    let category = product.category || "Featured";

    if (isKaiya) {
      category = "Babies";
    }

    if (isPadel) {
      category = "Sports";
    }

    return {
      id: Number.isFinite(numericId) ? numericId : 100000 + index,

      name:
        product.title ||
        product.advertiserName ||
        "ZOVARO Offer",

      merchant:
        product.advertiserName ||
        "CJ Affiliate",

      category,

      price: null,

      oldPrice: null,

      discount: null,

      image: DEFAULT_IMAGE,

      description:
        product.description ||
        `Featured offer from ${product.advertiserName || "a CJ merchant"}.`,

      type: "trending",

      clickUrl: product.clickUrl || "",

      destination: product.destination || "",

      saleCommission:
        product.saleCommission || "",

      allowDeepLinking:
        product.allowDeepLinking === true
    };
  }

  async function loadCJCatalog() {
    try {
      const response = await fetch(
        `${CATALOG_URL}?v=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `Catalog request failed: ${response.status}`
        );
      }

      const catalog = await response.json();

      if (
        !catalog ||
        !Array.isArray(catalog.products) ||
        catalog.products.length === 0
      ) {
        console.info(
          "ZOVARO CJ loader: no monetizable CJ offers available yet."
        );
        return;
      }

      const cjProducts = catalog.products
        .filter(
          product =>
            product &&
            typeof product.clickUrl === "string" &&
            product.clickUrl.trim() !== ""
        )
        .map(normalizeProduct);

      if (!cjProducts.length) {
        console.info(
          "ZOVARO CJ loader: catalog contains no usable affiliate clickUrl."
        );
        return;
      }

      PRODUCTS.splice(
        0,
        PRODUCTS.length,
        ...cjProducts
      );

      console.info(
        `ZOVARO CJ loader: ${cjProducts.length} monetizable offers loaded.`
      );

      if (typeof render === "function") {
        render();
      }
    } catch (error) {
      console.warn(
        "ZOVARO CJ loader:",
        error
      );
    }
  }

  loadCJCatalog();
})();
