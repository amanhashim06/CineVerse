/* =============================================
   about.js — CineVerse About Page Logic
============================================= */

/* ── Theme ── */
(function initTheme() {
  const saved = localStorage.getItem('cv_theme');
  if (saved === 'light') document.body.classList.add('light');
})();

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('cv_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  document.getElementById('theme-icon').className =
    document.body.classList.contains('light') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
});

// Sync icon on load
(function syncIcon() {
  if (document.body.classList.contains('light'))
    document.getElementById('theme-icon').className = 'fa-solid fa-sun';
})();

/* ── User Chip ── */
(function renderUserChip() {
  const raw = localStorage.getItem('cv_user');
  const wrap = document.getElementById('user-chip-wrap');
  if (!wrap) return;
  if (raw) {
    const user = JSON.parse(raw);
    const initials = (user.name || user.username || 'U').slice(0, 2).toUpperCase();
    wrap.innerHTML = `
      <div class="user-chip">
        <div class="chip-avatar">${initials}</div>
        <span>${user.username || user.name}</span>
        <button class="chip-logout" id="chip-logout" title="Sign out"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
      </div>`;
    document.getElementById('chip-logout').addEventListener('click', () => {
      localStorage.removeItem('cv_user');
      location.reload();
    });
  } else {
    wrap.innerHTML = `<a class="signin-btn" href="signin.html"><i class="fa-solid fa-right-to-bracket"></i> Sign In</a>`;
  }
})();

/* ── Mobile Hamburger ── */
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('open');
});

/* ── Support FAB ── */
const fab    = document.getElementById('support-fab');
const modal  = document.getElementById('support-modal');
const closeBtn = document.getElementById('support-close');

fab.addEventListener('click', () => modal.classList.toggle('hidden'));
closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

document.getElementById('sup-submit').addEventListener('click', () => {
  const name     = document.getElementById('sup-name').value.trim();
  const email    = document.getElementById('sup-email').value.trim();
  const subject  = document.getElementById('sup-subject').value.trim();
  const category = document.getElementById('sup-category').value;
  const message  = document.getElementById('sup-message').value.trim();

  if (!name || !email || !subject || !category || !message) {
    showToast('Please fill in all support fields.', 'error');
    return;
  }
  showToast('Message sent! We\'ll get back to you soon.', 'success');
  modal.classList.add('hidden');
  ['sup-name','sup-email','sup-subject','sup-message'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sup-category').value = '';
});

/* ── Toast ── */
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}
