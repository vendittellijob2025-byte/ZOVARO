(function () {
  const CATALOG_URL = "./data/catalog.json";

  function normalizeProduct(product, index) {
    const regularPrice =
      typeof product.price === "number"
        ? product.price
        : null;

    const salePrice =
      typeof product.salePrice === "number"
        ? product.salePrice
        : null;

    const hasSale =
      salePrice !== null &&
      regularPrice !== null &&
      salePrice < regularPrice;

    return {
      id: Number(product.id) || 100000 + index,

      name:
        product.title ||
        product.brand ||
        product.advertiserName ||
        "ZOVARO Offer",

      merchant:
        product.advertiserName ||
        "CJ Affiliate",

      category:
        product.category ||
        "Featured",

      price:
        hasSale
          ? salePrice
          : regularPrice,

      oldPrice:
        hasSale
          ? regularPrice
          : null,

      discount:
        product.discountPercentage != null
          ? `${Number(product.discountPercentage).toFixed(0)}%`
          : null,

      currency:
        product.currency ||
        "USD",

      image:
        product.imageLink ||
        (
          Array.isArray(product.additionalImageLinks) &&
          product.additionalImageLinks.length
            ? product.additionalImageLinks[0]
            : ""
        ),

      description:
        product.description ||
        `${product.brand ? product.brand + " — " : ""}${product.title || ""}`,

      type: "affiliate",

source:
  product.source ||
  "CJ",

network:
  product.network ||
  "CJ Affiliate",
      
      clickUrl:
  product.clickUrl ||
  product.destination ||
  "",

      destination:
        product.destination ||
        "",

      brand:
        product.brand ||
        "",

      advertiserId:
        product.advertiserId ||
        "",

      adId:
        product.adId ||
        "",

      joinedStatus:
        product.joinedStatus === true
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
          "ZOVARO CJ loader: no products available."
        );
        return;
      }

     const affiliateProducts = catalog.products
        .filter(product =>
          product &&
          (product.network === "CJ Affiliate" || product.source === "CJ") &&    
          product.joinedStatus === true &&
          typeof product.destination === "string" &&
          product.destination.trim() !== ""
        )
        .map(normalizeProduct)
        .filter(product =>
          product.image &&
          product.name
        );

      if (!cjProducts.length) {
        console.info(
          "ZOVARO CJ loader: no usable products."
        );
        return;
      }

      PRODUCTS.splice(
        0,
        PRODUCTS.length,
        ...affiliateProducts
      );

      console.info(
        `ZOVARO CJ loader: ${cjProducts.length} real products loaded.`
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
