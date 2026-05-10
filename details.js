const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiYmNlNTRhYTRlNDhmOWVlMzE4NGE1MTgwNzllNTZkMyIsIm5iZiI6MTc3ODM1MzE3NC42NjQsInN1YiI6IjY5ZmY4NDE2NjQxYzRlNzI3YTFlMGY2OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.XiuEcrB8RGKHfe9ms76aB6H9SpZ2zLQAp89wo9_dsyA';
const BASE_URL  = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/w500';
const BACKDROP  = 'https://image.tmdb.org/t/p/original';
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
  if (!getLoggedInUser()) { showToast('Please sign in to use watchlist.', 'error'); return; }
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
  updateWatchlistBtn(item.id, item.type);
}

function updateWatchlistBtn(id, type) {
  const btn = document.getElementById('wl-btn');
  if (!btn) return;
  const inWl = isInWatchlist(id, type);
  btn.innerHTML = `<i class="fa-solid ${inWl ? 'fa-check' : 'fa-plus'}"></i> ${inWl ? 'In Watchlist' : 'Add to Watchlist'}`;
  btn.className = `btn ${inWl ? 'btn-outline' : 'btn-red'}`;
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

/* LOAD DETAILS */
async function loadDetails() {
  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  let   type    = params.get('type') || 'movie';
  if (type === 'auto') type = 'movie';

  if (!id) {
    document.getElementById('details-content').innerHTML = `
      <div class="empty-msg">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>No content specified.</p>
        <a href="index.html" class="btn btn-red" style="margin-top:16px;"><i class="fa-solid fa-house"></i> Go Home</a>
      </div>`;
    return;
  }

  try {
    const [details, credits, videos] = await Promise.all([
      apiFetch(`/${type}/${id}`),
      apiFetch(`/${type}/${id}/credits`),
      apiFetch(`/${type}/${id}/videos`)
    ]);

    /* Page title */
    const title   = details.title || details.name || 'Unknown';
    document.title = `${title} – CineVerse`;

    const year    = (details.release_date || details.first_air_date || '').slice(0, 4);
    const rating  = details.vote_average ? details.vote_average.toFixed(1) : '–';
    const runtime = details.runtime
      ? `${details.runtime} min`
      : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min/ep` : '–');
    const genres  = (details.genres || []).map(g => `<span class="genre-tag">${g.name}</span>`).join('');
    const plot    = details.overview || 'No description available.';
    const poster  = details.poster_path ? `${IMG_BASE}${details.poster_path}` : null;
    const cast    = (credits.cast || []).slice(0, 10);
    const inWl    = isInWatchlist(parseInt(id), type);

    /* Backdrop */
    if (details.backdrop_path) {
      const bdImg = document.getElementById('details-backdrop-img');
      if (bdImg) { bdImg.src = `${BACKDROP}${details.backdrop_path}`; bdImg.alt = `${title} backdrop`; }
    }

    /* Trailer — build a priority-sorted list of ALL YouTube videos so the
       IFrame API player can automatically retry the next one if a video
       returns error 100 / 101 / 150 / 153 (embedding disabled / config error). */
    const VIDEO_PRIORITY = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'];
    const ytVideos = (videos.results || []).filter(v => v.site === 'YouTube' && v.key);
    ytVideos.sort((a, b) => {
      const ai = VIDEO_PRIORITY.indexOf(a.type), bi = VIDEO_PRIORITY.indexOf(b.type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    /* Cast HTML */
    const castHTML = cast.map(c => {
      const photo = c.profile_path
        ? `${IMG_BASE}${c.profile_path}`
        : `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23222'/><text y='42' x='32' text-anchor='middle' font-size='28' fill='%23555'>👤</text></svg>`;
      return `
        <div class="cast-chip">
          <img src="${photo}" alt="${c.name}" loading="lazy" width="64" height="64"/>
          <span class="cast-name">${c.name}</span>
          <span class="cast-char">${c.character || ''}</span>
        </div>`;
    }).join('');

    /* Additional metadata */
    const statusBadge = details.status
      ? `<span><i class="fa-solid fa-circle-dot"></i> <span class="meta-highlight">${details.status}</span></span>`
      : '';
    const langLabel = details.original_language
      ? `<span><i class="fa-solid fa-language"></i> ${details.original_language.toUpperCase()}</span>`
      : '';

    /* Item for watchlist */
    const wlItem = { id: parseInt(id), type, title, poster: details.poster_path || '', rating: details.vote_average || 0, year };

    document.getElementById('details-content').innerHTML = `
      <div class="details-layout">
        <!-- Poster column -->
        <div>
          ${poster
            ? `<img class="details-poster" src="${poster}" alt="${title} poster" width="260" height="390"/>`
            : `<div class="details-poster-placeholder">🎬</div>`
          }
          <button id="wl-btn" class="btn ${inWl ? 'btn-outline' : 'btn-red'}"
            style="width:100%;margin-top:14px;justify-content:center;"
            onclick="toggleWatchlist(${JSON.stringify(wlItem).replace(/"/g, '&quot;')})">
            <i class="fa-solid ${inWl ? 'fa-check' : 'fa-plus'}"></i>
            ${inWl ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
        </div>

        <!-- Info column -->
        <div class="details-info">
          <h1>${title}</h1>

          <div class="details-meta-row">
            <span><i class="fa-regular fa-calendar"></i> <span class="meta-highlight">${year || '–'}</span></span>
            <span class="rating-badge"><i class="fa-solid fa-star"></i> ${rating} / 10 TMDB</span>
            <span><i class="fa-solid fa-clock"></i> <span class="meta-highlight">${runtime}</span></span>
            <span><i class="fa-solid fa-tag"></i> <span class="meta-highlight">${type === 'movie' ? 'Movie' : 'TV Series'}</span></span>
            ${statusBadge}
            ${langLabel}
          </div>

          <div class="details-genres">${genres || '<span class="genre-tag">Uncategorized</span>'}</div>

          <p class="details-plot">${plot}</p>

          ${cast.length ? `
            <p class="details-section-title"><i class="fa-solid fa-users"></i> Cast</p>
            <div class="cast-row">${castHTML}</div>
          ` : ''}

          ${ytVideos.length ? `
            <p class="details-section-title"><i class="fa-brands fa-youtube"></i> Trailer</p>
            <div class="trailer-wrap">
              <div id="yt-player-wrap"></div>
            </div>
            <div id="yt-fallback-bar" style="display:none;">
              <a class="yt-fallback-link"
                 href="https://www.youtube.com/watch?v=${ytVideos[0].key}"
                 id="yt-direct-link"
                 target="_blank" rel="noopener noreferrer">
                <i class="fa-brands fa-youtube"></i> Embedding unavailable — Watch on YouTube
              </a>
            </div>
          ` : ''}

        </div>
      </div>
    `;

    /* Wire watchlist button onclick */
    document.getElementById('wl-btn')?.addEventListener('click', () => {
      toggleWatchlist(wlItem);
    });

    /* Boot the IFrame API player now that #yt-player-wrap is in the DOM */
    if (ytVideos.length) initTrailerPlayer(ytVideos, title);

  } catch (err) {
    console.error('Details error:', err);
    document.getElementById('details-content').innerHTML = `
      <div class="empty-msg">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Failed to load content details. Please try again.</p>
        <button class="btn btn-red" style="margin-top:16px;" onclick="history.back()">
          <i class="fa-solid fa-arrow-left"></i> Go Back
        </button>
      </div>`;
  }
}

