/* ==========================================================================
   Notes Carousel — Switch-style infinite category slider
   Works with the notes-overview layout.
   ========================================================================== */

(function () {
  /* DOM refs */
  var viewport  = document.getElementById('carousel-viewport');
  var track     = document.getElementById('carousel-track');
  var stageCat  = document.getElementById('category-stage');
  var stageWall = document.getElementById('notes-wall-stage');
  var wallTitle = document.getElementById('wall-category-title');
  var notesGrid = document.getElementById('notes-grid');
  var backBtn   = document.getElementById('back-to-categories');

  if (!viewport || !track) return;

  var cards       = track.querySelectorAll('.carousel-card');
  var allCards    = Array.from(cards);
  var totalCards  = allCards.length;

  /* Notes data — injected by Jekyll into a <script type="application/json"> tag */
  var notesData     = [];
  var categoriesMap = {};
  var totalUnique   = 3; /* fallback */
  try {
    var dataEl  = document.getElementById('notes-data');
    var payload = dataEl ? JSON.parse(dataEl.textContent) : {};
    notesData     = payload.notes || [];
    categoriesMap = payload.categories || {};
    totalUnique   = Object.keys(categoriesMap).length || (allCards.length / 3) || 1;
  } catch (e) {
    totalUnique = Math.max(1, Math.floor(allCards.length / 3));
  }

  var currentIndex   = totalUnique;
  var isDragging     = false;
  var startX         = 0;
  var startTranslate = 0;
  var translateX     = 0;
  var cardWidth      = 0;
  var cardGap        = 28;
  var clickTime      = 0;
  var clickTarget    = null;

  /* ── Layout measurement ──────────────────────── */
  function measure() {
    if (cards.length > 0) {
      cardWidth = cards[0].offsetWidth;
    }
    cardGap = parseFloat(getComputedStyle(track).gap) || 28;
    snapToCard(currentIndex, false);
  }

  /* ── Snap to card index ──────────────────────── */
  function snapToCard(idx, animate) {
    currentIndex = idx;
    var offset = -(idx * (cardWidth + cardGap))
               + (viewport.offsetWidth / 2)
               - (cardWidth / 2);
    translateX = offset;

    track.style.transition = animate
      ? 'transform 420ms cubic-bezier(0.22, 0.68, 0, 1.02)'
      : 'none';
    track.style.transform = 'translateX(' + translateX + 'px)';

    updateCardStates(idx);

    /* Handle infinite loop after transition */
    if (animate) {
      setTimeout(function () {
        if (currentIndex < totalUnique) {
          jumpToIndex(currentIndex + totalUnique, false);
        } else if (currentIndex >= totalUnique * 2) {
          jumpToIndex(currentIndex - totalUnique, false);
        }
      }, 450);
    }
  }

  function jumpToIndex(idx, animate) {
    currentIndex = idx;
    track.style.transition = animate
      ? 'transform 420ms cubic-bezier(0.22, 0.68, 0, 1.02)'
      : 'none';
    var offset = -(idx * (cardWidth + cardGap))
               + (viewport.offsetWidth / 2)
               - (cardWidth / 2);
    translateX = offset;
    track.style.transform = 'translateX(' + translateX + 'px)';
    updateCardStates(idx);
  }

  function updateCardStates(activeIdx) {
    allCards.forEach(function (c, i) {
      c.classList.toggle('is-active', i === activeIdx);
    });
  }

  /* ── Pointer events ──────────────────────────── */
  function getClientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onPointerDown(e) {
    isDragging = true;
    startX = getClientX(e);
    startTranslate = translateX;
    track.style.transition = 'none';
    track.style.cursor = 'grabbing';

    /* Track double-click */
    var now = Date.now();
    var card = e.target.closest('.carousel-card');
    if (card && now - clickTime < 350 && clickTarget === card) {
      /* Double-click detected */
      isDragging = false;
      var catSlug = card.dataset.category;
      var catName = card.dataset.name;
      showNotesWall(catSlug, catName);
      return;
    }
    clickTime = now;
    clickTarget = card;

    viewport.setPointerCapture(e.pointerId || 1);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    var dx = getClientX(e) - startX;
    translateX = startTranslate + dx;
    track.style.transform = 'translateX(' + translateX + 'px)';
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';

    var dx = getClientX(e) - startX;
    var step = cardWidth + cardGap;
    var snappedIndex = Math.round(
      (startTranslate + dx - (viewport.offsetWidth / 2) + (cardWidth / 2)) / -step
    );

    /* Clamp to valid range */
    snappedIndex = Math.max(0, Math.min(totalCards - 1, snappedIndex));
    snapToCard(snappedIndex, true);
  }

  /* ── Wheel / trackpad ────────────────────────── */
  function onWheel(e) {
    e.preventDefault();
    var step = cardWidth + cardGap;
    if (e.deltaX > 30 || e.deltaY > 30) {
      snapToCard(Math.min(totalCards - 1, currentIndex + 1), true);
    } else if (e.deltaX < -30 || e.deltaY < -30) {
      snapToCard(Math.max(0, currentIndex - 1), true);
    }
  }

  /* ── Keyboard ────────────────────────────────── */
  function onKeyDown(e) {
    if (stageCat && stageCat.style.display === 'none') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      snapToCard(Math.max(0, Math.min(totalCards - 1, currentIndex + dir)), true);
    }
  }

  /* ── Show notes wall for a category ──────────── */
  function showNotesWall(catSlug, catName) {
    wallTitle.textContent = catName;
    stageCat.style.display = 'none';
    stageWall.style.display = 'block';

    var filtered = notesData.filter(function (n) {
      return n.category === catSlug;
    });
    renderNotesGrid(filtered);
  }

  /* ── Render notes as polaroid grid ───────────── */
  function renderNotesGrid(notes) {
    notesGrid.innerHTML = '';

    if (notes.length === 0) {
      notesGrid.innerHTML =
        '<p class="no-notes-msg">No notes yet — check back soon ✍️</p>';
      return;
    }

    var n = notes.length;
    var cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(n) * 1.2)));
    var rows = Math.ceil(n / cols);
    notesGrid.style.setProperty('--shelf-cols', cols);

    var html = '';
    for (var r = 0; r < rows; r++) {
      html += '<div class="shelf-row">';
      for (var c = 0; c < cols; c++) {
        var idx = r * cols + c;
        if (idx < n) {
          var note = notes[idx];
          var catInfo = categoriesMap[note.category] || {};
          var cardColor = catInfo.color || '#e8e8e8';
          var cardIcon  = catInfo.icon  || '📝';
          html +=
            '<a href="' + note.url + '" class="shelf-photo note-card" style="--card-color: ' + cardColor + ';">' +
            '<div class="photo-mat note-mat">' +
            '<div class="note-mat__inner" style="background: linear-gradient(145deg, color-mix(in srgb, ' + cardColor + ' 40%, #fff 60%) 0%, color-mix(in srgb, ' + cardColor + ' 50%, #fff 50%) 100%);">' +
            '<span class="note-mat__icon">' + cardIcon + '</span>' +
            '<span class="note-mat__title">' + escapeHTML(note.title) + '</span>' +
            '</div>' +
            '</div>' +
            '<span class="photo-label">' + escapeHTML(note.date || '') + '</span>' +
            '</a>';
        } else {
          html +=
            '<div class="shelf-photo is-empty" aria-hidden="true">' +
            '<div class="photo-mat"></div>' +
            '</div>';
        }
      }
      html += '</div>';
    }
    notesGrid.innerHTML = html;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ── Back to categories ──────────────────────── */
  backBtn.addEventListener('click', function () {
    stageWall.style.display = 'none';
    stageCat.style.display = '';
    measure();
  });

  /* ── Event listeners ─────────────────────────── */
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup',   onPointerUp);
  viewport.addEventListener('pointerleave', onPointerUp);
  viewport.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);

  /* Prevent native drag on card images */
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ── Resize ──────────────────────────────────── */
  window.addEventListener('resize', function () {
    measure();
  });

  /* ── Init ────────────────────────────────────── */
  measure();
  snapToCard(totalUnique, false);
})();
