(function () {
  "use strict";

  const CATALOG_URL = "./data/catalog.json";
  const CATEGORY_TREE_URL = "./data/category-tree.json";

  function normalizeProduct(product, index) {
    const regularPrice = Number(product.price);
    const salePrice = Number(product.salePrice);
    const hasRegularPrice = Number.isFinite(regularPrice) && regularPrice > 0;
    const hasSalePrice = Number.isFinite(salePrice) && salePrice > 0;
    const hasSale = hasRegularPrice && hasSalePrice && salePrice < regularPrice;
    const title = product.englishTitle || product.title || product.brand || product.advertiserName || "ZOVARO Offer";
    const rawCategory = product.englishCategory || product.category || "Other";
    const category = String(rawCategory).trim().toLowerCase() === "other" ? "Unclassified" : rawCategory;
    return {
      id: product.id != null && String(product.id).trim() ? String(product.id) : "affiliate-" + index,
      name: title,
      merchant: product.advertiserName || "CJ Affiliate",
      category,
      subcategory: product.englishSubcategory || product.subcategory || "Other",
      price: hasSale ? salePrice : hasRegularPrice ? regularPrice : null,
      oldPrice: hasSale ? regularPrice : null,
      discount: hasSale
        ? (product.discountPercentage != null
            ? String(Math.round(Number(product.discountPercentage))) + "%"
            : String(Math.round(((regularPrice - salePrice) / regularPrice) * 100)) + "%")
        : null,
      currency: product.currency || "USD",
      image: product.imageLink || (Array.isArray(product.additionalImageLinks) ? product.additionalImageLinks[0] || "" : ""),
      description: product.englishDescription || product.description || (product.brand ? product.brand + " — " : "") + title,
      type: "trending",
      source: product.source || "CJ",
      network: product.network || "CJ Affiliate",
      clickUrl: product.clickUrl || "",
      destination: product.destination || "",
      brand: product.brand || "",
      advertiserId: product.advertiserId || "",
      adId: product.adId || "",
      joinedStatus: product.joinedStatus === true
    };
  }

  function setStatus(message) {
    window.ZOVARO_CATALOG_STATUS = message;
    const status = document.getElementById("shopCatalogStatus");
    if (status) status.textContent = message;
  }

  function renderStorefront() {
    if (typeof window.render === "function") window.render();
    else if (typeof render === "function") render();
  }

  async function loadAffiliateCatalog() {
    let loaded = 0;
    try {
      try {
        const treeResponse = await fetch(CATEGORY_TREE_URL, { cache: "no-cache" });
        if (treeResponse.ok) {
          const categoryTree = await treeResponse.json();
          window.ZOVARO_CATEGORY_TREE = Array.isArray(categoryTree.categories) ? categoryTree.categories : [];
          // The taxonomy must remain navigable even if the product feed is delayed or unavailable.
          renderStorefront();
        } else {
          console.warn("ZOVARO category tree request failed:", treeResponse.status);
        }
      } catch (treeError) {
        console.warn("ZOVARO category tree:", treeError);
      }

      const response = await fetch(CATALOG_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error("Catalog request failed: " + response.status);
      const catalog = await response.json();
      if (!catalog || !Array.isArray(catalog.products)) {
        throw new Error("Catalog response does not contain a products array.");
      }

      const activeNetworks = new Set(
        (Array.isArray(catalog.sources) ? catalog.sources : [])
          .filter(source => source && source.status === "active")
          .map(source => String(source.network || "").trim())
          .filter(Boolean)
      );

      const eligible = catalog.products.filter(product => {
        if (!product || typeof product !== "object" || product.joinedStatus !== true) return false;
        const isCj = product.source === "CJ" || product.network === "CJ Affiliate";
        if (!isCj && !activeNetworks.has(String(product.network || ""))) return false;
        const title = product.englishTitle || product.title;
        const category = product.englishCategory || product.category;
        return typeof title === "string" && title.trim() &&
          typeof category === "string" && category.trim() &&
          typeof product.clickUrl === "string" && product.clickUrl.trim().startsWith("https://");
      });

      // Keep eligible unclassified inventory searchable by its actual product title.
      // It remains outside curated category navigation until taxonomy is corrected.
      const unclassifiedCount = eligible.filter(product =>
        String(product.englishCategory || product.category || "").trim().toLowerCase() === "other"
      ).length;

      const affiliateProducts = eligible
        .map(normalizeProduct)
        .filter(product => {
          if (!product.name || !product.category || !product.image || product.price === null) return false;
          try {
            return new URL(product.image).protocol === "https:";
          } catch {
            return false;
          }
        });

      if (affiliateProducts.length) {
        PRODUCTS.splice(0, PRODUCTS.length, ...affiliateProducts);
        loaded = affiliateProducts.length;
        setStatus(loaded.toLocaleString() + " verified affiliate products searchable." + (unclassifiedCount ? " · " + unclassifiedCount.toLocaleString() + " searchable items await category classification." : ""));
      } else {
        setStatus("Product feed loaded, but no items passed the affiliate, image and price checks. Categories remain available.");
        console.warn("ZOVARO CJ loader: catalog contained no eligible products.", {
          sourceCount: Array.isArray(catalog.sources) ? catalog.sources.length : 0,
          catalogProductCount: catalog.products.length,
          activeNetworks: [...activeNetworks]
        });
      }

      renderStorefront();
      console.info("ZOVARO affiliate loader:", loaded + " real products loaded.");
    } catch (error) {
      setStatus("The product feed could not be loaded. Categories remain available; please retry shortly.");
      console.warn("ZOVARO CJ loader:", error);
      renderStorefront();
    }
    return loaded;
  }

  window.ZOVARO_CJ_READY = loadAffiliateCatalog();
})();