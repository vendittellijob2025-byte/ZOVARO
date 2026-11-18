(() => {
  "use strict";

  const backdrop = document.getElementById("zovaroAiBackdrop");
  if (!backdrop) return;

  const languageScreen = document.getElementById("zovaroAiLanguages");
  const welcomeScreen = document.getElementById("zovaroAiWelcomeScreen");
  const closeButton = document.getElementById("zovaroAiClose");
  const reopenButton = document.getElementById("zovaroAiReopen");
  const changeButton = document.getElementById("zovaroAiChangeLanguage");
  const welcomeText = document.getElementById("zovaroAiWelcomeText");
  const chooseCopy = document.getElementById("zovaroAiChooseCopy");
  const languageHeading = document.getElementById("zovaroAiLanguageHeading");
  const languageHint = document.getElementById("zovaroAiLanguageHint");
  const changeLabel = document.getElementById("zovaroAiChangeLabel");
  const reopenLabel = document.getElementById("zovaroAiReopenLabel");
  const homeButton = document.getElementById("zovaroHomeButton");
  const homeButtonLabel = document.getElementById("zovaroHomeButtonLabel");
  const buttons = backdrop.querySelectorAll("[data-zv-language]");
  const STORAGE_KEY = "zovaroWorldwideLanguage";

  const copy = {
    en: {
      label:"English", choose:"Welcome! First choose your language so I can greet you correctly.",
      heading:"Choose your language", hint:"Select a flag to continue in your language.",
      welcome:"Hello! I'm ZOVARO Worldwide. Are you looking for a product, an urgent job opportunity, or something exclusive such as a work of art or a luxury item? Tell me what you need and I'll help you explore the available opportunities. You can close my welcome and browse the homepage freely.",
      change:"Change language", reopen:"Need AI Search?", homeButton:"Home",
      home:["Discover Better. Shop Smarter. Discover Job Opportunities.","New & Used","Find what you need from around the world: electronics, fashion, beauty, perfumes, cosmetics, automotive, sports and much more.","Urgent Jobs & Workers","Find the opportunity that matches your skills, or find the right person for your business. Discover jobs, workers and new opportunities on ZOVARO.","ZOVARO WORLDWIDE · PRIVATE COLLECTION","LUXURY & PRESTIGE","Exclusive opportunities in prestigious properties, supercars, private aviation, yachts, fine watches, jewellery, art and collectibles."]
    },
    it: {
      label:"Italiano", choose:"Benvenuto! Scegli prima la tua lingua, così potrò accoglierti correttamente.",
      heading:"Scegli la tua lingua", hint:"Seleziona una bandiera per continuare nella tua lingua.",
      welcome:"Ciao! Sono ZOVARO Worldwide. Cerchi un prodotto, un lavoro urgente o qualcosa di esclusivo, come un'opera d'arte o un bene di lusso? Raccontami cosa ti serve e ti aiuterò a esplorare le opportunità disponibili. Puoi chiudere il mio benvenuto e navigare liberamente nella Home Page.",
      change:"Cambia lingua", reopen:"¿Necesitas una búsqueda con IA?", homeButton:"Inicio",
      home:["Scopri meglio. Acquista con intelligenza. Scopri opportunità di lavoro.","Nuovo e usato","Trova ciò che ti serve in tutto il mondo: elettronica, moda, bellezza, profumi, cosmetici, auto, sport e molto altro.","Lavori urgenti e lavoratori","Trova l'opportunità adatta alle tue competenze oppure la persona giusta per la tua attività. Scopri lavori, professionisti e nuove opportunità su ZOVARO.","ZOVARO WORLDWIDE · COLLEZIONE PRIVATA","LUSSO E PRESTIGIO","Opportunità esclusive: immobili prestigiosi, supercar, aviazione privata, yacht, orologi, gioielli, arte e collezionismo."]
    },
    es: {
      label:"Español", choose:"¡Bienvenido! Primero elige tu idioma para que pueda saludarte correctamente.",
      heading:"Elige tu idioma", hint:"Selecciona una bandera para continuar en tu idioma.",
      welcome:"¡Hola! Soy ZOVARO Worldwide. ¿Buscas un producto, un trabajo urgente o algo exclusivo, como una obra de arte o un artículo de lujo? Cuéntame qué necesitas y te ayudaré a explorar las oportunidades disponibles. Puedes cerrar mi bienvenida y navegar libremente por la página principal.",
      change:"Cambiar idioma", reopen:"¿Necesitas una búsqueda con IA?", homeButton:"Inicio",
      home:["Descubre mejor. Compra de forma inteligente. Encuentra oportunidades de trabajo.","Nuevo y usado","Encuentra en todo el mundo lo que necesitas: tecnología, moda, belleza, perfumes, cosmética, automoción, deportes y mucho más.","Empleos urgentes y trabajadores","Encuentra una oportunidad adecuada a tus habilidades o a la persona ideal para tu negocio. Descubre empleos y profesionales en ZOVARO.","ZOVARO WORLDWIDE · COLECCIÓN PRIVADA","LUJO Y PRESTIGIO","Oportunidades exclusivas: propiedades, superdeportivos, aviación privada, yates, relojes, joyas, arte y coleccionismo."]
    },
    fr: {
      label:"Français", choose:"Bienvenue ! Choisissez d'abord votre langue afin que je puisse vous accueillir correctement.",
      heading:"Choisissez votre langue", hint:"Sélectionnez un drapeau pour continuer dans votre langue.",
      welcome:"Bonjour ! Je suis ZOVARO Worldwide. Vous cherchez un produit, un emploi urgent ou quelque chose d'exclusif, comme une œuvre d'art ou un article de luxe ? Dites-moi ce qu'il vous faut et je vous aiderai à explorer les possibilités disponibles. Vous pouvez fermer mon accueil et parcourir librement la page d'accueil.",
      change:"Changer de langue", reopen:"Besoin d’une recherche par IA ?", homeButton:"Accueil",
      home:["Découvrez mieux. Achetez plus intelligemment. Découvrez des offres d'emploi.","Neuf et occasion","Trouvez dans le monde entier des produits électroniques, de mode, de beauté, des parfums, des cosmétiques, des articles automobiles, sportifs et bien plus.","Emplois urgents et travailleurs","Trouvez un emploi adapté à vos compétences ou la bonne personne pour votre entreprise. Découvrez des emplois et des professionnels sur ZOVARO.","ZOVARO WORLDWIDE · COLLECTION PRIVÉE","LUXE ET PRESTIGE","Des opportunités exclusives : propriétés, supercars, aviation privée, yachts, montres, bijoux, art et objets de collection."]
    },
    de: {
      label:"Deutsch", choose:"Willkommen! Wähle zuerst deine Sprache, damit ich dich richtig begrüßen kann.",
      heading:"Sprache auswählen", hint:"Wähle eine Flagge, um in deiner Sprache fortzufahren.",
      welcome:"Hallo! Ich bin ZOVARO Worldwide. Suchst du ein Produkt, einen dringenden Job oder etwas Exklusives wie ein Kunstwerk oder einen Luxusartikel? Erzähle mir, was du brauchst, und ich helfe dir, verfügbare Angebote zu entdecken. Du kannst meine Begrüßung schließen und die Startseite frei erkunden.",
      change:"Sprache ändern", reopen:"Brauchst du eine KI-Suche?", homeButton:"Startseite",
      home:["Entdecke mehr. Kaufe cleverer. Entdecke Jobmöglichkeiten.","Neu und gebraucht","Finde weltweit Elektronik, Mode, Beauty, Parfüm, Kosmetik, Autozubehör, Sportartikel und vieles mehr.","Dringende Jobs und Arbeitskräfte","Finde einen passenden Job oder die richtige Person für dein Unternehmen. Entdecke Stellen und Fachkräfte auf ZOVARO.","ZOVARO WORLDWIDE · PRIVATE KOLLEKTION","LUXUS UND PRESTIGE","Exklusive Möglichkeiten: Luxusimmobilien, Supersportwagen, Privatjets, Yachten, Uhren, Schmuck, Kunst und Sammlerstücke."]
    },
    pt: {
      label:"Português", choose:"Bem-vindo! Primeiro escolha o seu idioma para que eu possa cumprimentá-lo corretamente.",
      heading:"Escolha o seu idioma", hint:"Selecione uma bandeira para continuar no seu idioma.",
      welcome:"Olá! Sou o ZOVARO Worldwide. Procura um produto, um emprego urgente ou algo exclusivo, como uma obra de arte ou um artigo de luxo? Conte-me o que precisa e vou ajudar a explorar as oportunidades disponíveis. Pode fechar a apresentação e navegar livremente pela página inicial.",
      change:"Mudar idioma", reopen:"Precisa de uma pesquisa com IA?", homeButton:"Início",
      home:["Descubra melhor. Compre de forma inteligente. Descubra oportunidades de trabalho.","Novo e usado","Encontre em todo o mundo eletrônicos, moda, beleza, perfumes, cosméticos, automóveis, artigos esportivos e muito mais.","Empregos urgentes e profissionais","Encontre uma oportunidade adequada às suas competências ou a pessoa certa para o seu negócio. Descubra vagas e profissionais na ZOVARO.","ZOVARO WORLDWIDE · COLEÇÃO PRIVADA","LUXO E PRESTÍGIO","Oportunidades exclusivas: imóveis, supercarros, aviação privada, iates, relógios, joias, arte e colecionáveis."]
    },
    ar: {
      label:"العربية", choose:"مرحباً! اختر لغتك أولاً حتى أتمكن من الترحيب بك بشكل صحيح.",
      heading:"اختر لغتك", hint:"اختر علماً للمتابعة بلغتك.",
      welcome:"مرحباً! أنا ZOVARO Worldwide. هل تبحث عن منتج أو وظيفة عاجلة أو شيء مميز مثل عمل فني أو سلعة فاخرة؟ أخبرني بما تحتاج إليه وسأساعدك في استكشاف الفرص المتاحة. يمكنك إغلاق رسالة الترحيب وتصفح الصفحة الرئيسية بحرية.",
      change:"تغيير اللغة", reopen:"هل تحتاج إلى بحث بالذكاء الاصطناعي؟", homeButton:"الرئيسية",
      home:["اكتشف الأفضل. تسوّق بذكاء. اكتشف فرص العمل.","جديد ومستعمل","اكتشف الإلكترونيات والأزياء والجمال والعطور ومستحضرات التجميل والسيارات والرياضة وغير ذلك حول العالم.","وظائف عاجلة وعاملون","اعثر على فرصة تناسب مهاراتك أو الشخص المناسب لعملك. اكتشف الوظائف والمهنيين على ZOVARO.","ZOVARO WORLDWIDE · مجموعة خاصة","الفخامة والتميز","فرص حصرية في العقارات الفاخرة والسيارات الخارقة والطيران الخاص واليخوت والساعات والمجوهرات والفنون والمقتنيات."]
    },
    hi: {
      label:"हिन्दी", choose:"स्वागत है! पहले अपनी भाषा चुनें ताकि मैं आपका सही भाषा में स्वागत कर सकूँ।",
      heading:"अपनी भाषा चुनें", hint:"अपनी भाषा में आगे बढ़ने के लिए झंडा चुनें।",
      welcome:"नमस्ते! मैं ZOVARO Worldwide हूँ। क्या आप कोई उत्पाद, तुरंत नौकरी या कोई खास चीज़ जैसे कलाकृति या लग्ज़री वस्तु खोज रहे हैं? बताइए आपको क्या चाहिए, मैं उपलब्ध अवसर खोजने में मदद करूँगा। आप स्वागत संदेश बंद करके होम पेज पर स्वतंत्र रूप से जा सकते हैं।",
      change:"भाषा बदलें", reopen:"क्या आपको AI खोज चाहिए?", homeButton:"होम",
      home:["बेहतर खोजें। समझदारी से खरीदें। नौकरी के अवसर खोजें।","नया और पुराना","दुनिया भर में इलेक्ट्रॉनिक्स, फैशन, ब्यूटी, परफ्यूम, कॉस्मेटिक्स, ऑटोमोटिव, खेल और बहुत कुछ खोजें।","तत्काल नौकरियाँ और कर्मचारी","अपने कौशल के अनुसार अवसर या अपने व्यवसाय के लिए सही व्यक्ति खोजें। ZOVARO पर नौकरियाँ और पेशेवर खोजें।","ZOVARO WORLDWIDE · निजी संग्रह","लक्ज़री और प्रतिष्ठा","विशेष अवसर: प्रीमियम संपत्तियाँ, सुपरकार, निजी विमान, यॉट, घड़ियाँ, आभूषण, कला और संग्रहणीय वस्तुएँ।"]
    },
    zh: {
      label:"中文", choose:"欢迎！请先选择您的语言，这样我才能用正确的语言向您问候。",
      heading:"选择您的语言", hint:"选择一面旗帜，以您的语言继续。",
      welcome:"您好！我是 ZOVARO Worldwide。您正在寻找商品、紧急工作机会，还是艺术品或奢侈品等独特物品？告诉我您的需求，我会帮您探索现有机会。您也可以关闭欢迎信息，自由浏览主页。",
      change:"更改语言", reopen:"需要 AI 搜索吗？", homeButton:"首页",
      home:["发现更好选择，购物更明智。探索工作机会。","全新与二手","在全球寻找电子产品、时尚、美妆、香水、汽车用品、运动用品等。","紧急职位与人才","寻找适合您技能的机会，或为您的企业找到合适的人才。在 ZOVARO 探索职位与专业人才。","ZOVARO WORLDWIDE · 私人精选","奢华与尊贵","尊享机会：高端房产、超级跑车、私人航空、游艇、名表、珠宝、艺术品与收藏品。"]
    },
    ja: {
      label:"日本語", choose:"ようこそ。最初に言語を選択してください。選択した言語でご案内します。",
      heading:"言語を選択", hint:"旗を選択して、ご希望の言語で続行してください。",
      welcome:"こんにちは。ZOVARO Worldwideです。商品、急募の仕事、または芸術作品や高級品のような特別なものをお探しですか？必要なものを教えてください。利用可能な機会を探すお手伝いをします。歓迎メッセージを閉じて、ホームページを自由に閲覧することもできます。",
      change:"言語を変更", reopen:"AI検索が必要ですか？", homeButton:"ホーム",
      home:["より良い発見を。賢いショッピングを。仕事の機会も見つけよう。","新品・中古","世界中から電子機器、ファッション、美容、香水、自動車用品、スポーツ用品などを探せます。","急募の仕事・人材","スキルに合う仕事や、ビジネスに最適な人材を見つけましょう。ZOVAROで求人と専門家を探せます。","ZOVARO WORLDWIDE · プライベートコレクション","ラグジュアリー＆プレステージ","高級不動産、スーパーカー、プライベート航空、ヨット、高級時計、ジュエリー、アート、コレクターズアイテム。"]
    },
    ru: {
      label:"Русский", choose:"Добро пожаловать! Сначала выберите язык, чтобы я мог приветствовать вас правильно.",
      heading:"Выберите язык", hint:"Выберите флаг, чтобы продолжить на своём языке.",
      welcome:"Здравствуйте! Я ZOVARO Worldwide. Вы ищете товар, срочную работу или что-то особенное, например произведение искусства или предмет роскоши? Расскажите, что вам нужно, и я помогу найти доступные предложения. Вы можете закрыть приветствие и свободно просматривать главную страницу.",
      change:"Изменить язык", reopen:"Нужен поиск с ИИ?", homeButton:"Главная",
      home:["Открывайте лучшее. Покупайте разумнее. Находите работу.","Новое и подержанное","Находите по всему миру электронику, моду, косметику, парфюмерию, автотовары, спортивные товары и многое другое.","Срочная работа и специалисты","Найдите работу по своим навыкам или подходящего специалиста для своего бизнеса. Ищите вакансии и профессионалов на ZOVARO.","ZOVARO WORLDWIDE · ЧАСТНАЯ КОЛЛЕКЦИЯ","РОСКОШЬ И ПРЕСТИЖ","Эксклюзивные предложения: элитная недвижимость, суперкары, частная авиация, яхты, часы, украшения, искусство и коллекционные предметы."]
    },
    ko: {
      label:"한국어", choose:"환영합니다! 먼저 언어를 선택해 주세요. 선택한 언어로 인사드리겠습니다.",
      heading:"언어 선택", hint:"깃발을 선택하여 원하는 언어로 계속하세요.",
      welcome:"안녕하세요! 저는 ZOVARO Worldwide입니다. 상품, 긴급 채용 정보 또는 예술 작품이나 명품 같은 특별한 것을 찾고 계신가요? 필요한 것을 알려주시면 이용 가능한 기회를 찾도록 도와드리겠습니다. 환영 메시지를 닫고 홈페이지를 자유롭게 둘러볼 수도 있습니다.",
      change:"언어 변경", reopen:"AI 검색이 필요하신가요?", homeButton:"홈",
      home:["더 나은 발견, 더 현명한 쇼핑, 새로운 일자리 기회.","신품 및 중고","전 세계의 전자제품, 패션, 뷰티, 향수, 자동차 용품, 스포츠 용품 등을 찾아보세요.","긴급 채용 및 인재","역량에 맞는 일자리나 비즈니스에 적합한 인재를 찾아보세요. ZOVARO에서 채용 정보와 전문가를 만나보세요.","ZOVARO WORLDWIDE · 프라이빗 컬렉션","럭셔리 & 프레스티지","고급 부동산, 슈퍼카, 프라이빗 항공, 요트, 명품 시계, 주얼리, 예술품 및 컬렉터 아이템."]
    }
  };

  function getCopy(code) { return copy[code] || copy.en; }


  const requestForm = document.getElementById("zovaroAiRequestForm");
  const requestInput = document.getElementById("zovaroAiRequestInput");
  const requestLabel = document.getElementById("zovaroAiRequestLabel");
  const requestSubmit = document.getElementById("zovaroAiRequestSubmit");
  const requestHint = document.getElementById("zovaroAiRequestHint");

  const requestCopy = {
    en:["What do you need?","Describe what you are looking for…","SEARCH","Tell me what you need: a product, a job or a luxury opportunity."],
    it:["Di cosa hai bisogno?","Descrivi cosa stai cercando…","CERCA","Dimmi cosa ti serve: un prodotto, un lavoro o un'opportunità di lusso."],
    es:["¿Qué necesitas?","Describe lo que estás buscando…","BUSCAR","Dime qué necesitas: un producto, un empleo o una oportunidad de lujo."],
    fr:["De quoi avez-vous besoin ?","Décrivez ce que vous recherchez…","RECHERCHER","Dites-moi ce qu'il vous faut : un produit, un emploi ou une opportunité de luxe."],
    de:["Was brauchst du?","Beschreibe, wonach du suchst…","SUCHEN","Sag mir, was du brauchst: ein Produkt, einen Job oder eine Luxusgelegenheit."],
    pt:["Do que precisa?","Descreva o que está procurando…","PESQUISAR","Diga o que procura: um produto, um emprego ou uma oportunidade de luxo."],
    ar:["ما الذي تحتاج إليه؟","اكتب ما الذي تبحث عنه…","بحث","أخبرني بما تحتاج إليه: منتج أو وظيفة أو فرصة فاخرة."],
    hi:["आपको क्या चाहिए?","बताएँ कि आप क्या खोज रहे हैं…","खोजें","बताएँ कि आपको क्या चाहिए: उत्पाद, नौकरी या लग्ज़री अवसर।"],
    zh:["您需要什么？","请描述您正在寻找的内容…","搜索","告诉我您的需求：商品、工作或奢华机会。"],
    ja:["何をお探しですか？","お探しの内容を入力してください…","検索","商品、仕事、ラグジュアリーな機会など、ご希望を教えてください。"],
    ru:["Что вы ищете?","Опишите, что вы ищете…","ПОИСК","Укажите, что вам нужно: товар, работа или предложение класса люкс."],
    ko:["무엇을 찾고 계신가요?","찾으시는 내용을 입력하세요…","검색","상품, 일자리 또는 럭셔리 기회 등 필요한 것을 알려주세요."]
  };

  function applyRequestLanguage(code) {
    const labels = requestCopy[code] || requestCopy.en;
    requestLabel.textContent = labels[0];
    requestInput.placeholder = labels[1];
    requestSubmit.textContent = labels[2];
    requestHint.textContent = labels[3];
  }

  function submitAssistantRequest(query) {
    const normalized = query.toLowerCase();
    closeWelcome();

    if (/\b(job|jobs|work|career|employment|lavoro|lavori|impiego|assumere|trabajo|empleo|emploi|travail|arbeit|stelle|وظيفة|काम|工作|求人)\b/.test(normalized)) {
      const hiring = /\b(hire|hiring|cerco personale|assumere|contratar|recruit|recruter|einstellen)\b/.test(normalized);
      document.getElementById("openJobs")?.click();
      window.setTimeout(() => document.getElementById(hiring ? "openOfferJob" : "openLookingJob")?.click(), 80);
      return;
    }

    if (/\b(luxury|lusso|prestige|yacht|yachts|jet|helicopter|villa|castle|castello|rolex|ferrari|lamborghini|supercar|luxueux|luxus|豪华|高級|贅沢)\b/.test(normalized)) {
      document.getElementById("openLuxury")?.click();
      return;
    }

    document.getElementById("openShop")?.click();
    window.setTimeout(() => {
      document.getElementById("openBuyProducts")?.click();
      window.setTimeout(() => {
        document.getElementById("openNewProducts")?.click();
        window.setTimeout(() => {
          const search = document.getElementById("searchInput");
          const form = document.getElementById("searchForm");
          if (search && form) {
            search.value = query;
            form.dispatchEvent(new Event("submit", { bubbles:true, cancelable:true }));
          }
        }, 100);
      }, 100);
    }, 100);
  }

  requestForm?.addEventListener("submit", event => {
    event.preventDefault();
    const query = (requestInput.value || "").trim();
    if (!query) return;
    submitAssistantRequest(query);
  });


  function applyHomepageLanguage(code) {
    const data = getCopy(code).home;
    const set = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = value;
    };
    set(".brand-tagline", data[0]);
    set(".shop-card .main-card-subtitle", data[1]);
    set(".shop-card .main-card-description", data[2]);
    set(".job-card .main-card-subtitle", data[3]);
    set(".job-card .main-card-description", data[4]);
    set(".luxury-feature-kicker", data[5]);
    set(".luxury-feature-title", data[6]);
    set(".luxury-feature-copy", data[7]);
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
  }

  function showLanguagePicker() {
    languageScreen.hidden = false;
    welcomeScreen.hidden = true;
    backdrop.hidden = false;
    reopenButton.classList.remove("visible");
  }

  function showWelcome(code) {
    const data = getCopy(code);
    applyRequestLanguage(code);
    welcomeText.textContent = data.welcome;
    changeLabel.textContent = data.change;
    reopenLabel.textContent = data.reopen;
    if (homeButtonLabel) homeButtonLabel.textContent = data.homeButton || "Home";
    if (homeButton) homeButton.setAttribute("aria-label", data.homeButton || "Home");
    chooseCopy.textContent = data.choose;
    languageHeading.textContent = data.heading;
    languageHint.textContent = data.hint;
    languageScreen.hidden = true;
    welcomeScreen.hidden = false;
    backdrop.hidden = false;
    reopenButton.classList.remove("visible");
    applyHomepageLanguage(code);
  }

  function closeWelcome() {
    backdrop.hidden = true;
    reopenButton.classList.add("visible");
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const code = button.dataset.zvLanguage || "en";
      try { localStorage.setItem(STORAGE_KEY, code); } catch (_) {}
      showWelcome(code);
    });
  });

  changeButton.addEventListener("click", showLanguagePicker);
  closeButton.addEventListener("click", closeWelcome);
  reopenButton.addEventListener("click", () => {
    let saved = "";
    try { saved = localStorage.getItem(STORAGE_KEY) || ""; } catch (_) {}
    if (saved && copy[saved]) showWelcome(saved);
    else showLanguagePicker();
  });


  homeButton?.addEventListener("click", () => {
    const home = document.getElementById("homeView");
    if (!home) return;
    document.querySelectorAll(".view").forEach(view => {
      view.classList.toggle("hidden", view.id !== "homeView");
    });
    if (window.history && typeof window.history.pushState === "function") {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      window.history.pushState({ zovaroView: "homeView" }, "", `${url.pathname}${url.search}${url.hash}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !backdrop.hidden) closeWelcome();
  });

  let savedLanguage = "";
  try { savedLanguage = localStorage.getItem(STORAGE_KEY) || ""; } catch (_) {}
  if (savedLanguage && copy[savedLanguage]) showWelcome(savedLanguage);
  else showLanguagePicker();
})();
