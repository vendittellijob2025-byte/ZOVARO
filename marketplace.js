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
      addText(card, "span", "marketplace-kicker", type === "job" ? [item.category, item.workplace, item.jobType].filter(Boolean).join(" · ") : [item.category, item.condition].filter(Boolean).join(" · "));
      if (type === "job") {
        addText(card, "span", "career-guide-label", item.isCurated ? "ZOVARO CURATED · EMPLOYER SOURCE CHECKED" : "EMPLOYER-SUBMITTED LISTING");
      }
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
        if (salary) {
          addText(card, "p", "marketplace-price", salary);
          salaryUsd(item.salaryText, item.country).then(converted => {
            if (converted && card.isConnected) addText(card, "p", "marketplace-price", "Approx. " + converted.text + " USD" + (converted.date ? " · " + converted.date : ""));
          });
        }
        const details = document.createElement("a");
        details.className = "job-open-details";
        details.href = "/job.html?id=" + encodeURIComponent(item.id || "");
        details.textContent = "VIEW FULL JOB DETAILS";
        card.appendChild(details);
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
  const citySelect = $("jobCityFilter");
  const searchJobsButton = $("jobLocationSearch");
  const jobLocationStatus = $("jobLocationStatus");
  const careerCategoryGrid = $("careerCategoryGrid");
  let careerCategories = [];
  let locationSearchActive = false;
  let geoRequest = 0;

  const CAREER_CATEGORY_PHOTOS = [
    [/food|hospitality/i,"photo-1555939594-58d7cb561ad1"],
    [/construction|skilled trades/i,"photo-1504307651254-35680f356dfd"],
    [/manufacturing|production/i,"photo-1581091226825-a6a2a5aee158"],
    [/transport|logistics/i,"photo-1519003722824-194d4455a60c"],
    [/office|administration/i,"photo-1497366754035-f200968a6e72"],
    [/business|management/i,"photo-1460925895917-afdab827c52f"],
    [/retail|customer service/i,"photo-1441986300917-64674bd600d8"],
    [/cleaning|sanitation/i,"photo-1581578731548-c64695cc6952"],
    [/security|events/i,"photo-1517457373958-b7lyde9b0c7"],
    [/healthcare|medical/i,"photo-1576091160399-112ba8d25d1d"],
    [/education|training/i,"photo-1503676260728-1c00da094a0b"],
    [/finance|accounting/i,"photo-1554224155-6726b3ff858f"],
    [/marketing|communications/i,"photo-1432888622747-4eb9a8efeb07"],
    [/it, software|data/i,"photo-1518770660439-4636190af475"],
    [/engineering|technology/i,"photo-1581092921461-eab62e97a780"],
    [/agriculture|farming/i,"photo-1500382017468-9049fed747ef"],
    [/beauty|personal care/i,"photo-1487412720507-e7ab37603c6f"],
    [/legal|compliance/i,"photo-1589829545856-d10d557cf95f"],
    [/arts|media|creative/i,"photo-1492619375914-88005aa9e8fb"],
    [/remote|work from home/i,"photo-1498050108023-c5249f4df085"]
  ];
  function careerCategoryImage(name) {
    const match = CAREER_CATEGORY_PHOTOS.find(([pattern]) => pattern.test(String(name || "")));
    return "https://images.unsplash.com/" + (match?.[1] || "photo-1498050108023-c5249f4df085") + "?auto=format&fit=crop&w=900&q=80";
  }
  function uniqueSorted(values) {
    return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  }
  function normalizeLocation(value) {
    return String(value || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim().toLowerCase().replace(/\\s+/g," ");
  }
  function normalizeCategory(value) {
    return normalizeLocation(value).replace(/&/g,"and").replace(/[^a-z0-9]+/g," ").trim();
  }
  function setOptions(select, values, placeholder, selected = "") {
    if (!select) return;
    select.replaceChildren(new Option(placeholder, ""));
    const sorted = uniqueSorted(values);
    sorted.forEach(value => select.add(new Option(value, value)));
    select.value = sorted.includes(selected) ? selected : "";
  }
  function categoryHasJobs(category, jobs) {
    const target = normalizeCategory(category);
    return jobs.some(item => {
      const actual = normalizeCategory(item.category || "");
      return actual === target || (actual && target && (actual.includes(target) || target.includes(actual)));
    });
  }
  function renderCareerCategoryTiles(categories) {
    if (!careerCategoryGrid) return;
    careerCategoryGrid.replaceChildren();
    categories.forEach(item => {
      const name = String(item.name || "");
      if (!name) return;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "career-category-card";
      tile.dataset.category = name;
      tile.setAttribute("aria-label", name + " — available job category");
      const image = document.createElement("img");
      image.src = careerCategoryImage(name);
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      tile.appendChild(image);
      addText(tile, "strong", "", name);
      careerCategoryGrid.appendChild(tile);
    });
  }
  function restoreAllCareerCategories() {
    locationSearchActive = false;
    if (countrySelect) countrySelect.value = "";
    setOptions(citySelect, [], "Select a country first");
    if (citySelect) citySelect.disabled = true;
    renderCareerCategoryTiles(careerCategories);
    if (jobLocationStatus) jobLocationStatus.textContent = "All professional categories are shown. Choose a country and city to find available opportunities.";
  }
  function populateCities(country) {
    const cities = uniqueSorted(jobItems
      .filter(item => normalizeLocation(item.country) === normalizeLocation(country) ||
        (Array.isArray(item.countries) && item.countries.some(value => normalizeLocation(value) === normalizeLocation(country))))
      .map(item => item.city));
    setOptions(citySelect, cities, cities.length ? "Select a city" : "No cities with listed offers");
    if (citySelect) citySelect.disabled = !cities.length;
  }
  async function loadJobDirectory() {
    const seen = new Set();
    let cursor = null;
    try {
      do {
        const query = new URLSearchParams({type:"job"});
        if (cursor) query.set("cursor",cursor);
        const response = await fetch(API + "?" + query.toString(), {cache:"no-store"});
        if (!response.ok) throw new Error("Job directory unavailable");
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        items.forEach(item => {
          const key = String(item.id || JSON.stringify([item.title,item.company,item.country,item.city]));
          if (!seen.has(key)) { seen.add(key); jobItems.push(item); }
        });
        cursor = response.headers.get("X-Zovaro-Next-Cursor") || null;
      } while (cursor);
    } catch (error) {
      console.warn("ZOVARO live job directory:", error.message);
    }
    try {
      const response = await fetch("/data/curated-jobs.json",{cache:"no-store"});
      if (response.ok) {
        const source = await response.json();
        (Array.isArray(source) ? source : source.jobs || []).filter(item => item.status === "open").forEach(item => {
          const key = String(item.id || JSON.stringify([item.title,item.company,item.country,item.city]));
          if (!seen.has(key)) { seen.add(key); jobItems.push({...item,approvedAt:item.verifiedAt || null,isCurated:true}); }
        });
      }
    } catch (error) {
      console.warn("ZOVARO curated job directory:",error.message);
    }
    const countries = uniqueSorted([
      ...jobItems.flatMap(item => Array.isArray(item.countries) ? item.countries : [item.country])
    ]);
    if (countrySelect) {
      setOptions(countrySelect,countries,"Select a country");
      countrySelect.disabled = false;
    }
  }
  function searchJobsByLocation() {
    const country = countrySelect?.value || "";
    const city = citySelect?.value || "";
    if (!country || !city) {
      if (jobLocationStatus) jobLocationStatus.textContent = "Select both a country and a city before searching.";
      return;
    }
    locationSearchActive = true;
    const matches = jobItems.filter(item => {
      const countryMatches = normalizeLocation(item.country) === normalizeLocation(country) ||
        (Array.isArray(item.countries) && item.countries.some(value => normalizeLocation(value) === normalizeLocation(country)));
      return countryMatches && normalizeLocation(item.city) === normalizeLocation(city);
    });
    const available = careerCategories.filter(category => categoryHasJobs(category.name,matches));
    renderCareerCategoryTiles(available);
    if (jobLocationStatus) {
      jobLocationStatus.textContent = available.length
        ? available.length + " professional categories with active opportunities in " + city + ", " + country + "."
        : "No job opportunities were found in " + city + ", " + country + ". Try another city or country.";
    }
  }
  countrySelect?.addEventListener("change",() => {
    const country = countrySelect.value;
    if (!country) {
      setOptions(citySelect,[],"Select a country first");
      if (citySelect) citySelect.disabled = true;
      return;
    }
    populateCities(country);
    if (jobLocationStatus) jobLocationStatus.textContent = "Now select a city in " + country + ".";
  });
  searchJobsButton?.addEventListener("click",searchJobsByLocation);
  $("backFromLookingJob")?.addEventListener("click",() => {
    restoreAllCareerCategories();
  });
  const fxRates = new Map();
  function parseSalaryCurrency(text, country) {
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
    if (value.includes("$")) {
      const countryCurrency = {
        "United States":"USD","Canada":"CAD","Australia":"AUD","New Zealand":"NZD",
        "Singapore":"SGD","Hong Kong":"HKD","Liberia":"USD","Ecuador":"USD",
        "Panama":"USD","El Salvador":"USD","Timor-Leste":"USD","Marshall Islands":"USD",
        "Micronesia":"USD","Palau":"USD"
      };
      return countryCurrency[country] || null;
    } // A dollar sign alone is ambiguous without a reliable country.
    return null;
  }
  function parseSalaryNumbers(text) {
    const matches = [...String(text || "").matchAll(/\d[\d., ]*/g)].map(match => match[0].trim()).filter(Boolean);
    return matches.slice(0,2).map(raw => {
      let value = raw.replace(/ /g,"");
      const lastComma=value.lastIndexOf(","),lastDot=value.lastIndexOf(".");
      if(lastComma>=0&&lastDot>=0){
        const decimal=lastComma>lastDot?",":".";
        value=value.replace(/[.,]/g,"");
        const decimals=raw.slice(Math.max(lastComma,lastDot)+1).replace(/\D/g,"");
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
  async function salaryUsd(text, country) {
    const currency=parseSalaryCurrency(text, country);
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

  function openJobDetail(item, updateUrl = true) {
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
      salaryUsd(item.salaryText, item.country).then(converted=>{
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
    if(updateUrl && item.id){
      const url=new URL(window.location.href);url.searchParams.set("job",item.id);
      window.history.pushState({zovaroJobId:item.id},"",url);
    }
  }
  function addSafeLink(parent,url,label) {
    if(!/^https:\/\//i.test(url)) return;
    const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=label;parent.appendChild(link);
  }
  function closeJobDetail(updateUrl = true) {
    $("jobDetailPanel")?.classList.remove("open");
    document.body.style.overflow="";
    if(updateUrl){
      const url=new URL(window.location.href);url.searchParams.delete("job");
      window.history.replaceState({}, "", url);
    }
  }
  window.addEventListener("popstate",()=>closeJobDetail(false));
  $("closeJobDetail")?.addEventListener("click",closeJobDetail);
  $("jobDetailPanel")?.addEventListener("click",event=>{if(event.target.id==="jobDetailPanel")closeJobDetail();});
  countrySelect?.addEventListener("change",()=>{refreshJobGeography(true);});
  regionSelect?.addEventListener("change",refreshJobCities);
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
        // Geography selectors use the complete world directory, not just current job records.
      }
      loadedCounts[type] += items.length;
      cursors[type] = response.headers.get("X-Zovaro-Next-Cursor") || null;
      const moreButton = $(type === "job" ? "jobLoadMore" : "usedLoadMore");
      if (moreButton) moreButton.classList.toggle("hidden", !cursors[type]);
      if (empty) empty.classList.toggle("hidden", loadedCounts[type] > 0);
      if (type === "job") applyJobFilters();
      if (type === "product" && typeof window.filterUsedListings === "function") window.filterUsedListings();
      return items;
    } catch (error) {
      if (empty) { empty.classList.remove("hidden"); empty.textContent = "Listings are temporarily unavailable. Please try again later."; }
      return [];
    }
  }

  async function loadCuratedJobs() {
    try {
      const response = await fetch("/data/curated-jobs.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Curated job directory unavailable.");
      const source = await response.json();
      const curated = (Array.isArray(source) ? source : source.jobs || [])
        .filter(item => item.status === "open")
        .map(item => ({
          ...item,
          approvedAt: item.verifiedAt || null,
          isCurated: true
        }));
      if (curated.length) {
        renderListings($("jobListings"), curated, "job", true);
        jobItems.push(...curated);
        loadedCounts.job += curated.length;
        $("jobListingsEmpty")?.classList.add("hidden");
      }
      // Geography selectors use the complete world directory, not just current job records.
      applyJobFilters();
    } catch (error) {
      console.warn("ZOVARO curated jobs unavailable:", error.message);
    }
  }

  async function loadCareerCategories() {
    try {
      const response = await fetch("/data/career-guides.json",{cache:"no-store"});
      if (!response.ok) throw new Error("Career categories unavailable");
      const data = await response.json();
      careerCategories = (data.categories || []).filter(item => item && item.name);
    } catch (error) {
      console.warn("ZOVARO career categories:",error.message);
      careerCategories = [];
    }
    renderCareerCategoryTiles(careerCategories);
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
  $("usedLoadMore")?.addEventListener("click", () => loadListings("product", true));
  loadCareerCategories();
  loadJobDirectory();
  const jobId = new URLSearchParams(window.location.search).get("job");
  if (jobId) {
    const view = $("lookingJobView");
    if (view) {
      document.querySelectorAll(".view").forEach(el=>el.classList.add("hidden"));
      view.classList.remove("hidden");
    }
    fetch(API+"?type=job&id="+encodeURIComponent(jobId),{cache:"no-store"})
      .then(response=>{if(!response.ok) throw new Error("Job not found");return response.json();})
      .then(item=>{if(item && item.id) openJobDetail(item,false);})
      .catch(()=>{const source=$("jobDetailSource");if(source) source.textContent="This job offer is no longer available.";});
  }
  loadListings("product");
})();
