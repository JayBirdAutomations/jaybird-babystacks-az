// Reservation bar: date / time / party size, then "Find a table".
// With a booking platform (OpenTable, Resy, Tock...) it opens their page with the choice filled in where the
// platform supports it; without one it opens a ready-written text message to the restaurant.
// Without JavaScript the bar's fallback link (text or call) still works.
(function reserve() {
  const form = document.getElementById('reserve');
  if (!form) return;
  const hours = JSON.parse(form.dataset.hours || '{}');      // {"Monday": [["08:00","14:00"]], ...}
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateSel = form.querySelector('[name=date]');
  const timeSel = form.querySelector('[name=time]');
  const sizeSel = form.querySelector('[name=size]');
  const pad = (n) => String(n).padStart(2, '0');
  const label12 = (h, m) => `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;

  function open(d) {
    const spans = hours[days[d.getDay()]];
    return Object.keys(hours).length === 0 ? [['17:00', '21:00']] : (spans || []);
  }
  function slots(d) {                                        // bookable times that day, at least 30 min from now
    const out = [];
    const soonest = new Date(Date.now() + 30 * 60000);
    for (const [from, to] of open(d)) {
      const [h, m] = from.split(':').map(Number);
      const [eh, em] = to.split(':').map(Number);
      for (let t = h * 60 + m; t <= eh * 60 + em - 30; t += 30) {   // last seating half an hour before closing
        const slot = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(t / 60), t % 60);
        if (slot >= soonest) out.push(t);
      }
    }
    return out;
  }
  for (let i = 0, added = 0; i < 21 && added < 14; i++) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
    if (!slots(d).length) continue;                          // closed that day, or today is already over
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const text = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    dateSel.add(new Option(text, iso));
    added++;
  }
  function fillTimes() {
    const [y, mo, da] = dateSel.value.split('-').map(Number);
    const d = new Date(y, mo - 1, da);
    timeSel.length = 0;
    for (const t of slots(d)) {
      timeSel.add(new Option(label12(Math.floor(t / 60), t % 60), `${pad(Math.floor(t / 60))}:${pad(t % 60)}`));
    }
  }
  dateSel.addEventListener('change', fillTimes);
  fillTimes();
  for (let n = 1; n <= 10; n++) sizeSel.add(new Option(`${n} ${n === 1 ? 'person' : 'people'}`, String(n)));
  sizeSel.add(new Option('More than 10', '11'));
  sizeSel.value = '2';
  if (!dateSel.length) return;                              // no bookable days: keep the call/text line only
  form.classList.add('ready');
  const go = (url, newTab) => (window.__wbGo ? window.__wbGo(url) : newTab ? window.open(url, '_blank', 'noopener') : (window.location.href = url));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = dateSel.value, time = timeSel.value, size = sizeSel.value;
    if (!time) { timeSel.focus(); return; }
    const book = form.dataset.book;
    if (book) {
      const url = new URL(book);
      const host = url.hostname;
      if (host.includes('opentable')) { url.searchParams.set('covers', size); url.searchParams.set('dateTime', `${date}T${time}`); }
      else if (host.includes('resy')) { url.searchParams.set('date', date); url.searchParams.set('seats', size); }
      else if (host.includes('tock')) { url.searchParams.set('date', date); url.searchParams.set('size', size); url.searchParams.set('time', time); }
      go(url.toString(), true);
      return;
    }
    const pretty = dateSel.options[dateSel.selectedIndex].text;
    const people = size === '11' ? 'more than 10 people' : `${size} ${size === '1' ? 'person' : 'people'}`;
    const body = `Hi! I'd like to request a table for ${people} ${pretty === 'Today' || pretty === 'Tomorrow' ? pretty.toLowerCase() : 'on ' + pretty} at ${timeSel.options[timeSel.selectedIndex].text}. Is that available? (sent from your website)`;
    go(`sms:${form.dataset.tel}?&body=${encodeURIComponent(body)}`);
  });
})();
