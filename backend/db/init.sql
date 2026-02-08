-- init.sql: creates a user and database for the project
CREATE USER horse_user WITH PASSWORD 'horse_pass';
CREATE DATABASE horse_db;
GRANT ALL PRIVILEGES ON DATABASE horse_db TO horse_user;

\connect horse_db;

-- Enable UUID extension (optional but nice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- USERS TABLE
-- =========================
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS daily_observations CASCADE;
DROP TABLE IF EXISTS action_taken CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS horses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  administrator BOOLEAN NOT NULL DEFAULT FALSE,
  edit_capabilities BOOLEAN NOT NULL DEFAULT FALSE,
  view_capabilities BOOLEAN NOT NULL DEFAULT TRUE,
  active_user BOOLEAN NOT NULL DEFAULT TRUE,
  phone TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- HORSES TABLE
-- =========================
CREATE TABLE horses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  picture TEXT,              -- image url/path
  biography TEXT,            -- free form text
  birth_year INT CHECK (birth_year >= 1900 AND birth_year <= 2100),
  arrival_date DATE,         -- used to calculate years retired
  breed TEXT,                -- dropdown enforced in UI
  gender TEXT CHECK (gender IN ('Mare','Gelding')),

  left_eye TEXT CHECK (left_eye IN ('Missing','Blind','Glaucoma','Injured') OR left_eye IS NULL),
  right_eye TEXT CHECK (right_eye IN ('Missing','Blind','Glaucoma','Injured') OR right_eye IS NULL),

  heart_murmur BOOLEAN DEFAULT FALSE,
  cushings_positive BOOLEAN DEFAULT FALSE,
  heaves BOOLEAN DEFAULT FALSE,
  anhidrosis BOOLEAN DEFAULT FALSE,
  shivers BOOLEAN DEFAULT FALSE,

  bites BOOLEAN DEFAULT FALSE,
  kicks BOOLEAN DEFAULT FALSE,
  difficult_to_catch BOOLEAN DEFAULT FALSE,
  problem_with_needles BOOLEAN DEFAULT FALSE,
  problem_with_farrier BOOLEAN DEFAULT FALSE,
  sedation_for_farrier BOOLEAN DEFAULT FALSE,

  requires_extra_feed BOOLEAN DEFAULT FALSE,
  requires_extra_mash BOOLEAN DEFAULT FALSE,

  seen_by_vet BOOLEAN DEFAULT FALSE,
  seen_by_farrier BOOLEAN DEFAULT FALSE,
  military_police_horse BOOLEAN DEFAULT FALSE,
  ex_racehorse BOOLEAN DEFAULT FALSE,

  deceased BOOLEAN DEFAULT FALSE,
  date_of_death DATE,

  grooming_day TEXT,         -- e.g. M/T/W/Th/F (UI controlled)
  pasture TEXT,
  behavior_notes TEXT,
  regular_treatment BOOLEAN DEFAULT FALSE,
  medical_notes TEXT,

  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- TREATMENTS TABLE
-- =========================
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_of_treatment TEXT NOT NULL,  -- dropdown in UI
  frequency TEXT,                   -- optional
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- ACTION TAKEN TABLE
-- (links horse + treatment)
-- =========================
CREATE TABLE action_taken (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
  action_taken_notes TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- DAILY OBSERVATIONS / TO-DO
-- =========================
CREATE TABLE daily_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  notes TEXT,
  todo_status BOOLEAN NOT NULL DEFAULT FALSE,
  done_status BOOLEAN NOT NULL DEFAULT FALSE,
  notify_staff BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- AUDIT TRAIL
-- =========================
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  field_name TEXT,
  before_value TEXT,
  after_value TEXT
);

GRANT CONNECT ON DATABASE horse_db TO horse_user;

GRANT USAGE ON SCHEMA public TO horse_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO horse_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO horse_user;

-- Make future tables/sequences also get permissions automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO horse_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO horse_user;
