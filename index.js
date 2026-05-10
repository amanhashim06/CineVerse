/* =============================================
   CONSTANTS & CONFIG
============================================= */
const API_KEY   = 'bbce54aa4e48f9ee3184a518079e56d3';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiYmNlNTRhYTRlNDhmOWVlMzE4NGE1MTgwNzllNTZkMyIsIm5iZiI6MTc3ODM1MzE3NC42NjQsInN1YiI6IjY5ZmY4NDE2NjQxYzRlNzI3YTFlMGY2OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.XiuEcrB8RGKHfe9ms76aB6H9SpZ2zLQAp89wo9_dsyA';
const BASE_URL  = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/w500';
const BACKDROP  = 'https://image.tmdb.org/t/p/original';

const HEADERS = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};

let heroItem = null;

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
  icon.className = document.body.classList.contains('light')
    ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('cv_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
});

/* =============================================
   AUTH HELPERS
============================================= */
function getUsers()          { return JSON.parse(localStorage.getItem('cv_users') || '[]'); }
function getLoggedInUser()   { return JSON.parse(localStorage.getItem('cv_user') || 'null'); }

function renderUserChip() {
  const wrap = document.getElementById('user-chip-wrap');
  if (!wrap) return;
  const user = getLoggedInUser();
  if (user) {
    wrap.innerHTML = `
      <a class="user-chip" href="dashboard.html">
        <div class="avatar">${user.username[0].toUpperCase()}</div>
        <span>${user.username}</span>
      </a>
      <button class="btn btn-outline" style="padding:7px 14px;font-size:.8rem;margin-left:6px;" onclick="logout()">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    `;
  } else {
    wrap.innerHTML = `
      <a class="btn btn-outline" href="signin.html" style="padding:7px 14px;font-size:.8rem;">
        <i class="fa-solid fa-right-to-bracket"></i> Sign In
      </a>
    `;
  }
}

function logout() {
  localStorage.removeItem('cv_user');
  renderUserChip();
  showToast('Logged out successfully.', 'info');
}

/* =============================================
   WATCHLIST
============================================= */
function getWatchlist()    { return JSON.parse(localStorage.getItem('cv_watchlist') || '[]'); }
function saveWatchlist(w)  { localStorage.setItem('cv_watchlist', JSON.stringify(w)); }

function isInWatchlist(id, type) {
  return getWatchlist().some(x => x.id === id && x.type === type);
}

function toggleWatchlist(item) {
  const user = getLoggedInUser();
  if (!user) { showToast('Please sign in to use watchlist.', 'error'); return; }
  let wl = getWatchlist();
  const idx = wl.findIndex(x => x.id === item.id && x.type === item.type);
  if (idx >= 0) {
    wl.splice(idx, 1);
    showToast('Removed from watchlist.', 'info');
  } else {
    wl.push(item);
    showToast('Added to watchlist! ✓', 'success');
  }
  saveWatchlist(wl);
  refreshWatchlistButtons();
}

function refreshWatchlistButtons() {
  document.querySelectorAll('.btn-wl[data-id]').forEach(btn => {
    const id   = parseInt(btn.dataset.id);
    const type = btn.dataset.type;
    const inWl = isInWatchlist(id, type);
    btn.classList.toggle('in-wl', inWl);
    btn.innerHTML = inWl ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>';
    btn.title = inWl ? 'Remove from watchlist' : 'Add to watchlist';
  });
}

/* =============================================
   TOAST
============================================= */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
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
   API HELPERS
============================================= */
async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function posterUrl(path) {
  return path ? `${IMG_BASE}${path}` : null;
}

