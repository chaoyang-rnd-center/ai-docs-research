# API Reference

## Base URL

- Production: `https://api.example.com/v1`
- Staging: `https://api-staging.example.com/v1`

## Authentication

All API requests require authentication using Bearer tokens:

```
Authorization: Bearer <your-token>
```

## Rate Limiting

- 1000 requests per hour for authenticated users
- 100 requests per hour for unauthenticated users

## Endpoints

### Projects

#### List Projects

```http
GET /projects
```

Query parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `sort`: Sort field (created_at, updated_at, name)
- `order`: Sort order (asc, desc)

Response:
```json
{
  "data": [
    {
      "id": "proj_123",
      "name": "My Project",
      "description": "Project description",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20
  }
}
```

#### Create Project

```http
POST /projects
```

Request body:
```json
{
  "name": "New Project",
  "description": "Optional description"
}
```

#### Get Project

```http
GET /projects/:id
```

#### Update Project

```http
PUT /projects/:id
```

#### Delete Project

```http
DELETE /projects/:id
```

### Tasks

#### List Tasks

```http
GET /projects/:project_id/tasks
```

Query parameters:
- `status`: Filter by status (todo, in_progress, done)
- `assignee`: Filter by assignee user ID
- `due_before`: Filter tasks due before date (ISO 8601)
- `due_after`: Filter tasks due after date (ISO 8601)

#### Create Task

```http
POST /projects/:project_id/tasks
```

Request body:
```json
{
  "title": "Task title",
  "description": "Task description",
  "status": "todo",
  "assignee_id": "user_123",
  "due_date": "2024-02-01T00:00:00Z",
  "priority": "high"
}
```

#### Update Task

```http
PUT /tasks/:id
```

#### Delete Task

```http
DELETE /tasks/:id
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Detailed error message",
    "details": {
      "field": "specific field with error"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid authentication |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `invalid_request` | 400 | Invalid request parameters |
| `rate_limited` | 429 | Too many requests |
| `internal_error` | 500 | Server error |

## Webhooks

Subscribe to events by registering a webhook:

```http
POST /webhooks
```

Request body:
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["project.created", "task.updated"],
  "secret": "your-webhook-secret"
}
```

### Event Types

- `project.created`
- `project.updated`
- `project.deleted`
- `task.created`
- `task.updated`
- `task.deleted`
- `comment.created`
