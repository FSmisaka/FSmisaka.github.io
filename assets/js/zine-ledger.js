/* ==========================================================================
   Coding Ledger — scroll crossfade + zine heatmaps (home page)
   Vanilla JS; works with the home-poster layout.

   Two chapters: the hero poster fades away while the ledger rises.
   Data is injected as committed snapshots next to the site (see
   scripts/fetch_contrib_data.py — refreshed daily by GitHub Actions).
   ========================================================================== */

(function () {
  /* DOM refs */
  var hero = document.querySelector('.zine-hero-stage .zine-poster');
  var ledgerFade = document.querySelector('.zine-ledger__fade');
  var ledgerItems = Array.prototype.slice.call(
    document.querySelectorAll('.zine-ledger__item')
  );
  var hint = document.querySelector('.zine-scroll-hint');

  if (!hero || !ledgerFade) return;

  var ghWrap = document.getElementById('zine-github-heatmap');
  var ghTotal = document.getElementById('zine-github-total');
  var ghYears = document.getElementById('zine-years');
  var lcRing = document.getElementById('zine-lc-ring');
  var lcBars = document.getElementById('zine-lc-bars');
  var lcStreak = document.getElementById('zine-lc-streak');
  var lcLangs = document.getElementById('zine-lc-langs');
  var lcWrap = document.getElementById('zine-lc-heatmap');
  var lcTotal = document.getElementById('zine-lc-total');
  var refreshDate = document.getElementById('zine-refresh-date');

  /* ── motion preference ── */
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── data ── */
  var ghData = null;
  var lcData = null;
  var currentYear = null;

  function loadJSON(path) {
    return fetch(path)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .catch(function () {
        return null;
      });
  }

  /* ── helpers ── */
  function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function monthShort(iso) {
    return MONTHS[+iso.slice(5, 7) - 1] || '';
  }

  function fmtDate(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
  }

  function isoWeekday(iso) {
    return (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7; /* Mon = 0 */
  }

  var todayIso = new Date().toISOString().slice(0, 10);
  var todayEpochDay = Math.floor(Date.now() / 86400000);

  function epochIso(day) {
    return new Date(day * 86400000).toISOString().slice(0, 10);
  }

  /* ── heatmap grid (shared by GitHub + LeetCode) ── */
  var G = { cell: 10, gap: 3, padL: 28, padT: 15, padB: 8 };
  var LEVEL_FILLS = ['#2c2416', '#ddd2bd', '#b3a184', '#86704f', '#d4453b'];
  var LEVEL_OPACITY = [0.07, 1, 1, 1, 1];
  var UNIT = G.cell + G.gap;

  function heatSVG(weeks, ariaLabel, noun) {
    var n = weeks.length;
    var W = G.padL + n * UNIT - G.gap;
    var H = G.padT + 7 * UNIT - G.gap + G.padB;
    var parts = [
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ariaLabel) + '">'
    ];

    /* month labels */
    var lastMonth = '';
    for (var i = 0; i < n; i++) {
      var first = weeks[i][0];
      if (!first || !first[2]) continue;
      var m = monthShort(first[2]);
      if (m && m !== lastMonth) {
        parts.push(
          '<text x="' + (G.padL + i * UNIT + 1) + '" y="' + (G.padT - 5) + '">' + m + '</text>'
        );
        lastMonth = m;
      }
    }

    /* weekday labels: M W F */
    var wd = ['M', 'W', 'F'];
    for (var r = 0; r < 3; r++) {
      parts.push(
        '<text x="' + (G.padL - 7) + '" y="' + (G.padT + r * 2 * UNIT + G.cell - 3) + '">' +
        wd[r] + '</text>'
      );
    }

    /* cells */
    for (var c = 0; c < n; c++) {
      var week = weeks[c];
      for (var d = 0; d < week.length; d++) {
        var cell = week[d];
        if (!cell || !cell[2]) continue;
        if (cell[2] > todayIso) continue; /* never render the future */
        var row = isoWeekday(cell[2]);
        var lvl = cell[1] || 0;
        var tip = cell[0] + ' ' + noun + ' · ' + fmtDate(cell[2]);
        parts.push(
          '<rect x="' + (G.padL + c * UNIT) + '" y="' + (G.padT + row * UNIT) +
          '" width="' + G.cell + '" height="' + G.cell + '" rx="2" fill="' +
          LEVEL_FILLS[lvl] + '" fill-opacity="' + LEVEL_OPACITY[lvl] + '">' +
          '<title>' + esc(tip) + '</title></rect>'
        );
      }
    }
    parts.push('</svg>');
    return parts.join('');
  }

  /* ── GitHub chapter ── */
  function renderGithub() {
    if (!ghData || !ghData.calendars || !ghData.calendars.length) {
      if (ghWrap) ghWrap.innerHTML = '<p class="zine-plate__empty">— contribution data unavailable —</p>';
      return;
    }
    var calendars = ghData.calendars.slice().sort(function (a, b) {
      return b.year - a.year;
    });
    currentYear = calendars[0].year;

    if (ghYears) {
      ghYears.innerHTML = calendars
        .map(function (cal) {
          return (
            '<button type="button" class="zine-years__btn" data-year="' + cal.year + '">' +
            cal.year + '</button>'
          );
        })
        .join('');
      Array.prototype.forEach.call(ghYears.children, function (b) {
        b.classList.toggle('is-active', +b.getAttribute('data-year') === currentYear);
      });
      ghYears.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.zine-years__btn');
        if (!btn) return;
        var year = +btn.getAttribute('data-year');
        if (year === currentYear) return;
        currentYear = year;
        Array.prototype.forEach.call(ghYears.children, function (b) {
          b.classList.toggle('is-active', +b.getAttribute('data-year') === year);
        });
        setGrid(ghWrap, makeGithubGrid(year));
        if (ghTotal) ghTotal.textContent = ghTotalText(year);
      });
    }
    setGrid(ghWrap, makeGithubGrid(currentYear));
    if (ghTotal) ghTotal.textContent = ghTotalText(currentYear);
  }

  function makeGithubGrid(year) {
    var cal = null;
    for (var i = 0; i < ghData.calendars.length; i++) {
      if (ghData.calendars[i].year === year) cal = ghData.calendars[i];
    }
    if (!cal) return '';
    /* current-year graphs stop at the present week (never render the future) */
    var weeks = cal.weeks;
    var last = 0;
    for (var w = 0; w < weeks.length; w++) {
      if (weeks[w].length && weeks[w][0][2] <= todayIso) last = w;
    }
    weeks = weeks.slice(0, last + 1);
    return heatSVG(weeks, 'GitHub contributions in ' + year, 'contributions');
  }

  function ghTotalText(year) {
    for (var i = 0; i < ghData.calendars.length; i++) {
      if (ghData.calendars[i].year === year) {
        return ghData.calendars[i].total + ' contributions in ' + year;
      }
    }
    return '';
  }

  function setGrid(wrap, svg) {
    if (!wrap) return;
    if (!svg) {
      wrap.innerHTML = '';
      return;
    }
    wrap.style.opacity = '0';
    window.setTimeout(function () {
      wrap.innerHTML = svg;
      wrap.style.opacity = '';
    }, 140);
  }

  /* ── LeetCode chapter ── */
  var currentLcYear = null;
  var lcYears = document.getElementById('zine-lc-years');

  function renderLeetcode() {
    if (!lcData || !lcData.solved) {
      if (lcWrap) lcWrap.innerHTML = '<p class="zine-plate__empty">— practice data unavailable —</p>';
      return;
    }
    var solved = lcData.solved;
    var pct = solved.totalQuestions ? solved.total / solved.totalQuestions : 0;

    /* ring */
    if (lcRing) {
      var R = 40;
      var C = 2 * Math.PI * R;
      var sw = 7;
      lcRing.innerHTML =
        '<svg viewBox="0 0 94 94" aria-hidden="true">' +
        '<circle cx="47" cy="47" r="' + R + '" fill="none" stroke="rgba(44,36,22,0.09)" stroke-width="' + sw + '"></circle>' +
        '<circle id="zine-lc-ring-progress" cx="47" cy="47" r="' + R + '" fill="none" stroke="#d4453b" ' +
        'stroke-width="' + sw + '" stroke-linecap="round" ' +
        'stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"></circle>' +
        '</svg>' +
        '<div class="zine-lc__ring-label">' +
        '<span class="zine-lc__ring-num">' + esc(solved.total) + '</span>' +
        '<span class="zine-lc__ring-sub">solved</span>' +
        '</div>';
    }

    /* difficulty bars */
    if (lcBars) {
      function row(label, cls, stat) {
        var p = stat.total ? stat.solved / stat.total * 100 : 0;
        return (
          '<div class="zine-lc__bar-row">' +
          '<span class="zine-lc__bar-label">' + label + '</span>' +
          '<span class="zine-lc__bar-track"><i class="zine-lc__bar-fill ' + cls + '"></i></span>' +
          '<span class="zine-lc__bar-count">' + stat.solved + ' / ' + stat.total + '</span>' +
          '</div>'
        );
      }
      lcBars.innerHTML =
        row('Easy', 'zine-lc__bar-fill--easy', solved.easy) +
        row('Medium', 'zine-lc__bar-fill--medium', solved.medium) +
        row('Hard', 'zine-lc__bar-fill--hard', solved.hard);
    }

    /* streak + active days */
    if (lcStreak) {
      var st = lcData.streak || {};
      lcStreak.innerHTML =
        '<span class="zine-lc__streak-mark"></span>' +
        '<b>' + esc(st.current || 0) + '</b>-day current streak · longest <b>' +
        esc(st.highest || 0) + '</b> · <b>' + esc(lcData.totalActiveDays || 0) + '</b> active days';
    }

    /* languages */
    if (lcLangs) {
      var langs = (lcData.languages || []).slice(0, 4);
      lcLangs.innerHTML = langs.length
        ? langs.map(function (l) { return esc(l.name) + ' ' + l.count; }).join(' · ')
        : '';
    }

    /* submissions heatmap — one year of submissions, GitHub-style with tabs */
    if (lcWrap && lcData.calendar) {
      var years = [];
      Object.keys(lcData.calendar).forEach(function (k) {
        var y = new Date(+k * 86400000).getUTCFullYear();
        if (years.indexOf(y) === -1) years.push(y);
      });
      years.sort(function (a, b) { return b - a; });
      currentLcYear = years[0];

      if (lcYears) {
        lcYears.innerHTML = years
          .map(function (y) {
            return (
              '<button type="button" class="zine-years__btn" data-year="' + y + '">' +
              y + '</button>'
            );
          })
          .join('');
        Array.prototype.forEach.call(lcYears.children, function (b) {
          b.classList.toggle('is-active', +b.getAttribute('data-year') === currentLcYear);
        });
        lcYears.addEventListener('click', function (ev) {
          var btn = ev.target.closest('.zine-years__btn');
          if (!btn) return;
          var y = +btn.getAttribute('data-year');
          if (y === currentLcYear) return;
          currentLcYear = y;
          Array.prototype.forEach.call(lcYears.children, function (b) {
            b.classList.toggle('is-active', +b.getAttribute('data-year') === y);
          });
          setGrid(lcWrap, lcYearGrid(y));
        });
      }
      setGrid(lcWrap, lcYearGrid(currentLcYear));
    }

    /* footer */
    if (lcTotal) {
      lcTotal.textContent = solved.total + ' of ' + solved.totalQuestions + ' solved';
    }
  }

  function lcYearGrid(year) {
    /* Sunday-based week columns trimmed to the year — same geometry as the
       Green-Wall data, so both plates share one grid language */
    var start = Date.UTC(year, 0, 1) / 86400000;
    var end = Date.UTC(year + 1, 0, 1) / 86400000;
    var sunday = start - ((start - 3 + 7) % 7);
    var weeks = [];
    for (var s = sunday; s < end; s += 7) {
      var week = [];
      for (var j = 0; j < 7; j++) {
        var day = s + j;
        if (day < start || day >= end) continue;
        week.push([lcData.calendar[day] || 0, 0, epochIso(day)]);
      }
      if (week.length) weeks.push(week);
    }
    /* current-year graphs stop at the present week (never render the future) */
    var last = 0;
    for (var w = 0; w < weeks.length; w++) {
      if (weeks[w].length && weeks[w][0][2] <= todayIso) last = w;
    }
    weeks = weeks.slice(0, last + 1);
    return heatSVG(
      assignLevels(weeks),
      'LeetCode submissions in ' + year,
      'submissions'
    );
  }

  function assignLevels(weeks) {
    /* days with 1 submission stay quiet; only real bursts reach vermillion */
    for (var w = 0; w < weeks.length; w++) {
      for (var d = 0; d < weeks[w].length; d++) {
        var v = weeks[w][d][0];
        weeks[w][d][1] = v <= 0 ? 0 : v === 1 ? 1 : v <= 3 ? 2 : v <= 6 ? 3 : 4;
      }
    }
    return weeks;
  }

  /* one-shot reveal: ring sweep + bars fill when the ledger becomes visible */
  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;

    var ringProg = document.getElementById('zine-lc-ring-progress');
    if (ringProg && lcData && lcData.solved) {
      var total = lcData.solved.totalQuestions || 1;
      var p = lcData.solved.total / total;
      var C = 2 * Math.PI * 40;
      window.requestAnimationFrame(function () {
        ringProg.style.strokeDashoffset = String(C * (1 - p));
      });
    }

    if (lcBars && lcData && lcData.solved) {
      var fills = lcBars.querySelectorAll('.zine-lc__bar-fill');
      var stats = [lcData.solved.easy, lcData.solved.medium, lcData.solved.hard];
      window.requestAnimationFrame(function () {
        for (var i = 0; i < fills.length; i++) {
          var s = stats[i];
          fills[i].style.width = (s && s.total ? s.solved / s.total * 100 : 0) + '%';
        }
      });
    }
  }

  /* ── scroll choreography ── */
  var ticking = false;
  var ITEM_RANGES = [
    [0.14, 0.70],
    [0.26, 0.82],
    [0.38, 0.94],
    [0.50, 1.05]
  ];

  function update() {
    ticking = false;
    var reduced = motionQuery.matches;
    var vh = window.innerHeight || 1;
    var y = window.scrollY || document.documentElement.scrollTop || 0;

    /* hero chapter fades across the first viewport of scroll */
    var hp = clamp01(y / (vh * 0.92));
    hero.style.opacity = reduced ? (hp > 0.5 ? '0' : '1') : String(1 - easeInOut(hp));
    if (!reduced) {
      hero.style.transform = 'translateY(' + (-4 * hp) + 'vh)';
    }
    if (hint) {
      hint.style.opacity = String(clamp01(1 - hp * 2.4));
    }

    /* ledger chapter rises over its own viewport of scroll */
    var rect = ledgerFade.getBoundingClientRect();
    var t = clamp01(1 - rect.top / vh);
    var box = easeInOut(clamp01((t - 0.12) / 0.62));
    ledgerFade.style.opacity = String(box);
    if (!reduced) {
      ledgerFade.style.transform = 'translateY(' + ((1 - box) * 3) + 'vh)';
    }

    /* staggered items inside the ledger */
    for (var i = 0; i < ledgerItems.length; i++) {
      var range = ITEM_RANGES[i] || ITEM_RANGES[ITEM_RANGES.length - 1];
      var q = clamp01((t - range[0]) / (range[1] - range[0]));
      var e = reduced ? (q > 0.4 ? 1 : 0) : easeInOut(q);
      ledgerItems[i].style.opacity = String(e);
      if (!reduced) {
        ledgerItems[i].style.transform = 'translateY(' + ((1 - e) * 22) + 'px)';
      }
    }

    if (box > 0.45) reveal();
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ── init ── */
  Promise.all([
    loadJSON('/assets/data/contributions.json'),
    loadJSON('/assets/data/leetcode.json')
  ]).then(function (results) {
    ghData = results[0];
    lcData = results[1];
    renderGithub();
    renderLeetcode();
    if (refreshDate && lcData && lcData.updated_at) {
      refreshDate.textContent = fmtDate(lcData.updated_at.slice(0, 10));
    }
    update();
  });
})();
