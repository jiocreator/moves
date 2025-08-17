const TMDB_API_KEY = 'your_tmdb_api_key';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_API_KEY = 'your_omdb_api_key';  // Get from omdbapi.com
const OMDB_BASE_URL = 'http://www.omdbapi.com/';

let allMovies = [];

// Load movies and news
fetch('movies.json').then(res => res.json()).then(movies => { allMovies = movies; initPage(); });
fetch('news.json').then(res => res.json()).then(news => displayNews(news));

// Init based on page
function initPage() {
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    displayTrending();
    displayPopular('daily');
    displayCategories();
  } else if (window.location.pathname.includes('category.html')) {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    document.getElementById('category-title').textContent = `Category: ${cat}`;
    displayCategoryList(cat);
  } else if (window.location.pathname.includes('details.html')) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const m3uUrl = params.get('m3u');
    displayMovieDetails(id, m3uUrl);
  }
}

// Display Trending
function displayTrending() {
  const section = document.getElementById('trending');
  allMovies.forEach(movie => createCard(movie, section));
}

// Create Card Helper
function createCard(movie, container) {
  fetch(`${TMDB_BASE_URL}/${movie.type === 'series' ? 'tv' : 'movie'}/${movie.tmdb_id}?api_key=${TMDB_API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const thumbnail = movie.home_thumbnail || `https://image.tmdb.org/t/p/w500${data.poster_path}`;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${thumbnail}" alt="${movie.title}">
        <h3>${movie.title}</h3>
        <p>${movie.categories.join(', ')}</p>
        <button onclick="window.location.href='details.html?id=${movie.tmdb_id}&m3u=${encodeURIComponent(movie.m3u_url)}&type=${movie.type}'">Download & Watch</button>
      `;
      container.appendChild(card);
    });
}

// Display News
function displayNews(news) {
  const section = document.getElementById('reviews-news');
  news.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<img src="${item.image}" alt="${item.title}"><h3>${item.title}</h3><p>${item.description}</p>`;
    section.appendChild(card);
  });
}

// Popular Posts
function showPopular(period) {
  const content = document.getElementById('popular-content');
  content.innerHTML = '';
  const today = new Date();
  let filterDate = new Date(today);
  if (period === 'daily') filterDate.setDate(today.getDate() - 1);
  else if (period === 'weekly') filterDate.setDate(today.getDate() - 7);
  else if (period === 'monthly') filterDate.setDate(today.getDate() - 30);
  const filtered = allMovies.filter(movie => new Date(movie.added_date) >= filterDate);
  filtered.forEach(movie => createCard(movie, content));
  document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// Display Categories (full list from screenshots)
function displayCategories() {
  const categories = ['1080p', '10bits', '3D', '4K UHD', '60FPS Movies', 'Addatimes Originals', 'African Movies', 'Animation Movies', 'Anime', 'Arabic Movies', 'Asian Adult Movies', 'Assamese', 'Australian Movies', 'Bangla Dubbed', 'Romanian Movies', 'Russian Movies', 'Spanish Movies', 'Short Films', 'South African Movies', 'South Indian Movies', 'Sports', 'Swedish', 'Taiwan', 'Tamil Movies', 'Telugu Movies', 'Thai Movies', 'Torrent', 'Turkish Movies', 'TV Series', 'TV SHOWS', 'ULLU Originals', 'UnRated', 'Unreleased Tracks', 'Urdu Movies', 'Vietnamese Movies', 'Watch Online', 'Web Series'];
  const grid = document.querySelector('.category-grid');
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.onclick = () => window.location.href = `category.html?cat=${encodeURIComponent(cat)}`;
    grid.appendChild(btn);
  });
}

// Display Category List
function displayCategoryList(cat) {
  const section = document.getElementById('category-list');
  const filtered = allMovies.filter(movie => movie.categories.includes(cat));
  filtered.forEach(movie => createCard(movie, section));
}

