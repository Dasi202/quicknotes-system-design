# QuickNotes API Design

This is the real API the backend team should build (not JSONPlaceholder). It is a JSON REST API, versioned under `/v1`, authenticated with `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Description | Success status |
|--------|------|-------------|----------------|
| POST | `/v1/auth/login` | Exchange email and password for an access token | 200 OK |
| GET | `/v1/notes` | List the caller's notes (paginated, filter by `tag`, search with `q`) | 200 OK |
| POST | `/v1/notes` | Create a note | 201 Created |
| GET | `/v1/notes/{id}` | Get one note | 200 OK |
| PUT | `/v1/notes/{id}` | Replace a note's title, body and tags | 200 OK |
| PATCH | `/v1/notes/{id}` | Partially update a note | 200 OK |
| DELETE | `/v1/notes/{id}` | Delete a note | 204 No Content |
| GET | `/v1/tags` | List the caller's tags | 200 OK |
| POST | `/v1/notes/{id}/tags` | Attach a tag to a note | 201 Created |
| DELETE | `/v1/notes/{id}/tags/{tagId}` | Remove a tag from a note | 204 No Content |

Notes belong to the authenticated user; the user id is taken from the token, never from the request body.

## Create a note

`POST /v1/notes`

```json
{
  "title": "Buy milk",
  "body": "Two litres, semi-skimmed",
  "tags": ["shopping", "home"]
}
```

Response `201 Created` with header `Location: /v1/notes/8421`:

```json
{
  "id": 8421,
  "title": "Buy milk",
  "body": "Two litres, semi-skimmed",
  "tags": ["shopping", "home"],
  "createdAt": "2026-10-18T09:30:00Z",
  "updatedAt": "2026-10-18T09:30:00Z"
}
```

Rules: `title` required, 1-100 characters; `body` optional, up to 10,000 characters.

## List notes

`GET /v1/notes?tag=shopping&q=milk&limit=20&cursor=eyJpZCI6ODQyMH0`

Response `200 OK`:

```json
{
  "data": [
    {
      "id": 8421,
      "title": "Buy milk",
      "body": "Two litres, semi-skimmed",
      "tags": ["shopping", "home"],
      "createdAt": "2026-10-18T09:30:00Z",
      "updatedAt": "2026-10-18T09:30:00Z"
    }
  ],
  "nextCursor": "eyJpZCI6ODQwMH0"
}
```

`nextCursor` is `null` on the last page. Cursor pagination stays fast on large tables (offset pagination does not).

## Error codes

| Status | Meaning | Example cause |
|--------|---------|---------------|
| 400 Bad Request | Invalid input | Missing or too long title, malformed JSON |
| 401 Unauthorized | Missing, expired or invalid token | No `Authorization` header |
| 403 Forbidden | Authenticated but not allowed | Reading another user's note |
| 404 Not Found | Resource does not exist | `GET /v1/notes/999999` |
| 429 Too Many Requests | Rate limit exceeded | More than 100 requests/minute per user |
| 500 Internal Server Error | Unexpected server fault | Database unreachable |

Every error uses the same body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be between 1 and 100 characters.",
    "field": "title",
    "requestId": "req_7f3a9c"
  }
}
```