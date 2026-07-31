---
permalink: /
layout: home-poster
title: "Yiyao Wang"
author_profile: false
redirect_from:
  - /about/
  - /about.html
---

<main class="zine-poster" aria-labelledby="zine-title">
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
</main>
