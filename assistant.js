(() => {
  "use strict";

  const backdrop = document.getElementById("zovaroAiBackdrop");
  if (!backdrop) return;

  const languageScreen = document.getElementById("zovaroAiLanguages");
  const chatScreen = document.getElementById("zovaroAiChatScreen");
  const languageButtons = backdrop.querySelectorAll("[data-zv-language]");
  const title = document.getElementById("zovaroAiTitle");
  const welcome = document.getElementById("zovaroAiWelcome");
  const input = document.getElementById("zovaroAiInput");
  const form = document.getElementById("zovaroAiForm");
  const messages = document.getElementById("zovaroAiMessages");
  const close = document.getElementById("zovaroAiClose");
  const reopen = document.getElementById("zovaroAiReopen");
  const send = document.getElementById("zovaroAiSend");
  const status = document.getElementById("zovaroAiStatus");
  let language = "en";

  const copy = {
    en: { title: "ZOVARO AI ASSISTANT", welcome: "Hello! I'm ZOVARO. What do you need? Tell me as precisely as you can and I'll search the available ZOVARO listings.", placeholder: "Tell me what you need…", send: "SEARCH", searching: "I'm searching the available ZOVARO listings…", empty: "I couldn't find matching products in the currently connected catalogue. Try describing the item differently.", jobs: "I've opened the real job listings available on ZOVARO. Use the location filters to narrow the results.", close: "Close assistant", choose: "Choose your language" },
    it: { title: "ASSISTENTE IA ZOVARO", welcome: "Ciao! Sono ZOVARO. Di cosa hai bisogno? Descrivimi con precisione cosa cerchi e controllerò gli annunci e i prodotti realmente disponibili.", placeholder: "Dimmi di cosa hai bisogno…", send: "CERCA", searching: "Sto cercando nei cataloghi disponibili di ZOVARO…", empty: "Non ho trovato prodotti corrispondenti nel catalogo attualmente collegato. Prova a descrivere diversamente ciò che cerchi.", jobs: "Ho aperto le offerte di lavoro realmente disponibili su ZOVARO. Usa i filtri geografici per restringere i risultati.", close: "Chiudi assistente", choose: "Scegli la tua lingua" },
    es: { title: "ASISTENTE IA ZOVARO", welcome: "¡Hola! Soy ZOVARO. ¿Qué necesitas? Describe con detalle lo que buscas y revisaré los productos y anuncios realmente disponibles.", placeholder: "Dime qué necesitas…", send: "BUSCAR", searching: "Estoy buscando en los catálogos disponibles de ZOVARO…", empty: "No encontré productos coincidentes en el catálogo conectado actualmente. Intenta describirlos de otra manera.", jobs: "He abierto las ofertas de trabajo disponibles en ZOVARO. Usa los filtros de ubicación para limitar los resultados.", close: "Cerrar asistente", choose: "Elige tu idioma" },
    fr: { title: "ASSISTANT IA ZOVARO", welcome: "Bonjour ! Je suis ZOVARO. De quoi avez-vous besoin ? Décrivez précisément votre recherche et je consulterai les offres réellement disponibles.", placeholder: "Dites-moi ce qu'il vous faut…", send: "RECHERCHER", searching: "Je consulte les catalogues disponibles de ZOVARO…", empty: "Aucun produit correspondant n'a été trouvé dans le catalogue actuellement connecté.", jobs: "J'ai ouvert les offres d'emploi disponibles sur ZOVARO. Utilisez les filtres de localisation pour affiner les résultats.", close: "Fermer l'assistant", choose: "Choisissez votre langue" },
    de: { title: "ZOVARO KI-ASSISTENT", welcome: "Hallo! Ich bin ZOVARO. Was benötigen Sie? Beschreiben Sie Ihre Suche möglichst genau. Ich prüfe die tatsächlich verfügbaren Angebote.", placeholder: "Was suchen Sie?…", send: "SUCHEN", searching: "Ich durchsuche die verfügbaren ZOVARO-Kataloge…", empty: "Im aktuell verbundenen Katalog wurden keine passenden Produkte gefunden.", jobs: "Ich habe die verfügbaren Stellenangebote auf ZOVARO geöffnet. Verwenden Sie die Standortfilter.", close: "Assistent schließen", choose: "Sprache auswählen" },
    pt: { title: "ASSISTENTE IA ZOVARO", welcome: "Olá! Sou a ZOVARO. Do que precisa? Descreva o que procura e vou consultar os produtos e anúncios realmente disponíveis.", placeholder: "Diga-me do que precisa…", send: "PESQUISAR", searching: "Estou pesquisando nos catálogos disponíveis da ZOVARO…", empty: "Não encontrei produtos correspondentes no catálogo atualmente conectado.", jobs: "Abri as vagas disponíveis na ZOVARO. Use os filtros de localização para refinar os resultados.", close: "Fechar assistente", choose: "Escolha seu idioma" },
    zh: { title: "ZOVARO 智能助手", welcome: "您好！我是 ZOVARO。您需要什么？请尽可能详细地描述，我会搜索目前实际可用的商品和职位信息。", placeholder: "请告诉我您需要什么…", send: "搜索", searching: "正在搜索 ZOVARO 当前可用的目录…", empty: "在目前连接的商品目录中没有找到匹配商品。请尝试换一种描述。", jobs: "已打开 ZOVARO 当前可用的职位信息。您可以使用地点筛选条件缩小范围。", close: "关闭助手", choose: "选择语言" },
    ja: { title: "ZOVARO AIアシスタント", welcome: "こんにちは！ZOVAROです。何をお探しですか？できるだけ詳しく説明してください。現在利用可能な商品や求人を検索します。", placeholder: "必要なものを入力してください…", send: "検索", searching: "ZOVAROで利用可能な情報を検索しています…", empty: "現在接続されている商品カタログに一致する商品がありません。別の表現でお試しください。", jobs: "ZOVAROで現在掲載中の求人を開きました。地域フィルターで絞り込めます。", close: "アシスタントを閉じる", choose: "言語を選択" },
    ar: { title: "مساعد ZOVARO الذكي", welcome: "مرحباً! أنا ZOVARO. ما الذي تحتاج إليه؟ صف ما تبحث عنه بالتفصيل وسأبحث في المنتجات والوظائف المتاحة فعلياً.", placeholder: "أخبرني بما تحتاج إليه…", send: "بحث", searching: "أبحث في قوائم ZOVARO المتاحة…", empty: "لم أجد منتجات مطابقة في الكتالوج المتصل حالياً.", jobs: "فتحت الوظائف المتاحة على ZOVARO. استخدم عوامل تصفية الموقع لتضييق النتائج.", close: "إغلاق المساعد", choose: "اختر لغتك" },
    hi: { title: "ZOVARO AI सहायक", welcome: "नमस्ते! मैं ZOVARO हूँ। आपको क्या चाहिए? अपनी ज़रूरत विस्तार से बताइए; मैं उपलब्ध उत्पादों और नौकरियों को खोजूँगा।", placeholder: "बताइए आपको क्या चाहिए…", send: "खोजें", searching: "ZOVARO की उपलब्ध सूचियों में खोज रहा हूँ…", empty: "वर्तमान में जुड़े कैटलॉग में मेल खाते उत्पाद नहीं मिले।", jobs: "मैंने ZOVARO पर उपलब्ध नौकरियाँ खोल दी हैं। परिणाम सीमित करने के लिए स्थान फ़िल्टर का उपयोग करें।", close: "सहायक बंद करें", choose: "अपनी भाषा चुनें" }
  };

  const show = () => {
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const hide = () => {
    backdrop.hidden = true;
    document.body.style.overflow = "";
  };
  const addMessage = (text, who) => {
    const node = document.createElement("p");
    node.className = "zovaro-ai-message " + who;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
  };

  function chooseLanguage(code) {
    language = copy[code] ? code : "en";
    const t = copy[language];
    languageScreen.hidden = true;
    chatScreen.hidden = false;
    title.textContent = t.title;
    welcome.textContent = t.welcome;
    input.placeholder = t.placeholder;
    input.setAttribute("aria-label", t.placeholder);
    send.textContent = t.send;
    close.setAttribute("aria-label", t.close);
    messages.replaceChildren();
    addMessage(t.welcome, "assistant");
    input.focus();
  }

  languageButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      chooseLanguage(button.dataset.zvLanguage);
    });
  });

  function searchProducts(query) {
    const all = typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS) ? PRODUCTS : [];
    const stop = new Set(["the","and","for","with","from","that","this","what","need","want","cerco","cerca","per","con","una","uno","che","del","della","delle","de","la","el","los","las","para","por","que","un","una","je","le","les","des","und","der","die","das","ein","eine"]);
    const tokens = query.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) || [];
    const useful = [...new Set(tokens.filter(token => token.length > 2 && !stop.has(token)))];
    const ranked = all.map(product => {
      const haystack = [product.name, product.category, product.subcategory, product.brand, product.merchant, product.description].join(" ").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const hits = useful.filter(token => haystack.includes(token)).length;
      return { product, hits };
    }).filter(item => item.hits > 0).sort((a,b) => b.hits - a.hits);
    return ranked.map(item => item.product);
  }

  function runSearch(query) {
    const t = copy[language];
    const q = query.trim();
    if (!q) return;
    addMessage(q, "user");
    status.textContent = t.searching;

    const isJob = /\b(job|jobs|work|career|employment|lavoro|lavorare|impiego|empleo|trabajo|trabajar|emploi|stellenangebot|vaga|trabalho|وظيفة|работа)\b/i.test(q);
    if (isJob) {
      if (typeof window.showView === "function") window.showView("lookingJobView");
      const jobStatus = document.getElementById("jobLocationStatus");
      if (jobStatus) jobStatus.textContent = t.jobs;
      const searchButton = document.getElementById("jobLocationSearch");
      if (searchButton) searchButton.click();
      status.textContent = t.jobs;
      return;
    }

    const results = searchProducts(q);
    if (typeof window.showView === "function") window.showView("buyProductsView");
    window.requestAnimationFrame(() => {
      if (typeof window.showResults === "function") {
        window.showResults(results, "ZOVARO · " + q, results.length ? results.length + " real catalogue matches" : t.empty);
      }
      status.textContent = results.length ? results.length + " matching products found in the connected catalogue." : t.empty;
    });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    runSearch(input.value);
  });

  close.addEventListener("click", hide);
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) hide();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !backdrop.hidden) hide();
  });
  reopen.addEventListener("click", () => {
    languageScreen.hidden = true;
    chatScreen.hidden = false;
    const t = copy[language];
    title.textContent = t.title;
    welcome.textContent = t.welcome;
    show();
    input.focus();
  });

  show();
})();
