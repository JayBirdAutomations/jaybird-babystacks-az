// Live Google reviews. Google's terms forbid copying reviews into a site, so they are fetched from Google in the
// visitor's browser, only when the reviews section comes into view (most visits never load them, so they cost
// nothing), and shown with the reviewer's name and Google's credit line. Without the key, or if loading fails,
// the section keeps its "Read our reviews" and "Leave a review" buttons.
(function reviews() {
  const box = document.getElementById('reviews');
  if (!box || !box.dataset.key || !box.dataset.place) return;
  let started = false;

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function stars(rating) {
    const s = el('span', 'stars');
    s.setAttribute('aria-label', `${rating.toFixed(1)} out of 5 stars`);
    for (let i = 1; i <= 5; i++) s.append(el('span', i <= Math.round(rating) ? 'on' : 'off', '★'));
    return s;
  }

  async function load() {
    started = true;
    try {
      await new Promise((resolve, reject) => {
        window.__wbMaps = resolve;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(box.dataset.key)}&v=weekly&loading=async&callback=__wbMaps`;
        script.async = true;
        script.onerror = reject;
        document.head.append(script);
      });
      const { Place } = await google.maps.importLibrary('places');
      const place = new Place({ id: box.dataset.place });
      await place.fetchFields({ fields: ['rating', 'userRatingCount', 'reviews', 'googleMapsURI'] });
      const list = (place.reviews || []).filter((r) => r.text).slice(0, 5);
      if (!place.rating && !list.length) return;
      const summary = box.querySelector('.reviews-summary');
      summary.replaceChildren(
        el('strong', 'rating', place.rating ? place.rating.toFixed(1) : ''),
        place.rating ? stars(place.rating) : '',
        el('span', 'count', place.userRatingCount ? `${place.userRatingCount.toLocaleString()} Google reviews` : ''));
      const grid = box.querySelector('.reviews-list');
      grid.replaceChildren(...list.map((r) => {
        const card = el('article', 'review');
        const head = el('div', 'review-head');
        const who = r.authorAttribution || {};
        if (who.photoURI) { const img = el('img'); img.src = who.photoURI; img.alt = ''; img.width = 36; img.height = 36; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; head.append(img); }
        const name = who.uri ? Object.assign(el('a', 'who', who.displayName || 'Google user'), { href: who.uri, target: '_blank', rel: 'noopener' })
                             : el('span', 'who', who.displayName || 'Google user');
        head.append(name);
        card.append(head, stars(r.rating || 0), el('p', 'when', r.relativePublishTimeDescription || ''), el('p', 'text', r.text));
        return card;
      }));
      if (place.googleMapsURI) box.querySelector('.read-all').href = place.googleMapsURI;
      box.classList.add('live');
    } catch (err) {
      // keep the buttons; nothing else to do
    }
  }

  const watch = new IntersectionObserver((entries) => {
    if (!started && entries.some((e) => e.isIntersecting)) { watch.disconnect(); load(); }
  }, { rootMargin: '300px' });
  watch.observe(box);
})();
