-- Migration: Add health_status column to horses table
-- Run this in the Supabase SQL Editor to add the missing health_status column

ALTER TABLE public.horses 
ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'healthy'
CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'palliative'));
