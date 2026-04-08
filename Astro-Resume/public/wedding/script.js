// =========================================================
// TRANSLATIONS
// =========================================================
const TRANSLATIONS = {
  en: {
    pageTitle:       'WeddingCamBox \u2014 Capture Every Moment',
    navHowItWorks:   'How it works',
    navCameras:      'The cameras',
    navPricing:      'Pricing',
    navGallery:      'Your gallery',
    navGalleryLogin: 'My gallery login',
    navBookNow:      'Book now',
    heroEyebrow:     '10 cameras \u00b7 endless memories',
    heroTitle:       'Let your guests<br />tell your story',
    heroSubtitle:    'Rent our set of 10 thumb-sized cameras for your wedding reception. Pass them around, and watch your day come to life through the eyes of the people you love most.',
    heroCtaPrimary:  'Check availability',
    heroCtaSecondary:'See how it works',
    heroCameraLabel: '10 cameras included in every rental',
    howTitle:        'How it works',
    howSubtitle:     'Three simple steps from booking to beautiful photos.',
    step1Title:      'Book your date',
    step1Desc:       "Fill in our booking form with your wedding date and we'll confirm availability within 24 hours.",
    step2Title:      'Receive the box',
    step2Desc:       'We ship all 10 cameras to you before your big day \u2014 pre-charged, ready to shoot, and easy to hand around.',
    step3Title:      'Send them back',
    step3Desc:       'After the reception, drop the cameras back in the prepaid return box. We extract and deliver all photos digitally within 5 days.',
    camTitle:        'The cameras',
    camSubtitle:     'Small enough to fit in a pocket. Powerful enough to capture the moment.',
    feat1Title:      '1080P HD photos & video',
    feat1Desc:       'Crisp, full HD resolution in every lighting condition \u2014 from golden-hour outdoor shots to the dance floor at midnight.',
    feat2Title:      'Thumb-sized & portable',
    feat2Desc:       "Each camera is literally pocket-sized \u2014 small enough that guests barely notice they're holding one, until the perfect moment happens.",
    feat3Title:      'Built-in HD screen',
    feat3Desc:       'A tiny built-in screen lets guests instantly review each shot \u2014 so they know they captured the moment before passing it on.',
    feat4Title:      'Pre-charged & ready',
    feat4Desc:       "Every camera arrives fully charged before your big day \u2014 no fiddling, no dead batteries, no technical knowledge required.",
    feat5Title:      'One-click shooting',
    feat5Desc:       'Dead-simple operation \u2014 a single button takes the photo. Any guest can pick one up and start shooting in seconds.',
    feat6Title:      '32 GB storage per camera',
    feat6Desc:       "Enough for approximately 6,700 photos per camera. That's over 67,000 shots across all 10 cameras combined.",
    pricingTitle:    'Choose your package',
    pricingSubtitle: 'All packages include 10 cameras and your photos delivered within 5 days.',
    pricingPeriod:   '/ wedding',
    pricingMostPopular: 'Most popular',
    pricingComingSoon:  'Coming soon',
    p1i1: '10 thumb-sized cameras',      p1i2: 'Pre-charged & ready to shoot',
    p1i3: 'Raw photo files delivered',   p1i4: 'Private download link',
    p1i5: 'No online gallery',           p1i6: 'No sorting or curation',
    p2i1: '10 thumb-sized cameras',      p2i2: 'Pre-charged & ready to shoot',
    p2i3: 'Online photo gallery',        p2i4: 'Photo curation before sharing',
    p2i5: 'Guest sharing link',          p2i6: 'Download in full resolution',
    p3i1: 'Everything in Standard',      p3i2: 'Custom branded camera labels',
    p3i3: 'Custom branded online portal',p3i4: 'Digital photobook creator',
    bookBasic:    'Book Basic',
    bookStandard: 'Book Standard',
    shippingNote: 'Add <strong>PostNL shipping</strong> (send &amp; return) to any package for <strong>+\u20ac15,00</strong> \u2014 or pick up in person for free.',
    pricingNote:  'Want extra cameras or a longer rental period? <a href="#contact">Get in touch</a> for a custom quote.',
    galleryTitle:    "Your photos, your way",
    gallerySubtitle: 'After the wedding, every shot from every camera lands in your own private portal.',
    ps1Title: 'Browse & curate',
    ps1Desc:  'All photos from all 10 cameras are automatically collected and uploaded to your private gallery \u2014 sorted and ready to explore.',
    ps2Title: "Delete what you don't want",
    ps2Desc:  'Not every shot is a keeper. Easily remove the blurry, unflattering, or duplicate photos before anyone else sees them.',
    ps3Title: 'Download in full resolution',
    ps3Desc:  'Save individual photos or the whole collection at full 1080P resolution \u2014 yours to keep, print, and treasure forever.',
    ps4Title: 'Share with your guests',
    ps4Desc:  "Once you're happy with the collection, generate a share link and send it to everyone who attended. They can browse and download their favourites too.",
    comingSoonBadge: 'Coming soon',
    comingSoonDesc:  "The full online portal is currently in development. For now, all photos are delivered as a private download link \u2014 we'll notify all customers as soon as it launches.",
    contactTitle:    'Check availability',
    contactSubtitle: "Fill in the form and we'll get back to you within 24 hours.",
    labelName:    'Your name',           labelEmail:   'Email address',
    labelDate:    'Wedding date',        labelGuests:  'Approximate guest count',
    labelMessage: 'Anything else we should know? (optional)',
    placeholderName:    'e.g. Emma de Vries',
    placeholderEmail:   'emma@example.com',
    placeholderGuests:  'e.g. 80',
    placeholderMessage: 'Venue, special requests, questions\u2026',
    submitBtn:   'Send booking request',
    formSuccess: "\ud83c\udf89 Thanks! We'll be in touch within 24 hours to confirm your date.",
    errName:         'Please enter your name.',
    errEmail:        'Please enter a valid email.',
    errDate:         'Please pick your wedding date.',
    errEmailInvalid: 'Please enter a valid email address.',
    errDatePast:     'Wedding date must be in the future.',
    footerTagline: 'Making wedding memories accessible for everyone.',
    footerCopy:    '\u00a9 2025 WeddingCamBox. All rights reserved.',
    faqTitle:    'Frequently asked questions',
    faqSubtitle: 'Everything you need to know before booking.',
    faq1Q: 'How much does wedding camera rental cost?',
    faq1A: 'The <strong>Basic package</strong> starts at <strong>\u20ac89</strong> and includes 10 cameras and raw photo files on a private download link. The <strong>Standard package</strong> is <strong>\u20ac119</strong> and adds an online gallery, curation, and a guest sharing link. PostNL shipping (send &amp; return) is optional at +\u20ac15, or pick up in person for free.',
    faq2Q: 'How many cameras do I get, and how long is the battery?',
    faq2A: 'Every package includes <strong>10 pocket-sized 1080P cameras</strong>, each pre-charged and loaded with a 32 GB memory card \u2014 enough for approximately 6,700 photos per camera (over 67,000 across all 10). Batteries last a full reception without needing to recharge.',
    faq3Q: 'How do I receive my photos after the wedding?',
    faq3A: 'After your reception, place all 10 cameras back in the prepaid return box and drop it at any PostNL point. We extract every photo and deliver them digitally <strong>within 5 business days</strong> \u2014 as a private download link (Basic) or a private online gallery you can curate and share (Standard).',
    faq4Q: 'What if a camera gets damaged or lost?',
    faq4A: 'Accidents happen at weddings \u2014 we understand. Normal wear is covered. In case of damage beyond normal use or loss of a camera, a replacement fee of <strong>\u20ac45 per camera</strong> applies. We recommend keeping the cameras at the reception table when not in use and briefing a trusted guest to collect them at the end of the night.',
    faq5Q: 'Is this a replacement for a professional wedding photographer?',
    faq5A: 'WeddingCamBox is not a replacement for a professional photographer \u2014 it\'s a <strong>fun and affordable complement</strong>. It captures candid, spontaneous moments from your guests\u2019 perspective: the laughs between speeches, the dance floor from inside the crowd, the quiet moments a photographer would miss. Many couples use it alongside their photographer for a complete picture of the day.',
    faq6Q: 'Can I get more than 10 cameras, or rent for multiple days?',
    faq6A: 'Yes! <a href="#contact">Get in touch</a> for a custom quote if you need extra cameras (e.g. for a large venue or multi-day event) or a longer rental period.',
  },
  nl: {
    pageTitle:       'WeddingCamBox — Jullie dag, door de ogen van jullie gasten',
    navHowItWorks:   'Hoe het werkt',
    navCameras:      'De camera\u2019s',
    navPricing:      'Tarieven',
    navGallery:      'Jouw galerij',
    navGalleryLogin: 'Mijn galerij',
    navBookNow:      'Boek nu',
    heroEyebrow:     '10 camera\u2019s \u00b7 onvergetelijke momenten',
    heroTitle:       'Laat je gasten<br />jullie dag vastleggen',
    heroSubtitle:    'Huur een set van 10 compacte camera\u2019s voor jullie trouwreceptie. Laat de gasten de dag fotograferen \u2014 spontaan, vol echte emoties, en door de ogen van de mensen die het dichtst bij jullie staan.',
    heroCtaPrimary:  'Bekijk de beschikbaarheid',
    heroCtaSecondary:'Zo werkt het',
    heroCameraLabel: 'Bij elke boeking 10 camera\u2019s inbegrepen',
    howTitle:        'Hoe het werkt',
    howSubtitle:     'Drie simpele stappen van boeking tot prachtige herinneringen.',
    step1Title:      'Reserveer jullie datum',
    step1Desc:       'Vul het aanvraagformulier in met jullie trouwdatum en we bevestigen de beschikbaarheid binnen 24 uur.',
    step2Title:      'Ontvang de cameradoos',
    step2Desc:       'We sturen alle 10 camera\u2019s kant-en-klaar op v\u00f3\u00f3r jullie grote dag \u2014 opgeladen, voorzien van instructies en direct klaar voor gebruik.',
    step3Title:      'Stuur ze terug',
    step3Desc:       'Na de receptie gaan de camera\u2019s terug in de meegeleverde retourbox. Binnen 5 werkdagen zijn alle foto\u2019s digitaal beschikbaar.',
    camTitle:        'De camera\u2019s',
    camSubtitle:     'Klein genoeg voor in een zak. Krachtig genoeg om elk bijzonder moment vast te leggen.',
    feat1Title:      '1080P HD foto\u2019s & video',
    feat1Desc:       'Heldere, scherpe beelden in elke lichtomstandigheid \u2014 van de eerste dans in het avondlicht tot de dansvloer laat in de nacht.',
    feat2Title:      'Compact & makkelijk door te geven',
    feat2Desc:       'Elke camera past in een broekzak. Klein genoeg om vlot door te geven, groot genoeg om het moment van de avond vast te leggen.',
    feat3Title:      'Ingebouwd display',
    feat3Desc:       'Met het ingebouwde schermpje kunnen gasten hun foto\u2019s meteen bekijken \u2014 zodat ze zeker weten dat de foto gelukt is v\u00f3\u00f3r ze de camera doorgeven.',
    feat4Title:      'Volledig opgeladen geleverd',
    feat4Desc:       'Alle camera\u2019s komen volledig opgeladen aan. Geen gedoe met opladers of batterijen \u2014 gewoon instappen en fotograferen.',
    feat5Title:      'Fotograferen met \u00e9\u00e9n druk op de knop',
    feat5Desc:       'Zo eenvoudig dat iedereen het kan \u2014 van opa en oma tot de jongste bruidskinderen. \u00c9\u00e9n knop, en de foto is gemaakt.',
    feat6Title:      '32 GB geheugen per camera',
    feat6Desc:       'Ruimte voor zo\u2019n 6.700 foto\u2019s per camera. Samen goed voor meer dan 67.000 vastgelegde momenten over de hele bruiloft.',
    pricingTitle:    'Kies het pakket dat bij jullie past',
    pricingSubtitle: 'Elk pakket bevat 10 camera\u2019s en jullie foto\u2019s binnen 5 dagen digitaal geleverd.',
    pricingPeriod:   '/ bruiloft',
    pricingMostPopular: 'Meest gekozen',
    pricingComingSoon:  'Binnenkort',
    p1i1: '10 compacte camera\u2019s',       p1i2: 'Volledig opgeladen & gebruiksklaar',
    p1i3: 'Alle foto\u2019s als digitale bestanden', p1i4: 'Priv\u00e9 downloadlink',
    p1i5: 'Geen online galerij',           p1i6: 'Geen selectie of bewerking',
    p2i1: '10 compacte camera\u2019s',       p2i2: 'Volledig opgeladen & gebruiksklaar',
    p2i3: 'Persoonlijke online fotogalerij', p2i4: 'Foto\u2019s vooraf gecureerd door ons',
    p2i5: 'Deellink voor al je gasten',    p2i6: 'Downloaden in originele kwaliteit',
    p3i1: 'Alles uit Standard',            p3i2: 'Gepersonaliseerde camera-instructies',
    p3i3: 'Gepersonaliseerde online galerij', p3i4: 'Digitaal fotoboek samenstellen',
    bookBasic:    'Kies Basic',
    bookStandard: 'Kies Standard',
    shippingNote: 'Voeg <strong>PostNL-verzending</strong> (heen &amp; retour) toe voor <strong>+\u20ac15,00</strong> \u2014 of gratis ophalen op afspraak.',
    pricingNote:  'Meer camera\u2019s nodig of een langere huurperiode? <a href="#contact">Neem contact op</a> voor een offerte op maat.',
    galleryTitle:    'Jouw foto\u2019s, jouw keuze',
    gallerySubtitle: 'Na de bruiloft komen alle opnames automatisch samen in jullie persoonlijke online galerij.',
    ps1Title: 'Bekijk alle foto\u2019s',
    ps1Desc:  'Alle foto\u2019s van alle 10 camera\u2019s worden automatisch verzameld in jullie persoonlijke omgeving \u2014 overzichtelijk gesorteerd en direct klaar om te bekijken.',
    ps2Title: 'Verwijder wat je liever niet deelt',
    ps2Desc:  'Niet elke foto is raak. Haal wazige of minder geslaagde opnames eenvoudig weg v\u00f3\u00f3rdat je de galerij deelt met je gasten.',
    ps3Title: 'Download in originele kwaliteit',
    ps3Desc:  'Sla afzonderlijke foto\u2019s of de complete collectie op in de originele resolutie \u2014 om in te lijsten, te printen of voor altijd te bewaren.',
    ps4Title: 'Deel met al je gasten',
    ps4Desc:  'Blij met het resultaat? Stuur een deellink naar al je gasten zodat ook zij hun favorieten kunnen bekijken en downloaden.',
    comingSoonBadge: 'Binnenkort beschikbaar',
    comingSoonDesc:  'De online galerij is momenteel in ontwikkeling. Voor nu ontvang je alle foto\u2019s via een persoonlijke downloadlink \u2014 we laten het je weten zodra de galerij live staat.',
    contactTitle:    'Check jullie datum',
    contactSubtitle: 'Vul het formulier in en we reageren binnen 24 uur.',
    labelName:    'Jouw naam',           labelEmail:   'E-mailadres',
    labelDate:    'Trouwdatum',          labelGuests:  'Aantal gasten (schatting)',
    labelMessage: 'Nog iets wat we moeten weten? (optioneel)',
    placeholderName:    'bijv. Emma de Vries',
    placeholderEmail:   'emma@voorbeeld.nl',
    placeholderGuests:  'bijv. 80',
    placeholderMessage: 'Locatie, wensen, vragen\u2026',
    submitBtn:   'Aanvraag versturen',
    formSuccess: '\ud83c\udf89 Gelukt! We nemen binnen 24 uur contact op om jullie datum te bevestigen.',
    errName:         'Vul je naam in.',
    errEmail:        'Vul een geldig e-mailadres in.',
    errDate:         'Vul je trouwdatum in.',
    errEmailInvalid: 'Dit e-mailadres lijkt niet te kloppen.',
    errDatePast:     'De trouwdatum moet in de toekomst liggen.',
    footerTagline: 'Elke bruiloft verdient de mooiste herinneringen.',
    footerCopy:    '\u00a9 2025 WeddingCamBox. Alle rechten voorbehouden.',
    faqTitle:    'Veelgestelde vragen',
    faqSubtitle: 'Alles wat je wil weten voordat je boekt.',
    faq1Q: 'Wat kost het huren van bruiloftscamera\u2019s?',
    faq1A: 'Het <strong>Basispakket</strong> start vanaf <strong>\u20ac89</strong> en bevat 10 camera\u2019s plus alle foto\u2019s op een priv\u00e9 downloadlink. Het <strong>Standaardpakket</strong> kost <strong>\u20ac119</strong> en voegt een online galerij, curatie en een deellink voor gasten toe. PostNL-verzending (heen &amp; retour) is optioneel voor +\u20ac15, of haal de camera\u2019s gratis op.',
    faq2Q: 'Hoeveel camera\u2019s krijg ik en hoe lang gaat de batterij mee?',
    faq2A: 'Elk pakket bevat <strong>10 compacte 1080P-camera\u2019s</strong>, elk voorgeladen en voorzien van een 32 GB geheugenkaart \u2014 goed voor circa 6.700 foto\u2019s per camera (meer dan 67.000 in totaal). De batterijen gaan een volledige receptie mee zonder opladen.',
    faq3Q: 'Hoe ontvang ik mijn foto\u2019s na de bruiloft?',
    faq3A: 'Na de receptie leg je alle 10 camera\u2019s terug in de retourbox en drop je deze bij een PostNL-punt. Wij halen alle foto\u2019s eraf en leveren ze digitaal <strong>binnen 5 werkdagen</strong> \u2014 als priv\u00e9 downloadlink (Basis) of als een priv\u00e9 online galerij die je kunt cureren en delen (Standaard).',
    faq4Q: 'Wat als een camera beschadigd raakt of verloren gaat?',
    faq4A: 'Ongelukjes horen bij een bruiloft \u2014 dat begrijpen we. Normale slijtage is gedekt. Bij schade buiten normaal gebruik of verlies van een camera geldt een vervangingsvergoeding van <strong>\u20ac45 per camera</strong>. We raden aan de camera\u2019s op de receptietafel te bewaren als ze niet in gebruik zijn en een vertrouwde gast te vragen ze aan het einde van de avond te verzamelen.',
    faq5Q: 'Is dit een vervanging voor een professionele trouwfotograaf?',
    faq5A: 'WeddingCamBox is geen vervanging voor een professionele fotograaf \u2014 het is een <strong>leuke en betaalbare aanvulling</strong>. Het legt spontane, ongedwongen momenten vast vanuit het perspectief van je gasten: de lach tussen toespraken, de dansvloer van binnenuit, de stille momenten die een fotograaf zou missen. Veel koppels combineren het met hun fotograaf voor een compleet beeld van de dag.',
    faq6Q: 'Kan ik meer dan 10 camera\u2019s huren of voor meerdere dagen?',
    faq6A: 'Jazeker! <a href="#contact">Neem contact op</a> voor een offerte op maat als je extra camera\u2019s nodig hebt (bijv. voor een grote locatie of meerdaags evenement) of een langere huurperiode wil.',
  }
};
// =========================================================
// LANGUAGE / i18n
// =========================================================
let currentLang = 'en';

