# QuickNotes

QuickNotes is a note-taking app that is moving from a browser-only tool to an online service for 1 million users. This repository has two parts: a small front-end API client that proves the browser can load, create and delete notes through a REST API (using the free [JSONPlaceholder](https://jsonplaceholder.typicode.com) practice API), and the design documents for the real backend.

## How to run the API client

1. Clone the repository and open the folder.
2. Open `index.html` in a browser (double-click it), or serve it: `python3 -m http.server 8000` and visit `http://localhost:8000`.
3. Click **Load notes** to GET 10 notes, use the form to create a note (POST), and click **Delete** on a note (DELETE).

An internet connection is needed. JSONPlaceholder does not store changes, so created notes disappear on reload and the server always returns the same 10 notes; `api.js` explains how deletes handle this.

## Files

- `index.html`, `style.css`, `api.js`: the API client
- [API design](docs/api-design.md): endpoints, examples and error codes
- [Data model](docs/data-model.md): entities, SQL, indexes and the SQL vs NoSQL decision
- [Architecture](docs/architecture.md): requirements, load estimates, diagram, flows and trade-offs

## What I learned

- A single reusable `request()` function that checks `response.ok` and throws keeps error handling in one place, because `fetch` does not reject on 404 or 500 by itself.
- Every request needs loading, success, error and empty states, and disabling buttons while a request runs prevents duplicate submissions.
- Using `textContent` instead of `innerHTML` stops user text from being run as HTML (XSS).
- A fake API like JSONPlaceholder does not persist data, so the UI must be designed carefully around what the server really confirms.
- Capacity estimates (about 70 reads/s and 12 writes/s on average) show that this system is read-heavy and that caching and replicas matter more than sharding at first.
- Good designs name their trade-offs, such as cache staleness and replica lag, and remove single points of failure with redundancy.