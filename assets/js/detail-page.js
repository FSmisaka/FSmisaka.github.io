/* ==========================================================================
   Detail Page — table of contents (right-side dashes) + back-to-top button
   Used by: note-detail, paper-detail
   ========================================================================== */

(function () {
  var body = document.querySelector('.note-body');
  if (!body) return;

  /* ── Build TOC ────────────────────────────────── */
  var headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length < 2) return; // need at least 2 headings for useful TOC

  // Ensure every heading has an id (kramdown auto_ids may have set them)
  headings.forEach(function (h, i) {
    if (!h.id) {
      h.id = 'section-' + (i + 1);
    }
  });

  // Build dash indicators and panel entries
  var dashesHtml = '';
  var panelHtml  = '';
  var minLevel = 6;

  headings.forEach(function (h) {
    var level = parseInt(h.tagName.charAt(1), 10);
    if (level < minLevel) minLevel = level;
  });

  headings.forEach(function (h, i) {
    var level = parseInt(h.tagName.charAt(1), 10);
    var indent = level - minLevel;
    var title  = h.textContent.trim();

    // Dash — width scales with level (higher = longer)
    var dashClass = 'toc-dash toc-dash--l' + level;

    dashesHtml +=
      '<span class="' + dashClass + '" ' +
      'data-target="' + h.id + '" ' +
      'title="' + escapeAttr(title) + '"></span>';

    // Panel entry
    panelHtml +=
      '<a href="#' + h.id + '" class="toc-link toc-link--l' + level + '" ' +
      'style="padding-left:' + (8 + indent * 14) + 'px;">' +
      escapeHTML(title) +
      '</a>';
  });

  // Create TOC sidebar
  var sidebar = document.createElement('nav');
  sidebar.className = 'toc-sidebar';
  sidebar.setAttribute('aria-label', 'Table of contents');
  sidebar.innerHTML =
    '<div class="toc-dashes">' + dashesHtml + '</div>' +
    '<div class="toc-panel">' +
      '<div class="toc-panel__title">Contents</div>' +
      '<div class="toc-panel__links">' + panelHtml + '</div>' +
    '</div>';

  document.body.appendChild(sidebar);

  /* ── Click: scroll to heading ─────────────────── */
  sidebar.addEventListener('click', function (e) {
    var target = e.target.closest('[data-target]') || e.target.closest('a[href^="#"]');
    if (!target) return;

    var id;
    if (target.hasAttribute('data-target')) {
      id = target.getAttribute('data-target');
    } else {
      id = target.getAttribute('href').slice(1);
    }

    var heading = document.getElementById(id);
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Don't add to history for TOC navigation
      if (e.target.closest('.toc-dash')) {
        e.preventDefault();
      }
    }
  });

  /* ── Update active dash based on scroll position ── */
  var activeDash = null;
  window.addEventListener('scroll', function () {
    var scrollPos = window.scrollY + 100; // offset for fixed header

    // Find the heading closest to the top
    var current = null;
    headings.forEach(function (h) {
      if (h.offsetTop <= scrollPos) {
        current = h;
      }
    });

    if (current) {
      var newDash = sidebar.querySelector('[data-target="' + current.id + '"]');
      if (newDash && newDash !== activeDash) {
        if (activeDash) activeDash.classList.remove('is-active');
        newDash.classList.add('is-active');
        activeDash = newDash;

        // Also highlight in panel
        var oldLink = sidebar.querySelector('.toc-link.is-active');
        if (oldLink) oldLink.classList.remove('is-active');
        var newLink = sidebar.querySelector('a[href="#' + current.id + '"]');
        if (newLink) newLink.classList.add('is-active');
      }
    }
  }, { passive: true });

  /* ── Back to top ──────────────────────────────── */
  var backBtn = document.createElement('button');
  backBtn.className = 'back-to-top';
  backBtn.setAttribute('aria-label', 'Back to top');
  backBtn.innerHTML = '↑';
  backBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(backBtn);

  // Show/hide based on scroll
  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      backBtn.classList.add('is-visible');
    } else {
      backBtn.classList.remove('is-visible');
    }
  }, { passive: true });

  /* ── Helpers ──────────────────────────────────── */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
