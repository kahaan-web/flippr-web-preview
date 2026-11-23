/* Shell: loads screen fragments, hash routing, drawer, navbar indicator, toast.
   A fragment may include <script> tags; they are executed after insertion.
   Screen scripts can register window.FL.onShow[name] = (el) => {...}. */
window.FL = window.FL || { onShow: {} };
(function () {
  const screen = document.getElementById('screen');
  const header = document.getElementById('header');
  const tabs = ['home', 'fantasy', 'auction', 'matches', 'more'];
  let current = null, prevTab = 'home';

  function runScripts(el) {
    el.querySelectorAll('script').forEach(old => {
      const s = document.createElement('script');
      s.textContent = old.textContent; old.replaceWith(s);
    });
  }
  async function load(el) {
    if (el.dataset.loaded) return;
    el.dataset.loaded = '1';
    try { const r = await fetch(el.dataset.src); el.innerHTML = await r.text(); runScripts(el); }
    catch (e) { el.innerHTML = '<p class="pad meta">Could not load this screen.</p>'; }
  }
  FL.toast = function (msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1800);
  };
  FL.openDrawer = () => screen.classList.add('drawer-open');
  FL.closeDrawer = () => screen.classList.remove('drawer-open');

  const soon = { fantasy: 'Fantasy', auction: 'Auction', matches: 'My Matches', more: 'More', profile: 'Profile', hisaab: 'Hisaab', settings: 'Settings' };
  async function show(name) {
    if (name === 'near') {
      await show('home');
      const n = document.getElementById('near');
      if (n) document.getElementById('v-home').scrollTo({top: n.offsetTop - 112, behavior: 'smooth'});
      FL.closeDrawer(); return;
    }
    if (!document.getElementById('v-' + name) && soon[name]) {
      FL.toast(soon[name] + ' is coming in the next build');
      history.replaceState(null, '', '#home'); name = 'home';
    }
    const el = document.getElementById('v-' + name) || document.getElementById('v-home');
    name = el.id.slice(2);
    await load(el);
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v === el));
    const title = el.dataset.title;
    document.getElementById('hLogo').hidden = !!title;
    const ht = document.getElementById('hTitle'); ht.hidden = !title; ht.textContent = title || '';
    header.classList.toggle('sub', !!el.dataset.sub);
    const i = tabs.indexOf(name);
    if (i >= 0) prevTab = name;
    const ai = tabs.indexOf(prevTab);
    document.querySelectorAll('.nav-item').forEach((n, k) => n.classList.toggle('on', k === ai));
    document.getElementById('navInd').style.transform = `translateX(${ai * 100}%)`;
    header.classList.toggle('scrolled', el.scrollTop > 4);
    current = el;
    FL.closeDrawer();
    if (FL.onShow[name]) FL.onShow[name](el);
  }
  document.querySelectorAll('.view').forEach(v => v.addEventListener('scroll', () => {
    if (v === current) header.classList.toggle('scrolled', v.scrollTop > 4);
  }, { passive: true }));
  window.addEventListener('hashchange', () => show(location.hash.slice(1) || 'home'));
  document.getElementById('menuBtn').onclick = FL.openDrawer;
  document.getElementById('scrim').onclick = FL.closeDrawer;
  document.getElementById('backBtn').onclick = () => { history.length > 1 ? history.back() : (location.hash = '#home'); };
  // generic: any [data-toast] element shows a toast instead of navigating
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-toast]');
    if (t) { e.preventDefault(); FL.toast(t.dataset.toast); }
  });
  document.querySelector('[aria-label="Search"]').onclick = () => FL.toast('Search is coming in the next build');
  document.querySelector('[aria-label="Notifications"]').onclick = () => FL.toast('You have 4 unread notifications · Demo');
  load(document.getElementById('drawer'));
  show(location.hash.slice(1) || 'home');
})();
