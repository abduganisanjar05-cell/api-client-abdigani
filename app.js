const API_BASE = 'https://openlibrary.org';
const FALLBACK_COVER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="320"><rect width="220" height="320" fill="#dfe7f1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#1f6feb" font-family="Arial">No Cover</text></svg>'
);

const elements = {
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  countries: document.getElementById('countries'),
  details: document.getElementById('country-details'),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('country-search'),
  parallelResults: document.getElementById('parallel-results')
};

function showLoading(message = 'Loading...') {
  elements.loading.textContent = message;
  elements.loading.classList.add('visible');
}

function hideLoading() {
  elements.loading.classList.remove('visible');
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.classList.add('visible');
}

function hideError() {
  elements.error.textContent = '';
  elements.error.classList.remove('visible');
}

function getBookTitle(book) {
  return book?.title || 'Unknown title';
}

function getBookAuthors(book) {
  return Array.isArray(book?.author_name) && book.author_name.length ? book.author_name.join(', ') : 'N/A';
}

function getBookYear(book) {
  return book?.first_publish_year || 'N/A';
}

function getBookCover(book) {
  if (!book?.cover_i) {
    return FALLBACK_COVER;
  }

  return `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
}

function renderBooks(books) {
  elements.countries.innerHTML = '';

  if (!books || books.length === 0) {
    elements.countries.innerHTML = '<p>Book not found.</p>';
    return;
  }

  books.forEach((book) => {
    const card = document.createElement('article');
    card.className = 'country-card';

    const image = document.createElement('img');
    image.className = 'flag';
    image.src = getBookCover(book);
    image.alt = `${getBookTitle(book)} cover`;
    image.onerror = () => {
      image.src = FALLBACK_COVER;
    };

    const title = document.createElement('div');
    title.className = 'country-name';
    title.textContent = getBookTitle(book);

    const meta = document.createElement('div');
    meta.className = 'country-meta';
    meta.innerHTML = `
      <div><strong>Author:</strong> ${getBookAuthors(book)}</div>
      <div><strong>Published:</strong> ${getBookYear(book)}</div>
    `;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'View Details';
    button.dataset.key = book?.key || '';

    button.addEventListener('click', async () => {
      const bookKey = button.dataset.key;
      if (!bookKey) {
        showError('Book details are unavailable for this selection.');
        return;
      }

      await fetchBookDetails(bookKey);
    });

    card.append(image, title, meta, button);
    elements.countries.appendChild(card);
  });
}

function renderBookDetails(book) {
  if (!book) {
    elements.details.innerHTML = '<p>Book details not available.</p>';
    return;
  }

  const card = document.createElement('div');
  card.className = 'details-card';

  const authorList = Array.isArray(book?.authors) && book.authors.length
    ? book.authors.map((author) => author.name || 'Unknown author').join(', ')
    : 'N/A';

  const subjects = Array.isArray(book?.subjects) && book.subjects.length ? book.subjects.slice(0, 5).join(', ') : 'N/A';

  card.innerHTML = `
    <h3>${book?.title || 'Unknown title'}</h3>
    <img src="${getBookCover({ cover_i: book?.covers?.[0] || null })}" alt="${book?.title || 'Book'} cover" class="flag" />
    <div class="detail-row"><span class="detail-label">Author:</span><span>${authorList}</span></div>
    <div class="detail-row"><span class="detail-label">Published:</span><span>${book?.first_publish_date || 'N/A'}</span></div>
    <div class="detail-row"><span class="detail-label">Subjects:</span><span>${subjects}</span></div>
    <div class="detail-row"><span class="detail-label">Edition Count:</span><span>${book?.edition_count || 'N/A'}</span></div>
  `;

  elements.details.innerHTML = '';
  elements.details.appendChild(card);
}

function renderParallelResults(primaryBooks, secondaryBooks) {
  elements.parallelResults.innerHTML = '';

  const primaryWrap = document.createElement('div');
  primaryWrap.className = 'parallel-item';

  const primaryTitle = document.createElement('h3');
  primaryTitle.textContent = 'JavaScript Books';

  const primaryList = document.createElement('ul');
  primaryList.className = 'parallel-list';

  (primaryBooks || []).slice(0, 5).forEach((book) => {
    const item = document.createElement('li');
    item.textContent = getBookTitle(book);
    primaryList.appendChild(item);
  });

  primaryWrap.append(primaryTitle, primaryList);

  const secondaryWrap = document.createElement('div');
  secondaryWrap.className = 'parallel-item';

  const secondaryTitle = document.createElement('h3');
  secondaryTitle.textContent = 'Python Books';

  const secondaryList = document.createElement('ul');
  secondaryList.className = 'parallel-list';

  (secondaryBooks || []).slice(0, 5).forEach((book) => {
    const item = document.createElement('li');
    item.textContent = getBookTitle(book);
    secondaryList.appendChild(item);
  });

  secondaryWrap.append(secondaryTitle, secondaryList);

  elements.parallelResults.append(primaryWrap, secondaryWrap);
}

async function fetchJson(url, errorMessage) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

async function searchBooks(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    showError('Please enter a book title to search.');
    return [];
  }

  const url = `${API_BASE}/search.json?q=${encodeURIComponent(trimmedQuery)}`;

  try {
    const data = await fetchJson(url, 'Failed to search books. Please check your internet connection and try again.');
    const books = data.docs || [];

    if (books.length === 0) {
      showError('Book not found.');
      renderBooks([]);
      return [];
    }

    hideError();
    renderBooks(books);
    return books;
  } catch (error) {
    showError(error.message || 'Failed to search books. Please try again.');
    renderBooks([]);
    return [];
  }
}

async function fetchBookDetails(workKey) {
  const cleanKey = workKey.replace(/^\/works\//, '').replace(/\//g, '');
  const url = `${API_BASE}/works/${encodeURIComponent(cleanKey)}.json`;

  try {
    showLoading('Loading book details...');
    const data = await fetchJson(url, 'Failed to load book details. Please check your internet connection and try again.');
    renderBookDetails(data);
    hideError();
  } catch (error) {
    showError(error.message || 'Failed to load book details. Please try again.');
    elements.details.innerHTML = '<p>Book details are not available right now.</p>';
  } finally {
    hideLoading();
  }
}

async function loadParallelData() {
  try {
    showLoading('Loading books...');
    const [javascriptBooks, pythonBooks] = await Promise.all([
      fetchJson(`${API_BASE}/search.json?q=${encodeURIComponent('javascript')}`, 'Failed to load JavaScript books. Please check your internet connection and try again.'),
      fetchJson(`${API_BASE}/search.json?q=${encodeURIComponent('python')}`, 'Failed to load Python books. Please check your internet connection and try again.')
    ]);

    const jsDocs = javascriptBooks.docs || [];
    const pyDocs = pythonBooks.docs || [];

    renderBooks(jsDocs);
    renderParallelResults(jsDocs, pyDocs);
    hideError();
  } catch (error) {
    showError(error.message || 'Failed to load book data. Please check your internet connection and try again.');
    renderBooks([]);
    elements.parallelResults.innerHTML = '<p>Parallel results are not available right now.</p>';
  } finally {
    hideLoading();
  }
}

elements.searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = elements.searchInput.value;

  showLoading('Searching books...');
  hideError();

  try {
    await searchBooks(query);
  } finally {
    hideLoading();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadParallelData();
});
