// Genosis — shared site behavior (nav, mobile drawer, scroll fades, contact form)
// Plain ES5/ES6, no framework. Loaded on every page.

  // SCROLL FADE
  function triggerScrollFades() {
    const els = document.querySelectorAll('.scroll-fade');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => {
      if (!el.classList.contains('in')) obs.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', triggerScrollFades);

  // ===== MENU CONTROLLER =====
  // Handles desktop hover, click-toggle, click-outside, escape, and mobile drawer.
  const navMenu = document.getElementById('navMenu');
  const navItems = navMenu.querySelectorAll('li[data-menu]');
  let hoverCloseTimer = null;
  const HOVER_CLOSE_DELAY = 150; // small delay so cursor can travel between trigger and panel

  function isMobile() { return window.innerWidth <= 980; }

  function openDropdown(menuKey) {
    navItems.forEach(li => {
      const isTarget = li.dataset.menu === menuKey;
      li.classList.toggle('is-open', isTarget);
      const trigger = li.querySelector('a.nav-link');
      if (trigger) trigger.setAttribute('aria-expanded', isTarget ? 'true' : 'false');
    });
  }

  function closeAllDropdowns() {
    navItems.forEach(li => {
      li.classList.remove('is-open');
      const trigger = li.querySelector('a.nav-link');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function toggleDropdown(event, menuKey) {
    event.preventDefault();
    event.stopPropagation();
    const li = navMenu.querySelector(`li[data-menu="${menuKey}"]`);
    if (!li) return;
    if (li.classList.contains('is-open')) {
      closeAllDropdowns();
    } else {
      openDropdown(menuKey);
    }
  }

  // Desktop hover-intent: open on enter, close after small delay on leave
  navItems.forEach(li => {
    li.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
      openDropdown(li.dataset.menu);
    });
    li.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
      hoverCloseTimer = setTimeout(closeAllDropdowns, HOVER_CLOSE_DELAY);
    });
  });

  // Click outside closes dropdowns
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target)) closeAllDropdowns();
  });

  // Escape key closes everything
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeMobileNav();
    }
  });

  // ===== MOBILE DRAWER =====
  function toggleMobileNav() {
    const isOpen = document.body.classList.toggle('nav-open');
    const drawer = document.getElementById('mobileDrawer');
    document.querySelector('.mobile-toggle').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (drawer) drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (!isOpen) {
      closeAllDropdowns();
      closeAllDrawerSubmenus();
    }
  }
  function closeMobileNav() {
    document.body.classList.remove('nav-open');
    document.querySelector('.mobile-toggle').setAttribute('aria-expanded', 'false');
    const drawer = document.getElementById('mobileDrawer');
    if (drawer) drawer.setAttribute('aria-hidden', 'true');
    closeAllDropdowns();
    closeAllDrawerSubmenus();
  }
  function toggleDrawerSubmenu(menuKey) {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    const items = drawer.querySelectorAll('li[data-drawer-menu]');
    items.forEach(li => {
      if (li.dataset.drawerMenu === menuKey) {
        const willOpen = !li.classList.contains('is-open');
        li.classList.toggle('is-open', willOpen);
        const btn = li.querySelector('button');
        if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      } else {
        li.classList.remove('is-open');
        const btn = li.querySelector('button');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  function closeAllDrawerSubmenus() {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    drawer.querySelectorAll('li[data-drawer-menu]').forEach(li => {
      li.classList.remove('is-open');
      const btn = li.querySelector('button');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  // Close mobile drawer if window resizes back to desktop
  window.addEventListener('resize', () => {
    if (!isMobile() && document.body.classList.contains('nav-open')) {
      closeMobileNav();
    }
  });

  // ===== ACTIVE PAGE HIGHLIGHTING =====
  function setCurrentNav(pageKey) {
    document.querySelectorAll('a.nav-link').forEach(a => a.classList.remove('is-current'));
    // Direct page match
    const direct = document.querySelector(`a.nav-link[data-page="${pageKey}"]`);
    if (direct) { direct.classList.add('is-current'); return; }
    // Section match (program/industry/solution pages light up their section)
    if (pageKey && pageKey.startsWith('program-')) {
      const trigger = document.querySelector('li[data-menu="programs"] > a.nav-link');
      if (trigger) trigger.classList.add('is-current');
    } else if ((pageKey && pageKey.startsWith('industry-')) || pageKey === 'industries') {
      const trigger = document.querySelector('li[data-menu="industries"] > a.nav-link');
      if (trigger) trigger.classList.add('is-current');
    } else if ((pageKey && pageKey.startsWith('solution-')) || pageKey === 'solutions') {
      const trigger = document.querySelector('li[data-menu="solutions"] > a.nav-link');
      if (trigger) trigger.classList.add('is-current');
    }
  }

  // ===== CONTACT FORM PATH =====
  var CONTACT_PATH_LABELS = {
    briefing: 'Request a briefing',
    advisory: 'Advisory engagement',
    partnership: 'Partnership inquiry',
    general: 'General inquiry'
  };
  function setContactPath(event, path) {
    document.querySelectorAll('.contact-path').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    const programRow = document.getElementById('program-row');
    if (programRow) programRow.style.display = path === 'briefing' ? 'block' : 'none';
    const inquiryType = document.getElementById('inquiry-type');
    if (inquiryType) inquiryType.value = CONTACT_PATH_LABELS[path] || path;
  }

  // ===== CONTACT FORM SUBMISSION (Formspree AJAX) =====
  (function () {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var submitBtn = document.getElementById('contact-submit');
    var errorEl = document.getElementById('contact-error');
    var successEl = document.getElementById('contact-success');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (errorEl) errorEl.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          form.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
        } else {
          return response.json().then(function (data) {
            var msg = 'Something went wrong. Please try again, or email contact@genosis.io.';
            if (data && data.errors && data.errors.length) {
              msg = data.errors.map(function (e) { return e.message; }).join(' ');
            }
            throw new Error(msg);
          });
        }
      }).catch(function (err) {
        if (errorEl) {
          errorEl.textContent = err.message || 'Something went wrong. Please try again, or email contact@genosis.io.';
          errorEl.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit inquiry';
        }
      });
    });
  })();
