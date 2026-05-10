/* =============================================
   THEME
============================================= */
function initTheme() {
  const saved = localStorage.getItem('cv_theme');
  if (saved === 'light') document.body.classList.add('light');
  updateThemeIcon();
}
function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  icon.className = document.body.classList.contains('light') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('cv_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
});

/* =============================================
   AUTH HELPERS
============================================= */
function getUsers()        { return JSON.parse(localStorage.getItem('cv_users') || '[]'); }
function saveUsers(u)      { localStorage.setItem('cv_users', JSON.stringify(u)); }
function getLoggedInUser() { return JSON.parse(localStorage.getItem('cv_user') || 'null'); }
function setLoggedInUser(u){ localStorage.setItem('cv_user', JSON.stringify(u)); }

/* =============================================
   TOAST
============================================= */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* =============================================
   FORM HELPERS
============================================= */
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  ['signin-error', 'signin-success', 'signup-error', 'signup-success'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

/* =============================================
   SIGN IN
============================================= */
document.getElementById('signin-form')?.addEventListener('submit', e => {
  e.preventDefault();
  clearErrors();

  const emailVal = document.getElementById('si-email').value.trim();
  const passVal  = document.getElementById('si-pass').value;
  let valid = true;

  if (!emailVal) { setError('si-email-err', 'Username or email is required.'); valid = false; }
  if (!passVal)  { setError('si-pass-err', 'Password is required.'); valid = false; }
  if (!valid) return;

  const users = getUsers();
  const user  = users.find(u =>
    (u.email === emailVal || u.username === emailVal) && u.password === passVal
  );

  if (!user) {
    const errEl = document.getElementById('signin-error');
    errEl.textContent = 'Invalid credentials. Please check your email/username and password.';
    errEl.classList.remove('hidden');
    return;
  }

  setLoggedInUser(user);
  showToast(`Welcome back, ${user.username}! 🎬`, 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 900);
});

/* =============================================
   SIGN UP
============================================= */
document.getElementById('signup-form')?.addEventListener('submit', e => {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById('su-name').value.trim();
  const email    = document.getElementById('su-email').value.trim();
  const username = document.getElementById('su-username').value.trim();
  const age      = parseInt(document.getElementById('su-age').value);
  const pass     = document.getElementById('su-pass').value;
  const confirm  = document.getElementById('su-confirm').value;
  const terms    = document.getElementById('su-terms').checked;

  let valid = true;

  if (!name || !/^[A-Za-z ]{2,}$/.test(name)) {
    setError('su-name-err', 'Enter a valid name (letters only, min 2 chars).'); valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('su-email-err', 'Enter a valid email address.'); valid = false;
  }
  if (!username || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    setError('su-username-err', 'Username: 3–20 characters, letters/numbers/underscore.'); valid = false;
  }
  if (!age || age < 13) {
    setError('su-age-err', 'You must be at least 13 years old.'); valid = false;
  }
  if (!pass || pass.length < 6) {
    setError('su-pass-err', 'Password must be at least 6 characters.'); valid = false;
  }
  if (pass !== confirm) {
    setError('su-confirm-err', 'Passwords do not match.'); valid = false;
  }
  if (!terms) {
    setError('su-terms-err', 'You must accept the Terms & Conditions.'); valid = false;
  }

  if (!valid) return;

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    const errEl = document.getElementById('signup-error');
    errEl.textContent = 'An account with this email already exists.';
    errEl.classList.remove('hidden');
    return;
  }
  if (users.find(u => u.username === username)) {
    const errEl = document.getElementById('signup-error');
    errEl.textContent = 'Username is already taken. Please choose another.';
    errEl.classList.remove('hidden');
    return;
  }

  const newUser = { name, email, username, age, password: pass, joinedAt: Date.now() };
  users.push(newUser);
  saveUsers(users);

  document.getElementById('signup-success')?.classList.remove('hidden');
  showToast(`Welcome to CineVerse, ${username}! 🎬`, 'success');

  setTimeout(() => {
    setLoggedInUser(newUser);
    window.location.href = 'index.html';
  }, 1200);
});

/* Real-time validation */
document.getElementById('su-email')?.addEventListener('input', function () {
  const err = document.getElementById('su-email-err');
  if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
    err.textContent = 'Enter a valid email.';
  } else { err.textContent = ''; }
});

document.getElementById('su-confirm')?.addEventListener('input', function () {
  const pass = document.getElementById('su-pass')?.value;
  const err  = document.getElementById('su-confirm-err');
  if (this.value && this.value !== pass) {
    err.textContent = 'Passwords do not match.';
  } else { err.textContent = ''; }
});

/* =============================================
   INIT
============================================= */
initTheme();

/* Redirect if already logged in */
if (getLoggedInUser() && window.location.pathname.includes('signin')) {
  window.location.href = 'index.html';
}
