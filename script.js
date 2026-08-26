// MAD Marketing — interactions

// Nav : fond au scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menu mobile
const burger = document.getElementById('burger');
const navMobile = document.getElementById('navMobile');
burger.addEventListener('click', () => {
  const open = navMobile.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});
navMobile.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navMobile.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

// Typographie : jamais un mot seul sur la dernière ligne d'un paragraphe
// (veuve). text-wrap: pretty (CSS) fait le gros du travail, mais laisse
// passer des cas; on soude donc systématiquement les deux derniers mots
// avec une espace insécable, valable à toutes les largeurs d'écran.
{
  const glueLastWords = (el) => {
    for (let i = el.childNodes.length - 1; i >= 0; i--) {
      const node = el.childNodes[i];
      if (node.nodeType === 3 && node.textContent.trim()) {
        node.textContent = node.textContent.replace(/(\S)\s+(\S+\s*)$/, '$1\u00A0$2');
        return true;
      }
      if (node.nodeType === 1 && glueLastWords(node)) return true;
    }
    return false;
  };
  document.querySelectorAll('p, blockquote, .stat span').forEach(glueLastWords);
}

// Bannière de témoins (Loi 25) : aucun témoin non essentiel avant un
// consentement explicite. Le choix est mémorisé 6 mois, puis redemandé.
// Le consentement PAR DÉFAUT (tout refusé) et l'application du choix mémorisé
// sont déclarés dans le <head> de chaque page, AVANT Google Tag Manager :
// ici on ne gère que la bannière et les mises à jour de choix.
(function () {
  const CLE = 'mad-consent-v1';
  const SIX_MOIS = 180 * 24 * 3600 * 1000;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  let memorise = null;
  try {
    const d = JSON.parse(localStorage.getItem(CLE));
    if (d && Date.now() - d.ts < SIX_MOIS) memorise = d;
  } catch (e) { /* stockage indisponible : on redemandera */ }

  const appliquer = (accepte) => {
    const etat = accepte ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: etat,
      ad_user_data: etat,
      ad_personalization: etat,
      analytics_storage: etat
    });
  };

  let bandeau = null;
  const fermer = (accepte) => {
    try { localStorage.setItem(CLE, JSON.stringify({ accepte, ts: Date.now() })); } catch (e) {}
    appliquer(accepte);
    if (bandeau) {
      const b = bandeau;
      bandeau = null;
      b.classList.remove('visible');
      setTimeout(() => b.remove(), 450);
    }
    // Si le visiteur a suivi le lien du bandeau vers la politique de
    // confidentialité, on le ramène à l'accueil (dans sa langue) une fois
    // son choix fait.
    if (location.pathname.indexOf('politique-confidentialite') !== -1) {
      setTimeout(() => { location.href = '/index.html'; }, 350);
    } else if (location.pathname.indexOf('privacy-policy') !== -1) {
      setTimeout(() => { location.href = '/en/index.html'; }, 350);
    }
  };
  const enAnglais = location.pathname.indexOf('/en/') !== -1;
  const ouvrir = () => {
    if (bandeau) return;
    bandeau = document.createElement('div');
    bandeau.className = 'cookie-banner';
    bandeau.setAttribute('role', 'dialog');
    bandeau.setAttribute('aria-label', enAnglais ? 'Cookie consent' : 'Consentement aux témoins');
    bandeau.innerHTML = enAnglais
      ? '<p>We use cookies to measure site traffic and the performance of our campaigns. <a href="/en/privacy-policy.html">Privacy policy</a></p>' +
        '<div class="cookie-actions">' +
        '<button type="button" class="btn btn-primary btn-sm" data-choix="oui">Accept</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-choix="non">Decline</button>' +
        '</div>'
      : '<p>Nous utilisons des témoins (cookies) pour analyser la fréquentation du site et mesurer nos campagnes. <a href="/politique-confidentialite.html">Politique de confidentialité</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-choix="oui">Accepter</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-choix="non">Refuser</button>' +
      '</div>';
    document.body.appendChild(bandeau);
    requestAnimationFrame(() => requestAnimationFrame(() => bandeau && bandeau.classList.add('visible')));
    bandeau.querySelectorAll('button').forEach(b =>
      b.addEventListener('click', () => fermer(b.dataset.choix === 'oui'))
    );
  };
  if (!memorise) setTimeout(ouvrir, 900);

  // Lien « Gérer les témoins » dans le pied de page, pour changer d'avis
  const bas = document.querySelector('.footer-bottom');
  if (bas) {
    const lien = document.createElement('a');
    lien.href = '#';
    lien.className = 'cookie-manage';
    lien.textContent = enAnglais ? 'Manage cookies' : 'Gérer les témoins';
    lien.addEventListener('click', (e) => { e.preventDefault(); ouvrir(); });
    bas.appendChild(lien);
  }
})();

