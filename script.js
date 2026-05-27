/* ═══════════════════════════════════════════════════════════
   script.js — Alex Morgan Portfolio
   Handles: loader, theme, navbar, mobile menu, typing effect,
            scroll reveal, skill bars, active nav, scroll-to-top,
            contact form toast, footer year.
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── Utility: safely get DOM element ───────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ════════════════════════════════════════════════════════════
   1. LOADING SCREEN
   ════════════════════════════════════════════════════════════ */
(function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  // Hide loader after page is ready (min 1.9 s for the animation)
  const minTime = new Promise(res => setTimeout(res, 1900));
  const pageLoad = new Promise(res => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res);
  });

  Promise.all([minTime, pageLoad]).then(() => {
    loader.classList.add('hidden');
    // Remove from DOM so it can't block interaction
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  });
})();

/* ════════════════════════════════════════════════════════════
   2. THEME TOGGLE  (dark ↔ light)
   ════════════════════════════════════════════════════════════ */
(function initTheme() {
  const btn = $('#themeToggle');
  const html = document.documentElement;

  // Persist preference
  const saved = localStorage.getItem('portfolio-theme');
  if (saved) html.setAttribute('data-theme', saved);

  btn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
  });
})();

/* ════════════════════════════════════════════════════════════
   3. NAVBAR — scroll glass effect + active link highlighting
   ════════════════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar  = $('#navbar');
  const links   = $$('.nav-links a');

  /* Add glass background once user scrolls past 40px */
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
    highlightActiveLink();
    toggleScrollTopBtn();
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Highlight the nav link whose section is in view */
  function highlightActiveLink() {
    const sections = $$('section[id]');
    let current = '';

    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) current = section.id;
    });

    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }
})();

/* ════════════════════════════════════════════════════════════
   4. MOBILE MENU
   ════════════════════════════════════════════════════════════ */
(function initMobileMenu() {
  const toggle  = $('#menuToggle');
  const menu    = $('#mobileMenu');
  const overlay = $('#menuOverlay');
  const links   = $$('#mobileMenu a');

  const open  = () => {
    menu?.classList.add('open');
    overlay?.classList.add('open');
    toggle?.classList.add('open');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    menu?.classList.remove('open');
    overlay?.classList.remove('open');
    toggle?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle?.addEventListener('click', () =>
    menu?.classList.contains('open') ? close() : open()
  );

  overlay?.addEventListener('click', close);

  // Close when a link is tapped
  links.forEach(a => a.addEventListener('click', close));

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.classList.contains('open')) close();
  });
})();

/* ════════════════════════════════════════════════════════════
   5. TYPING EFFECT (hero section)
   ════════════════════════════════════════════════════════════ */
(function initTypingEffect() {
  const el = $('#typingText');
  if (!el) return;

  const phrases = [
    'Front-End Developer',
    'VLSI Enthusiast',
    'Open-Source Contributor',
    'Problem Solver',
  ];

  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;
  let paused    = false;

  const SPEED_TYPE = 75;    // ms per character typed
  const SPEED_DEL  = 40;    // ms per character deleted
  const PAUSE_END  = 1800;  // pause after fully typed
  const PAUSE_DEL  = 400;   // pause before next phrase

  function tick() {
    if (paused) return;

    const phrase = phrases[phraseIdx];

    if (!deleting) {
      // Type forward
      el.textContent = phrase.slice(0, charIdx + 1);
      charIdx++;

      if (charIdx === phrase.length) {
        // Fully typed — pause then start deleting
        paused = true;
        setTimeout(() => { deleting = true; paused = false; schedule(); }, PAUSE_END);
        return;
      }
    } else {
      // Delete backward
      el.textContent = phrase.slice(0, charIdx - 1);
      charIdx--;

      if (charIdx === 0) {
        // Fully deleted — move to next phrase
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        paused = true;
        setTimeout(() => { paused = false; schedule(); }, PAUSE_DEL);
        return;
      }
    }

    schedule();
  }

  function schedule() {
    setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE);
  }

  // Small initial delay so page has settled
  setTimeout(schedule, 800);
})();

/* ════════════════════════════════════════════════════════════
   6. SCROLL REVEAL (Intersection Observer)
   ════════════════════════════════════════════════════════════ */
(function initScrollReveal() {
  const items = $$('.reveal');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Animate skill bars if inside one
          const fill = entry.target.querySelector('.skill-fill');
          if (fill) animateBar(fill);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach(el => observer.observe(el));

  // Also observe skill-bar-items that aren't .reveal wrappers
  $$('.skill-bar-item').forEach(item => {
    const fill = item.querySelector('.skill-fill');
    if (!fill) return;

    const barObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateBar(fill);
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    barObserver.observe(item);
  });

  function animateBar(fill) {
    const target = fill.dataset.width || '0';
    // Small delay so the reveal animation finishes first
    setTimeout(() => { fill.style.width = `${target}%`; }, 200);
  }
})();

/* ════════════════════════════════════════════════════════════
   7. SCROLL-TO-TOP BUTTON
   ════════════════════════════════════════════════════════════ */
function toggleScrollTopBtn() {
  const btn = $('#scrollTop');
  btn?.classList.toggle('visible', window.scrollY > 500);
}

$('#scrollTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ════════════════════════════════════════════════════════════
   8. CONTACT FORM — toast confirmation
   ════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const btn = $('#sendBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const name    = $('#name')?.value.trim();
    const email   = $('#email')?.value.trim();
    const message = $('#message')?.value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all required fields.', true);
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', true);
      return;
    }

    // Simulate sending (no real backend)
    btn.disabled = true;
    btn.innerHTML = '<span>Sending…</span>';

    setTimeout(() => {
      showToast('🎉 Message sent! I\'ll get back to you soon.');
      btn.disabled = false;
      btn.innerHTML = '<span>Send Message</span><i class="ph ph-paper-plane-tilt"></i>';

      // Clear form
      ['name','email','subject','message'].forEach(id => {
        const el = $(`#${id}`);
        if (el) el.value = '';
      });
    }, 1400);
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();

/* ─── Toast helper ───────────────────────────────────────────── */
function showToast(msg, isError = false) {
  // Remove any existing toast
  $$('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;

  if (isError) {
    toast.style.background = 'var(--text)';
    toast.style.color       = 'var(--bg)';
  }

  document.body.appendChild(toast);
  // Force reflow for animation
  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3200);
}

/* ════════════════════════════════════════════════════════════
   9. FOOTER YEAR
   ════════════════════════════════════════════════════════════ */
(function initFooterYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ════════════════════════════════════════════════════════════
   10. SMOOTH SCROLL — override for all anchor links
   ════════════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;

  const target = document.querySelector(anchor.getAttribute('href'));
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ════════════════════════════════════════════════════════════
   11. PROJECT CARD — subtle tilt on mouse move
   ════════════════════════════════════════════════════════════ */
(function initCardTilt() {
  const cards = $$('.project-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 to 0.5
      const y = (e.clientY - rect.top)  / rect.height - 0.5;

      card.style.transform = `
        perspective(600px)
        rotateY(${x * 8}deg)
        rotateX(${-y * 8}deg)
        translateY(-6px)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ════════════════════════════════════════════════════════════
   12. HERO BACKGROUND — subtle parallax on mouse move
   ════════════════════════════════════════════════════════════ */
(function initParallax() {
  const orbs = $$('.orb');
  if (!orbs.length) return;

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;  // -1 to 1
    const dy = (e.clientY - cy) / cy;

    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 10;
      orb.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
    });
  });
})();
