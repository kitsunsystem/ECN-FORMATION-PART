/* ECN Formation Kids : mondes par âge, mascotte, confettis */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MEMBER = window.ECN_MEMBER || null; // injecté par le Worker (absent en aperçu local)
  const KIDS = window.ECN_KIDS_FORMATIONS || [];
  const key = `ecnf:${MEMBER ? MEMBER.id + ':' : ''}kidsAge`;
  const store = {
    get() { try { return +localStorage.getItem(key) || 0; } catch { return 0; } },
    set(v) { try { localStorage.setItem(key, String(v)); } catch { /* stockage indisponible */ } }
  };

  const ICON = {
    star: '<path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    brush: '<path d="M14.5 4.5 19.5 9.5 10 19H5v-5z"/><path d="m12.5 6.5 5 5"/>',
    rocket: '<path d="M12 3c3 2 5 5.5 5 9.5L15 15H9l-2-2.5C7 8.5 9 5 12 3z"/><circle cx="12" cy="10" r="2"/><path d="M9 15l-2 4 3-1M15 15l2 4-3-1"/>'
  };
  const WORLDS = [
    { age: 8, name: 'Les Petits Explorateurs', c: '#ffb020', tint: '#fff4d6', icon: 'star', desc: 'Découvrir, observer et jouer pour apprendre les premières bases.' },
    { age: 10, name: 'Les Inventeurs', c: '#2bb3ff', tint: '#e0f4ff', icon: 'bulb', desc: 'Imaginer, construire et comprendre comment les choses fonctionnent.' },
    { age: 12, name: 'Les Créateurs', c: '#ff5fa2', tint: '#ffe3f0', icon: 'brush', desc: 'Créer tes propres projets : dessin, vidéo, code et bien plus.' },
    { age: 16, name: 'Les Jeunes Entrepreneurs', c: '#22c58b', tint: '#dcfaee', icon: 'rocket', desc: 'Préparer ton avenir : projets, argent, communication et esprit d’entreprise.' }
  ];
  const list = age => KIDS.filter(f => +f.age === age);
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;

  if (MEMBER && MEMBER.lastName) $('#hello').textContent = `Bienvenue, famille ${MEMBER.lastName} !`;

  $('#worldGrid').innerHTML = WORLDS.map(w => `<button class="world" role="listitem" data-age="${w.age}" style="--c:${w.c};--tint:${w.tint}" aria-pressed="false">
      <span class="world-ico">${svg(w.icon)}</span>
      <span class="world-age">Dès ${w.age} ans</span>
      <span class="world-name">${w.name}</span>
      <span class="world-count">${list(w.age).length ? `${list(w.age).length} formation${list(w.age).length > 1 ? 's' : ''}` : 'Bientôt'}</span>
    </button>`).join('');

  const ROCKET = `<div class="rocket" aria-hidden="true"><svg viewBox="0 0 100 120">
      <path class="flame" d="M38 92 Q50 120 62 92 Z" fill="#ffb020"/>
      <path d="M50 6 C70 22 74 52 68 86 H32 C26 52 30 22 50 6Z" fill="#fff" stroke="#5b4bdb" stroke-width="5"/>
      <circle cx="50" cy="44" r="11" fill="#7fd4ff" stroke="#5b4bdb" stroke-width="5"/>
      <path d="M32 62 L16 84 L32 82Z M68 62 L84 84 L68 82Z" fill="#ff6fae" stroke="#5b4bdb" stroke-width="4" stroke-linejoin="round"/>
    </svg></div>`;

  function showWorld(age, celebrate) {
    const w = WORLDS.find(x => x.age === age);
    if (!w) return;
    document.querySelectorAll('.world').forEach(b => {
      const on = +b.dataset.age === age;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
    const items = list(age);
    $('#panel').innerHTML = `<div class="panel-card" style="--c:${w.c};--tint:${w.tint}">
      <div class="panel-head"><span class="world-age">Dès ${w.age} ans</span><h3>${w.name}</h3><p>${w.desc}</p></div>
      ${items.length ? `<div class="kid-grid">${items.map(f => {
        const link = /^https:\/\//.test(f.u || '');
        const inner = `${f.img ? `<img src="${esc(f.img)}" alt="" loading="lazy">` : ''}<span class="kc-body"><b>${esc(f.t)}</b>${f.desc ? `<small>${esc(f.desc)}</small>` : ''}${f.d ? `<small>⏱ ${esc(f.d)}</small>` : ''}<span class="kc-go">${link ? 'C’est parti !' : 'Bientôt'}</span></span>`;
        return link ? `<a class="kid-card" href="${esc(f.u)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="kid-card">${inner}</div>`;
      }).join('')}</div>` : `<div class="soon">${ROCKET}<div>
        <h4>Les premières formations arrivent très bientôt !</h4>
        <p>Nova prépare tout pour les ${w.name.replace(/^Les /, '')}. Reviens vite&nbsp;!</p>
        <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div></div></div>`}
    </div>`;
    store.set(age);
    if (celebrate) {
      const r = document.querySelector(`.world[data-age="${age}"]`).getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2, [w.c, '#ffd23f', '#ff6fae', '#7fd4ff']);
      $('#panel').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  function confetti(x, y, colors) {
    if (reduce) return;
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('i');
      p.className = 'confetti';
      p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 160;
      p.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v - 60}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(${Math.cos(a) * v * 1.2}px, ${Math.sin(a) * v + 140}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], { duration: 1100 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
    }
  }

  $('#worldGrid').addEventListener('click', e => {
    const b = e.target.closest('.world');
    if (b) showWorld(+b.dataset.age, true);
  });

  // Nova parle quand on la touche
  const LINES = ['Salut, moi c’est Nova !', 'Choisis ton monde pour commencer !', 'Apprendre, c’est une aventure !', 'Tu es super curieux, bravo !', 'On va bien s’amuser ensemble !'];
  let line = 0;
  $('#mascot').addEventListener('click', e => {
    line = (line + 1) % LINES.length;
    const s = $('#speech');
    s.textContent = LINES[line];
    s.style.animation = 'none';
    void s.offsetWidth; // relance l'animation d'apparition
    s.style.animation = '';
    const m = e.currentTarget;
    m.classList.remove('is-happy');
    void m.offsetWidth;
    m.classList.add('is-happy');
    const r = m.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height * .35, ['#ffd23f', '#ff6fae', '#5ef0b0', '#7fd4ff']);
  });

  document.querySelectorAll('[data-scroll]').forEach(b => b.addEventListener('click', () => {
    $(b.dataset.scroll).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  const saved = store.get();
  if (WORLDS.some(w => w.age === saved)) showWorld(saved, false);
})();
