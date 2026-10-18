// QuickNotes API client (practice backend: JSONPlaceholder)
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE = 100;

const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("notes-list");

// ---- helpers -------------------------------------------------------------
function setStatus(message, kind) {          // kind: "loading" | "success" | "error" | ""
  statusEl.textContent = message;            // textContent only, never innerHTML
  statusEl.className = kind || "";
}

// Reusable request: calls fetch, checks response.ok, throws on errors.
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json().catch(() => ({})); // DELETE may return {}
  return { data, status: response.status };
}

function friendlyError(err, action) {
  if (err.status >= 500) return `The server had a problem while ${action}. Please try again soon.`;
  if (err.status) return `Could not complete the request while ${action} (status ${err.status}).`;
  return `Could not reach the server while ${action}. Check your connection and try again.`;
}

function showEmptyState() {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = "No notes yet. Write one above or load your notes.";
  listEl.appendChild(li);
}

function clearEmptyState() {
  const empty = listEl.querySelector("li.empty");
  if (empty) empty.remove();
}

function renderNote(note) {
  const li = document.createElement("li");
  li.dataset.id = note.id;
  const title = document.createElement("h3");
  title.className = "note-title";
  title.textContent = note.title;
  const body = document.createElement("p");
  body.className = "note-body";
  body.textContent = note.body || "";
  li.append(title, body);
  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete-btn";
  del.textContent = "Delete";
  del.addEventListener("click", () => deleteNote(note.id, li, del));
  li.appendChild(del);
  return li;
}

// ---- GET: load 10 notes --------------------------------------------------
async function loadNotes() {
  setStatus("Loading notes...", "loading");
  loadBtn.disabled = true;
  try {
    const { data } = await request(`${API_URL}?_limit=10`);
    listEl.replaceChildren();
    if (data.length === 0) {
      showEmptyState();
      setStatus("The server has no notes yet.", "success");
    } else {
      data.forEach(note => listEl.appendChild(renderNote(note)));
      setStatus(`Loaded ${data.length} notes from the server.`, "success");
    }
  } catch (err) {
    setStatus(friendlyError(err, "loading notes"), "error");
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
