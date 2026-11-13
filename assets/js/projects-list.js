/* ==========================================================================
   Projects List — client-side pagination, 3 projects per page, newest first
   ========================================================================== */

(function () {
  var listEl = document.getElementById('projects-list');
  var paginationEl = document.getElementById('projects-pagination');

  if (!listEl) return;

  /* ── Load data ───────────────────────────────── */
  var projects = [];
  try {
    var dataEl = document.getElementById('projects-data');
    if (dataEl) {
      projects = JSON.parse(dataEl.textContent).projects || [];
    }
  } catch (e) {
    projects = [];
  }

  /* newest (largest order) first */
  projects.sort(function (a, b) {
    return (b.order || 0) - (a.order || 0);
  });

  var PER_PAGE = 3;
  var currentPage = 1;

  /* ── Render ──────────────────────────────────── */
  function render() {
    var totalPages = Math.max(1, Math.ceil(projects.length / PER_PAGE));

    /* Clamp current page */
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PER_PAGE;
    var pageItems = projects.slice(start, start + PER_PAGE);

    var html = '';
    for (var i = 0; i < pageItems.length; i++) {
      var p = pageItems[i];

      html += '<div class="project-entry">';

      if (p.title) {
        html += '<h2 class="project-entry__title">' + escapeHTML(p.title) + '</h2>';
      }
      if (p.source) {
        html += '<p class="project-entry__source">' + escapeHTML(p.source) + '</p>';
      }
      if (p.period) {
        html += '<p class="project-entry__period"><em>' + escapeHTML(p.period) + '</em></p>';
      }
      if (p.image) {
        html +=
          '<figure class="project-entry__figure">' +
          '<img src="' + escapeHTML('/images/' + p.image) + '" alt="' + escapeHTML(p.title || 'Project image') + '" loading="lazy">' +
          '</figure>';
      }
      if (p.description) {
        html += '<p class="project-entry__description">' + escapeHTML(p.description) + '</p>';
      }

      html += '</div>';

      if (i < pageItems.length - 1) {
        html += '<hr />';
      }
    }
    listEl.innerHTML = html;

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
    html += '<button class="jp-previous pagination-arrow" data-page="' + (currentPage - 1) + '"' +
            (currentPage <= 1 ? ' disabled' : '') + '>&larr;</button>';

    /* Page numbers with ellipsis */
    var pages = getPageRange(currentPage, totalPages);
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      if (p === '...') {
        html += '<span class="jp-ellipsis">…</span>';
      } else {
        html += '<button class="jp-item' + (p === currentPage ? ' jp-current' : '') +
                '" data-page="' + p + '">' + p + '</button>';
      }
    }

    /* Next arrow */
    html += '<button class="jp-next pagination-arrow" data-page="' + (currentPage + 1) + '"' +
            (currentPage >= totalPages ? ' disabled' : '') + '>&rarr;</button>';

    paginationEl.innerHTML = html;

    /* Attach pagination click handlers */
    var btns = paginationEl.querySelectorAll('button[data-page]');
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener('click', function () {
        var page = parseInt(this.getAttribute('data-page'), 10);
        var total = Math.max(1, Math.ceil(projects.length / PER_PAGE));
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
    var end = Math.min(total - 1, current + 1);

    for (var j = start; j <= end; j++) {
      pages.push(j);
    }

    if (current < total - 2) pages.push('...');

    pages.push(total);
    return pages;
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
