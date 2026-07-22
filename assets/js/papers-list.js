/* ==========================================================================
   Papers List — client-side pagination (20/page), domain filter, hover expand
   ========================================================================== */

(function () {
  var listEl       = document.getElementById('papers-list');
  var paginationEl = document.getElementById('papers-pagination');
  var filterEl     = document.getElementById('domain-filter');

  if (!listEl) return;

  /* ── Load data ───────────────────────────────── */
  var allPapers = [];
  try {
    var dataEl = document.getElementById('papers-data');
    if (dataEl) {
      allPapers = JSON.parse(dataEl.textContent).papers || [];
    }
  } catch (e) {
    allPapers = [];
  }

  var PER_PAGE    = 20;
  var currentPage = 1;
  var activeDomain = 'all';

  /* ── Filtering ───────────────────────────────── */
  function filteredPapers() {
    if (activeDomain === 'all') return allPapers;
    var slug = activeDomain;
    return allPapers.filter(function (p) {
      return slugify(p.domain) === slug;
    });
  }

  function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ── Render ──────────────────────────────────── */
  function render() {
    var filtered = filteredPapers();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    /* Clamp current page */
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PER_PAGE;
    var pageItems = filtered.slice(start, start + PER_PAGE);

    /* Build list HTML */
    if (pageItems.length === 0) {
      listEl.innerHTML =
        '<p class="papers-no-results">No papers in this domain yet 📚</p>';
    } else {
      var html = '';
      for (var i = 0; i < pageItems.length; i++) {
        var p = pageItems[i];
        var href = '#';
        if (p.file) {
          href = '/papers/' + p.file + '/';
        } else if (p.url) {
          href = p.url;
        }

        html +=
          '<div class="paper-entry" data-href="' + href + '">' +
          '<div class="paper-entry__compact">' +
            '<span class="paper-meta-year">' + escapeHTML(String(p.year || '')) + '</span>' +
            '<span class="paper-meta-domain">' + escapeHTML(p.domain || '') + '</span>' +
            '<span class="paper-meta-model">' + escapeHTML(p.model || '') + '</span>' +
            '<span class="paper-entry__title">' + escapeHTML(p.title || '') + '</span>' +
            '<span class="paper-entry__venue">' + escapeHTML(p.venue || '') + '</span>' +
          '</div>' +
          '<div class="paper-entry__excerpt">' +
            '<div class="paper-entry__excerpt-inner">' + escapeHTML(p.excerpt || '').replace(/\n/g, '<br>') + '</div>' +
          '</div>' +
          '<span class="paper-entry__click-hint">' + (p.file ? 'click for review →' : '') + '</span>' +
          '</div>';
      }
      listEl.innerHTML = html;

      /* Attach click handlers */
      var entries = listEl.querySelectorAll('.paper-entry');
      for (var j = 0; j < entries.length; j++) {
        entries[j].addEventListener('click', function () {
          var h = this.getAttribute('data-href');
          if (h && h !== '#') {
            window.location.href = h;
          }
        });
      }
    }

    /* Pagination */
    renderPagination(totalPages);
  }

  /* ── Pagination controls ─────────────────────── */
  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    var html = '';

    /* Prev arrow */
    html += '<button class="pagination-btn pagination-arrow" data-page="' + (currentPage - 1) + '"' +
            (currentPage <= 1 ? ' disabled' : '') + '>←</button>';

    /* Page numbers with ellipsis */
    var pages = getPageRange(currentPage, totalPages);
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      if (p === '...') {
        html += '<span class="pagination-btn pagination-ellipsis">…</span>';
      } else {
        html += '<button class="pagination-btn' + (p === currentPage ? ' is-active' : '') +
                '" data-page="' + p + '">' + p + '</button>';
      }
    }

    /* Next arrow */
    html += '<button class="pagination-btn pagination-arrow" data-page="' + (currentPage + 1) + '"' +
            (currentPage >= totalPages ? ' disabled' : '') + '>→</button>';

    paginationEl.innerHTML = html;

    /* Attach pagination click handlers */
    var btns = paginationEl.querySelectorAll('.pagination-btn[data-page]');
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener('click', function () {
        var page = parseInt(this.getAttribute('data-page'), 10);
        var total = Math.max(1, Math.ceil(filteredPapers().length / PER_PAGE));
        if (page >= 1 && page <= total) {
          currentPage = page;
          render();
          listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  /* Generate page range like: 1 ... 4 5 6 ... 12 */
  function getPageRange(current, total) {
    if (total <= 7) {
      var range = [];
      for (var i = 1; i <= total; i++) range.push(i);
      return range;
    }

    var pages = [1];

    if (current > 3) pages.push('...');

    var start = Math.max(2, current - 1);
    var end   = Math.min(total - 1, current + 1);

    for (var j = start; j <= end; j++) {
      pages.push(j);
    }

    if (current < total - 2) pages.push('...');

    pages.push(total);
    return pages;
  }

  /* ── Domain filter ───────────────────────────── */
  if (filterEl) {
    filterEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.domain-chip');
      if (!chip) return;

      /* Update active chip */
      filterEl.querySelectorAll('.domain-chip').forEach(function (c) {
        c.classList.remove('is-active');
      });
      chip.classList.add('is-active');

      activeDomain = chip.getAttribute('data-domain') || 'all';
      currentPage = 1;
      render();
      listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ── Util ────────────────────────────────────── */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ── Init ────────────────────────────────────── */
  render();
})();
