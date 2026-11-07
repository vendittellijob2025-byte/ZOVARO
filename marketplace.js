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
    for (const name of ["publicContact","sellerDeclaration","ownershipDeclaration","employerDeclaration"]) {
      const control = form.querySelector('input[name="' + name + '"]');
      if (control) payload[name] = control.checked;
    }
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
      if (status) {
        status.textContent = result.message || "Submitted for screening.";
        if (result.status === "rejected" && result.id) {
          const appeal = document.createElement("button");
          appeal.type = "button";
          appeal.className = "marketplace-report";
          appeal.textContent = "APPEAL THIS DECISION";
          appeal.addEventListener("click", async () => {
            const email = window.prompt("Contact email for your appeal:");
            if (!email) return;
            const details = window.prompt("Explain why this listing should be reconsidered (at least 15 characters):");
            if (!details || details.trim().length < 15) return;
            appeal.disabled = true;
            try {
              const r = await fetch(API, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"appeal",id:result.id,email,reason:"Automated moderation appeal",details})});
              const d = await r.json();
              if (!r.ok) throw new Error(d.error || "Appeal failed.");
              appeal.textContent = "APPEAL SENT";
            } catch (e) { window.alert(e.message); appeal.disabled = false; }
          });
          status.appendChild(document.createTextNode(" "));
          status.appendChild(appeal);
        }
      }
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

  function renderListings(container, items, type, append = false) {
    if (!append) container.replaceChildren();
    for (const item of items) {
      const card = document.createElement("article");
      card.className = type === "product" ? "marketplace-listing used-listing" : "marketplace-listing";
      if (type === "product") card.dataset.category = item.category || "Other";
      addText(card, "span", "marketplace-kicker", type === "job" ? [item.workplace, item.jobType].filter(Boolean).join(" · ") : [item.category, item.condition].filter(Boolean).join(" · "));
      if (item.imageUrl) {
        const image = document.createElement("img");
        image.src = item.imageUrl;
        image.alt = item.title || "Product listing image";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.className = "marketplace-product-image";
        card.appendChild(image);
      }
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
      const report = document.createElement("button");
      report.type = "button";
      report.className = "marketplace-report";
      report.textContent = "REPORT LISTING";
      report.addEventListener("click", async () => {
        const email = window.prompt("Your contact email for the report:");
        if (!email) return;
        const reason = window.prompt("Reason (e.g. suspected scam, prohibited item, counterfeit):") || "Safety concern";
        const details = window.prompt("Please explain the concern (at least 15 characters):");
        if (!details || details.trim().length < 15) return;
        report.disabled = true;
        try {
          const response = await fetch(API, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"report",id:item.id,email,reason,details})});
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Report failed.");
          report.textContent = "REPORT SENT";
        } catch (error) { window.alert(error.message); report.disabled = false; }
      });
      card.appendChild(report);
      container.appendChild(card);
    }
  }

  const cursors = { job: null, product: null };
  const loadedCounts = { job: 0, product: 0 };

  async function loadListings(type, append = false) {
    const container = type === "job" ? $("jobListings") : $("usedListingGrid");
    const empty = type === "job" ? $("jobListingsEmpty") : $("usedEmptyState");
    if (!container) return [];
    try {
      const query = new URLSearchParams({type});
      if (append && cursors[type]) query.set("cursor", cursors[type]);
      const response = await fetch(API + "?" + query.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load listings.");
      const items = Array.isArray(data) ? data : [];
      renderListings(container, items, type, append);
      loadedCounts[type] += items.length;
      cursors[type] = response.headers.get("X-Zovaro-Next-Cursor") || null;
      const moreButton = $(type === "job" ? "jobLoadMore" : "usedLoadMore");
      if (moreButton) moreButton.classList.toggle("hidden", !cursors[type]);
      if (empty) empty.classList.toggle("hidden", loadedCounts[type] > 0);
      if (type === "product" && typeof window.filterUsedListings === "function") window.filterUsedListings();
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
  $("jobLoadMore")?.addEventListener("click", () => loadListings("job", true));
  $("usedLoadMore")?.addEventListener("click", () => loadListings("product", true));
  $("jobSearchInput")?.addEventListener("input", filterJobs);

  loadListings("job");
  loadListings("product");
})();