function detectLanguage() {
  const stored = localStorage.getItem('wcb_lang');
  if (stored === 'en' || stored === 'nl') return stored;
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('nl') ? 'nl' : 'en';
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('wcb_lang', lang);
  document.documentElement.lang = lang;
  document.title = TRANSLATIONS[lang].pageTitle;
  applyTranslations(lang);
  updateLangButtons(lang);
}

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = t[el.dataset.i18nHtml];
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const v = t[el.dataset.i18nPlaceholder];
    if (v !== undefined) el.placeholder = v;
  });
}

function updateLangButtons(lang) {
  document.querySelectorAll('.lang-switch__btn').forEach(btn => {
    btn.classList.toggle('lang-switch__btn--active', btn.dataset.lang === lang);
  });
}

// Attach click handlers to ALL lang switch buttons (desktop + mobile)
document.querySelectorAll('.lang-switch__btn').forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

// Auto-detect on load
setLanguage(detectLanguage());

// =========================================================
// STICKY NAV
// =========================================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// =========================================================
// MOBILE MENU
// =========================================================
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// =========================================================
// BOOKING FORM VALIDATION
// =========================================================
const form       = document.getElementById('bookingForm');
const successMsg = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  const t = TRANSLATIONS[currentLang];

  const fields = [
    { id: 'name',  errorId: 'nameError',  msg: t.errName  },
    { id: 'email', errorId: 'emailError', msg: t.errEmail },
    { id: 'date',  errorId: 'dateError',  msg: t.errDate  },
  ];

  fields.forEach(({ id, errorId, msg }) => {
    const input          = document.getElementById(id);
    const error          = document.getElementById(errorId);
    const isEmpty        = !input.value.trim();
    const isInvalidEmail = id === 'email' && !isEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    const isPastDate     = id === 'date'  && !isEmpty && new Date(input.value) < new Date();

    if (isEmpty || isInvalidEmail || isPastDate) {
      input.classList.add('invalid');
      error.textContent = isInvalidEmail ? t.errEmailInvalid
                        : isPastDate     ? t.errDatePast
                        : msg;
      valid = false;
    } else {
      input.classList.remove('invalid');
      error.textContent = '';
    }
  });

  if (!valid) return;

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled    = true;
  submitBtn.textContent = currentLang === 'nl' ? 'Versturen\u2026' : 'Sending\u2026';

  // Save booking request to localStorage for the admin portal
  const request = {
    id:          'req_' + Date.now(),
    name:        document.getElementById('name').value.trim(),
    email:       document.getElementById('email').value.trim(),
    date:        document.getElementById('date').value,
    guests:      document.getElementById('guests').value || '',
    package:     document.getElementById('package').value,
    message:     document.getElementById('message').value.trim(),
    submittedAt: new Date().toISOString(),
    status:      'pending',
  };
  const existing = JSON.parse(localStorage.getItem('wcb_booking_requests') || '[]');
  existing.push(request);
  localStorage.setItem('wcb_booking_requests', JSON.stringify(existing));

  setTimeout(() => {
    form.reset();
    submitBtn.style.display = 'none';
    successMsg.classList.add('visible');
    successMsg.textContent = TRANSLATIONS[currentLang].formSuccess;
  }, 900);
});

form.querySelectorAll('input, textarea').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('invalid');
    const errorEl = document.getElementById(input.id + 'Error');
    if (errorEl) errorEl.textContent = '';
  });
});

// =========================================================
// SCROLL REVEAL
// =========================================================
const revealEls = document.querySelectorAll('.step, .feature, .pricing-card, .quote, .portal-step, .portal-coming-soon');
const observer  = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});