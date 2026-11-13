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
      if (type === "job") {
        card.dataset.jobCard = "true";
        card.dataset.jobId = item.id || "";
      }
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
      if (item.sellerDisplayName) addText(card, "p", "marketplace-company", item.sellerDisplayName + (item.sellerCountry ? " · " + item.sellerCountry : ""));
      if (item.companyWebsite) {
        const site = document.createElement("a");
        site.href = item.companyWebsite;
        site.target = "_blank";
        site.rel = "noopener noreferrer";
        site.className = "marketplace-company";
        site.textContent = "OFFICIAL COMPANY WEBSITE";
        card.appendChild(site);
      }
      if (item.price != null) addText(card, "p", "marketplace-price", new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency || "USD" }).format(Number(item.price)));
      addText(card, "p", "marketplace-location", item.location);
      if (type === "job") {
        const salary = item.salaryText ? " · " + item.salaryText : "";
        if (salary) addText(card, "p", "marketplace-price", salary);
        const details = document.createElement("button");
        details.type = "button";
        details.className = "job-open-details";
        details.textContent = "VIEW FULL JOB DETAILS";
        details.addEventListener("click", () => openJobDetail(item));
        card.appendChild(details);
        card.addEventListener("click", event => {
          if (event.target === card || event.target.tagName === "H3") openJobDetail(item);
        });
      } else {
        addText(card, "p", "marketplace-description", item.description);
      }
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


  const jobItems = [];
  const countrySelect = $("jobCountryFilter");
  const regionSelect = $("jobRegionFilter");
  const citySelect = $("jobCityFilter");

  function uniqueSorted(values) {
    return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  }
  function setOptions(select, values, placeholder) {
    if (!select) return;
    const current = select.value;
    select.replaceChildren(new Option(placeholder, ""));
    uniqueSorted(values).forEach(value => select.add(new Option(value, value)));
    select.value = values.includes(current) ? current : "";
  }
  async function loadWorldCountries() {
    if (!countrySelect) return;
    try {
      const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2", { cache: "force-cache" });
      if (!response.ok) throw new Error("Country directory unavailable");
      const countries = await response.json();
      const names = countries.map(item => item?.name?.common).filter(Boolean).sort((a,b)=>a.localeCompare(b));
      const current = countrySelect.value;
      countrySelect.replaceChildren(new Option("All countries", ""));
      countrySelect.add(new Option("Remote / Worldwide", "Remote / Worldwide"));
      names.forEach(name => countrySelect.add(new Option(name, name)));
      countrySelect.value = names.includes(current) || current === "Remote / Worldwide" ? current : "";
    } catch {
      // The portal remains usable with countries found in available listings.
      setOptions(countrySelect, [...jobItems.map(x=>x.country), "Remote / Worldwide"], "All countries");
    }
  }

  function refreshJobGeography() {
    if (!countrySelect) return;
    setOptions(countrySelect, jobItems.map(x => x.country), "All countries");
    const country = countrySelect.value;
    const scoped = jobItems.filter(x => !country || x.country === country);
    setOptions(regionSelect, scoped.map(x => x.region), "All regions / states");
    regionSelect.disabled = !country || !scoped.some(x => x.region);
    const region = regionSelect.value;
    const cityScope = scoped.filter(x => !region || x.region === region);
    setOptions(citySelect, cityScope.map(x => x.city), "All cities");
    citySelect.disabled = !region || !cityScope.some(x => x.city);
  }
  function selectedJobItems() {
    const country = countrySelect?.value || "";
    const region = regionSelect?.value || "";
    const city = citySelect?.value || "";
    const q = ($("jobSearchInput")?.value || "").trim().toLowerCase();
    return jobItems.filter(item =>
      (!country || item.country === country) &&
      (!region || item.region === region) &&
      (!city || item.city === city) &&
      (!q || [item.title,item.company,item.location,item.description,item.country,item.region,item.city].join(" ").toLowerCase().includes(q))
    );
  }
  function applyJobFilters() {
    const selected = selectedJobItems();
    const cards = $("jobListings")?.querySelectorAll('[data-job-card="true"]') || [];
    const visibleIds = new Set(selected.map(x => x.id));
    cards.forEach(card => card.classList.toggle("hidden", !visibleIds.has(card.dataset.jobId)));
    const meta = $("jobResultsMeta");
    if (meta) meta.textContent = selected.length + " matching opportunities in the currently loaded results.";
    const empty = $("jobListingsEmpty");
    if (empty) {
      empty.textContent = selected.length ? "" : "No jobs match these filters. Try another location or search term.";
      empty.classList.toggle("hidden", selected.length > 0);
    }
  }
  const fxRates = new Map();
  function parseSalaryCurrency(text) {
    const value = String(text || "");
    const upper = value.toUpperCase();
    const codes = ["USD","EUR","GBP","CHF","CAD","AUD","NZD","INR","BRL","COP","MXN","PLN","SEK","NOK","DKK","JPY","CNY","SGD","HKD","ZAR","AED","TRY","CZK","HUF","RON","THB","IDR","MYR","PHP","ILS","KRW"];
    const explicit = codes.find(code => new RegExp("\\b" + code + "\\b").test(upper));
    if (explicit) return explicit;
    if (value.includes("€")) return "EUR";
    if (value.includes("£")) return "GBP";
    if (value.includes("₹")) return "INR";
    if (value.includes("R$")) return "BRL";
    if (value.includes("zł")) return "PLN";
    if (value.includes("₩")) return "KRW";
    if (value.includes("₺")) return "TRY";
    if (value.includes("د.إ")) return "AED";
    if (value.includes("$")) return null; // $ alone is ambiguous (USD, CAD, AUD, etc.).
    return null;
  }
  function parseSalaryNumbers(text) {
    const matches = [...String(text || "").matchAll(/\\d[\\d., ]*/g)].map(match => match[0].trim()).filter(Boolean);
    return matches.slice(0,2).map(raw => {
      let value = raw.replace(/ /g,"");
      const lastComma=value.lastIndexOf(","),lastDot=value.lastIndexOf(".");
      if(lastComma>=0&&lastDot>=0){
        const decimal=lastComma>lastDot?",":".";
        value=value.replace(/[.,]/g,"");
        const decimals=raw.slice(Math.max(lastComma,lastDot)+1).replace(/\\D/g,"");
        value=value.slice(0,-decimals.length)+"."+decimals;
      } else if(lastComma>=0||lastDot>=0){
        const sep=lastComma>=0?",":".",parts=value.split(sep);
        if(parts.length===2&&parts[1].length!==3) value=parts[0]+"."+parts[1];
        else value=parts.join("");
      }
      const number=Number(value);
      return Number.isFinite(number)?number:null;
    }).filter(value=>value!==null);
  }
  async function salaryUsd(text) {
    const currency=parseSalaryCurrency(text);
    if(!currency) return null;
    const numbers=parseSalaryNumbers(text);
    if(!numbers.length) return null;
    if(currency==="USD") return {text:numbers.map(n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n)).join(" – "),date:null,original:text};
    try {
      let data=fxRates.get(currency);
      if(!data){
        const response=await fetch("https://api.frankfurter.dev/v2/rate/"+currency.toLowerCase()+"/usd");
        if(!response.ok) return null;
        data=await response.json();fxRates.set(currency,data);
      }
      return {text:numbers.map(n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n*data.rate)).join(" – "),date:data.date,original:text};
    } catch { return null; }
  }

  function openJobDetail(item) {
    const panel = $("jobDetailPanel");
    if (!panel) return;
    $("jobDetailTitle").textContent = item.title || "Job opportunity";
    $("jobDetailCompany").textContent = [item.company, item.location].filter(Boolean).join(" · ");
    const meta = $("jobDetailMeta");
    meta.replaceChildren();
    const entries = [
      ["Country",item.country],["Region / State",item.region],["City",item.city],
      ["Employment type",item.jobType],["Workplace",item.workplace],
      ["Compensation",item.salaryText],["Published / verified",item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : ""]
    ];
    entries.filter(x=>x[1]).forEach(([label,value])=>{
      const cell=document.createElement("div"),strong=document.createElement("strong"),span=document.createElement("span");
      strong.textContent=label;span.textContent=value;cell.append(strong,span);meta.appendChild(cell);
    });
    if(item.salaryText){
      salaryUsd(item.salaryText).then(converted=>{
        if(!converted || !panel.classList.contains("open")) return;
        const cell=document.createElement("div"),strong=document.createElement("strong"),span=document.createElement("span");
        strong.textContent="Estimated salary in USD";
        span.textContent=converted.text+(converted.date?" · reference rate "+converted.date:"")+(converted.original?" (original: "+converted.original+")":"");
        cell.append(strong,span);meta.appendChild(cell);
      });
    }
    $("jobDetailDescription").textContent = item.description || "Please follow the official application link for the full role description.";
    const actions=$("jobDetailActions");actions.replaceChildren();
    if(item.applicationUrl) addSafeLink(actions,item.applicationUrl,"APPLY ON COMPANY WEBSITE");
    else if(item.companyWebsite) addSafeLink(actions,item.companyWebsite,"VISIT OFFICIAL COMPANY WEBSITE");
    if(item.contactEmail){const mail=document.createElement("a");mail.href="mailto:"+item.contactEmail;mail.textContent="CONTACT EMPLOYER";actions.appendChild(mail);}
    const source=$("jobDetailSource");
    source.textContent = item.sourceName ? "Source: "+item.sourceName+(item.sourceUrl?" · ":"") : "Employer-submitted opportunity.";
    if(item.sourceUrl && /^https:\/\//i.test(item.sourceUrl)) addSafeLink(source,item.sourceUrl,"OPEN ORIGINAL SOURCE");
    panel.classList.add("open");
    document.body.style.overflow="hidden";
  }
  function addSafeLink(parent,url,label) {
    if(!/^https:\/\//i.test(url)) return;
    const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=label;parent.appendChild(link);
  }
  function closeJobDetail() {
    $("jobDetailPanel")?.classList.remove("open");
    document.body.style.overflow="";
  }
  $("closeJobDetail")?.addEventListener("click",closeJobDetail);
  $("jobDetailPanel")?.addEventListener("click",event=>{if(event.target.id==="jobDetailPanel")closeJobDetail();});
  countrySelect?.addEventListener("change",()=>{refreshJobGeography();applyJobFilters();});
  regionSelect?.addEventListener("change",()=>{refreshJobGeography();applyJobFilters();});
  citySelect?.addEventListener("change",applyJobFilters);

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
      if (type === "job") {
        if (!append) jobItems.length = 0;
        jobItems.push(...items);
        refreshJobGeography();
        applyJobFilters();
      }
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

  function filterJobs() { applyJobFilters(); }

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

  loadWorldCountries();
  loadListings("job");
  loadListings("product");
})();
