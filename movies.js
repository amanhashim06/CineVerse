const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiYmNlNTRhYTRlNDhmOWVlMzE4NGE1MTgwNzllNTZkMyIsIm5iZiI6MTc3ODM1MzE3NC42NjQsInN1YiI6IjY5ZmY4NDE2NjQxYzRlNzI3YTFlMGY2OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.XiuEcrB8RGKHfe9ms76aB6H9SpZ2zLQAp89wo9_dsyA';
const BASE_URL  = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/w500';
const HEADERS   = { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' };

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
function logout() { localStorage.removeItem('cv_user'); renderUserChip(); showToast('Logged out.', 'info'); }

/* WATCHLIST */
function getWatchlist()   { return JSON.parse(localStorage.getItem('cv_watchlist') || '[]'); }
function saveWatchlist(w) { localStorage.setItem('cv_watchlist', JSON.stringify(w)); }
function isInWatchlist(id, type) { return getWatchlist().some(x => x.id === id && x.type === type); }
function toggleWatchlist(item) {
  const user = getLoggedInUser();
  if (!user) { showToast('Please sign in to use watchlist.', 'error'); return; }
  let wl = getWatchlist();
  const idx = wl.findIndex(x => x.id === item.id && x.type === item.type);
  if (idx >= 0) { wl.splice(idx, 1); showToast('Removed from watchlist.', 'info'); }
  else { wl.push(item); showToast('Added to watchlist! ✓', 'success'); }
  saveWatchlist(wl);
  refreshWatchlistButtons();
}
function refreshWatchlistButtons() {
  document.querySelectorAll('.btn-wl[data-id]').forEach(btn => {
    const inWl = isInWatchlist(parseInt(btn.dataset.id), btn.dataset.type);
    btn.classList.toggle('in-wl', inWl);
    btn.innerHTML = inWl ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>';
    btn.title = inWl ? 'Remove from watchlist' : 'Add to watchlist';
  });
}

/* TOAST */
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100px)'; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); }, 3200);
}

/* API */
async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* CARDS */
function buildCard(item, type) {
  const id = item.id, title = item.title || item.name || 'Untitled';
  const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;
  const year = (item.release_date || item.first_air_date || '').slice(0,4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '–';
  const inWl = isInWatchlist(id, type);
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    ${poster ? `<img class="card-poster" src="${poster}" alt="${title}" loading="lazy"/>` : `<div class="card-poster-placeholder"><i class="fa-solid fa-film"></i></div>`}
    <div class="card-body">
      <div class="card-title" title="${title}">${title}</div>
      <div class="card-meta"><span>${year}</span><span class="card-rating"><i class="fa-solid fa-star"></i> ${rating}</span></div>
    </div>
    <div class="card-overlay">
      <div class="card-overlay-title">${title}</div>
      <div class="card-overlay-btns">
        <button class="btn-details" onclick="location.href='details.html?id=${id}&type=${type}'"><i class="fa-solid fa-circle-info"></i> Info</button>
        <button class="btn-wl ${inWl?'in-wl':''}" data-id="${id}" data-type="${type}"
          onclick="event.stopPropagation();toggleWatchlist({id:${id},type:'${type}',title:'${title.replace(/'/g,"\\'")}',poster:'${item.poster_path||''}',rating:${item.vote_average||0},year:'${year}'})">
          ${inWl?'<i class="fa-solid fa-check"></i>':'<i class="fa-solid fa-plus"></i>'}
        </button>
      </div>
    </div>`;
  card.querySelector('.card-body').addEventListener('click', () => location.href=`details.html?id=${id}&type=${type}`);
  return card;
}

function renderCards(containerId, items, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (!items?.length) { el.innerHTML = `<div class="empty-msg"><i class="fa-solid fa-film"></i><p>No results found.</p></div>`; return; }
  items.forEach(item => el.appendChild(buildCard(item, type)));
}
function showLoadingIn(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
}

/* LOAD MOVIES */
async function loadMoviesPage() {
  try {
    const genre = document.getElementById('filter-genre')?.value || '';
    const sort  = document.getElementById('filter-sort')?.value || 'popularity.desc';
    const lang  = document.getElementById('filter-lang')?.value || '';

    // Base params — /discover/movie honours sort_by, with_genres, with_original_language.
    // The legacy /movie/popular and /movie/top_rated endpoints ignore these params entirely,
    // which is why the sort dropdown had no visible effect before this fix.
    const discoverParams = { sort_by: sort, language: 'en-US', 'vote_count.gte': 50 };
    if (genre) discoverParams.with_genres = genre;
    if (lang)  discoverParams.with_original_language = lang;

    // Top-rated sub-section always sorts by rating regardless of the user's chosen sort.
    const topRatedParams = {
      ...discoverParams,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 200
    };

    ['popular-movies-grid','top-rated-grid','upcoming-grid'].forEach(showLoadingIn);

    const [pop, tr, uc] = await Promise.all([
      apiFetch('/discover/movie', discoverParams),
      apiFetch('/discover/movie', topRatedParams),
      apiFetch('/movie/upcoming', { language: 'en-US' })
    ]);
    renderCards('popular-movies-grid', (pop.results || []).slice(0,12), 'movie');
    renderCards('top-rated-grid',      (tr.results  || []).slice(0,12), 'movie');
    renderCards('upcoming-grid',       (uc.results  || []).slice(0,12), 'movie');
  } catch(e) {
    console.error(e);
    showToast('Failed to load movies.', 'error');
  }
}

/* FILTER */
document.getElementById('apply-filter')?.addEventListener('click', loadMoviesPage);

/* SEARCH */
let searchTimer = null;
document.getElementById('search-input')?.addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  const dd = document.getElementById('search-dropdown');
  if (!q) { dd.classList.add('hidden'); return; }
  searchTimer = setTimeout(async () => {
    dd.innerHTML = `<div class="search-item"><div class="spinner" style="width:18px;height:18px;border-width:2px;"></div></div>`;
    dd.classList.remove('hidden');
    try {
      const data = await apiFetch('/search/multi', { query: q, language: 'en-US' });
      const results = (data.results || []).filter(r => r.media_type !== 'person').slice(0, 8);
      if (!results.length) { dd.innerHTML = `<div class="search-item" style="color:var(--text-muted)">No results.</div>`; return; }
      dd.innerHTML = '';
      results.forEach(r => {
        const el = document.createElement('div');
        el.className = 'search-item';
        el.innerHTML = `${r.poster_path ? `<img src="${IMG_BASE}${r.poster_path}" alt="${r.title||r.name}" loading="lazy"/>` : `<div style="width:36px;height:50px;background:var(--bg4);border-radius:4px;flex-shrink:0;"></div>`}<div class="si-info"><div class="si-title">${r.title||r.name}</div><div class="si-meta">${(r.release_date||r.first_air_date||'').slice(0,4)} · ${r.media_type==='movie'?'Movie':'Series'}</div></div>`;
        el.addEventListener('click', () => { location.href = `details.html?id=${r.id}&type=${r.media_type}`; });
        dd.appendChild(el);
      });
    } catch { dd.innerHTML = `<div class="search-item" style="color:var(--red)">Search failed.</div>`; }
  }, 320);
});
document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) document.getElementById('search-dropdown')?.classList.add('hidden'); });

/* HAMBURGER */
document.getElementById('hamburger')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.toggle('open'));

/* INIT */
initTheme();
renderUserChip();
loadMoviesPage();