// Movie Details
async function displayMovieDetails(id, m3uUrl, type = 'movie') {
  const tmdbEndpoint = `${TMDB_BASE_URL}/${type === 'series' ? 'tv' : 'movie'}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,images,external_ids`;
  const tmdbData = await fetch(tmdbEndpoint).then(res => res.json());
  const imdbId = tmdbData.external_ids.imdb_id;
  const omdbData = await fetch(`${OMDB_BASE_URL}?i=${imdbId}&apikey=${OMDB_API_KEY}`).then(res => res.json());

  const infoDiv = document.getElementById('movie-info');
  const thumbnail = tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '';
  const genres = tmdbData.genres.map(g => g.name).join(', ');
  const release = tmdbData.release_date || tmdbData.first_air_date;
  const director = tmdbData.credits.crew.find(c => c.job === 'Director')?.name || 'N/A';
  const cast = tmdbData.credits.cast.slice(0, 3).map(c => c.name).join(', ');
  const language = tmdbData.original_language.toUpperCase();
  const rtRating = omdbData.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || 'N/A';

  infoDiv.innerHTML = `
    <img src="${thumbnail}" alt="${tmdbData.title || tmdbData.name}">
    <h1>${tmdbData.title || tmdbData.name} (${release.substring(0,4)})</h1>
    <p>${tmdbData.runtime || tmdbData.episode_run_time[0]} min | ${genres} | ${release}</p>
    <p>IMDb: ${omdbData.imdbRating}/10 (${omdbData.imdbVotes} votes)</p>
    <p>Rotten Tomatoes: ${rtRating}</p>
    <p>Storyline: ${tmdbData.overview}</p>
    <p>Director: ${director}</p>
    <p>Cast: ${cast}</p>
    <p>Language: ${language}</p>
    <p>Quality: WEB-DL</p>
    <p>Resolution: 720p | 1080p</p>
    <p>Size: 550MB | 1.6GB</p>
  `;

  // Screenshots
  const screenshotsDiv = document.getElementById('screenshots');
  tmdbData.images.backdrops.slice(0, 5).forEach(img => {
    const image = document.createElement('img');
    image.src = `https://image.tmdb.org/t/p/w500${img.file_path}`;
    screenshotsDiv.appendChild(image);
  });

  // Downloads from m3u
  const m3uText = await fetch(m3uUrl).then(res => res.text());
  const links = parseM3U(m3uText);
  const downloadsDiv = document.getElementById('downloads');
  const episodes = groupByEpisode(links);  // Group logic
  for (const [epi, epiLinks] of Object.entries(episodes)) {
    const section = document.createElement('div');
    section.className = 'episode-section';
    section.innerHTML = `<div class="episode-header">Download Now ${epi}</div><p>Download Links Here</p>`;
    epiLinks.forEach(link => {
      const btn = document.createElement('button');
      btn.className = link.url.includes('watch') ? 'watch-button' : 'download-button';
      btn.textContent = link.name;
      btn.onclick = () => window.location.href = link.url;
      section.appendChild(btn);
    });
    downloadsDiv.appendChild(section);
  }
}

// Group by Episode (assume name like "Epi.23 720p")
function groupByEpisode(links) {
  const groups = {};
  links.forEach(link => {
    const epiMatch = link.name.match(/Epi\.(\d+)/i) || ['Unknown'];
    const epi = `Epi.${epiMatch[1]}`;
    if (!groups[epi]) groups[epi] = [];
    groups[epi].push(link);
  });
  return groups;
}

// m3u Parser (updated)
function parseM3U(text) {
  const lines = text.split('\n');
  const result = [];
  let current = {};
  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      current = { name: line.split(',')[1] || 'Unnamed' };
      const groupMatch = line.match(/group-title="([^"]+)"/);
      if (groupMatch) current.categories = groupMatch[1].split('|');
      const thumbnailMatch = line.match(/tvg-logo="([^"]+)"/);
      if (thumbnailMatch) current.thumbnail = thumbnailMatch[1];
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      result.push(current);
      current = {};
    }
  });
  return result;
}

// Search (on all pages)
document.getElementById('search')?.addEventListener('input', e => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
  });
});
