# PostgreSQL setup (Docker Compose)

This project includes a local PostgreSQL setup using Docker Compose.

Files added:

- `docker-compose.yml` — service for PostgreSQL 15.
- `db/init.sql` — initialization script (creates user `horse_user` and database `horse_db`).
- `.env.example` — example environment variables.

Quick start:

1. Copy environment variables (optional):

   cp .env.example .env

2. Start the database:

   docker compose up -d

3. Check logs:

   docker compose logs -f db

4. Connect locally (example):

   psql "postgres://horse_user:horse_pass@localhost:5432/horse_db"

Notes:

- The `db/init.sql` file is mounted into `/docker-entrypoint-initdb.d/` and will run only the first time the container initialises the volume.
- To reset the DB, stop containers, remove the `db-data` volume and restart: `docker compose down -v` then `docker compose up -d`.
- If you want me to start the container and confirm connectivity, say so and I'll run the commands.
