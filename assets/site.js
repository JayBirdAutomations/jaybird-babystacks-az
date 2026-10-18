// Scroll-scrubbed walk-in: one frame per scroll position, drawn on a canvas.
// Adapted from the hero player on jaybirdautomations.com; adds a phone frame set and the service before/after
// label (.ba-chip). The headline and buttons stay over the video the whole time, like Inti's site.
(function walkIn() {
  const canvas = document.getElementById('walkin');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COUNT = Number(canvas.dataset.count);
  const phone = window.matchMedia('(max-width: 767px)').matches;
  const base = phone ? canvas.dataset.phone : canvas.dataset.desktop;
  const path = (i) => `${base}${String(i).padStart(4, '0')}.webp`;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chip = document.querySelector('.ba-chip');       // service: 'Before' turns into 'After'

  const images = new Array(COUNT);
  const state = { frame: 0 };

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  }

  function render() {
    const idx = Math.min(COUNT - 1, Math.max(0, Math.round(state.frame)));
    let img = images[idx];
    // While frames are still loading, show the nearest one that has arrived.
    for (let d = 1; (!img || !img.naturalWidth) && d < COUNT; d++) img = images[idx - d] || images[idx + d];
    if (!img || !img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function load(i, priority) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      if (priority) img.fetchPriority = 'high';
      img.onload = () => { images[i] = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = path(i + 1);
    });
  }

  async function boot() {
    sizeCanvas();
    if (reduced) {
      // A single still: the first frame, or the last one for a before/after (show the result, not the mess).
      const rest = canvas.dataset.rest === 'last' ? COUNT - 1 : 0;
      state.frame = rest;
      if (chip && rest) chip.textContent = chip.dataset.after;
      await load(rest, true);
      render();
      return;
    }
    await load(0, true);
    render();
    let next = 1;
    async function worker() {
      while (next < COUNT) {
        const i = next++;
        await load(i);
        if (Math.abs(i - state.frame) < 3) render();
      }
    }
    await Promise.all(Array.from({ length: 8 }, worker));
  }

  boot();
  // Re-measure whenever the canvas itself changes size: window resizes, phone rotation, or a page opened in a
  // background tab (laid out at zero size until it's first shown).
  new ResizeObserver(() => { sizeCanvas(); render(); }).observe(canvas);

  if (reduced || !window.gsap || !window.ScrollTrigger) return;  // a still frame: no pin, no scrub

  gsap.registerPlugin(ScrollTrigger);
  gsap.to(state, {
    frame: COUNT - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=180%',
      pin: true,
      pinSpacing: true,
      scrub: 0.4,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (chip) chip.textContent = self.progress > 0.5 ? chip.dataset.after : chip.dataset.before;
      },
    },
    onUpdate: render,
  });
})();
