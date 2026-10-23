/* ECN Group — Espace Formation : catalogue LE CUBE (tous les packs), formations ECN Membre, accès par pack, motion */
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
  const anim = !!(G && ST) && !reduce;
  if (anim) G.registerPlugin(ST);
  const root = document.documentElement;

  // Version officielle : profil injecté par le Worker après vérification du compte ECN (absent = aperçu de démo)
  const MEMBER = window.ECN_MEMBER || null;
  const official = !!MEMBER;
  const ECN_ADHESION_URL = 'https://ecn-group.com/dashboard#tab-adhesion';
  const ns = official ? `ecnf:${MEMBER.id}:` : 'ecnf:'; // favoris et historique propres à chaque membre
  const store = {
    get(k, d) { try { const v = localStorage.getItem(ns + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(ns + k, JSON.stringify(v)); } catch { /* stockage indisponible : la page reste utilisable */ } }
  };

  /* ---------- Données ---------- */
  const COURSES = (window.ECN_COURSES || []).map((c, id) => ({ ...c, id }));
  const ECN = window.ECN_MEMBRE_FORMATIONS || [];
  const CATS = [...new Set(COURSES.map(c => c.c))].sort((a, b) => a.localeCompare(b, 'fr'));
  // lien LE CUBE accepté seulement s'il pointe vers lecube.biz
  const cubeUrl = c => (/^https:\/\/lecube\.biz\//.test(c.u) ? c.u : 'https://lecube.biz/');

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
    ext: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>'
  };

  const TIERS = {
    initie: { name: 'Pack Initié', tag: 'Accès Essentiel', desc: 'Catalogue LE CUBE Formations inclus.', eyebrow: 'Pack Initié · Catalogue LE CUBE', toast: 'Mode Pack Initié : catalogue LE CUBE, formations ECN en aperçu' },
    membre: { name: 'Pack Membre', tag: 'Golden Card', desc: 'Catalogue LE CUBE et formations ECN Membre.', eyebrow: 'Pack Membre · Accès complet', toast: 'Mode Membre : catalogue LE CUBE et formations ECN Membre' },
    fondateur: { name: 'Cercle Fondateur', tag: 'Fondateur', desc: 'Accès total, avant-premières et cercle privé.', eyebrow: 'Cercle Fondateur · Accès total', toast: 'Cercle Fondateur : accès total et thème signature' }
  };
  let tier = official ? MEMBER.tier : store.get('tier', 'membre');
  if (!TIERS[tier]) tier = official ? 'initie' : 'membre';
  root.dataset.tier = tier;
  root.classList.toggle('is-official', official);
  const ecnOpen = () => tier !== 'initie'; // formations ECN Membre : Membre et Cercle Fondateur

  const favs = new Set(store.get('favs', []));
  let recent = store.get('recent', []).filter(id => COURSES[id]);

  /* ---------- Helpers UI ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  const thumb = c => c.img
    ? `<img src="${c.img.includes('/') ? esc(c.img) : `assets/courses/${c.img}`}" alt="" loading="lazy" decoding="async">`
    : `<div class="fallback" style="--c:${c.col || '#d4af37'}"><svg viewBox="0 0 24 24">${icon(c.c || '')}</svg><b>${esc(c.c || '')}</b></div>`;

  // Carte LE CUBE : lien étiré vers lecube.biz (nouvel onglet), le cœur reste cliquable au-dessus
  function cardHTML(c) {
    const meta = [c.l && `<span>${esc(c.l)}</span>`, c.d && `<span>${SVG.clock}${esc(c.d)}</span>`, c.r && '<span class="star">★ 5,0</span>'].filter(Boolean).join('');
    return `<article class="card" data-id="${c.id}" style="--c:${c.col}">
      <div class="card-in">
        <div class="card-thumb">${thumb(c)}
          <div class="card-badges">${c.n ? '<span class="badge new">Nouveau</span>' : ''}
            <button class="fav${favs.has(c.id) ? ' is-on' : ''}" data-fav="${c.id}" aria-pressed="${favs.has(c.id)}" aria-label="Ajouter « ${esc(c.t)} » aux favoris">${SVG.heart}</button></div>
        </div>
        <div class="card-body">
          <p class="card-cat">${esc(c.c)}</p>
          <h3><a class="card-link" href="${esc(cubeUrl(c))}" target="_blank" rel="noopener" data-open="${c.id}">${esc(c.t)}</a></h3>
          <div class="card-meta">${meta}<span class="ext">LE CUBE ${SVG.ext}</span></div>
        </div>
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
    const count = cat => COURSES.filter(c => c.c === cat).length;
    $('#catGrid').innerHTML = CATS.map(cat => `<button class="cat" data-cat="${esc(cat)}" style="--c:${COURSES.find(c => c.c === cat).col}">
        <span class="cat-ico"><svg viewBox="0 0 24 24">${icon(cat)}</svg></span>
        <span class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
        <span class="cat-text"><span class="cat-name">${esc(cat)}</span><span class="cat-count">${count(cat)} formations</span></span>
      </button>`).join('');
    $('#marquee').innerHTML = [...CATS, ...CATS].map(c => `<span>${esc(c)}</span><i></i>`).join('');
    $('#fCat').insertAdjacentHTML('beforeend', CATS.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join(''));
    $('#catChips').innerHTML = `<button class="chip is-active" data-chip="">Toutes les catégories</button>` +
      CATS.map(c => `<button class="chip" data-chip="${esc(c)}">${esc(c)}<small>${count(c)}</small></button>`).join('');
  }

  /* ---------- Récemment consultées (formations ouvertes sur LE CUBE) ---------- */
  function renderRecent() {
    const list = recent.map(id => COURSES[id]);
    $('#recentRail').innerHTML = list.length ? list.map(c => `<a class="recent" href="${esc(cubeUrl(c))}" target="_blank" rel="noopener" data-open="${c.id}">
        <span class="recent-thumb">${thumb(c)}</span>
        <span class="recent-body"><small>${esc(c.c)}</small><span>${esc(c.t)}</span></span>
        <span class="recent-go">${SVG.ext}</span>
      </a>`).join('') : '<p class="empty">Ouvrez une formation : elle apparaîtra ici pour y revenir en un clic.</p>';
  }
  function trackOpen(id) {
    recent = [id, ...recent.filter(x => x !== id)].slice(0, 12);
    store.set('recent', recent);
    renderRecent();
  }

  /* ---------- Formations ECN Membre ---------- */
  function renderEcn() {
    const open = ecnOpen();
    $('#ecnLead').textContent = open
      ? 'Les formations exclusives ECN Group, incluses dans votre pack.'
      : 'Les formations exclusives ECN Group sont réservées aux packs Membre et Cercle Fondateur. En voici l’aperçu.';
    if (!ECN.length) {
      $('#ecnZone').innerHTML = `<div class="ecn-build">
        <div class="ecn-skeletons" aria-hidden="true">${'<div class="sk"><i></i><i></i></div>'.repeat(3)}</div>
        <div>
          <span class="ecn-chip">En construction</span>
          <h3>Les premières formations ECN arrivent bientôt</h3>
          <p>${open ? 'Elles apparaîtront ici dès leur mise en ligne, sans démarche de votre part.' : 'Passez au Pack Membre pour y accéder dès leur mise en ligne.'}</p>
          ${open ? '' : '<button class="btn btn-gold" data-open-upgrade>Débloquer les formations ECN</button>'}
        </div>
      </div>`;
      return;
    }
    $('#ecnZone').innerHTML = `<div class="grid ecn-grid">${ECN.map((f, i) => {
      const link = open && /^https:\/\//.test(f.u || '');
      return `<article class="card${open ? '' : ' is-locked'}" data-ecn="${i}" style="--c:#d4af37">
        <div class="card-in">
          <div class="card-thumb">${thumb(f)}
            <div class="lock"><div class="lock-ico">${SVG.lock}</div><span>Réservé Membre</span></div>
          </div>
          <div class="card-body">
            <p class="card-cat">${esc(f.c || 'ECN Group')}</p>
            <h3>${link ? `<a class="card-link" href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)}</a>` : `<button class="card-link" data-ecn-open="${i}">${esc(f.t)}</button>`}</h3>
            <div class="card-meta">${[f.l && `<span>${esc(f.l)}</span>`, f.d && `<span>${SVG.clock}${esc(f.d)}</span>`].filter(Boolean).join('')}<span class="ext">ECN</span></div>
          </div>
        </div>
      </article>`;
    }).join('')}</div>${open ? '' : '<div class="more"><button class="btn btn-gold" data-open-upgrade>Débloquer les formations ECN</button></div>'}`;
  }

  /* ---------- Catalogue LE CUBE (filtres) ---------- */
  const grid = $('#grid');
  grid.innerHTML = COURSES.map(cardHTML).join('');
  const cardEls = $$('.card', grid);
  const state = { cat: '', level: '', sort: 'new', q: '', limit: 24 };

  function matches(c) {
    if (state.cat && c.c !== state.cat) return false;
    if (state.level && c.l !== state.level) return false;
    if (state.q && !norm(c.t + ' ' + c.c).includes(norm(state.q.trim()))) return false;
    return true;
  }
  const sorter = (a, b) => (state.sort === 'az' ? a.t.localeCompare(b.t, 'fr') : (b.at || 0) - (a.at || 0) || a.id - b.id);

  // Filtres : on affiche/masque les cartes dans le flux normal de la page, puis un simple fondu
  function applyFilters(animate = true) {
    const list = COURSES.filter(matches).sort(sorter);
    const shown = new Set(list.slice(0, state.limit).map(c => c.id));
    list.forEach(c => grid.appendChild(cardEls[c.id]));
    cardEls.forEach(el => { el.hidden = !shown.has(+el.dataset.id); });
    $('#resultCount').textContent = list.length;
    $('#emptyState').hidden = list.length > 0;
    $('.more').hidden = list.length <= state.limit;
    if (!anim) return;
    if (animate) G.fromTo(cardEls.filter(el => !el.hidden), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35, stagger: .015, ease: 'power2.out', overwrite: true, clearProps: 'opacity,transform' });
    ST.refresh(); // la hauteur du catalogue a changé : recalcule les autres déclencheurs
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
    toast(on ? 'Ajoutée à vos favoris' : 'Retirée de vos favoris');
    if (view === 'favoris') renderFavs();
  }
  function setFavCount() {
    $('#favCount').textContent = $('#favCountM').textContent = $('#statFavs').textContent = favs.size;
    $('#favCountM').hidden = !favs.size;
  }
  function renderFavs() {
    const list = [...favs].map(id => COURSES[id]).filter(Boolean);
    $('#favGrid').innerHTML = list.map(cardHTML).join('');
    $('#favEmpty').hidden = list.length > 0;
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
      G.fromTo(m.querySelector('.upgrade-box'), { y: lite ? 40 : 80, scale: .92, rotateX: lite ? 0 : 14, opacity: 0, transformPerspective: 1200 }, { y: 0, scale: 1, rotateX: 0, opacity: 1, duration: .9, ease: 'expo.out' });
      G.fromTo(m.querySelectorAll('.plan'), { y: lite ? 24 : 50, opacity: 0, rotateY: lite ? 0 : -20 }, { y: 0, opacity: 1, rotateY: 0, duration: 1, stagger: .08, delay: .15, ease: 'expo.out' });
    }
    m.querySelector('.close-btn').focus({ preventScroll: true });
  }
  function closeModal(m, then) {
    if (!m || m.hidden) return then && then();
    const done = () => { m.hidden = true; lock(false); if (lastFocus) lastFocus.focus({ preventScroll: true }); if (then) then(); };
    if (!anim) return done();
    G.to(m.querySelector('.modal-backdrop'), { opacity: 0, duration: .35 });
    G.to(m.querySelector('.upgrade-box'), { y: 50, scale: .95, opacity: 0, duration: .35, ease: 'power2.in', onComplete: done });
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
    renderEcn();
  }
  function setTier(t, x = innerWidth / 2, y = 40) {
    if (official || !TIERS[t] || t === tier) return; // le pack réel vient de la base ECN
    const apply = () => {
      tier = t;
      root.dataset.tier = t;
      store.set('tier', t);
      updateTierUI();
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
    const vals = { statCube: COURSES.length, statCats: CATS.length };
    Object.entries(vals).forEach(([id, v]) => {
      const el = $('#' + id);
      if (!anim) { el.textContent = v; return; }
      const o = { v: +el.textContent || 0 };
      G.to(o, { v, duration: 1.8, ease: 'expo.out', overwrite: true, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });
    $('#statEcn').textContent = ECN.length || 'Bientôt';
  }

  /* ---------- Vues ---------- */
  let view = 'dashboard';
  const SECTIONS = { ecn: '#ecn', catalogue: '#catalog' }; // entrées de menu qui défilent dans le tableau de bord, dans l'ordre de la page
  const scrollToEl = (target, immediate) => {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -100, duration: 1.6, immediate: !!immediate });
    else if (target === 0) scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
    else $(target).scrollIntoView({ behavior: 'smooth' });
  };
  const setNavActive = name => $$('.nav-links button, .tabbar button').forEach(b => b.classList.toggle('is-active', b.dataset.view === name));
  function go(name) {
    const target = SECTIONS[name] ? 'dashboard' : name;
    setNavActive(name);
    const after = () => { if (SECTIONS[name]) scrollToEl(SECTIONS[name]); };
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
    ['Comment suivre une formation LE CUBE ?', 'Cliquez sur une formation : elle s’ouvre sur lecube.biz, la plateforme de notre partenaire LE CUBE Formations. Connectez-vous-y avec vos identifiants LE CUBE pour la suivre.'],
    ['Où retrouver ma progression et mes attestations ?', 'Sur LE CUBE Formations : votre avancement et vos attestations y sont enregistrés. Ici, la rubrique « Récemment consultées » vous permet d’y revenir en un clic.'],
    ['Que comprend mon pack ECN Group ?', 'Le Pack Initié donne accès à tout le catalogue LE CUBE. Les packs Membre (Golden Card) et Cercle Fondateur y ajoutent les formations exclusives ECN Membre.'],
    ['Quand arrivent les formations ECN Membre ?', 'Elles sont en cours de préparation. Elles apparaîtront automatiquement dans la rubrique « Formations ECN Membre » dès leur mise en ligne.'],
    ['Comment passer du Pack Initié au Pack Membre ?', 'Depuis votre espace membre ECN Group, rubrique Adhésion. Les formations ECN Membre s’ouvrent dès la confirmation de votre règlement.']
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
  [grid, $('#favGrid')].forEach(g => {
    g.addEventListener('click', e => {
      const fav = e.target.closest('.fav');
      if (fav) { e.preventDefault(); toggleFav(+fav.dataset.fav); return; }
      // toute la carte ouvre la formation (le lien du titre porte l'URL et l'accessibilité)
      const card = e.target.closest('.card');
      if (card && !e.target.closest('a')) card.querySelector('a.card-link').click();
    });
  });
  // ouverture d'une formation LE CUBE (clic, clic molette) : mémorisée dans « Récemment consultées »
  ['click', 'auxclick'].forEach(type => document.addEventListener(type, e => {
    const a = e.target.closest('a[data-open]');
    if (a && !(type === 'click' && railMoved)) trackOpen(+a.dataset.open);
  }));
  $('#ecnZone').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    if (!ecnOpen()) { openModal('#upgrade'); return; } // aperçu Initié
    const a = card.querySelector('a.card-link');
    if (a) { if (!e.target.closest('a')) a.click(); return; }
    toast('Cette formation ECN sera bientôt disponible.');
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
  $('#fSort').addEventListener('change', e => { state.sort = e.target.value; applyFilters(); });
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

  $$('[data-rail]').forEach(b => b.addEventListener('click', () => $('#recentRail').scrollBy({ left: +b.dataset.rail * 400, behavior: 'smooth' })));
  // Glisser-déposer horizontal du rail à la souris (sans ouvrir le lien en fin de glissé)
  let railDown = false, railX = 0, railL = 0, railMoved = false;
  const rail = $('#recentRail');
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; railDown = true; railMoved = false; railX = e.clientX; railL = rail.scrollLeft; });
  addEventListener('pointermove', e => { if (!railDown) return; const dx = e.clientX - railX; if (Math.abs(dx) > 5) { railMoved = true; rail.classList.add('is-drag'); } rail.scrollLeft = railL - dx; });
  addEventListener('pointerup', () => { railDown = false; rail.classList.remove('is-drag'); setTimeout(() => { railMoved = false; }, 0); });
  rail.addEventListener('click', e => { if (railMoved) e.preventDefault(); });
  rail.addEventListener('dragstart', e => e.preventDefault());

  $$('.tier-switch button').forEach(b => b.addEventListener('click', e => setTier(b.dataset.tier, e.clientX || innerWidth / 2, e.clientY || 40)));
  $('#faq').addEventListener('click', e => { const b = e.target.closest('button'); if (b) accordion(b.parentElement, '.qa-body'); });

  document.addEventListener('click', e => {
    const v = e.target.closest('[data-view]');
    if (v) { e.preventDefault(); go(v.dataset.view); return; }
    const s = e.target.closest('[data-scrollto]');
    if (s) { scrollToEl(s.dataset.scrollto === 'top' ? 0 : s.dataset.scrollto); return; }
    if (e.target.closest('[data-open-upgrade]')) { openModal('#upgrade'); return; }
    const st = e.target.closest('[data-set-tier]');
    if (st && official) { if (st.dataset.setTier !== tier) window.location.href = ECN_ADHESION_URL; return; }
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
    if (m) closeModal(m);
  });
  addEventListener('resize', placePill);

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
    $$('.block-head .eyebrow, .result-count, .rail-nav, .ecn-badge').forEach(e => G.from(e, { opacity: 0, x: -24, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 94%' } }));
    batchReveal('.cat', tilt ? { y: 100, rotateX: -45, transformPerspective: 900 } : { y: 30 });
    batchReveal('.perk', { y: lite ? 30 : 60 });
    batchReveal('.filters, #ecnZone', { y: lite ? 24 : 50 });
    G.from('.recent', { x: lite ? 60 : 140, opacity: 0, duration: lite ? .9 : 1.3, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '#recentRail', start: 'top 92%' } });
    if (lite) return;
    G.to('.hero-copy', { yPercent: -18, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.pass-wrap', { y: -160, rotateX: 28, scale: .9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.fromTo('.marquee', { opacity: .3 }, { opacity: 1, scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'top 60%', scrub: true } });
  }

  // l'onglet actif suit le défilement : accueil, formations ECN, catalogue
  if (anim) {
    const zones = [];
    const syncNav = () => { if (view === 'dashboard') setNavActive((zones.filter(z => z.st.isActive).pop() || { name: 'dashboard' }).name); }; // la plus basse visible l'emporte
    Object.entries(SECTIONS).forEach(([name, sel]) => zones.push({ name, st: ST.create({ trigger: sel, start: 'top 55%', end: 'bottom 45%', onToggle: syncNav }) }));
  }

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
  if (official) {
    const first = MEMBER.firstName || 'Membre', full = `${MEMBER.firstName} ${MEMBER.lastName}`.trim() || first;
    $('#heroName').textContent = first;
    $('#passHolder').textContent = full;
    $('#passNum').textContent = MEMBER.memberCode ? `ECN · ${MEMBER.memberCode}` : 'ECN Group';
    $('#avatarInitials').textContent = ((MEMBER.firstName || ' ')[0] + (MEMBER.lastName || ' ')[0]).trim().toUpperCase() || 'EC';
    $('#avatar').href = '/logout';
    $('#avatar').title = `${full} · Se déconnecter`;
    $$('[data-set-tier]').forEach(b => {
      b.textContent = b.dataset.setTier === tier ? 'Votre pack actuel' : 'Faire évoluer mon adhésion';
      b.disabled = b.dataset.setTier === tier;
    });
  }
  renderCats();
  renderRecent();
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
