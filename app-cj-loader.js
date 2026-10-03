(function () {
  const CATALOG_URL = "./data/catalog.json";

  function normalizeProduct(product, index) {
    const regularPrice =
      typeof product.price === "number" &&
      Number.isFinite(product.price) &&
      product.price > 0
        ? product.price
        : null;

    const salePrice =
      typeof product.salePrice === "number" &&
      Number.isFinite(product.salePrice) &&
      product.salePrice > 0
        ? product.salePrice
        : null;

    const hasSale =
      salePrice !== null &&
      regularPrice !== null &&
      salePrice < regularPrice;

    const englishTitle =
      typeof product.englishTitle === "string"
        ? product.englishTitle.trim()
        : "";

    const englishDescription =
      typeof product.englishDescription === "string"
        ? product.englishDescription.trim()
        : "";

    const englishCategory =
      typeof product.englishCategory === "string"
        ? product.englishCategory.trim()
        : "";

    return {
      id:
        Number(product.id) ||
        100000 + index,

      name:
        englishTitle,

      merchant:
        product.advertiserName ||
        "CJ Affiliate",

      category:
        englishCategory,

      price:
        hasSale
          ? salePrice
          : regularPrice,

      oldPrice:
        hasSale
          ? regularPrice
          : null,

      discount:
        hasSale &&
        product.discountPercentage != null &&
        Number.isFinite(
          Number(product.discountPercentage)
        ) &&
        Number(product.discountPercentage) > 0
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
        englishDescription,

      type:
        "affiliate",

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

  async function loadAffiliateCatalog() {
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

      const catalog =
        await response.json();

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

      const ENABLED_NETWORKS =
        Array.isArray(catalog.sources)
          ? catalog.sources
              .filter(
                source =>
                  source.status === "active"
              )
              .map(
                source =>
                  source.network
              )
          : [];

      const affiliateProducts =
        catalog.products
          .filter(product => {
            if (
              !product ||
              !ENABLED_NETWORKS.includes(
                product.network
              ) ||
              product.joinedStatus !== true ||
              typeof product.destination !== "string" ||
              product.destination.trim() === ""
            ) {
              return false;
            }

            const hasEnglishTitle =
              typeof product.englishTitle === "string" &&
              product.englishTitle.trim() !== "";

            const hasEnglishDescription =
              typeof product.englishDescription === "string" &&
              product.englishDescription.trim() !== "";

            const hasEnglishCategory =
              typeof product.englishCategory === "string" &&
              product.englishCategory.trim() !== "";

            return (
              hasEnglishTitle &&
              hasEnglishDescription &&
              hasEnglishCategory
            );
          })
          .map(normalizeProduct)
          .filter(product =>
            product.image &&
            product.name &&
            product.category &&
            product.description
          );

      if (!affiliateProducts.length) {
        console.info(
          "ZOVARO CJ loader: no usable English products."
        );
        return;
      }

      PRODUCTS.splice(
        0,
        PRODUCTS.length,
        ...affiliateProducts
      );

      console.info(
        `ZOVARO affiliate loader: ${affiliateProducts.length} real English products loaded.`
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

  loadAffiliateCatalog();
})();
