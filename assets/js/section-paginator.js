/* ==========================================================================
   Section Paginator — paginates each [data-paginate] list, 10 items per page.
   Used by the Notes and Readings pages; pagination UI matches Projects.
   ========================================================================== */

(function () {
  var PER_PAGE = 10;

  var lists = document.querySelectorAll('[data-paginate]');
  if (!lists.length) return;

  Array.prototype.forEach.call(lists, function (list) {
    var items = Array.prototype.filter.call(list.children, function (el) {
      return el.tagName === 'LI';
    });

    var nav = list.nextElementSibling;
    if (!nav || !nav.classList.contains('holder')) {
      nav = null;
    }

    /* a single page fits — no pagination, no empty pager */
    if (items.length <= PER_PAGE) {
      if (nav) {
        nav.hidden = true;
        nav.innerHTML = '';
      }
      return;
    }

    var totalPages = Math.ceil(items.length / PER_PAGE);
    var currentPage = 1;

    /* heading right above the list — scroll target on page change */
    var heading = list.previousElementSibling;

    function render() {
      var start = (currentPage - 1) * PER_PAGE;
      var end = start + PER_PAGE;

      for (var i = 0; i < items.length; i++) {
        items[i].hidden = i < start || i >= end;
      }

      renderPagination();
    }

    function renderPagination() {
      if (!nav) return;

      if (totalPages <= 1) {
        nav.hidden = true;
        nav.innerHTML = '';
        return;
      }
      nav.hidden = false;

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

      nav.innerHTML = html;

      var btns = nav.querySelectorAll('button[data-page]');
      for (var k = 0; k < btns.length; k++) {
        btns[k].addEventListener('click', function () {
          var page = parseInt(this.getAttribute('data-page'), 10);
          if (page >= 1 && page <= totalPages) {
            currentPage = page;
            render();
            var target = heading && heading.tagName === 'H2' ? heading : list;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    }

    render();
  });

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
})();
