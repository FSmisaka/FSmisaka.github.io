---
permalink: /
layout: home-poster
title: "Yiyao Wang"
author_profile: false
redirect_from:
  - /about/
  - /about.html
---

<main class="home-poster" aria-labelledby="poster-title">
  <div class="poster-butterfly" data-butterfly aria-hidden="true">
    <span class="poster-butterfly__wing poster-butterfly__wing--left"></span>
    <span class="poster-butterfly__body"></span>
    <span class="poster-butterfly__wing poster-butterfly__wing--right"></span>
  </div>

  <div class="net-cursor" data-net-cursor aria-hidden="true">
    <span class="net-cursor__hoop"></span>
    <span class="net-cursor__neck"></span>
    <span class="net-cursor__handle"></span>
  </div>

  <section class="poster-sheet">
    <span class="poster-note poster-note--top" aria-hidden="true">LLM</span>
    <span class="poster-note poster-note--left" aria-hidden="true">Rec</span>

    <h1 class="poster-greeting" id="poster-title">
      Halo, I am <span class="fancy-name">Yiyao Wang</span>
    </h1>

    <div class="poster-grid">
      <div>
        <div class="intro-copy">
          <p>Halo and welcome to my profile. I enjoy building models with Statistical ML, DL, and LLMs to solve real-world problems (especially those related to business challenges).</p>
          <p>-- Skills &amp; Tools: Hands-on experience with Python, C, and Java, with current interests in recommendation systems and LLM, particularly GR, LLM4Rec, LLM inference acceleration, and Agent memory.</p>
          <p>-- Career interests: MLE.</p>
          <p>Always open to learning, collaboration, and exchanging ideas :)</p>
        </div>

        <div class="identity-list" aria-label="Basic information">
          <a class="identity-row" href="mailto:york2004cn@163.com">
            <i class="fa-solid fa-envelope" aria-hidden="true"></i>
            <span>york2004cn@163.com</span>
          </a>
          <div class="identity-row">
            <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
            <span>Beihang University / Tsinghua University</span>
          </div>
        </div>
      </div>

      <figure class="portrait-frame">
        <div class="portrait-image-wrap">
          <img src="{{ '/images/York_Wang.jpg' | relative_url }}" alt="Portrait of Yiyao Wang">
        </div>
        <figcaption class="portrait-caption">
          <strong>Yiyao Wang 王羿珧</strong>
          <span>Beihang University · Tsinghua University</span>
        </figcaption>

        <nav class="social-dock" aria-label="Social links">
          <a class="social-icon" data-social="linkedin" href="www.linkedin.com/in/york-yiyao-wang" aria-label="LinkedIn link placeholder">
            <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
            <span class="social-tip">
              <span>生活所迫 在这是伪人</span>
              <span>Life forces me to fake myself here</span>
            </span>
          </a>

          <a class="social-icon" data-social="mail" href="mailto:york2004cn@163.com" aria-label="Email Yiyao Wang">
            <i class="fa-solid fa-envelope" aria-hidden="true"></i>
            <span class="social-tip">
              <span>真会有人从这里联系吗</span>
              <span>Will anyone really contact me from here?</span>
            </span>
          </a>

          <a class="social-icon" data-social="douban" href="https://www.douban.com/people/214758071" aria-label="Douban link placeholder">
            <span class="douban-mark" aria-hidden="true">豆</span>
            <span class="social-tip">
              <span>看那么多总要记一下吧</span>
              <span>something to look back on when I'm old</span>
            </span>
          </a>

          <a class="social-icon" data-social="steam" href="https://steamcommunity.com/id/FSmisaka/" aria-label="Steam link placeholder">
            <i class="fa-brands fa-steam-symbol" aria-hidden="true"></i>
            <span class="social-tip">
              <span>陪我打游戏！</span>
              <span>Come play games with me!</span>
            </span>
          </a>
        </nav>
      </figure>
    </div>

    <a class="project-gate" href="{{ '/projects/' | relative_url }}">
      <span>Projects that Yiyao Participated</span>
      <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
    </a>
  </section>
</main>

<script>
  (function () {
    var root = document.querySelector(".home-poster");
    var net = document.querySelector("[data-net-cursor]");
    var butterfly = document.querySelector("[data-butterfly]");

    if (!root || !net || !butterfly) {
      return;
    }

    var lastPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var lastEscape = 0;
    var resetTimer = null;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function placeButterfly(startled) {
      var margin = window.innerWidth < 620 ? 58 : 92;
      var x = randomBetween(margin, Math.max(margin + 1, window.innerWidth - margin));
      var y = randomBetween(margin, Math.max(margin + 1, window.innerHeight - margin));
      var rotate = Math.round(randomBetween(-24, 24));
      var scale = randomBetween(0.86, 1.15).toFixed(2);
      var hue = Math.round(randomBetween(8, 320));

      butterfly.style.setProperty("--butterfly-x", x + "px");
      butterfly.style.setProperty("--butterfly-y", y + "px");
      butterfly.style.setProperty("--butterfly-rotate", rotate + "deg");
      butterfly.style.setProperty("--butterfly-scale", scale);
      butterfly.style.setProperty("--butterfly-hue", hue);

      butterfly.classList.toggle("is-surprised", Boolean(startled));
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(function () {
        butterfly.classList.remove("is-surprised");
      }, 700);
    }

    function moveNet(event) {
      var dx = event.clientX - lastPoint.x;
      var dy = event.clientY - lastPoint.y;
      var angle = Math.max(-30, Math.min(30, dx * 0.25 + dy * 0.08 - 16));

      net.style.transform = "translate3d(" + (event.clientX - 24) + "px, " + (event.clientY - 20) + "px, 0) rotate(" + angle + "deg)";
      net.classList.add("is-visible");
      lastPoint = { x: event.clientX, y: event.clientY };
    }

    function checkCatch(event) {
      var now = Date.now();
      if (now - lastEscape < 520) {
        return;
      }

      var rect = butterfly.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

      if (distance < 64) {
        lastEscape = now;
        placeButterfly(true);
      }
    }

    root.addEventListener("pointermove", function (event) {
      moveNet(event);
      checkCatch(event);
    });

    root.addEventListener("pointerenter", function () {
      net.classList.add("is-visible");
    });

    root.addEventListener("pointerleave", function () {
      net.classList.remove("is-visible");
    });

    window.addEventListener("resize", function () {
      placeButterfly(false);
    });

    placeButterfly(false);
    window.setInterval(function () {
      placeButterfly(false);
    }, 5200);
  }());
</script>
