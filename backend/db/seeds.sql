-- backend/db/seeds.sql
-- Run this in the Supabase SQL Editor AFTER schema.sql to populate sample data.

-- =========================
-- USERS
-- =========================
insert into public.users (name, administrator, edit_capabilities, phone) values
  ('Admin User', true, true, '555-0100'),
  ('Staff Member', false, true, '555-0101'),
  ('Volunteer', false, false, '555-0102');

-- =========================
-- HORSES
-- =========================
insert into public.horses (
  name, breed, birth_year, gender, color, health_status, arrival_date,
  heart_murmur, cushings_positive, military_police_horse, ex_racehorse, pasture, grooming_day,
  behavior_notes, medical_notes, updated_by
) values
  ('Thunder', 'Mustang', 2004, 'Gelding', 'Bay', 'healthy', '2018-03-15',
   false, false, false, true, 'North Field', 'Monday',
   'Very friendly, loves carrots.', 'No current issues.', 1),
  ('Belle', 'Arabian', 1998, 'Mare', 'Grey', 'needs_attention', '2015-06-01',
   true, false, false, false, 'South Pasture', 'Wednesday',
   'Shy around strangers.', 'Heart murmur - monitor closely.', 1),
  ('Rusty', 'Quarter Horse', 1996, 'Gelding', 'Chestnut', 'palliative', '2012-09-10',
   false, true, true, false, 'Barn Area', 'Friday',
   'Gentle giant, great with kids.', 'Cushings positive, on Prascend.', 2),
  ('Daisy', 'Thoroughbred', 2008, 'Mare', 'Dark Bay', 'healthy', '2020-01-20',
   false, false, false, true, 'East Field', 'Tuesday',
   'Energetic, needs daily exercise.', null, 2),
  ('Scout', 'Paint', 2001, 'Gelding', 'Pinto', 'critical', '2016-11-05',
   false, false, false, false, 'Barn Area', 'Thursday',
   'Kicks - approach with caution.', 'Heaves, requires medication.', 1);

-- Update Scout's behavioral flags
update public.horses set kicks = true, heaves = true where name = 'Scout';
-- Update Belle's extra care flags
update public.horses set requires_extra_feed = true where name = 'Belle';

-- =========================
-- MEDICAL RECORDS
-- =========================
insert into public.medical_records (
  horse_id, record_type, description, vet_name, date, next_followup, notes, photo_url, updated_at, updated_by
) values
  (1, 'checkup', 'Annual wellness exam - all clear.', 'Dr. Martinez', '2025-11-01', '2026-11-01', 'Teeth in good shape.', null, now(), 1),
  (1, 'vaccination', 'Flu and tetanus booster.', 'Dr. Martinez', '2025-11-01', '2026-11-01', null, null, now(), 1),
  (2, 'checkup', 'Heart murmur evaluation.', 'Dr. Chen', '2025-10-15', '2026-01-15', 'Grade 2 murmur, stable.', null, now(), 1),
  (2, 'treatment', 'Dental float procedure.', 'Dr. Chen', '2025-08-20', null, 'Mild hooks corrected.', null, now(), 1),
  (3, 'treatment', 'Cushings blood panel and Prascend adjustment.', 'Dr. Patel', '2025-12-01', '2026-03-01', 'ACTH levels slightly elevated, increased dosage.', null, now(), 2),
  (3, 'checkup', 'Routine farrier and lameness check.', 'Dr. Patel', '2025-09-10', null, 'Mild arthritis in front left.', null, now(), 2),
  (4, 'vaccination', 'West Nile and rabies vaccination.', 'Dr. Martinez', '2025-10-05', '2026-10-05', null, null, now(), 2),
  (5, 'treatment', 'Heaves management review.', 'Dr. Chen', '2025-11-20', '2026-02-20', 'Switched to soaked hay, improving.', null, now(), 1);

-- =========================
-- AUDIT LOGS
-- =========================
insert into public.audit_trail (user_id, table_name, field_name, before_value, after_value) values
  (1, 'horses', 'health_status', 'healthy', 'needs_attention'),
  (1, 'horses', 'medical_notes', null, 'Heart murmur - monitor closely.'),
  (2, 'horses', 'pasture', 'East Field', 'Barn Area'),
  (1, 'medical_records', 'description', null, 'Annual wellness exam - all clear.');
