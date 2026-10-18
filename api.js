// QuickNotes API client 
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

// ---- POST: create a note -------------------------------------------------
const form = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitBtn = document.getElementById("submit-btn");
 
function validateTitle(title) {
  if (title.length === 0) return "Please enter a title.";
  if (title.length > MAX_TITLE) return `The title is too long (${title.length}/${MAX_TITLE} characters).`;
  return null;
}
 
async function createNote(title, body) {
  return request(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ title, body, userId: 1 }),
  });
}
 
async function handleSubmit(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  const problem = validateTitle(title);
  if (problem) {
    setStatus(problem, "error");
    titleInput.focus();
    return;
  }
  submitBtn.disabled = true;
  setStatus("Saving note...", "loading");
  try {
    const { data, status } = await createNote(title, body);
    clearEmptyState();
    createdIds.add(data.id);
    listEl.prepend(renderNote({ id: data.id, title, body }));
    setStatus(`Note created (status ${status}, id ${data.id}).`, "success");
    form.reset();
  } catch (err) {
    setStatus(friendlyError(err, "saving the note"), "error");
  } finally {
    submitBtn.disabled = false;
  }
}
 
form.addEventListener("submit", handleSubmit);

// ---- DELETE: remove a note -----------------------------------------------
// JSONPlaceholder is a fake API: it never stores notes we create, so a created
// note (id 101+) does not exist on the server. DELETE /posts/{id} still answers
// 200 for real and fake ids, so we send the request for every note and remove
// it from the page only after the server confirms success. If a real backend
// answers 404 for a note we created in this session, it is already gone, so we
// treat that 404 as success. Any other error keeps the note and shows a message.

const createdIds = new Set();   // ids of notes created in this session
 
async function deleteNote(id, li, button) {
  button.disabled = true;
  setStatus("Deleting note...", "loading");
  try {
    const { status } = await request(`${API_URL}/${id}`, { method: "DELETE" });
    removeFromList(li);
    setStatus(`Note deleted (status ${status}, id ${id}).`, "success");
  } catch (err) {
    if (err.status === 404 && createdIds.has(id)) {
      removeFromList(li);
      setStatus(`Note ${id} was only stored locally, so it was removed from the list.`, "success");
    } else {
      button.disabled = false;
      setStatus(friendlyError(err, "deleting the note"), "error");
    }
  }
}
 
function removeFromList(li) {
  li.remove();
  if (listEl.children.length === 0) showEmptyState();
}