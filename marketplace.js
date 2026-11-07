(() => {
  const API = "/api/marketplace";
  const $ = id => document.getElementById(id);

  function formObject(form) {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  }

  async function submitListing(form, type, statusId, buttonLabel) {
    const status = $(statusId);
    const button = form.querySelector('button[type="submit"]');
    if (!form.reportValidity()) return;
    const payload = formObject(form);
    payload.type = type;
    payload.publicContact = form.querySelector('input[name="publicContact"]')?.checked === true;
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (button) { button.disabled = true; button.textContent = "SENDING…"; }
    if (status) status.textContent = "Sending your listing securely…";
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed.");
      form.reset();
      if (status) status.textContent = result.message || "Submitted for review.";
    } catch (error) {
      if (status) status.textContent = error.message || "Unable to submit. Please try again.";
    } finally {
      if (button) { button.disabled = false; button.textContent = buttonLabel; }
    }
  }

  function addText(parent, tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value || "";
    parent.appendChild(el);
    return el;
  }

  function renderListings(container, items, type) {
    container.replaceChildren();
    for (const item of items) {
      const card = document.createElement("article");
      card.className = "marketplace-listing";
      addText(card, "span", "marketplace-kicker", type === "job" ? [item.workplace, item.jobType].filter(Boolean).join(" · ") : [item.category, item.condition].filter(Boolean).join(" · "));
      addText(card, "h3", "", item.title);
      if (item.company) addText(card, "p", "marketplace-company", item.company);
      if (item.price != null) addText(card, "p", "marketplace-price", new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency || "USD" }).format(Number(item.price)));
      addText(card, "p", "marketplace-location", item.location);
      addText(card, "p", "marketplace-description", item.description);
      if (item.contactEmail) {
        const link = document.createElement("a");
        link.className = "marketplace-contact";
        link.href = "mailto:" + item.contactEmail;
        link.textContent = type === "job" ? "CONTACT EMPLOYER" : "CONTACT SELLER";
        card.appendChild(link);
      }
      container.appendChild(card);
    }
  }

  async function loadListings(type) {
    const container = type === "job" ? $("jobListings") : $("usedListingGrid");
    const empty = type === "job" ? $("jobListingsEmpty") : $("usedEmptyState");
    if (!container) return [];
    try {
      const response = await fetch(API + "?type=" + encodeURIComponent(type), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load listings.");
      const items = Array.isArray(data) ? data : [];
      renderListings(container, items, type);
      if (empty) empty.classList.toggle("hidden", items.length > 0);
      return items;
    } catch (error) {
      if (empty) { empty.classList.remove("hidden"); empty.textContent = "Listings are temporarily unavailable. Please try again later."; }
      return [];
    }
  }

  function filterJobs() {
    const query = ($("jobSearchInput")?.value || "").trim().toLowerCase();
    const cards = $("jobListings")?.querySelectorAll(".marketplace-listing") || [];
    let visible = 0;
    cards.forEach(card => {
      const show = !query || card.textContent.toLowerCase().includes(query);
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    const empty = $("jobListingsEmpty");
    if (empty && cards.length) {
      empty.textContent = visible ? "" : "No jobs match your search.";
      empty.classList.toggle("hidden", visible > 0);
    }
  }

  $("productListingForm")?.addEventListener("submit", event => {
    event.preventDefault();
    submitListing(event.currentTarget, "product", "productFormStatus", "SUBMIT FOR REVIEW");
  });
  $("jobListingForm")?.addEventListener("submit", event => {
    event.preventDefault();
    submitListing(event.currentTarget, "job", "jobFormStatus", "SUBMIT JOB FOR REVIEW");
  });
  $("jobSearchButton")?.addEventListener("click", filterJobs);
  $("jobSearchInput")?.addEventListener("input", filterJobs);

  loadListings("job");
  loadListings("product");
})();