// Révélation au scroll
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Section croissance épinglée : la ligne se trace pendant que la section reste
// figée à l'écran (sticky), au rythme du scroll dans le wrapper.
const growthWrap = document.querySelector('.growth-pin-wrap');
if (growthWrap) {
  const clipRect = document.getElementById('growthClipRect');
  const dot = document.getElementById('growthDot');
  const W = 1440;
  const pts = [[0,540],[180,500],[360,520],[540,430],[720,450],[900,320],[1080,340],[1260,190],[1440,90]];
  const yAt = (x) => {
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i][0] && x <= pts[i + 1][0]) {
        const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
        return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
      }
    }
    return pts[pts.length - 1][1];
  };

  const draw = (p) => {
    clipRect.setAttribute('width', (W * p).toFixed(1));
    if (p > 0.004 && p < 0.996) {
      const x = W * p;
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', yAt(x).toFixed(1));
      dot.style.opacity = '1';
    } else {
      dot.style.opacity = '0';
    }
  };

  if (reduceMotion) {
    draw(1); // ligne complète, sans épinglage, si mouvement réduit
  } else {
    // Boucle continue (pas d'écouteur scroll) : la position est relue à
    // chaque image, fiable même quand les événements de défilement sont
    // filtrés (certains navigateurs intégrés/mobiles).
    let lastP = -1;
    const loop = () => {
      const travel = Math.max(growthWrap.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max((window.scrollY - growthWrap.offsetTop) / travel, 0), 1);
      if (Math.abs(p - lastP) > 0.0005) { draw(p); lastP = p; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Scènes de mini-résultats : deux mouvements liés au scroll.
// 1. ENTRÉE : les cartes arrivent du haut-droit en tournant sur elles-mêmes,
//    en cascade, et viennent se poser à leur place (réversible au scroll).
// 2. PARALLAXE : une fois posées, chaque carte glisse selon son data-depth
//    → effet de profondeur 3D pendant le défilement.
const statScenes = document.querySelectorAll('.stat-scene');
if (statScenes.length && !reduceMotion) {
  let ticking3d = false;
  const smooth = (x) => x * x * (3 - 2 * x);
  const mobileScene = window.matchMedia('(max-width: 768px)');
  const updateScenes = () => {
    ticking3d = false;
    const vh = window.innerHeight;
    statScenes.forEach(scene => {
      const r = scene.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 480) return; // hors écran
      // Progression d'entrée : 0 quand la scène pointe sous l'écran,
      // 1 dès qu'elle est bien engagée dans l'écran (entrée rapide).
      const e = Math.min(Math.max((vh - r.top) / (vh * 0.5), 0), 1);
      const p = (r.top + r.height / 2 - vh / 2) / vh; // parallaxe -0.5…0.5
      const cards = scene.querySelectorAll('[data-depth]');
      cards.forEach((el, i) => {
        const d = parseFloat(el.dataset.depth) || 1;
        const py = p * d * -58;
        // Mobile : pas de vol d'entrée (les cartes se chevauchaient) —
        // elles sont posées d'avance, seule la parallaxe reste.
        const s = mobileScene.matches
          ? 1
          : smooth(Math.min(Math.max(e * 2 - i * 0.12, 0), 1));
        const inv = 1 - s;
        const tx = inv * (220 + i * 50);
        const ty = inv * -(260 + i * 35) + py;
        const rot = inv * (200 - i * 25);
        const sc = 0.55 + 0.45 * s;
        el.style.transform =
          'translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px) ' +
          'rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
        el.style.opacity = (0.05 + 0.95 * s).toFixed(3);
      });
    });
  };
  const onScroll3d = () => {
    if (!ticking3d) { ticking3d = true; requestAnimationFrame(updateScenes); }
  };
  window.addEventListener('scroll', onScroll3d, { passive: true });
  window.addEventListener('resize', onScroll3d);
  updateScenes();
}

// Fusée du hero : la vidéo avance au rythme du défilement (scrubbing),
// avec un lissage pour que le mouvement reste fluide.
const rocketVid = document.getElementById('heroRocketVid');
if (rocketVid) {
  const heroSection = rocketVid.closest('.hero');
  // Chargement en Blob : certains serveurs (dont le serveur de test local) ne
  // gèrent pas les requêtes partielles, ce qui bloque les sauts dans la vidéo.
  fetch(rocketVid.getAttribute('src'))
    .then(r => r.blob())
    .then(b => { rocketVid.src = URL.createObjectURL(b); })
    .catch(() => {});

  // iPhone/Safari : les sauts d'image (currentTime) ne s'affichent parfois
  // qu'après un premier démarrage déclenché par un geste. On amorce donc la
  // vidéo (lecture-pause éclair, muette) au premier toucher ou défilement.
  let amorcee = false;
  const amorcer = () => {
    if (amorcee) return;
    amorcee = true;
    const p = rocketVid.play();
    if (p && p.then) p.then(() => rocketVid.pause()).catch(() => {});
  };
  window.addEventListener('touchstart', amorcer, { once: true, passive: true });
  window.addEventListener('scroll', amorcer, { once: true, passive: true });
  let targetP = 0;
  let currentP = 0;
  const setTargetP = () => {
    const range = Math.max(heroSection.offsetHeight - 100, 1);
    targetP = Math.min(Math.max(window.scrollY / range, 0), 1);
  };
  const tickVid = () => {
    setTargetP(); // relu à chaque image : fiable même sans événements scroll
    // Montée en douceur (0.12); redescente RAPIDE (0.4) quand on remonte la
    // page, pour ne pas voir la fusée retomber lentement à travers le texte.
    const vitesse = targetP < currentP ? 0.4 : 0.12;
    currentP += (targetP - currentP) * vitesse;
    if (window.scrollY < heroSection.offsetHeight + 200) {
      // Décollage : cachée sous l'écran (85 %) au repos, sortie par le haut
      // (-100 %) en fin de parcours, pendant que le temps de la vidéo suit la
      // même progression (pas de boucle : la coupure du rebouclage se voyait).
      // Safari/iPhone : on attend que le saut précédent soit terminé avant
      // d'en demander un autre, sinon la vidéo fige (recherches empilées).
      if (rocketVid.duration && !rocketVid.seeking) {
        const t = currentP * (rocketVid.duration - 0.05);
        if (Math.abs(t - rocketVid.currentTime) > 0.033) {
          rocketVid.currentTime = t;
        }
      }
      rocketVid.style.transform = 'translateY(' + (85 - currentP * 185).toFixed(2) + '%)';
    }
    requestAnimationFrame(tickVid);
  };
  window.addEventListener('scroll', setTargetP, { passive: true });
  window.addEventListener('resize', setTargetP);
  setTargetP();
  if (reduceMotion) {
    rocketVid.addEventListener('loadedmetadata', () => {
      rocketVid.currentTime = rocketVid.duration * 0.5;
      rocketVid.style.transform = 'translateY(0%)';
    });
  } else {
    requestAnimationFrame(tickVid);
  }
}

const reveals = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach(el => el.classList.add('visible'));
} else {
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => io.observe(el));
}