/* =============================================
   YOUTUBE IFRAME API — TRAILER PLAYER
   Loads the YT script once, then creates a player
   that automatically retries the next video whenever
   YouTube returns an embed-blocked error code.
   Error codes handled:
     100 — video removed / private
     101 — embedding disabled by owner
     150 — embedding disabled (obfuscated variant of 101)
     153 — player configuration error (embed blocked)
============================================= */
function initTrailerPlayer(videos, movieTitle) {
  const wrap = document.getElementById('yt-player-wrap');
  if (!wrap || !videos.length) return;

  let currentIndex = 0;

  function loadPlayer(index) {
    if (index >= videos.length) {
      /* All videos failed — show the direct link fallback */
      const wrapEl = document.querySelector('.trailer-wrap');
      if (wrapEl) wrapEl.style.display = 'none';
      const bar = document.getElementById('yt-fallback-bar');
      if (bar) bar.style.display = 'block';
      return;
    }

    const key = videos[index].key;

    /* Update the direct-link href to match current candidate */
    const directLink = document.getElementById('yt-direct-link');
    if (directLink) directLink.href = `https://www.youtube.com/watch?v=${key}`;

    /* Destroy any existing player before creating a new one */
    if (window._cvYTPlayer && typeof window._cvYTPlayer.destroy === 'function') {
      try { window._cvYTPlayer.destroy(); } catch (_) {}
    }
    wrap.innerHTML = '';

    window._cvYTPlayer = new YT.Player(wrap, {
      width:  '100%',
      height: '100%',
      videoId: key,
      playerVars: {
        rel:            0,
        modestbranding: 1,
        origin:         window.location.origin || 'https://localhost'
      },
      events: {
        onError: function (e) {
          const EMBED_BLOCKED = [100, 101, 150, 153];
          if (EMBED_BLOCKED.includes(e.data)) {
            /* Try the next video silently */
            loadPlayer(index + 1);
          }
        }
      }
    });
  }

  function bootPlayer() {
    loadPlayer(currentIndex);
  }

  /* Load the YT IFrame API script only once across page lifetime */
  if (window.YT && window.YT.Player) {
    bootPlayer();
  } else {
    window.onYouTubeIframeAPIReady = bootPlayer;
    if (!document.getElementById('yt-api-script')) {
      const s = document.createElement('script');
      s.id  = 'yt-api-script';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }
}

/* HAMBURGER */
document.getElementById('hamburger')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.toggle('open'));

/* INIT */
initTheme();
renderUserChip();
loadDetails();
