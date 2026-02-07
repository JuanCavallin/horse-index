-- init.sql: creates a user and database for the project
CREATE USER horse_user WITH PASSWORD 'horse_pass';
CREATE DATABASE horse_db;
GRANT ALL PRIVILEGES ON DATABASE horse_db TO horse_user;

-- Enable useful extensions (no-op if already enabled)
\connect horse_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
