# Docker Instructions

This project supports running the full stack using Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Compose (Linux)
- Docker Compose v2+

## Quick Start

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_key
   OPENROUTER_API_KEY=your_openrouter_key
   AWS_BEARER_TOKEN_BEDROCK=bedrock-api-key-...
   AWS_REGION=us-east-1
   ```

3. **Build and start**
   ```bash
   docker compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API docs: http://localhost:8000/docs

## Services

| Service   | Port  | Description                  |
|-----------|-------|------------------------------|
| backend   | 8000  | FastAPI + RAG + Conversion   |
| frontend  | 5173  | React UI (served via nginx)  |

## Common Commands

```bash
# Start in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop and remove containers
docker compose down

# Rebuild a single service
docker compose build backend
docker compose up -d backend

# Clean volumes (removes uploads/outputs inside containers)
docker compose down -v

# Execute command inside container
docker compose exec backend bash
```

## Production Considerations

- The current `docker-compose.yml` mounts volumes for `uploads`, `outputs`, and `chroma_db` so data persists on the host.
- For production:
  - Use a reverse proxy (Traefik / Nginx)
  - Set proper CORS if needed
  - Consider using `docker-compose.prod.yml`
  - Store API keys in a secret manager instead of .env

## Troubleshooting

**Frontend can't reach backend**
- In Docker, use service name `http://backend:8000` inside containers.
- Currently the frontend is configured to call `localhost:8000` (works because ports are published).

**Permission issues on Linux**
```bash
sudo chown -R $USER:$USER backend/uploads backend/outputs backend/chroma_db
```

**Rebuild from scratch**
```bash
docker compose down -v
docker system prune -a
docker compose up --build
```

## Volumes

- `backend/uploads` → Source files
- `backend/outputs` → Converted documents (downloadable)
- `backend/chroma_db` → Vector embeddings for chat

## Healthchecks

The backend has a healthcheck on `/`. You can monitor it with:
```bash
docker inspect --format='{{.State.Health.Status}}' document-platform-backend
```

---

For local development without Docker, see the main [README.md](./README.md).