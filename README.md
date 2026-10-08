# Lab 6 — Book Explorer

## Project
This project is a pure JavaScript frontend that uses direct browser `fetch()` calls to a public API. It loads live book data, renders cards, supports search, shows details, and uses `Promise.all` for two parallel requests.

## API Used
Open Library API

Base URL: https://openlibrary.org

The app uses these endpoints directly from the browser:
- `https://openlibrary.org/search.json?q={query}` for search requests
- `https://openlibrary.org/works/{work_id}.json` for a single book details request
- two independent search requests inside `Promise.all` for the parallel results section

## How to Open
You can open the project in a browser directly from the file system, but a simple static server is the safest option because it serves the HTML/CSS/JS without acting as an API proxy.

Example:

```bash
cd api-client-abdigani
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

This local server only serves static files. It is not a local API proxy.

## Features
- direct browser `fetch()` requests
- `async/await` data loading
- loading state while data is fetched
- clear page-level error messages
- `response.ok` checks
- `try/catch` error handling
- real search request with a new query parameter
- second request for book details by book ID/work key
- `Promise.all` with two independent requests
- DOM rendering with vanilla JavaScript

## What `await` does
`await` pauses JavaScript until a fetch request finishes. This is useful because the page should wait for the API before rendering data. The code checks `response.ok` to make sure the server responded successfully before reading the JSON. `try/catch` is used so the app can show a friendly message instead of crashing when the network is down or the request fails.

## AI Tools Used
During development I used AI assistance in VS Code to help create, check, and improve the JavaScript code.

## Screenshot
The final screenshot is stored at `screenshots/lab6.png`.
