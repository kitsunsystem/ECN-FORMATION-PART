/**
 * E-mail de bienvenue dans l'Espace Formation (envoyé une fois, quand le compte formation est associé).
 * HTML compatible messageries : tableaux, styles en ligne, images publiques hébergées sur ecn-group.com.
 */

const ASSETS = 'https://ecn-group.com/assets/email';
const OPEN_URL = 'https://ecn-group.com/dashboard?formation=1';
const SUPPORT_URL = 'https://ecn-group.com/dashboard#tab-support';
const GOLD = '#d4af37';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const PACKS = {
  initie: { name: 'Pack Initié', tag: 'Accès Essentiel', ecn: 'Réservées aux packs Membre et Cercle Fondateur : passez Membre pour y accéder dès leur sortie.' },
  membre: { name: 'Pack Membre', tag: 'Golden Card', ecn: 'Incluses dans votre pack : les formations exclusives ECN arrivent très bientôt.' },
  fondateur: { name: 'Cercle Fondateur', tag: 'Fondateur', ecn: 'Incluses dans votre pack, en avant-première : les formations exclusives ECN arrivent très bientôt.' }
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export function welcomeEmail({ firstName, lastName, memberCode, tier, formationEmail }) {
  const P = PACKS[tier] || PACKS.initie;
  const first = (firstName || '').trim() || 'cher membre';
  const holder = `${firstName || ''} ${lastName || ''}`.trim();
  const subject = `Bienvenue dans votre Espace Formation, ${first}`;

  const stat = (n, label) => `<td class="stack" width="33%" align="center" valign="top" style="padding:6px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #2a2414;border-radius:16px;background:#100e09;">
        <tr><td align="center" style="padding:18px 8px 16px;">
          <div style="font-family:${SERIF};font-size:34px;line-height:1;font-weight:700;color:${GOLD};">${n}</div>
          <div style="margin-top:8px;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#a8a191;">${label}</div>
        </td></tr></table></td>`;

  const thumb = (file, label) => `<td class="thumb" width="25%" align="center" valign="top" style="padding:5px;">
      <img src="${ASSETS}/${file}.jpg" width="124" alt="${label}" style="display:block;width:100%;max-width:124px;height:auto;border:0;border-radius:12px;">
      <div style="margin-top:7px;font-family:${SANS};font-size:11px;font-weight:600;color:#c9c2b0;">${label}</div></td>`;

  const feature = (num, title, text) => `<tr><td style="padding:0 0 14px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #232638;border-radius:16px;background:#0f1220;">
        <tr>
          <td width="62" align="center" valign="top" style="padding:18px 0 18px 16px;">
            <div style="width:40px;height:40px;line-height:40px;border-radius:20px;background:${GOLD};font-family:${SERIF};font-size:18px;font-weight:700;color:#120d02;text-align:center;">${num}</div>
          </td>
          <td valign="top" style="padding:18px 18px 18px 12px;">
            <div style="font-family:${SERIF};font-size:18px;font-weight:700;color:#ffffff;">${title}</div>
            <div style="margin-top:6px;font-family:${SANS};font-size:14px;line-height:1.6;color:#b9bfd0;">${text}</div>
          </td>
        </tr></table></td></tr>`;

  const step = (n, text) => `<tr>
      <td width="34" valign="top" style="padding:0 0 12px;"><div style="width:24px;height:24px;line-height:24px;border-radius:12px;border:1px solid ${GOLD};font-family:${SANS};font-size:12px;font-weight:700;color:${GOLD};text-align:center;">${n}</div></td>
      <td valign="top" style="padding:2px 0 12px;font-family:${SANS};font-size:14px;line-height:1.55;color:#d8dbe6;">${text}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>
  @media (max-width: 620px) {
    .wrap { width: 100% !important; }
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .stack { display: block !important; width: 100% !important; }
    .thumb { display: inline-block !important; width: 48% !important; }
    .h1 { font-size: 30px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#05060a;" bgcolor="#05060a">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Votre Espace Formation ECN Group est prêt : votre formule, vos formations et tout ce qui vous attend.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#05060a" style="background:#05060a;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="wrap" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#0b0e17;border:1px solid #3a2f12;border-radius:22px;overflow:hidden;">

  <tr><td height="4" style="height:4px;font-size:0;line-height:0;background:${GOLD};background-image:linear-gradient(90deg,#8c6a1e,#fbe8aa,#d4af37,#fbe8aa,#8c6a1e);">&nbsp;</td></tr>

  <tr><td align="center" style="padding:36px 24px 6px;background:#0b0e17;background-image:radial-gradient(circle at 50% 0%, rgba(212,175,55,.30), rgba(11,14,23,0) 62%);">
    <a href="https://ecn-group.com/" target="_blank" style="text-decoration:none;"><img src="${ASSETS}/logo-ecn.png" width="88" height="88" alt="ECN Group" style="display:block;width:88px;height:88px;border:0;margin:0 auto;"></a>
    <div style="margin-top:14px;font-family:${SERIF};font-size:20px;font-weight:700;letter-spacing:4px;color:#ffffff;">ECN GROUP</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:12px;"><tr>
      <td style="padding:6px 14px;border:1px solid rgba(212,175,55,.55);border-radius:99px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;color:${GOLD};">ESPACE FORMATION</td>
    </tr></table>
  </td></tr>

  <tr><td class="px" align="center" style="padding:22px 46px 4px;">
    <h1 class="h1" style="margin:0;font-family:${SERIF};font-size:36px;line-height:1.15;font-weight:700;color:#ffffff;">Bienvenue dans votre<br>Espace Formation, <span style="color:${GOLD};">${esc(first)}</span></h1>
    <p style="margin:16px 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:#c3c8d6;">Votre compte formation est activé et associé à votre compte ECN Group. Tout est prêt&nbsp;: voici ce qui vous attend.</p>
  </td></tr>

  <tr><td class="px" style="padding:26px 46px 10px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid rgba(212,175,55,.6);border-radius:20px;background:#15110a;background-image:linear-gradient(135deg,#2a2210 0%,#0f0c06 55%,#3a2d10 100%);">
      <tr><td style="padding:22px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a191;">VOTRE FORMULE</td>
          <td align="right"><span style="display:inline-block;padding:5px 12px;border:1px solid rgba(212,175,55,.6);border-radius:99px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:#f6e29e;text-transform:uppercase;">${esc(P.tag)}</span></td>
        </tr></table>
        <div style="margin-top:12px;font-family:${SERIF};font-size:28px;font-weight:700;color:${GOLD};">${esc(P.name)}</div>
        <div style="margin:16px 0 14px;height:1px;line-height:1px;font-size:0;background:rgba(212,175,55,.25);">&nbsp;</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
          <td valign="top" style="font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#d6d0bf;">${esc(holder || 'Membre ECN')}</td>
          <td valign="top" align="right" style="font-family:${SANS};font-size:12px;letter-spacing:1px;color:#a8a191;">${memberCode ? esc(memberCode) : 'ECN Group'}</td>
        </tr></table>
        ${formationEmail ? `<div style="margin-top:12px;font-family:${SANS};font-size:13px;color:#c9c2b0;">Compte formation&nbsp;: <span style="color:#ffffff;font-weight:600;">${esc(formationEmail)}</span></div>` : ''}
      </td></tr></table>
  </td></tr>

  <tr><td class="px" style="padding:16px 40px 6px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      ${stat('162', 'Formations vidéo')}${stat('12', 'Catégories')}${stat('4', 'Univers Kids')}
    </tr></table>
  </td></tr>

  <tr><td class="px" align="center" style="padding:14px 40px 4px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      ${thumb('bureautique', 'Bureautique')}${thumb('langues', 'Langues')}${thumb('marketing', 'Marketing digital')}${thumb('developpement-personnel', 'Développement personnel')}
    </tr></table>
  </td></tr>

  <tr><td class="px" style="padding:26px 46px 6px;">
    <div style="margin:0 0 16px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;color:${GOLD};">CE QUI VOUS ATTEND</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${feature('1', 'Formations ECN Initié', '162 formations vidéo en 12 catégories&nbsp;: bureautique, langues, marketing, développement personnel et bien plus. Incluses dans votre pack.')}
      ${feature('2', 'Formations ECN Membre', esc(P.ecn))}
      ${feature('3', 'ECN Formation Kids', 'L’espace privé de vos enfants&nbsp;: des formations dès 8, 10, 12 et 16&nbsp;ans, dans un univers pensé pour eux.')}
    </table>
  </td></tr>

  <tr><td class="px" style="padding:14px 46px 4px;">
    <div style="margin:0 0 14px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;color:${GOLD};">BIEN DÉMARRER EN 3 ÉTAPES</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${step('1', 'Ouvrez votre Espace Formation depuis votre espace membre ECN Group.')}
      ${step('2', 'Choisissez une formation&nbsp;: elle s’ouvre en un clic.')}
      ${step('3', `Connectez-vous avec votre compte formation${formationEmail ? ` (<span style="color:#ffffff;">${esc(formationEmail)}</span>)` : ''} et commencez.`)}
    </table>
  </td></tr>

  <tr><td align="center" style="padding:24px 24px 8px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
      <td align="center" bgcolor="${GOLD}" style="border-radius:99px;background:${GOLD};background-image:linear-gradient(135deg,#fbe8aa 0%,#d4af37 45%,#b38825 80%,#fbe8aa 100%);">
        <a href="${OPEN_URL}" target="_blank" style="display:inline-block;padding:17px 38px;font-family:${SANS};font-size:15px;font-weight:800;letter-spacing:.5px;color:#120d02;text-decoration:none;">Ouvrir mon Espace Formation &rarr;</a>
      </td></tr></table>
    <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;color:#8e95a8;">Une question&nbsp;? <a href="${SUPPORT_URL}" target="_blank" style="color:${GOLD};text-decoration:none;font-weight:600;">Ouvrez un ticket au support ECN Group</a></p>
  </td></tr>

  <tr><td style="padding:28px 0 0;">&nbsp;</td></tr>
  <tr><td align="center" style="padding:22px 28px 26px;background:#080a12;border-top:1px solid rgba(212,175,55,.18);">
    <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;font-weight:700;color:#8e95a8;">ECN Group, SL • Principauté d’Andorre</p>
    <p style="margin:0;font-family:${SANS};font-size:10px;line-height:1.6;color:#5b6276;">Vous recevez cet e-mail suite à l’activation de votre Espace Formation ECN Group.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    `Bienvenue dans votre Espace Formation, ${first} !`,
    '',
    'Votre compte formation est activé et associé à votre compte ECN Group.',
    '',
    `Votre formule : ${P.name} (${P.tag})${memberCode ? ` · ${memberCode}` : ''}`,
    formationEmail ? `Compte formation : ${formationEmail}` : '',
    '',
    'Ce qui vous attend :',
    '1. Formations ECN Initié : 162 formations vidéo en 12 catégories, incluses dans votre pack.',
    `2. Formations ECN Membre : ${P.ecn}`,
    '3. ECN Formation Kids : l’espace privé de vos enfants, dès 8, 10, 12 et 16 ans.',
    '',
    `Ouvrir mon Espace Formation : ${OPEN_URL}`,
    `Support : ${SUPPORT_URL}`,
    '',
    'ECN Group, SL • Principauté d’Andorre'
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');

  return { subject, html, text };
}
