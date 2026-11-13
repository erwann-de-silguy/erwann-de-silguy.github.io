(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function activate(id, focus = false) {
    const selected = tabs.find(tab => tab.getAttribute('aria-controls') === id);
    if (!selected) return false;
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
    if (focus) selected.focus();
    return true;
  }
  activate(location.hash.slice(1)) || activate('work-generali');
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.getAttribute('aria-controls')));
    tab.addEventListener('keydown', event => {
      const keys = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1};
      if (!(event.key in keys)) return;
      event.preventDefault();
      activate(tabs[keys[event.key]].getAttribute('aria-controls'), true);
    });
  });
  document.querySelectorAll('a[href^="#work-"]').forEach(link => {
    link.addEventListener('click', () => {
      activate(link.hash.slice(1));
      // Repeated clicks on the same hash must still navigate to the project.
      if (location.hash === link.hash) document.querySelector(link.hash).scrollIntoView({block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    });
  });
  addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (activate(id)) document.getElementById(id).scrollIntoView({block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  });
  const dialog = document.getElementById('share-dialog');
  const status = document.getElementById('share-status');
  const canonical = new URL('/', location.href).href;
  const link = document.getElementById('share-link');
  // Share the active Vercel deployment or custom domain.
  link.href = canonical;
  link.textContent = canonical.replace(/^https?:\/\//, '');
  document.querySelector('.share-options a[href^="https://www.linkedin.com/"]').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(canonical);
  document.querySelector('.share-options a[href^="mailto:"]').href = 'mailto:?subject=' + encodeURIComponent('Erwann de Silguy | Finance & AI') + '&body=' + encodeURIComponent(canonical);
  document.querySelectorAll('.share-profile-button').forEach(button => {
    button.addEventListener('click', () => {
      status.textContent = '';
      dialog.showModal();
    });
  });
  document.getElementById('copy-share-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(canonical);
      status.textContent = 'Profile link copied.';
    } catch {
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(link);
      selection.removeAllRanges();
      selection.addRange(range);
      link.focus();
      status.textContent = 'Select and copy the profile link above.';
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
})();
