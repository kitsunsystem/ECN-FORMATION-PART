/* ECN Group — Espace Formation (maquette démo) : catalogue, accès par pack, motion */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").toLowerCase();
  const key = s => norm(s).replace(/[^a-z]/g, '');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const lite = matchMedia('(max-width: 980px), (pointer: coarse)').matches; // mobile/tablette : animations allégées
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const Flip = window.Flip;
  const anim = !!(G && ST && Flip) && !reduce;
  if (anim) G.registerPlugin(ST, Flip);
  const root = document.documentElement;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ecnf:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ecnf:' + k, JSON.stringify(v)); } catch { /* stockage indisponible : la démo reste utilisable */ } }
  };

  /* ---------- Données ---------- */
  const COURSES = (window.ECN_COURSES || []).map((c, id) => ({ ...c, id }));
  const CATS = [...new Set(COURSES.map(c => c.c))].sort((a, b) => a.localeCompare(b, 'fr'));

  const ICONS = {
    bureautique: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    caodao: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 16 9 5 9-5M3 12l9 5 9-5"/>',
    comptabilitepaie: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',
    developpementpersonnel: '<path d="m12 3 2.6 5.6 5.4.7-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z"/>',
    developpementweb: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
    infographievideo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
    langues: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    managementrh: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5.5"/>',
    productivite: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    reconversion: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
    securite: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    ventemarketingdigital: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>'
  };
  const icon = cat => ICONS[key(cat)] || ICONS.productivite;
  const SVG = {
    lock: '<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>'
  };

  const CAT_DESC = {
    bureautique: 'Maîtrisez les outils du quotidien pour gagner en efficacité : documents, tableaux, présentations et collaboration en ligne.',
    caodao: 'Concevez, modélisez et présentez vos projets techniques avec les logiciels de référence du secteur.',
    comptabilitepaie: 'Des règles fondamentales aux cas pratiques : sécurisez la comptabilité et la paie de votre structure.',
    developpementpersonnel: 'Développez votre impact : communication, confiance en soi, gestion des émotions et leadership personnel.',
    developpementweb: 'Créez des sites et applications modernes, du premier code aux frameworks professionnels.',
    infographievideo: 'Montage, animation, graphisme : donnez vie à vos idées avec les outils créatifs des pros.',
    langues: 'Progressez à votre rythme avec des parcours structurés par niveau, du A1 au C2.',
    managementrh: 'Recrutez, motivez et faites grandir vos équipes avec des méthodes éprouvées.',
    productivite: 'Organisez, automatisez et exploitez l’IA pour accomplir plus, en moins de temps.',
    reconversion: 'Un parcours concret pour lancer une nouvelle activité ou changer de métier en confiance.',
    securite: 'Protégez votre entreprise, vos données et vos clients grâce aux bons réflexes.',
    ventemarketingdigital: 'Attirez, convertissez et fidélisez : les leviers de vente et de marketing digital qui fonctionnent.'
  };

  // Programme réel de la formation Outlook (snapshot LE CUBE), les autres sont générés.
  const OUTLOOK_KEY = norm('Outlook sur le Web avec Microsoft 365');
  const OUTLOOK = {
    desc: 'Avec cette formation vous apprendrez à optimiser votre productivité en gérant efficacement vos emails, calendriers, contacts et tâches. Grâce à des démonstrations pratiques, vous découvrirez comment naviguer dans Microsoft 365, planifier des réunions et utiliser des outils avancés comme Bookings et Microsoft Loop pour une collaboration efficace.',
    goals: ['Maîtriser Outlook sur le web avec Microsoft 365', 'Optimiser l’organisation et la productivité dans Microsoft 365', 'Gérer efficacement les emails, calendriers, contacts et tâches', 'Planifier des réunions et utiliser les outils intégrés', 'Explorer les fonctionnalités avancées comme Bookings et Microsoft Loop'],
    parts: [
      ['Introduction', ['Présentation de la formation Outlook sur le web avec Microsoft 365', 'Qu’est-ce qu’Outlook', 'Se connecter à Microsoft 365 ou à Outlook Microsoft 365', '?Test de positionnement']],
      ['Découverte Outlook web', ['Se connecter à Microsoft 365 ou Outlook Microsoft 365', 'Se repérer dans Microsoft 365', 'Se repérer dans Outlook en ligne']],
      ['Utilisation de Courrier', ['Envoyer et répondre à un message', 'Les différentes façons de transférer un message', 'Planifier l’envoi d’un message', 'Envoyer un fichier en pièce jointe et le partager de manière sécurisée', 'Créer et ajouter une signature à un message', 'Utiliser les accusés de lecture et de réception', 'Repérer un message avec l’indicateur ou le mettre en non lu', 'Utiliser les dossiers pour classer les emails', 'Configurer les actions rapides', 'Créer et planifier un message d’absence', 'Gérer le regroupement des messages', 'Mentionner un destinataire', 'Envoyer un message Teams à partir d’Outlook', '?Quiz de la partie 1']],
      ['Gestion de mon planning', ['Les repères à avoir dans le calendrier Outlook', 'Planifier une réunion', 'Afficher un calendrier en disponibilité', 'Partager un calendrier']],
      ['Planification grâce à Bookings', ['Qu’est-ce que Microsoft Bookings', 'Accéder à Bookings', 'Paramétrer une réservation', 'Partager une page de réservation personnelle', 'Créer un agenda de réservation pour une équipe', '?Quiz de la partie 2']],
      ['Organisation de tâches avec To Do', ['Créer des tâches dans To Do', 'Organiser les tâches grâce aux groupes et aux listes', 'Ajouter les courriers avec indicateurs dans To Do', 'Partager une tâche']],
      ['Contacts', ['Se repérer dans Contacts', 'Créer un contact', 'Créer une liste de contacts']],
      ['Découvrir Loop', ['Qu’est-ce que Microsoft Loop', 'Créer un composant Loop à partir d’Outlook', '?Quiz de la partie 3']],
      ['Conclusion', ['Conclusion générale']]
    ]
  };

  const TIERS = {
    initie: { name: 'Pack Initié', tag: 'Accès Essentiel', desc: 'Socle de formations de base inclus dans votre pack.', eyebrow: 'Pack Initié · Accès essentiel', hours: 3, certs: 0, toast: 'Mode Pack Initié : accès limité aux formations de base' },
    membre: { name: 'Pack Membre', tag: 'Golden Card', desc: 'Vous avez accès à l’ensemble du catalogue.', eyebrow: 'Pass Illimité · Actif', hours: 14, certs: 2, toast: 'Mode Membre : accès premium à tout le catalogue' },
    fondateur: { name: 'Cercle Fondateur', tag: 'Fondateur', desc: 'Accès total, avant-premières et cercle privé.', eyebrow: 'Cercle Fondateur · Accès total', hours: 21, certs: 4, toast: 'Cercle Fondateur : accès total et thème signature' }
  };
  let tier = store.get('tier', 'membre');
  if (!TIERS[tier]) tier = 'membre';
  root.dataset.tier = tier;
  const canAccess = c => tier !== 'initie' || c.i === 1;

  // Progression démo (chapitres terminés par formation)
  const SEED = [['Outlook sur le Web avec Microsoft 365', 2], ['Claude AI : de la découverte aux usages professionnels', 18], ['Initiation à l’Intelligence Artificielle', 35],
    ['Maîtrisez CapCut de A à Z', 64], ['Gestion du stress', 60], ['Prompt engineering : des bases aux techniques avancées', 41],
    ['Power BI : de débutant à expérimenté', 77], ['Adobe After Effects pour animer des vidéos avec des effets avancés', 9]];
  const byKey = new Map(COURSES.map(c => [norm(c.t), c]));
  const prog = store.get('prog', null) || {};
  const order = store.get('order', null) || [];
  if (!store.get('prog', null)) {
    SEED.forEach(([t, p]) => { const c = byKey.get(norm(t)); if (c) { prog[c.id] = Math.max(1, Math.round(p * c.ch / 100)); order.push(c.id); } });
  }
  const pct = c => Math.min(100, Math.round((prog[c.id] || 0) / c.ch * 100));
  const favs = new Set(store.get('favs', []));
  const resumeList = () => order.map(id => COURSES[id]).filter(c => c && prog[c.id] && canAccess(c));

  /* ---------- Helpers UI ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  const ring = p => `<div class="ring" data-p="${p}"><svg viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="32"/><circle class="fg" cx="40" cy="40" r="32"/></svg><b>${p}%</b></div>`;
  function animateRings(scope) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.ring', scope).forEach(r => { r.querySelector('.fg').style.strokeDashoffset = 201 * (1 - r.dataset.p / 100); });
    }));
  }

  const thumb = c => c.img
    ? `<img src="assets/courses/${c.img}" alt="" loading="lazy" decoding="async">`
    : `<div class="fallback" style="--c:${c.col}"><svg viewBox="0 0 24 24">${icon(c.c)}</svg><b>${esc(c.c)}</b></div>`;

  function cardHTML(c) {
    const p = pct(c);
    return `<article class="card${canAccess(c) ? '' : ' is-locked'}" data-id="${c.id}" style="--c:${c.col}" tabindex="0" aria-label="${esc(c.t)}">
      <div class="card-in">
        <div class="card-thumb">${thumb(c)}
          <div class="card-badges">${c.id < 2 ? '<span class="badge new">Nouveau</span>' : ''}${c.id < 5 ? '<span class="badge vip">Avant-première</span>' : ''}
            <button class="fav${favs.has(c.id) ? ' is-on' : ''}" data-fav="${c.id}" aria-pressed="${favs.has(c.id)}" aria-label="Ajouter aux favoris">${SVG.heart}</button></div>
          <div class="lock"><div class="lock-ico">${SVG.lock}</div><span>Réservé Membre</span></div>
        </div>
        <div class="card-body">
          <p class="card-cat">${esc(c.c)}</p>
          <h3>${esc(c.t)}</h3>
          <div class="card-meta"><span>${SVG.clock}${c.d}</span><span>${SVG.layers}${c.ch} chapitres</span><span>${c.l}</span>${c.r ? '<span class="star">★ 5,0</span>' : ''}</div>
          <div class="card-prog"><div class="bar"><i style="width:${p}%"></i></div><span>${p}%</span></div>
        </div>
        <div class="card-glare"></div>
      </div>
    </article>`;
  }

  /* ---------- Tilt 3D + reflets (délégué) ---------- */
  function bindTilt(scope, sel, max, inner) {
    if (!fine || reduce) return;
    scope.addEventListener('pointermove', e => {
      const host = e.target.closest(sel);
      if (!host) return;
      const el = inner ? host.querySelector(inner) : host;
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - .5) * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((.5 - y) * max).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      el.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
    });
    scope.addEventListener('pointerout', e => {
      const host = e.target.closest(sel);
      if (!host || host.contains(e.relatedTarget)) return;
      const el = inner ? host.querySelector(inner) : host;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Catégories & marquee ---------- */
  function renderCats() {
    $('#catGrid').innerHTML = CATS.map(cat => {
      const col = COURSES.find(c => c.c === cat).col;
      return `<button class="cat" data-cat="${esc(cat)}" style="--c:${col}">
        <span class="cat-ico"><svg viewBox="0 0 24 24">${icon(cat)}</svg></span>
        <span class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
        <span class="cat-text"><span class="cat-name">${esc(cat)}</span><span class="cat-count"></span><span class="cat-meter"><i></i></span></span>
      </button>`;
    }).join('');
    $('#marquee').innerHTML = [...CATS, ...CATS].map(c => `<span>${esc(c)}</span><i></i>`).join('');
    $('#fCat').insertAdjacentHTML('beforeend', CATS.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join(''));
    $('#catChips').innerHTML = `<button class="chip is-active" data-chip="">Toutes les catégories</button>` +
      CATS.map(c => `<button class="chip" data-chip="${esc(c)}">${esc(c)}<small></small></button>`).join('');
  }
  function updateCats() {
    $$('.cat').forEach(el => {
      const list = COURSES.filter(c => c.c === el.dataset.cat);
      const acc = list.filter(canAccess).length;
      el.querySelector('.cat-count').textContent = tier === 'initie' ? `${acc} / ${list.length} accessibles` : `${list.length} formations`;
      el.querySelector('.cat-meter i').style.width = (acc / list.length * 100) + '%';
    });
    $$('.chip[data-chip]').forEach(ch => {
      if (!ch.dataset.chip) return;
      const list = COURSES.filter(c => c.c === ch.dataset.chip);
      ch.querySelector('small').textContent = tier === 'initie' ? `${list.filter(canAccess).length}/${list.length}` : list.length;
    });
  }

  /* ---------- Reprendre ---------- */
  function renderResume() {
    const list = resumeList();
    $('#resumeRail').innerHTML = list.length ? list.map(c => `<button class="resume" data-id="${c.id}">
        ${ring(pct(c))}
        <span class="resume-body"><small>${esc(c.c)}</small><span class="r-title">${esc(c.t)}</span><span class="r-sub">${prog[c.id]} / ${c.ch} chapitres</span></span>
        <span class="resume-go">${SVG.next}</span>
      </button>`).join('') : '<p class="empty">Commencez une formation : elle apparaîtra ici.</p>';
    animateRings($('#resumeRail'));
  }

  /* ---------- Catalogue (filtres + Flip) ---------- */
  const grid = $('#grid');
  grid.innerHTML = COURSES.map(cardHTML).join('');
  const cardEls = $$('.card', grid);
  const state = { cat: '', level: '', dur: '', sort: 'new', q: '', mine: false, limit: 24 };
  const hoursOf = c => { const m = c.d.match(/(\d+)h(\d+)?/); return m ? +m[1] + (m[2] ? +m[2] / 60 : 0) : 1; };

  function matches(c) {
    if (state.cat && c.c !== state.cat) return false;
    if (state.level && c.l !== state.level) return false;
    if (state.dur) {
      const h = hoursOf(c);
      if ((state.dur === 's' && h >= 2) || (state.dur === 'm' && (h < 2 || h > 5)) || (state.dur === 'l' && h <= 5)) return false;
    }
    if (state.mine && !canAccess(c)) return false;
    if (state.q && !norm(c.t + ' ' + c.c).includes(norm(state.q.trim()))) return false;
    return true;
  }
  function sorter(a, b) {
    if (tier === 'initie' && canAccess(a) !== canAccess(b)) return canAccess(a) ? -1 : 1; // l'accessible d'abord
    if (state.sort === 'az') return a.t.localeCompare(b.t, 'fr');
    if (state.sort === 'prog') return pct(b) - pct(a) || a.id - b.id;
    return a.id - b.id;
  }

  function applyFilters(animate = true) {
    const list = COURSES.filter(matches).sort(sorter);
    const shown = new Set(list.slice(0, state.limit).map(c => c.id));
    const flipState = anim && animate ? Flip.getState(cardEls) : null;
    list.forEach(c => grid.appendChild(cardEls[c.id]));
    cardEls.forEach(el => { el.hidden = !shown.has(+el.dataset.id); });
    $('#resultCount').textContent = list.length;
    $('#emptyState').hidden = list.length > 0;
    $('.more').hidden = list.length <= state.limit;
    if (flipState) {
      Flip.from(flipState, {
        duration: .8, ease: 'expo.out', absolute: true, stagger: .008, nested: true,
        onEnter: els => G.fromTo(els, { opacity: 0, scale: .82, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: .8, stagger: .025, ease: 'expo.out' }),
        onLeave: els => G.to(els, { opacity: 0, scale: .82, duration: .35, ease: 'power2.in' }),
        onComplete: () => ST.refresh()
      });
    } else if (anim) ST.refresh(); // l'ordre a changé : recalcule les déclencheurs de reveal
  }

  function setLocks() {
    cardEls.forEach(el => el.classList.toggle('is-locked', !canAccess(COURSES[+el.dataset.id])));
  }
  function refreshCardProgress(c) {
    $$(`.card[data-id="${c.id}"]`).forEach(el => {
      el.querySelector('.card-prog .bar i').style.width = pct(c) + '%';
      el.querySelector('.card-prog span').textContent = pct(c) + '%';
    });
  }

  /* ---------- Favoris ---------- */
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    store.set('favs', [...favs]);
    const on = favs.has(id);
    $$(`.fav[data-fav="${id}"]`).forEach(b => {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
      if (anim) G.fromTo(b, { scale: .6 }, { scale: 1, duration: .7, ease: 'elastic.out(1,.4)' });
    });
    setFavCount();
    $$('[data-course-fav]').forEach(b => { b.textContent = on ? '♥ Dans vos favoris' : '♡ Ajouter aux favoris'; });
    toast(on ? 'Ajoutée à vos favoris' : 'Retirée de vos favoris');
    if (view === 'favoris') renderFavs();
  }
  function setFavCount() {
    $('#favCount').textContent = $('#favCountM').textContent = favs.size;
    $('#favCountM').hidden = !favs.size;
  }
  function renderFavs() {
    const list = [...favs].map(id => COURSES[id]).filter(Boolean);
    $('#favGrid').innerHTML = list.map(cardHTML).join('');
    $('#favEmpty').hidden = list.length > 0;
  }

  /* ---------- Fiche formation ---------- */
  function curriculum(c) {
    const toLessons = (arr, i) => arr.map((t, j) => ({ t: t[0] === '?' ? t.slice(1) : `${i + 1}.${j + 1}. ${t}`, q: t[0] === '?' }));
    if (norm(c.t) === OUTLOOK_KEY) return OUTLOOK.parts.map(([name, arr], i) => ({ name, lessons: toLessons(arr, i) }));
    const T = ['Les notions clés', 'Prise en main pas à pas', 'Vocabulaire et repères', 'Exercice guidé', 'Étude de cas réel', 'Méthodes et bonnes pratiques', 'Atelier pratique', 'Erreurs fréquentes à éviter', 'Astuces de pro', 'Techniques avancées', 'Optimiser son efficacité', 'Mise en situation'];
    const mid = Math.max(3, c.ch - 5), a = Math.ceil(mid * .4), b = Math.ceil(mid * .35);
    const counts = [3, a, b, Math.max(1, mid - a - b), 2];
    const names = ['Introduction générale', 'Les fondamentaux', 'Mise en pratique', 'Aller plus loin', 'Conclusion générale'];
    return names.map((name, i) => {
      let arr = Array.from({ length: counts[i] }, (_, j) =>
        i === 0 ? ['Présentation de la formation', 'Objectifs et déroulé', '?Test de positionnement'][j]
          : i === 4 ? ['Synthèse et ressources', '?Évaluation finale'][j]
            : T[(j + i * 4) % T.length] + (j >= T.length ? ` (${Math.floor(j / T.length) + 1})` : ''));
      if (i > 0 && i < 4) arr = [...arr, `?Quiz de la partie ${i}`];
      return { name, lessons: toLessons(arr, i) };
    });
  }
  const flatLessons = c => curriculum(c).flatMap(p => p.lessons).filter(l => !l.q);
  const nextLesson = c => { const l = flatLessons(c); return (l[Math.min(prog[c.id] || 0, l.length - 1)] || { t: 'Introduction' }).t; };

  let current = null, lastFrom = null;
  function fillCourse(c) {
    current = c;
    const ok = canAccess(c), p = pct(c), done = prog[c.id] || 0;
    const isOutlook = norm(c.t) === OUTLOOK_KEY;
    const desc = isOutlook ? OUTLOOK.desc : `${CAT_DESC[key(c.c)] || ''} Cette formation « ${c.t} » se suit entièrement en ligne, en vidéo, à votre rythme.`;
    const goals = isOutlook ? OUTLOOK.goals : [`Comprendre les fondamentaux de : ${c.t}`, 'Appliquer les méthodes sur des cas concrets', 'Gagner en autonomie et en efficacité au quotidien', 'Valider vos acquis avec des quiz et une évaluation finale'];

    $('#courseMedia').innerHTML = thumb(c);
    $('#courseCrumbs').innerHTML = `<span>Accueil</span><span>›</span><span>${esc(c.c)}</span><span>›</span><b>${esc(c.t)}</b>`;
    $('#courseTitle').textContent = c.t;
    $('#courseLead').textContent = isOutlook ? desc.slice(0, 190) + '…' : desc;
    $('#courseMeta').innerHTML = ['1 module', `${c.ch} chapitres`, 'Attestation de formation', `Niveau ${c.l}`, `Durée : ${c.d} environ`].map(m => `<li>${m}</li>`).join('');
    $('#courseActions').innerHTML = ok
      ? `<button class="btn btn-gold" data-play>${SVG.play}<span>${done ? 'Continuer la formation' : 'Commencer la formation'}</span></button>
         <button class="btn btn-ghost" data-course-fav>${favs.has(c.id) ? '♥ Dans vos favoris' : '♡ Ajouter aux favoris'}</button>`
      : `<button class="btn btn-gold" data-open-upgrade>${SVG.lock}<span>Débloquer avec le Pack Membre</span></button>
         <button class="btn btn-ghost" data-goto-tab="content">Aperçu du programme</button>`;
    $('#courseProgress').innerHTML = ok
      ? `${ring(p)}<dl><div><dt>Progression</dt><dd>${done} / ${c.ch} chapitres</dd></div><div><dt>Dernière activité</dt><dd>${done ? `Il y a ${(c.id % 5) + 2} jours` : '—'}</dd></div><div><dt>Attestation</dt><dd>${p === 100 ? 'Disponible' : 'À 100 %'}</dd></div></dl><p class="next">Prochain chapitre<b>${esc(nextLesson(c))}</b></p>`
      : `<div class="lock-ico big">${SVG.lock}</div><p class="locked-txt">Cette formation fait partie du catalogue complet, réservé aux packs <b>Membre</b> et <b>Cercle Fondateur</b>.</p>`;

    $('#panelAbout').innerHTML = `<div class="about-grid">
      <div><h4>À propos de cette formation</h4><p>${esc(desc)}</p><h4>Objectifs pédagogiques</h4><ul class="check">${goals.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <dl class="infos">
        <div><dt>Niveau</dt><dd>${c.l}</dd></div><div><dt>Public</dt><dd>Tous publics</dd></div>
        <div><dt>Durée</dt><dd>${c.d} environ</dd></div><div><dt>Prérequis</dt><dd>${c.l === 'Avancé' ? 'Bases du sujet' : 'Aucun'}</dd></div>
        <div><dt>Format</dt><dd>Vidéo HD + quiz</dd></div><div><dt>Évaluation</dt><dd>Quiz & ateliers pratiques</dd></div>
        <div><dt>Matériel</dt><dd>Ordinateur ou tablette, Internet</dd></div><div><dt>Accessibilité</dt><dd>100 % en ligne</dd></div>
        <div><dt>Support</dt><dd>Téléphone & email</dd></div>
      </dl></div>`;

    let k = 0;
    $('#panelContent').innerHTML = `<p class="content-sum">1 module · ${c.ch} chapitres</p>` + curriculum(c).map((part, i) => `
      <div class="module${i === 0 ? ' is-open' : ''}">
        <button class="module-head" aria-expanded="${i === 0}"><b>${i + 1}</b><span><h4>${esc(part.name)}</h4><small>${part.lessons.length} éléments</small></span><i>${SVG.chev}</i></button>
        <div class="module-body" style="height:${i === 0 ? 'auto' : '0'}"><ol>${part.lessons.map(l => {
          const idx = l.q ? -1 : k++;
          const cls = [l.q ? 'quiz' : '', idx >= 0 && idx < done ? 'done' : '', !ok && (idx >= 3 || l.q) ? 'locked' : ''].join(' ');
          return `<li><button class="lesson ${cls}" data-lesson="${esc(l.t)}"><span class="st"></span><span>${esc(l.t)}</span><em>${l.q ? 'Quiz' : `${(idx % 7) + 3} min`}</em></button></li>`;
        }).join('')}</ol></div>
      </div>`).join('');

    $('#panelReviews').innerHTML = `<div class="reviews">
      <div class="score"><b>${c.r ? '5,0' : '—'}</b><div class="stars">${c.r ? '★★★★★' : '☆☆☆☆☆'}</div><p>${c.r ? '1 avis' : 'Pas encore d’avis'}</p></div>
      <div>${c.r ? '<div class="review"><h5>Apprenant·e vérifié·e</h5><div class="stars">★★★★★</div><p>Formation claire et concrète, on applique tout de suite au travail.</p></div>' : ''}
        <div class="review"><h5>Donnez votre avis sur cette formation</h5><p>Votre retour aide les autres membres ECN à choisir leur prochaine formation.</p><button class="btn btn-ghost sm" data-review style="margin-top:14px">Envoyer mon avis</button></div>
      </div></div>`;
    setTab('about', false);
    animateRings($('#courseProgress'));
  }

  function setTab(name, animate = true) {
    $$('.tabs button').forEach(b => b.classList.toggle('is-active', b.dataset.tab === name));
    $$('.tab-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === name));
    const b = $(`.tabs button[data-tab="${name}"]`), ink = $('.tab-ink');
    ink.style.width = b.offsetWidth + 'px';
    ink.style.transform = `translateX(${b.offsetLeft}px)`;
    if (anim && animate) G.fromTo(`.tab-panel[data-panel="${name}"] > *`, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .05, ease: 'expo.out' });
  }

  const rectInset = r => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 22px)`;
  function openCourse(c, fromEl) {
    fillCourse(c);
    lastFrom = fromEl || null;
    const el = $('#course');
    el.hidden = false;
    $('.course-scroll').scrollTop = 0;
    lock(true);
    window.dispatchEvent(new CustomEvent('ecn:pause', { detail: true }));
    setTab('about', false);
    if (anim) {
      const from = fromEl ? rectInset(fromEl.getBoundingClientRect()) : 'inset(50% 50% 50% 50% round 22px)';
      G.fromTo(el, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1, ease: 'expo.inOut' });
      G.fromTo('#courseMedia > *', { scale: 1.5 }, { scale: 1.1, duration: 1.8, ease: 'expo.out' });
      G.fromTo('.course-head > *', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .06, delay: .45, ease: 'expo.out' });
      G.fromTo('.course-progress', { x: lite ? 0 : 60, y: lite ? 30 : 0, opacity: 0, rotateY: lite ? 0 : -25 }, { x: 0, opacity: 1, rotateY: 0, duration: 1.1, delay: .6, ease: 'expo.out' });
      G.fromTo('.tabs, .tab-panels', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: .75, ease: 'expo.out' });
    }
    $('[data-close-course]').focus({ preventScroll: true });
  }
  function closeCourse() {
    const el = $('#course');
    if (el.hidden) return;
    const done = () => {
      el.hidden = true;
      current = null;
      lock(false);
      window.dispatchEvent(new CustomEvent('ecn:pause', { detail: false }));
      if (lastFrom && document.contains(lastFrom)) lastFrom.focus({ preventScroll: true });
    };
    if (!anim) return done();
    const r = lastFrom && document.contains(lastFrom) && lastFrom.offsetParent ? lastFrom.getBoundingClientRect() : null;
    const visible = r && r.bottom > 0 && r.top < innerHeight;
    G.to(el, { clipPath: visible ? rectInset(r) : 'inset(50% 50% 50% 50% round 22px)', duration: .8, ease: 'expo.inOut', onComplete: done });
  }

  /* ---------- Lecteur ---------- */
  let playTween = null, playCourse = null;
  function openPlayer(c, title) {
    playCourse = c;
    $('#playerCourse').textContent = `${c.c} · ${c.t}`;
    $('#playerTitle').textContent = title || nextLesson(c);
    $('#screenTitle').textContent = $('#playerTitle').textContent;
    resetPlayer();
    openModal('#player');
  }
  function resetPlayer() {
    if (playTween) playTween.kill();
    $('#screen').classList.remove('is-playing');
    $('#scrubBar').style.width = '0';
    $('#playerTime').textContent = '00:00';
  }
  function play() {
    $('#screen').classList.add('is-playing');
    const o = { t: 0 };
    const tick = () => {
      const s = Math.round(o.t * 504);
      $('#scrubBar').style.width = (o.t * 100) + '%';
      $('#playerTime').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    playTween = G ? G.to(o, { t: 1, duration: 14, ease: 'none', onUpdate: tick }) : null;
  }
  function markDone(btn) {
    const c = playCourse;
    if (!c) return;
    prog[c.id] = Math.min(c.ch, (prog[c.id] || 0) + 1);
    if (!order.includes(c.id)) order.unshift(c.id);
    store.set('prog', prog);
    store.set('order', order);
    burst(btn);
    toast(`Chapitre validé · progression ${pct(c)} %`);
    refreshCardProgress(c);
    renderResume();
    countStats();
    if (current && current.id === c.id) fillCourse(c);
    $('#playerTitle').textContent = $('#screenTitle').textContent = nextLesson(c);
    resetPlayer();
  }
  function burst(el) {
    if (!anim) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('i');
      d.style.cssText = `position:fixed;z-index:900;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:7px;height:7px;border-radius:50%;pointer-events:none;background:var(--a-l);box-shadow:0 0 12px var(--a)`;
      document.body.appendChild(d);
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 140;
      G.to(d, { x: Math.cos(a) * v, y: Math.sin(a) * v - 40, opacity: 0, scale: .2, duration: 1 + Math.random() * .6, ease: 'expo.out', onComplete: () => d.remove() });
    }
  }

  /* ---------- Modales & verrou de scroll ---------- */
  let locks = 0, lastFocus = null;
  function lock(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    if (lenis) locks ? lenis.stop() : lenis.start();
    root.style.overflow = locks ? 'hidden' : '';
  }
  function openModal(sel) {
    const m = $(sel);
    lastFocus = document.activeElement;
    m.hidden = false;
    lock(true);
    if (anim) {
      G.fromTo(m.querySelector('.modal-backdrop'), { opacity: 0 }, { opacity: 1, duration: .5 });
      G.fromTo(m.querySelector('.player-box, .upgrade-box'), { y: lite ? 40 : 80, scale: .92, rotateX: lite ? 0 : 14, opacity: 0, transformPerspective: 1200 }, { y: 0, scale: 1, rotateX: 0, opacity: 1, duration: .9, ease: 'expo.out' });
      G.fromTo(m.querySelectorAll('.plan'), { y: lite ? 24 : 50, opacity: 0, rotateY: lite ? 0 : -20 }, { y: 0, opacity: 1, rotateY: 0, duration: 1, stagger: .08, delay: .15, ease: 'expo.out' });
    }
    m.querySelector('.close-btn').focus({ preventScroll: true });
  }
  function closeModal(m, then) {
    if (!m || m.hidden) return then && then();
    const done = () => { m.hidden = true; lock(false); if (m.id === 'player') resetPlayer(); if (lastFocus) lastFocus.focus({ preventScroll: true }); if (then) then(); };
    if (!anim) return done();
    G.to(m.querySelector('.modal-backdrop'), { opacity: 0, duration: .35 });
    G.to(m.querySelector('.player-box, .upgrade-box'), { y: 50, scale: .95, opacity: 0, duration: .35, ease: 'power2.in', onComplete: done });
  }

  /* ---------- Changement de pack ---------- */
  function placePill() {
    const b = $(`.tier-switch button[data-tier="${tier}"]`), pill = $('.tier-pill');
    pill.style.width = b.offsetWidth + 'px';
    pill.style.transform = `translateX(${b.offsetLeft}px)`;
  }
  function updateTierUI() {
    const T = TIERS[tier];
    $$('.tier-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tier === tier));
    placePill();
    $('#passName').textContent = T.name;
    $('#passTag').textContent = T.tag;
    $('#passDesc').textContent = T.desc;
    $('#heroEyebrow').textContent = T.eyebrow;
    $('#lockedCount').textContent = COURSES.filter(c => !c.i).length;
    if (tier !== 'initie') { state.mine = false; $('#fMine').checked = false; }
    setLocks();
    updateCats();
    renderResume();
    countStats();
    if (view === 'favoris') renderFavs();
    if (current) fillCourse(current);
  }
  function setTier(t, x = innerWidth / 2, y = 40) {
    if (!TIERS[t] || t === tier) return;
    const apply = () => {
      tier = t;
      root.dataset.tier = t;
      store.set('tier', t);
      updateTierUI();
      applyFilters(false);
    };
    if (document.startViewTransition && !reduce) {
      const vt = document.startViewTransition(apply);
      vt.ready.then(() => {
        const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: lite ? 700 : 1100, easing: 'cubic-bezier(.76,0,.24,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => {});
    } else apply();
    window.dispatchEvent(new CustomEvent('ecn:tier', { detail: t }));
    if (anim) G.fromTo('.pass', { scale: .94 }, { scale: 1, duration: .9, ease: 'expo.out', clearProps: 'transform' });
    toast(TIERS[t].toast);
  }

  function countStats() {
    const vals = { statAccess: COURSES.filter(canAccess).length, statProgress: resumeList().length, statHours: TIERS[tier].hours, statCerts: TIERS[tier].certs };
    Object.entries(vals).forEach(([id, v]) => {
      const el = $('#' + id);
      if (!anim) { el.textContent = v; return; }
      const o = { v: +el.textContent || 0 };
      G.to(o, { v, duration: 1.8, ease: 'expo.out', overwrite: true, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });
    $('#statTotal').textContent = '/ ' + COURSES.length;
  }

  /* ---------- Vues ---------- */
  let view = 'dashboard';
  const scrollToEl = (target, immediate) => {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -100, duration: 1.6, immediate: !!immediate });
    else if (target === 0) scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
    else $(target).scrollIntoView({ behavior: 'smooth' });
  };
  const setNavActive = name => $$('.nav-links button, .tabbar button').forEach(b => b.classList.toggle('is-active', b.dataset.view === name));
  function go(name) {
    const target = name === 'catalogue' ? 'dashboard' : name;
    setNavActive(name);
    const after = () => { if (name === 'catalogue') scrollToEl('#catalog'); };
    window.dispatchEvent(new CustomEvent('ecn:view', { detail: target }));
    if (target === view) { if (name === 'dashboard') scrollToEl(0); after(); return; }
    const cur = $('#view-' + view), next = $('#view-' + target);
    view = target;
    if (target === 'favoris') renderFavs();
    const swap = () => {
      cur.classList.remove('is-active');
      next.classList.add('is-active');
      scrollToEl(0, true);
      if (ST) ST.refresh();
      after();
      if (anim && target !== 'dashboard') G.fromTo(next.querySelectorAll('.block-head > *, .help-cta, .qa, .grid > .card, .empty-big:not([hidden])'), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .06, ease: 'expo.out', clearProps: 'transform,opacity' });
    };
    if (!anim) return swap();
    G.to(cur, { opacity: 0, y: -24, duration: .35, ease: 'power2.in', onComplete: () => { G.set(cur, { clearProps: 'opacity,transform' }); swap(); } });
  }

  /* ---------- FAQ ---------- */
  const FAQ = [
    ['Comment reprendre une formation là où je me suis arrêté ?', 'Depuis votre tableau de bord, la section « Reprendre une formation » affiche vos formations en cours. Le bouton « Continuer » vous ramène directement au chapitre suivant, sans avoir à chercher.'],
    ['Ma progression ne semble pas à jour, que faire ?', 'Votre avancement est enregistré au fil de votre lecture. Si l’affichage vous paraît en retard, revenez sur le tableau de bord après avoir quitté la leçon : il se met alors à jour automatiquement.'],
    ['Comment obtenir mon attestation de formation ?', 'L’attestation devient disponible une fois la formation terminée à 100 %, lorsque toutes les conditions de validation sont remplies.'],
    ['Que comprend mon pack ECN Group ?', 'Le Pack Initié donne accès au socle de 22 formations de base. Les packs Membre (Golden Card) et Cercle Fondateur ouvrent l’ensemble du catalogue, dans toutes les catégories, avec les nouveautés ajoutées chaque mois.'],
    ['Comment passer du Pack Initié au Pack Membre ?', 'Depuis votre espace membre ECN Group, rubrique Adhésion. Votre accès s’étend à tout le catalogue dès la confirmation de votre règlement.']
  ];
  $('#faq').innerHTML = FAQ.map(([q, a]) => `<div class="qa"><button aria-expanded="false"><span>${esc(q)}</span><i></i></button><div class="qa-body"><p>${esc(a)}</p></div></div>`).join('');
  function accordion(item, bodySel, force) {
    const body = item.querySelector(bodySel);
    const open = force ?? !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    item.querySelector('button').setAttribute('aria-expanded', open);
    if (anim) G.to(body, { height: open ? 'auto' : 0, duration: .7, ease: 'expo.inOut' });
    else body.style.height = open ? 'auto' : '0';
  }

  /* ---------- Événements ---------- */
  function onCardActivate(e) {
    const fav = e.target.closest('.fav');
    if (fav) { e.stopPropagation(); toggleFav(+fav.dataset.fav); return; }
    const card = e.target.closest('.card');
    if (card) openCourse(COURSES[+card.dataset.id], card);
  }
  [grid, $('#favGrid')].forEach(g => {
    g.addEventListener('click', onCardActivate);
    g.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); onCardActivate(e); } });
    bindTilt(g, '.card', 14, '.card-in');
  });
  bindTilt($('#catGrid'), '.cat', 16);
  bindTilt($('.pass-wrap'), '.pass', 22);
  bindTilt($('.help-grid'), '.help-cta', 8);

  $('#catGrid').addEventListener('click', e => {
    const b = e.target.closest('.cat');
    if (!b) return;
    setChip(b.dataset.cat);
    scrollToEl('#catalog');
  });
  function setChip(cat) {
    state.cat = cat;
    state.limit = 24;
    $$('.chip').forEach(ch => ch.classList.toggle('is-active', ch.dataset.chip === cat));
    $('#fCat').value = cat;
    applyFilters();
  }
  $('#fCat').addEventListener('change', e => setChip(e.target.value));
  $('#catChips').addEventListener('click', e => { const ch = e.target.closest('.chip'); if (ch) setChip(ch.dataset.chip); });
  $('#fLevel').addEventListener('change', e => { state.level = e.target.value; applyFilters(); });
  $('#fDur').addEventListener('change', e => { state.dur = e.target.value; applyFilters(); });
  $('#fSort').addEventListener('change', e => { state.sort = e.target.value; applyFilters(); });
  $('#fMine').addEventListener('change', e => { state.mine = e.target.checked; applyFilters(); });
  let qTimer;
  $('#fSearch').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; state.limit = 24; applyFilters(); }, 200); });
  $('#heroSearch').addEventListener('submit', e => {
    e.preventDefault();
    state.q = $('#heroSearchInput').value;
    $('#fSearch').value = state.q;
    state.cat = '';
    state.limit = 24;
    $$('.chip').forEach(ch => ch.classList.toggle('is-active', ch.dataset.chip === ''));
    $('#fCat').value = '';
    applyFilters();
    scrollToEl('#catalog');
  });
  $('#loadMore').addEventListener('click', () => { state.limit += 24; applyFilters(); });

  $('#resumeRail').addEventListener('click', e => { const r = e.target.closest('.resume'); if (r && !railMoved) openCourse(COURSES[+r.dataset.id], r); });
  $$('[data-rail]').forEach(b => b.addEventListener('click', () => $('#resumeRail').scrollBy({ left: +b.dataset.rail * 400, behavior: 'smooth' })));
  // Glisser-déposer horizontal du rail à la souris
  let railDown = false, railX = 0, railL = 0, railMoved = false;
  const rail = $('#resumeRail');
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; railDown = true; railMoved = false; railX = e.clientX; railL = rail.scrollLeft; });
  addEventListener('pointermove', e => { if (!railDown) return; const dx = e.clientX - railX; if (Math.abs(dx) > 5) { railMoved = true; rail.classList.add('is-drag'); } rail.scrollLeft = railL - dx; });
  addEventListener('pointerup', () => { railDown = false; rail.classList.remove('is-drag'); setTimeout(() => { railMoved = false; }, 0); });

  $$('.tier-switch button').forEach(b => b.addEventListener('click', e => setTier(b.dataset.tier, e.clientX || innerWidth / 2, e.clientY || 40)));
  $$('.tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

  $('#course').addEventListener('click', e => {
    if (e.target.closest('[data-close-course]')) return closeCourse();
    if (e.target.closest('[data-play]')) return openPlayer(current);
    if (e.target.closest('[data-course-fav]')) return toggleFav(current.id);
    if (e.target.closest('[data-review]')) return toast('Merci ! Votre avis a été envoyé (démo).');
    const tab = e.target.closest('[data-goto-tab]');
    if (tab) return setTab(tab.dataset.gotoTab);
    const mod = e.target.closest('.module-head');
    if (mod) return accordion(mod.parentElement, '.module-body');
    const les = e.target.closest('.lesson');
    if (les) return canAccess(current) ? openPlayer(current, les.dataset.lesson) : openModal('#upgrade');
  });
  $('#faq').addEventListener('click', e => { const b = e.target.closest('button'); if (b) accordion(b.parentElement, '.qa-body'); });
  $('#playBtn').addEventListener('click', play);
  $('#markDone').addEventListener('click', e => markDone(e.currentTarget));
  $('#supportBtn').addEventListener('click', () => toast('Démo : ouverture de la conversation WhatsApp du support'));

  document.addEventListener('click', e => {
    const v = e.target.closest('[data-view]');
    if (v) { e.preventDefault(); go(v.dataset.view); return; }
    const s = e.target.closest('[data-scrollto]');
    if (s) { scrollToEl(s.dataset.scrollto === 'top' ? 0 : s.dataset.scrollto); return; }
    if (e.target.closest('[data-open-upgrade]')) { openModal('#upgrade'); return; }
    const st = e.target.closest('[data-set-tier]');
    if (st) {
      const r = st.getBoundingClientRect();
      closeModal($('#upgrade'), () => setTier(st.dataset.setTier, r.left + r.width / 2, r.top + r.height / 2));
      return;
    }
    if (e.target.closest('[data-close-modal]')) closeModal(e.target.closest('.modal'));
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = $$('.modal').find(x => !x.hidden);
    m ? closeModal(m) : closeCourse();
  });
  addEventListener('resize', () => { placePill(); if (current) setTab($('.tabs button.is-active').dataset.tab, false); });

  /* ---------- Motion : Lenis, curseur, aimants, reveals ---------- */
  let lenis = null;
  if (anim && window.Lenis && !lite) {
    lenis = new window.Lenis({ lerp: .085, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    const skew = G.quickTo('#marquee', 'skewX', { duration: .6, ease: 'power3' });
    lenis.on('scroll', e => skew(Math.max(-14, Math.min(14, -e.velocity * .5))));
  }

  if (anim && fine) {
    const cur = $('.cursor');
    const xTo = G.quickTo(cur, 'x', { duration: .5, ease: 'power3' }), yTo = G.quickTo(cur, 'y', { duration: .5, ease: 'power3' });
    addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('button, a, .card, select, input, label')));
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        G.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .6, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => G.to(b, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.35)' }));
    });
  }

  function split(el) {
    const out = [];
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.push(document.createTextNode(' ')); return; }
          const w = document.createElement('span'), s = document.createElement('span');
          w.className = 'w';
          s.textContent = part;
          w.appendChild(s);
          out.push(w);
        });
      } else {
        const w = document.createElement('span');
        w.className = 'w';
        w.appendChild(n.cloneNode(true));
        out.push(w);
      }
    });
    el.replaceChildren(...out);
  }

  function batchReveal(sel, from) {
    G.set(sel, { opacity: 0 });
    ST.batch(sel, {
      start: 'top 94%', once: true,
      onEnter: b => G.fromTo(b, { ...from, opacity: 0 }, { x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1, duration: 1.2, stagger: .07, ease: 'expo.out', overwrite: true, clearProps: 'transform' })
    });
  }

  function reveals() {
    const tilt = !lite; // pas de rotations 3D sur mobile : elles font scintiller icônes et logos
    $$('.block-head .split').forEach(h => G.from(h.querySelectorAll('.w > *'), { yPercent: 115, rotate: tilt ? 4 : 0, duration: lite ? .9 : 1.3, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 90%' } }));
    $$('.block-head .eyebrow, .result-count, .rail-nav').forEach(e => G.from(e, { opacity: 0, x: -24, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 94%' } }));
    batchReveal('.cat', tilt ? { y: 100, rotateX: -45, transformPerspective: 900 } : { y: 30 });
    if (tilt) batchReveal('#grid .card', { y: 90, rotateX: -25, scale: .94, transformPerspective: 1200 }); // mobile : cartes affichées direct, pas de trou en défilement rapide
    batchReveal('.perk', { y: lite ? 30 : 60 });
    batchReveal('.filters, .upsell-card', { y: lite ? 24 : 50 });
    G.from('.resume', { x: lite ? 60 : 140, opacity: 0, duration: lite ? .9 : 1.3, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '#resumeRail', start: 'top 92%' } });
    if (lite) return;
    G.to('.hero-copy', { yPercent: -18, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.pass-wrap', { y: -160, rotateX: 28, scale: .9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.fromTo('.marquee', { opacity: .3 }, { opacity: 1, scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'top 60%', scrub: true } });
  }

  // l'onglet actif suit le défilement entre l'accueil et le catalogue
  if (anim) ST.create({ trigger: '#catalog', start: 'top 55%', end: 'bottom 45%', onToggle: st => { if (view === 'dashboard') setNavActive(st.isActive ? 'catalogue' : 'dashboard'); } });

  function intro() {
    const tl = G.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    tl.from('.nav, .tabbar', { opacity: 0, duration: 1 }, 0)
      .from('.hero h1 .w > *', { yPercent: 120, rotate: lite ? 0 : 5, duration: lite ? 1.1 : 1.5, stagger: .05 }, .05)
      .from('.hero .eyebrow', { y: 20, opacity: 0, duration: 1 }, .15)
      .from('.hero-sub, .search, .stats > div', { y: 50, opacity: 0, duration: 1.2, stagger: .08 }, .4)
      .from('.pass', lite ? { y: 50, opacity: 0, duration: 1.2, clearProps: 'transform' } : { rotateY: -80, rotateX: 25, y: 160, z: -300, opacity: 0, duration: 2, ease: 'expo.out', clearProps: 'transform' }, .2)
      .from('.pass-powered, .scroll-hint', { opacity: 0, duration: 1 }, 1)
      .add(countStats, .5);
    return tl;
  }

  /* ---------- Démarrage ---------- */
  renderCats();
  updateTierUI();
  applyFilters(false);
  setFavCount();
  $$('.split').forEach(split);

  if (!anim) {
    $('#loader').remove();
    countStats();
  } else {
    const introTl = intro();
    reveals();
    const o = { v: 0 }, num = $('#loaderNum');
    G.set('#loader', { clipPath: 'inset(0% 0% 0% 0%)' });
    G.timeline()
      .to(o, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(o.v); } })
      .to('.loader-ring circle', { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to('.loader-core', { scale: 1.12, duration: .5, ease: 'power2.out' }, 1.25)
      .to('#loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.15, ease: 'expo.inOut', onComplete: () => $('#loader')?.remove() }, '+=.05')
      .add(() => introTl.play(), '-=.75');
  }
  // filet de sécurité si une animation ne se termine pas
  setTimeout(() => { const l = $('#loader'); if (l) l.remove(); }, 6000);
})();
