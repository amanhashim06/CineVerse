const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

/* THEME */
function initTheme() {
  if (localStorage.getItem('cv_theme') === 'light') document.body.classList.add('light');
  updateThemeIcon();
}
function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = document.body.classList.contains('light') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('cv_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
});

/* USER */
function getLoggedInUser() { return JSON.parse(localStorage.getItem('cv_user') || 'null'); }
function renderUserChip() {
  const wrap = document.getElementById('user-chip-wrap');
  if (!wrap) return;
  const user = getLoggedInUser();
  if (user) {
    wrap.innerHTML = `<a class="user-chip" href="dashboard.html"><div class="avatar">${user.username[0].toUpperCase()}</div><span>${user.username}</span></a>
    <button class="btn btn-outline" style="padding:7px 14px;font-size:.8rem;margin-left:6px;" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>`;
  } else {
    wrap.innerHTML = `<a class="btn btn-outline" href="signin.html" style="padding:7px 14px;font-size:.8rem;"><i class="fa-solid fa-right-to-bracket"></i> Sign In</a>`;
  }
}
function logout() { localStorage.removeItem('cv_user'); renderUserChip(); showToast('Logged out.', 'info'); renderDashboard(); }

/* WATCHLIST */
function getWatchlist()   { return JSON.parse(localStorage.getItem('cv_watchlist') || '[]'); }
function saveWatchlist(w) { localStorage.setItem('cv_watchlist', JSON.stringify(w)); }

function removeFromWatchlist(id, type) {
  let wl = getWatchlist();
  wl = wl.filter(x => !(x.id === id && x.type === type));
  saveWatchlist(wl);
  showToast('Removed from watchlist.', 'info');
  renderDashboard();
}

function clearWatchlist() {
  if (!confirm('Clear your entire watchlist? This cannot be undone.')) return;
  saveWatchlist([]);
  showToast('Watchlist cleared.', 'info');
  renderDashboard();
}

/* TOAST */
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100px)'; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); }, 3200);
}

/* COUNTER ANIMATION */
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current  = 0;
    const step   = Math.max(1, Math.ceil(target / 30));
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  });
}

/* RENDER DASHBOARD */
function renderDashboard() {
  const container = document.getElementById('dashboard-content');
  const user      = getLoggedInUser();

  if (!user) {
    container.innerHTML = `
      <div class="dash-locked">
        <i class="fa-solid fa-lock"></i>
        <h3>Sign In Required</h3>
        <p>Create an account or sign in to view your dashboard and manage your watchlist.</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <a class="btn btn-red" href="signin.html"><i class="fa-solid fa-right-to-bracket"></i> Sign In</a>
          <a class="btn btn-outline" href="signup.html"><i class="fa-solid fa-user-plus"></i> Create Account</a>
        </div>
      </div>`;
    return;
  }

  const wl      = getWatchlist();
  const movies  = wl.filter(x => x.type === 'movie');
  const series  = wl.filter(x => x.type === 'tv');

  /* Joined date */
  const joinedStr = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : 'N/A';

  /* Watchlist cards */
  const wlCards = wl.length
    ? wl.map(item => `
        <div class="wl-card" onclick="location.href='details.html?id=${item.id}&type=${item.type}'">
          ${item.poster
            ? `<img class="card-poster" src="${IMG_BASE}${item.poster}" alt="${item.title}" loading="lazy"/>`
            : `<div class="card-poster-placeholder"><i class="fa-solid fa-film"></i></div>`
          }
          <div class="card-body">
            <div class="card-title" title="${item.title}">${item.title}</div>
            <div class="card-meta">
              <span>${item.year || ''} · ${item.type === 'movie' ? '🎬' : '📺'}</span>
              <span class="card-rating"><i class="fa-solid fa-star"></i> ${item.rating ? item.rating.toFixed(1) : '–'}</span>
            </div>
          </div>
          <button class="remove-btn" title="Remove from watchlist"
            onclick="event.stopPropagation(); removeFromWatchlist(${item.id},'${item.type}')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>`).join('')
    : `<div class="empty-msg">
        <i class="fa-regular fa-bookmark"></i>
        <p>Your watchlist is empty.</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <a class="btn btn-red" href="movies.html"><i class="fa-solid fa-film"></i> Browse Movies</a>
          <a class="btn btn-outline" href="series.html"><i class="fa-solid fa-tv"></i> Browse Series</a>
        </div>
      </div>`;

  container.innerHTML = `
    <!-- Profile Card -->
    <div class="dash-profile">
      <div class="dash-avatar">${user.username[0].toUpperCase()}</div>
      <div class="dash-user-info">
        <h2>${user.username}</h2>
        <div class="dash-user-email"><i class="fa-solid fa-envelope" style="margin-right:5px;color:var(--text-dim)"></i>${user.email}</div>
        <div class="dash-joined"><i class="fa-regular fa-calendar" style="margin-right:5px;"></i>Member since ${joinedStr}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-film"></i></div>
        <div class="stat-num" data-target="${movies.length}">0</div>
        <div class="stat-label">Movies Saved</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-tv"></i></div>
        <div class="stat-num" data-target="${series.length}">0</div>
        <div class="stat-label">Series Saved</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-bookmark"></i></div>
        <div class="stat-num" data-target="${wl.length}">0</div>
        <div class="stat-label">Total Bookmarked</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-star"></i></div>
        <div class="stat-num" data-target="${wl.filter(x => x.rating >= 7).length}">0</div>
        <div class="stat-label">Highly Rated</div>
      </div>
    </div>

    <!-- Watchlist -->
    <div class="watchlist-header">
      <h2 class="section-title" style="margin-bottom:0;"><span><i class="fa-solid fa-bookmark"></i></span> My Watchlist</h2>
      ${wl.length ? `<button class="btn-clear" onclick="clearWatchlist()"><i class="fa-solid fa-trash"></i> Clear List</button>` : ''}
    </div>
    <div class="wl-grid">${wlCards}</div>
  `;

  animateCounters();
}

/* HAMBURGER */
document.getElementById('hamburger')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.toggle('open'));

/* INIT */
initTheme();
renderUserChip();
renderDashboard();
