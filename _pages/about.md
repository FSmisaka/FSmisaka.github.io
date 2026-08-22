---
permalink: /
layout: home-poster
title: "Yiyao Wang"
author_profile: false
redirect_from:
  - /about/
  - /about.html
---

<main class="zine-hero-stage" aria-labelledby="zine-title">
  <div class="zine-poster">
    <!-- Vermillion accent mark — the single high-chroma anchor -->
    <span class="zine-accent" aria-hidden="true"></span>

    <div class="zine-center">
      <!-- Name block: elegant serif, no background, floating above portrait -->
      <div class="zine-name-area">
        <h1 class="zine-name" id="zine-title">Yiyao Wang</h1>
        <span class="zine-name-cn">王羿珧</span>
      </div>

      <!-- Portrait hero: cutout with white border (falls back to original JPG) -->
      <figure class="zine-hero">
        <picture>
          <source srcset="{{ '/images/York_Wang_cutout.png' | relative_url }}" type="image/png">
          <img
            src="{{ '/images/York_Wang.jpg' | relative_url }}"
            alt="Portrait of Yiyao Wang"
            class="zine-hero__img"
          >
        </picture>
      </figure>

      <!-- School logos: tiny marks near portrait -->
      <div class="zine-schools" aria-label="School logos">
        <a class="zine-schools__item" href="https://www.buaa.edu.cn" target="_blank" rel="noopener" aria-label="Beihang University">
          <img src="{{ '/images/schools/beihang-logo.png' | relative_url }}" alt="Beihang University logo" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
          <span class="zine-schools__fallback" hidden>BUAA</span>
        </a>
        <a class="zine-schools__item" href="https://www.tsinghua.edu.cn" target="_blank" rel="noopener" aria-label="Tsinghua University">
          <img src="{{ '/images/schools/tsinghua-logo.png' | relative_url }}" alt="Tsinghua University logo" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
          <span class="zine-schools__fallback" hidden>THU</span>
        </a>
      </div>

      <!-- Intro fragment: tiny text drifting near the portrait -->
      <p class="zine-fragment zine-fragment--a">
        Student in Statistical ML, DL &amp; LLMs.<br>
        I build models for real‑world problems.
      </p>

      <p class="zine-fragment zine-fragment--b">
        Recommendation systems · LLM4Rec<br>
        Inference acceleration · Agent memory
      </p>

      <p class="zine-fragment zine-fragment--c">
        Beijing, China<br>
        Beihang &amp; Tsinghua
      </p>

      <!-- Social links: scattered tiny text -->
      <nav class="zine-socials" aria-label="Social links">
        <a class="zine-socials__link" href="https://www.linkedin.com/in/york-yiyao-wang" target="_blank" rel="noopener">
          LinkedIn
          <span class="zine-socials__tip">生活所迫 在这是伪人</span>
        </a>
        <a class="zine-socials__link" href="mailto:york2004cn@163.com">
          Email
          <span class="zine-socials__tip">york2004cn@163.com</span>
        </a>
        <a class="zine-socials__link" href="https://www.douban.com/people/214758071" target="_blank" rel="noopener">
          Douban
          <span class="zine-socials__tip">记录一下看过的电影 ^ ^</span>
        </a>
        <a class="zine-socials__link" href="https://steamcommunity.com/id/FSmisaka/" target="_blank" rel="noopener">
          Steam
          <span class="zine-socials__tip">爽玩 ARPG!</span>
        </a>
      </nav>

      <!-- Navigation: small centered text -->
      <nav class="zine-nav" aria-label="Main pages">
        <a class="zine-nav__link" href="{{ '/projects/' | relative_url }}">Projects</a>
        <span class="zine-nav__sep" aria-hidden="true">·</span>
        <a class="zine-nav__link" href="{{ '/notes/' | relative_url }}">Notes</a>
        <span class="zine-nav__sep" aria-hidden="true">·</span>
        <a class="zine-nav__link" href="{{ '/papers/' | relative_url }}">Papers</a>
      </nav>
    </div>

    <!-- Footer microtext — far bottom -->
    <footer class="zine-footer">
      <span>Beijing · China</span>
    </footer>

    <!-- Scroll cue — the parchment says: there is a second page -->
    <p class="zine-scroll-hint" aria-hidden="true">
      <span class="zine-scroll-hint__label">scroll</span>
      <span class="zine-scroll-hint__line"></span>
    </p>
  </div>
</main>

