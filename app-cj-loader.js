(function () {
  const CATALOG_URL = "./data/catalog.json";

  function normalizeProduct(product, index) {
    const numericId = Number(product.id);

    return {
      id: Number.isFinite(numericId) ? numericId : 100000 + index,
      name: product.title || "ZOVARO Product",
      merchant: product.advertiserId
        ? `CJ Advertiser ${product.advertiserId}`
        : "CJ Affiliate",
      category: "Featured",
      price: Number(product.price) || 0,
      oldPrice: null,
      discount: null,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
      description:
        product.description || "Product available through an approved ZOVARO merchant.",
      type: "trending",
      clickUrl: product.clickUrl || ""
    };
  }

  async function loadCJCatalog() {
    try {
      const response = await fetch(`${CATALOG_URL}?v=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Catalog request failed: ${response.status}`);
      }

      const catalog = await response.json();

      if (
        !catalog ||
        !Array.isArray(catalog.products) ||
        catalog.products.length === 0
      ) {
        console.info(
          "ZOVARO CJ loader: no monetizable CJ products available yet."
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

      PRODUCTS.splice(0, PRODUCTS.length, ...cjProducts);

      console.info(
        `ZOVARO CJ loader: ${cjProducts.length} monetizable products loaded.`
      );

      if (typeof render === "function") {
        render();
      }
    } catch (error) {
      console.warn("ZOVARO CJ loader:", error);
    }
  }

  loadCJCatalog();
})();