/* =============================================
   CARD BUILDER
============================================= */
function buildCard(item, type) {
  const id    = item.id;
  const title = item.title || item.name || 'Untitled';
  const poster= posterUrl(item.poster_path);
  const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating= item.vote_average ? item.vote_average.toFixed(1) : '–';
  const inWl  = isInWatchlist(id, type);

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    ${poster
      ? `<img class="card-poster" src="${poster}" alt="${title} poster" loading="lazy" width="160" height="240"/>`
      : `<div class="card-poster-placeholder"><i class="fa-solid fa-film"></i></div>`
    }
    <div class="card-body">
      <div class="card-title" title="${title}">${title}</div>
      <div class="card-meta">
        <span>${year}</span>
        <span class="card-rating"><i class="fa-solid fa-star"></i> ${rating}</span>
      </div>
    </div>
    <div class="card-overlay">
      <div class="card-overlay-title">${title}</div>
      <div class="card-overlay-btns">
        <button class="btn-details" onclick="goToDetails(${id},'${type}')"><i class="fa-solid fa-circle-info"></i> Info</button>
        <button class="btn-wl ${inWl ? 'in-wl' : ''}" data-id="${id}" data-type="${type}"
          onclick="event.stopPropagation(); toggleWatchlist({id:${id},type:'${type}',title:'${title.replace(/'/g,"\\'")}',poster:'${item.poster_path || ''}',rating:${item.vote_average||0},year:'${year}'})">
          ${inWl ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>'}
        </button>
      </div>
    </div>
  `;
  card.querySelector('.card-body').addEventListener('click', () => goToDetails(id, type));
  return card;
}

function goToDetails(id, type) {
  window.location.href = `details.html?id=${id}&type=${type}`;
}

function renderCards(containerId, items, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (!items || !items.length) {
    el.innerHTML = `<div class="empty-msg"><i class="fa-solid fa-film"></i><p>No results found.</p></div>`;
    return;
  }
  items.forEach(item => el.appendChild(buildCard(item, type)));
}

function showLoadingIn(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
}

/* =============================================
   HOME PAGE
============================================= */
async function loadHomePage() {
  try {
    showLoadingIn('trending-row');
    const trendData = await apiFetch('/trending/all/week');
    const trending  = trendData.results || [];
    renderCards('trending-row', trending.slice(0, 12), 'movie');

    if (trending.length) setHero(trending[0]);

    showLoadingIn('action-row');
    const actionData = await apiFetch('/discover/movie', { with_genres: '28', language: 'en-US', sort_by: 'popularity.desc' });
    renderCards('action-row', (actionData.results || []).slice(0, 10), 'movie');

    showLoadingIn('malayalam-row');
    const mlData = await apiFetch('/discover/movie', { with_original_language: 'ml', sort_by: 'popularity.desc' });
    renderCards('malayalam-row', (mlData.results || []).slice(0, 10), 'movie');

  } catch (err) {
    console.error('Home load error:', err);
    showToast('Failed to load content. Check your connection.', 'error');
  }
}

function setHero(item) {
  heroItem = item;
  const type   = item.media_type || (item.title ? 'movie' : 'tv');
  const title  = item.title || item.name || 'Unknown';
  const plot   = item.overview || 'No description available.';
  const year   = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '–';

  document.getElementById('hero-title').textContent = title;
  document.getElementById('hero-plot').textContent  = plot.slice(0, 160) + (plot.length > 160 ? '…' : '');
  document.getElementById('hero-year').innerHTML   = `<i class="fa-regular fa-calendar"></i> ${year}`;
  document.getElementById('hero-rating').innerHTML = `<i class="fa-solid fa-star" style="color:var(--gold)"></i> ${rating}`;
  document.getElementById('hero-type').innerHTML   = `<i class="fa-solid fa-tag"></i> ${type === 'movie' ? 'Movie' : 'Series'}`;

  const bgImg = document.getElementById('hero-bg-img');
  if (item.backdrop_path) {
    bgImg.src = `${BACKDROP}${item.backdrop_path}`;
    bgImg.alt = `${title} backdrop`;
  }

  document.getElementById('hero-play-btn').onclick = () => goToDetails(item.id, type);
  document.getElementById('hero-wl-btn').onclick   = () => toggleWatchlist({
    id: item.id, type, title,
    poster: item.poster_path || '',
    rating: item.vote_average || 0,
    year
  });
}

/* =============================================
   SEARCH
============================================= */
let searchTimer = null;

document.getElementById('search-input')?.addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q  = e.target.value.trim();
  const dd = document.getElementById('search-dropdown');
  if (!q) { dd.classList.add('hidden'); return; }
  searchTimer = setTimeout(() => fetchSearchSuggestions(q), 320);
});

document.getElementById('search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('search-dropdown').classList.add('hidden');
    document.getElementById('search-input').value = '';
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('search-dropdown')?.classList.add('hidden');
  }
});

async function fetchSearchSuggestions(q) {
  const dd = document.getElementById('search-dropdown');
  dd.innerHTML = `<div class="search-item"><div class="spinner" style="width:18px;height:18px;border-width:2px;"></div></div>`;
  dd.classList.remove('hidden');

  try {
    const data    = await apiFetch('/search/multi', { query: q, language: 'en-US' });
    const results = (data.results || []).filter(r => r.media_type !== 'person').slice(0, 8);

    if (!results.length) {
      dd.innerHTML = `<div class="search-item" style="color:var(--text-muted)">No results found.</div>`;
      return;
    }

    dd.innerHTML = '';
    results.forEach(r => {
      const title  = r.title || r.name;
      const year   = (r.release_date || r.first_air_date || '').slice(0, 4);
      const type   = r.media_type;
      const poster = r.poster_path ? `${IMG_BASE}${r.poster_path}` : '';

      const el = document.createElement('div');
      el.className = 'search-item';
      el.innerHTML = `
        ${poster ? `<img src="${poster}" alt="${title}" loading="lazy"/>` : `<div style="width:36px;height:50px;background:var(--bg4);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;">🎬</div>`}
        <div class="si-info">
          <div class="si-title">${title}</div>
          <div class="si-meta">${year} · ${type === 'movie' ? 'Movie' : 'TV Series'}</div>
        </div>
        <span class="badge">${type === 'movie' ? '🎬' : '📺'}</span>
      `;
      el.addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        dd.classList.add('hidden');
        goToDetails(r.id, type);
      });
      dd.appendChild(el);
    });
  } catch {
    dd.innerHTML = `<div class="search-item" style="color:var(--red)">Search failed. Try again.</div>`;
  }
}

/* =============================================
   HAMBURGER
============================================= */
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobile-menu')?.classList.toggle('open');
});

/* =============================================
   SUPPORT FORM
============================================= */
document.getElementById('support-fab')?.addEventListener('click', () => {
  document.getElementById('support-modal')?.classList.toggle('hidden');
});
document.getElementById('support-close')?.addEventListener('click', () => {
  document.getElementById('support-modal')?.classList.add('hidden');
});
document.getElementById('sup-submit')?.addEventListener('click', () => {
  const name     = document.getElementById('sup-name')?.value.trim();
  const email    = document.getElementById('sup-email')?.value.trim();
  const subject  = document.getElementById('sup-subject')?.value.trim();
  const category = document.getElementById('sup-category')?.value;
  const message  = document.getElementById('sup-message')?.value.trim();

  if (!name || !email || !subject || !category || !message) {
    showToast('Please fill in all support fields.', 'error');
    return;
  }
  showToast('Support request sent! We\'ll get back to you soon. ✓', 'success');
  document.getElementById('support-modal')?.classList.add('hidden');
  ['sup-name','sup-email','sup-subject','sup-category','sup-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
});

/* =============================================
   INIT
============================================= */
(function init() {
  initTheme();
  renderUserChip();
  loadHomePage();
})();
