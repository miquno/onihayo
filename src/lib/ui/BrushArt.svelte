<!--
  Decoration behind a page's opening: an ensō brush circle that draws itself and a
  few sakura petals that fall once. Hidden from assistive technology. With reduced
  motion the circle is simply there and no petals fall. The parent positions it
  (`position: relative` and `isolation: isolate`).
-->
<div class="art" aria-hidden="true">
  <svg class="enso" viewBox="0 0 400 400" focusable="false">
    <path class="ink" pathLength="1" d="M309 70 A172 172 0 0 1 200 372 A168 168 0 0 1 228 33" />
    <path class="ink heavy" pathLength="1" d="M309 70 A170 170 0 0 1 170 367" />
    <path class="trail" pathLength="1" d="M298 60 A178 178 0 0 1 194 381 A176 176 0 0 1 252 36" />
  </svg>
  <span class="petal petal-1"></span><span class="petal petal-2"></span><span class="petal petal-3"
  ></span><span class="petal petal-4"></span><span class="petal petal-5"></span><span
    class="petal petal-6"
  ></span>
</div>

<style>
  .art {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
  }

  .enso {
    position: absolute;
    top: 0;
    right: 0;
    width: min(50%, 14rem);
    height: auto;
    aspect-ratio: 1;
    /* Sumi ink, like a brushed ensō. */
    color: var(--color-text);
    opacity: var(--opacity-ornament);
  }

  .enso path {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
  }

  .ink {
    stroke-width: 8;
  }

  .heavy {
    stroke-width: 16;
  }

  .trail {
    stroke-width: 1.5;
  }

  /* Petals exist only while motion is welcome; the still page is the finished picture. */
  .petal {
    display: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .enso path {
      stroke-dasharray: 1;
      animation: draw var(--duration-ink) var(--easing-gentle) both;
    }

    .trail {
      animation-delay: var(--duration-base);
    }

    /* Each petal falls once; the last one lands within five seconds (WCAG 2.2.2). */
    .petal {
      display: block;
      position: absolute;
      top: 0;
      width: var(--space-3);
      height: var(--space-2);
      border-radius: var(--radius-lg) var(--radius-sm);
      background: var(--color-petal);
      opacity: 0;
      animation: fall var(--duration-petal) linear both;
    }

    .petal-1 {
      left: 58%;
    }

    .petal-2 {
      left: 72%;
      animation-delay: 300ms;
    }

    .petal-3 {
      left: 86%;
      animation-delay: 700ms;
    }

    .petal-4 {
      left: 64%;
      animation-delay: 1000ms;
    }

    .petal-5 {
      left: 92%;
      animation-delay: 500ms;
    }

    .petal-6 {
      left: 78%;
      animation-delay: 1100ms;
    }
  }

  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes fall {
    0% {
      top: 0;
      opacity: 0;
      transform: translateX(0) rotate(0deg);
    }
    10% {
      opacity: 0.9;
    }
    35% {
      transform: translateX(1.5rem) rotate(120deg);
    }
    65% {
      transform: translateX(-1rem) rotate(240deg);
    }
    85% {
      opacity: 0.8;
    }
    100% {
      top: 100%;
      opacity: 0;
      transform: translateX(0.5rem) rotate(360deg);
    }
  }
</style>
