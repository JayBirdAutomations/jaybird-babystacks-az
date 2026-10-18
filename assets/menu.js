// Menu tabs: the section links become tabs that show one section at a time.
// Without JavaScript the links still jump to each section and the whole menu shows.
(function menuTabs() {
  const nav = document.querySelector('.menu-jump');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('a[data-tab]')];
  const panels = tabs.map((t) => document.getElementById(t.dataset.tab));
  nav.setAttribute('role', 'tablist');
  tabs.forEach((t, i) => {
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', t.dataset.tab);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', t.id = `tab-${t.dataset.tab}`);
  });

  function show(i, focus) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', (e) => { e.preventDefault(); show(i); });
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); show((i + step + tabs.length) % tabs.length, true); }
      if (e.key === 'Home') { e.preventDefault(); show(0, true); }
      if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
    });
  });
  show(0);
})();
