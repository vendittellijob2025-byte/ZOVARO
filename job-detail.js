(() => {
  const $ = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get("id");
  const set = (id,value) => { $(id).textContent = value || ""; };
  const safeLink = (parent,url,label,secondary=false) => {
    if (!url || !/^https:\/\//i.test(url) && !/^mailto:/i.test(url)) return;
    const a=document.createElement("a");a.href=url;a.textContent=label;
    if(/^https:/i.test(url)){a.target="_blank";a.rel="noopener noreferrer";}
    if(secondary)a.className="secondary";
    parent.appendChild(a);
  };
  const cell = (label,value) => {
    if(!value)return;
    const div=document.createElement("div"),strong=document.createElement("strong"),span=document.createElement("span");
    strong.textContent=label;span.textContent=value;div.append(strong,span);$("jobMeta").appendChild(div);
  };
  async function load(){
    if(!id){throw new Error("Missing job reference.");}
    let item=null,curated=false;
    try{
      const r=await fetch("/data/curated-jobs.json",{cache:"no-store"});
      if(r.ok){const data=await r.json();item=(data.jobs||data).find(x=>x.id===id)||null;curated=!!item;}
    }catch{}
    if(!item){
      const r=await fetch("/api/marketplace?type=job&id="+encodeURIComponent(id),{cache:"no-store"});
      if(!r.ok)throw new Error("This job listing could not be found or is no longer public.");
      item=await r.json();
    }
    document.title=item.title+" | ZOVARO JOBS Worldwide";
    set("jobStatus",curated?"EMPLOYER SOURCE CHECKED · "+(item.verifiedAt||"date not available"):"EMPLOYER-SUBMITTED LISTING");
    set("jobTitle",item.title);
    set("jobCompany",[item.company,item.location].filter(Boolean).join(" · "));
    cell("Country",Array.isArray(item.countries)?item.countries.join(", "):item.country);
    cell("Region / State",item.region);
    cell("City",item.city);
    cell("Employment type",item.jobType);
    cell("Workplace",item.workplace);
    cell("Compensation",item.salaryText);
    cell("Last checked",item.verifiedAt||item.approvedAt||"Not independently dated");
    set("jobDescription",item.description||"Please consult the employer's official page for the full description.");
    const list=$("jobRequirements");
    (item.requirements||[]).forEach(v=>{const li=document.createElement("li");li.textContent=v;list.appendChild(li);});
    const actions=$("jobActions");
    if(item.applicationUrl)safeLink(actions,item.applicationUrl,curated?"VIEW EMPLOYER APPLICATION PAGE":"APPLY / VIEW OFFICIAL DETAILS");
    if(item.contactEmail)safeLink(actions,"mailto:"+item.contactEmail+"?subject="+encodeURIComponent("Application: "+item.title),"EMAIL THE EMPLOYER",true);
    if(item.sourceUrl)safeLink(actions,item.sourceUrl,"OPEN ORIGINAL SOURCE",true);
    set("jobSource",curated
      ? "Source: "+(item.sourceName||item.company)+". "+(item.verificationNote||"This summary links to the employer's published information.")+" ZOVARO has not been appointed by the employer."
      : "Source: employer-submitted listing. ZOVARO reviews submissions but does not independently verify employment contracts or act as the employer.");
  }
  load().catch(error=>{set("jobStatus","UNAVAILABLE");set("jobTitle","Job details unavailable");set("jobDescription",error.message);$("jobDescription").classList.add("error");});
})();