<!-- ════════════════════════════════════════════════════════════════════
     CHAPTER 2 — CODING LEDGER
     GitHub contribution wall · LeetCode practice log
     Statics: assets/data/*.json (refreshed daily, see scripts/)       -->
<section class="zine-ledger" id="zine-ledger" aria-labelledby="zine-ledger-title">
  <div class="zine-ledger__inner">
    <div class="zine-ledger__fade">

      <header class="zine-ledger__head zine-ledger__item">
        <span class="zine-ledger__mark" aria-hidden="true"></span>
        <div>
          <p class="zine-ledger__kicker">Practice · Contributions</p>
          <h2 class="zine-ledger__title" id="zine-ledger-title">Coding Ledger</h2>
        </div>
        <p class="zine-ledger__aside">
          Two walls of habit —<br>
          GitHub commits &amp; LeetCode submissions.<br>
          New snapshots <strong id="zine-refresh-date">daily</strong>.
        </p>
      </header>

      <div class="zine-plates">

        <!-- ── GitHub ── -->
        <article class="zine-plate zine-plate--github zine-ledger__item" aria-labelledby="zine-plate-github-title">
          <header class="zine-plate__head">
            <h3 class="zine-plate__title" id="zine-plate-github-title">
              GitHub <span class="zine-plate__title-sub">— contribution wall</span>
            </h3>
            <nav class="zine-years" id="zine-years" aria-label="Select contribution year"></nav>
          </header>

          <div class="zine-gh-stats" id="zine-gh-stats">
            <div class="zine-gh-stat"><span class="zine-gh-stat__num" id="zine-gh-stat-total">…</span><span class="zine-gh-stat__label">contributions</span></div>
            <div class="zine-gh-stat"><span class="zine-gh-stat__num" id="zine-gh-stat-streak">…</span><span class="zine-gh-stat__label">longest streak</span></div>
            <div class="zine-gh-stat"><span class="zine-gh-stat__num" id="zine-gh-stat-days">…</span><span class="zine-gh-stat__label">active days</span></div>
            <div class="zine-gh-stat"><span class="zine-gh-stat__num" id="zine-gh-stat-social">…</span><span class="zine-gh-stat__label">followers · following</span></div>
          </div>

          <div class="zine-heatmap-wrap" id="zine-github-heatmap"></div>
          <p class="zine-plate__foot">
            <span class="zine-plate__total" id="zine-github-total">…</span>
            <span class="zine-plate__dot" aria-hidden="true">·</span>
            <a class="zine-plate__link" href="https://github.com/FSmisaka" target="_blank" rel="noopener">github.com/FSmisaka</a>
          </p>
        </article>

        <!-- ── LeetCode ── -->
        <article class="zine-plate zine-plate--leetcode zine-ledger__item" aria-labelledby="zine-plate-leetcode-title">
          <header class="zine-plate__head">
            <h3 class="zine-plate__title" id="zine-plate-leetcode-title">
              LeetCode <span class="zine-plate__title-sub">— practice log</span>
            </h3>
            <nav class="zine-years" id="zine-lc-years" aria-label="Select practice year"></nav>
          </header>

          <div class="zine-lc">
            <div class="zine-lc__ring" id="zine-lc-ring"></div>
            <div class="zine-lc__side">
              <div class="zine-lc__bars" id="zine-lc-bars"></div>
              <p class="zine-lc__streak" id="zine-lc-streak"></p>
              <p class="zine-lc__langs" id="zine-lc-langs"></p>
            </div>
          </div>

          <div class="zine-heatmap-wrap zine-heatmap-wrap--lc" id="zine-lc-heatmap"></div>

          <p class="zine-plate__foot">
            <span class="zine-plate__total" id="zine-lc-total">…</span>
            <span class="zine-plate__dot" aria-hidden="true">·</span>
            <a class="zine-plate__link" href="https://leetcode.cn/u/fsmisaka/" target="_blank" rel="noopener">leetcode.cn/u/fsmisaka</a>
          </p>
        </article>

      </div>

      <footer class="zine-ledger__foot zine-ledger__item">
        <span>snapshots refreshed daily · green-wall · leetcode.cn</span>
        <span>№ 002 — code ledger</span>
      </footer>

    </div>
  </div>
</section>

<noscript>
  <p style="font-family: Inter, sans-serif; font-size: 0.62rem; color: #9b9286; letter-spacing: 0.04em; padding: 0 6vw 4vh; text-align: center;">
    Enable JavaScript to view the coding ledger — GitHub contributions &amp; LeetCode practice.
  </p>
</noscript>
