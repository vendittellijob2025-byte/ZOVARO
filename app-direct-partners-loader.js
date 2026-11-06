(function () {
  "use strict";
  const REGISTRY_URL = "./data/direct-partners.json";
  function validHttpsUrl(value) {
    try { return new URL(String(value || "")).protocol === "https:"; }
    catch { return false; }
  }
  function loadDirectPartnerProducts() {
    return fetch(REGISTRY_URL + "?v=" + Date.now(), { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Direct Partners registry HTTP " + response.status);
        return response.json();
      })
      .then(registry => {
        if (!registry || !Array.isArray(registry.partners) || !Array.isArray(registry.products)) {
          throw new Error("Invalid Direct Partners registry.");
        }
        const activePartners = new Map(registry.partners
          .filter(partner => partner && partner.status === "active" && partner.writtenApproval === true)
          .map(partner => [String(partner.id), partner]));
        const products = registry.products.filter(product => {
          const partner = activePartners.get(String(product.partnerId || ""));
          return product && product.publicationStatus === "published" && partner &&
            product.tracking?.status === "verified" && product.assets?.imagePermission === true &&
            validHttpsUrl(product.tracking?.clickUrl) && validHttpsUrl(product.imageUrl) &&
            String(product.title || "").trim() && Number(product.price) > 0 &&
            String(product.currency || "").trim() && String(product.tracking?.conversionMethod || "").trim();
        }).map(product => ({
          id: "direct-" + String(product.id),
          name: String(product.title),
          merchant: String(activePartners.get(String(product.partnerId)).name),
          category: String(product.category || "Automotive"),
          price: Number(product.price),
          currency: String(product.currency),
          image: String(product.imageUrl),
          description: String(product.description || ""),
          type: "trending",
          source: "ZOVARO DIRECT PARTNERS",
          network: "ZOVARO DIRECT PARTNERS",
          clickUrl: String(product.tracking.clickUrl),
          destination: "",
          brand: String(product.brand || ""),
          partnerId: String(product.partnerId)
        }));
        if (!Array.isArray(window.PRODUCTS)) {
          console.warn("ZOVARO Direct Partners: PRODUCTS array not available.");
          return;
        }
        const existingIds = new Set(window.PRODUCTS.map(product => String(product.id)));
        const freshProducts = products.filter(product => !existingIds.has(String(product.id)));
        window.PRODUCTS.push(...freshProducts);
        if (freshProducts.length && typeof window.render === "function") window.render();
        console.info("ZOVARO Direct Partners: " + freshProducts.length + " approved, tracked products loaded.");
      })
      .catch(error => console.warn("ZOVARO Direct Partners loader:", error));
  }
  Promise.resolve(window.ZOVARO_CJ_READY).catch(() => undefined).then(loadDirectPartnerProducts);
})();
