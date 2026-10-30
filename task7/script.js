const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const PAGE_SIZE = 10;
const TOTAL_POSTS = 100;      // всего постов в API
const SCROLL_OFFSET = 200;    // за сколько px до конца страницы подгружаем
const DEBOUNCE_MS = 300;
 
const feedEl = document.getElementById('feed');
const statusEl = document.getElementById('status');
const searchEl = document.getElementById('search');
 
// Все загруженные посты хранятся здесь
let allPosts = [];
let query = '';
let isLoading = false;
let hasMore = true;
 
/* ---------- Загрузка данных ---------- */
 
async function fetchPosts() {
  const start = allPosts.length;
  const url = `${API_URL}?_start=${start}&_limit=${PAGE_SIZE}`;
 
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку ${response.status}`);
  }
  return response.json();
}
 
async function loadMore() {
  if (isLoading || !hasMore) return;
 
  isLoading = true;
  showLoader();
 
  try {
    const posts = await fetchPosts();
    allPosts.push(...posts);
 
    if (posts.length < PAGE_SIZE || allPosts.length >= TOTAL_POSTS) {
      hasMore = false;
    }
 
    render();
    isLoading = false;
    updateStatus();
    fillScreenIfNeeded();
  } catch (error) {
    isLoading = false;
    showError(error);
  }
}
 
/* ---------- Отрисовка ---------- */
 
function getFilteredPosts() {
  const q = query.trim().toLowerCase();
  if (!q) return allPosts;
  return allPosts.filter((post) => post.title.toLowerCase().includes(q));
}
 
function createCard(post) {
  const card = document.createElement('article');
  card.className = 'card';
 
  const author = document.createElement('div');
  author.className = 'card__author';
 
  const avatar = document.createElement('span');
  avatar.className = 'card__avatar';
  avatar.textContent = post.userId;
 
  const authorName = document.createElement('span');
  authorName.textContent = `Автор #${post.userId}`;
 
  author.append(avatar, authorName);
 
  const title = document.createElement('h2');
  title.className = 'card__title';
  title.textContent = post.title;
 
  const body = document.createElement('p');
  body.className = 'card__body';
  body.textContent = post.body;
 
  card.append(author, title, body);
  return card;
}
 
function render() {
  const posts = getFilteredPosts();
  feedEl.replaceChildren(...posts.map(createCard));
}
 
/* ---------- Статус: загрузка / ошибка / конец ---------- */
 
function showLoader() {
  statusEl.innerHTML =
    '<div class="loader"><span class="spinner"></span><span>Загрузка…</span></div>';
}
 
function showError(error) {
  const box = document.createElement('div');
  box.className = 'error';
 
  const text = document.createElement('p');
  text.textContent = `Не удалось загрузить посты. ${error.message}. Проверьте подключение к интернету.`;
 
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = 'Повторить';
  button.addEventListener('click', loadMore);
 
  box.append(text, button);
  statusEl.replaceChildren(box);
}
 
function updateStatus() {
  if (!hasMore) {
    statusEl.textContent = 'Больше постов нет.';
  } else if (query.trim() && getFilteredPosts().length === 0) {
    statusEl.textContent = 'Среди загруженных постов ничего не найдено.';
  } else {
    statusEl.textContent = '';
  }
}
 
/* ---------- Бесконечный скролл ---------- */
 
function isNearBottom() {
  return window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - SCROLL_OFFSET;
}
 
window.addEventListener('scroll', () => {
  if (isNearBottom()) loadMore();
});
 
// Если экран большой и страница ещё не прокручивается — догружаем
function fillScreenIfNeeded() {
  if (!query.trim() && hasMore && isNearBottom()) loadMore();
}
 
/* ---------- Поиск с дебаунсом ---------- */
 
let debounceTimer;
 
searchEl.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    query = searchEl.value;
    render();
    if (!isLoading) updateStatus();
  }, DEBOUNCE_MS);
});
 
/* ---------- Старт ---------- */
 
loadMore();