/* ==========================================================================
   Coding Ledger — GitHub contribution wall + LeetCode practice log
   Vanilla JS; renders on load (no scroll choreography).

   Data is injected as committed snapshots next to the site (see
   scripts/fetch_contrib_data.py — refreshed daily by GitHub Actions).
   ========================================================================== */

(function () {
  var root = document.getElementById('coding-ledger');
  if (!root) return;

  var ghWrap = document.getElementById('gh-heatmap');
  var ghTotal = document.getElementById('gh-total');
  var ghYears = document.getElementById('gh-years');
  var ghStatTotal = document.getElementById('gh-stat-total');
  var ghStatStreak = document.getElementById('gh-stat-streak');
  var ghStatDays = document.getElementById('gh-stat-days');
  var ghStatSocial = document.getElementById('gh-stat-social');
  var lcRing = document.getElementById('lc-ring');
  var lcBars = document.getElementById('lc-bars');
  var lcStreak = document.getElementById('lc-streak');
  var lcLangs = document.getElementById('lc-langs');
  var lcWrap = document.getElementById('lc-heatmap');
  var lcTotal = document.getElementById('lc-total');
  var refreshDate = document.getElementById('lc-refresh-date');

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

  function epochIso(day) {
    return new Date(day * 86400000).toISOString().slice(0, 10);
  }

  /* ── heatmap grid (shared by GitHub + LeetCode) — monochrome on white ── */
  var G = { cell: 10, gap: 3, padL: 28, padT: 15, padB: 8 };
  var LEVEL_FILLS = ['#ededed', '#c8c8c6', '#a0a09e', '#6e6e6c', '#333332'];
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
          LEVEL_FILLS[lvl] + '">' +
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
      if (ghWrap) ghWrap.innerHTML = '<p class="ledger-block__empty">— contribution data unavailable —</p>';
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
            '<button type="button" class="ledger-years__btn" data-year="' + cal.year + '">' +
            cal.year + '</button>'
          );
        })
        .join('');
      Array.prototype.forEach.call(ghYears.children, function (b) {
        b.classList.toggle('is-active', +b.getAttribute('data-year') === currentYear);
      });
      ghYears.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.ledger-years__btn');
        if (!btn) return;
        var year = +btn.getAttribute('data-year');
        if (year === currentYear) return;
        currentYear = year;
        Array.prototype.forEach.call(ghYears.children, function (b) {
          b.classList.toggle('is-active', +b.getAttribute('data-year') === year);
        });
        setGrid(ghWrap, makeGithubGrid(year));
        if (ghTotal) ghTotal.textContent = ghTotalText(year);
        updateGhStats(year);
      });
    }
    setGrid(ghWrap, makeGithubGrid(currentYear));
    if (ghTotal) ghTotal.textContent = ghTotalText(currentYear);
    updateGhStats(currentYear);
  }

  /* year-scoped stat blocks: contributions, longest streak, active days,
     plus the static follow numbers from the profile */
  function updateGhStats(year) {
    if (!ghData || !ghData.calendars) return;
    var cal = null;
    for (var i = 0; i < ghData.calendars.length; i++) {
      if (ghData.calendars[i].year === year) cal = ghData.calendars[i];
    }
    if (!cal) return;

    var days = [];
    for (var w = 0; w < cal.weeks.length; w++) {
      for (var d = 0; d < cal.weeks[w].length; d++) {
        var cell = cal.weeks[w][d];
        if (cell && cell[0] > 0 && cell[2] <= todayIso) {
          days.push(new Date(cell[2] + 'T00:00:00Z').getTime() / 86400000);
        }
      }
    }
    days.sort(function (a, b) { return a - b; });

    var longest = 0;
    var run = 0;
    for (var i = 0; i < days.length; i++) {
      run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    }

    if (ghStatTotal) ghStatTotal.textContent = String(cal.total);
    if (ghStatStreak) ghStatStreak.textContent = String(longest);
    if (ghStatDays) ghStatDays.textContent = String(days.length);
    if (ghStatSocial) {
      var f = ghData.followers, g = ghData.following;
      ghStatSocial.textContent =
        (f == null || g == null) ? '—' : f + ' · ' + g;
    }
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
  var lcYears = document.getElementById('lc-years');

  function renderLeetcode() {
    if (!lcData || !lcData.solved) {
      if (lcWrap) lcWrap.innerHTML = '<p class="ledger-block__empty">— practice data unavailable —</p>';
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
        '<circle cx="47" cy="47" r="' + R + '" fill="none" stroke="#ededed" stroke-width="' + sw + '"></circle>' +
        '<circle id="lc-ring-progress" cx="47" cy="47" r="' + R + '" fill="none" stroke="#333332" ' +
        'stroke-width="' + sw + '" stroke-linecap="round" ' +
        'stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"></circle>' +
        '</svg>' +
        '<div class="ledger-lc__ring-label">' +
        '<span class="ledger-lc__ring-num">' + esc(solved.total) + '</span>' +
        '<span class="ledger-lc__ring-sub">solved</span>' +
        '</div>';
    }

    /* difficulty bars */
    if (lcBars) {
      function row(label, cls, stat) {
        var p = stat.total ? stat.solved / stat.total * 100 : 0;
        return (
          '<div class="ledger-lc__bar-row">' +
          '<span class="ledger-lc__bar-label">' + label + '</span>' +
          '<span class="ledger-lc__bar-track"><i class="ledger-lc__bar-fill ' + cls + '" style="width:' + p + '%"></i></span>' +
          '<span class="ledger-lc__bar-count">' + stat.solved + ' / ' + stat.total + '</span>' +
          '</div>'
        );
      }
      lcBars.innerHTML =
        row('Easy', 'ledger-lc__bar-fill--easy', solved.easy) +
        row('Medium', 'ledger-lc__bar-fill--medium', solved.medium) +
        row('Hard', 'ledger-lc__bar-fill--hard', solved.hard);
    }

    /* streak + active days */
    if (lcStreak) {
      var st = lcData.streak || {};
      lcStreak.innerHTML =
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
              '<button type="button" class="ledger-years__btn" data-year="' + y + '">' +
              y + '</button>'
            );
          })
          .join('');
        Array.prototype.forEach.call(lcYears.children, function (b) {
          b.classList.toggle('is-active', +b.getAttribute('data-year') === currentLcYear);
        });
        lcYears.addEventListener('click', function (ev) {
          var btn = ev.target.closest('.ledger-years__btn');
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

    /* animate the ring sweep once rendered */
    var ringProg = document.getElementById('lc-ring-progress');
    if (ringProg) {
      var C = 2 * Math.PI * 40;
      window.requestAnimationFrame(function () {
        ringProg.style.strokeDashoffset = String(C * (1 - pct));
      });
    }
  }

  function lcYearGrid(year) {
    /* Sunday-based week columns trimmed to the year */
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
    /* quiet days stay light; only real bursts reach full ink */
    for (var w = 0; w < weeks.length; w++) {
      for (var d = 0; d < weeks[w].length; d++) {
        var v = weeks[w][d][0];
        weeks[w][d][1] = v <= 0 ? 0 : v === 1 ? 1 : v <= 3 ? 2 : v <= 6 ? 3 : 4;
      }
    }
    return weeks;
  }

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
  });
})();
