import { supabase } from './lib/supabase';

async function seed() {
  console.log('Starting seed...');

  // 1. CLEANUP: Delete in dependency order
  const { error: cleanLogs } = await supabase.from('audit_logs').delete().neq('id', 0);
  const { error: cleanObs } = await supabase.from('daily_observations').delete().neq('id', 0);
  const { error: cleanActions } = await supabase.from('action_taken').delete().neq('id', 0);
  const { error: cleanRecords } = await supabase.from('medical_records').delete().neq('id', 0);
  const { error: cleanTreatments } = await supabase.from('treatments').delete().neq('id', 0);
  const { error: cleanHorses } = await supabase.from('horses').delete().neq('id', 0);
  const { error: cleanUsers } = await supabase.from('users').delete().neq('id', 0);

  const cleanErrors = [cleanLogs, cleanObs, cleanActions, cleanRecords, cleanTreatments, cleanHorses, cleanUsers].filter(Boolean);
  if (cleanErrors.length) {
    console.error('Error cleaning up:', cleanErrors[0]);
    return;
  }
  console.log('Old data cleared.');

  // 2. INSERT USERS
  const { data: users, error: userError } = await supabase
    .from('users')
    .insert([
      { name: 'Admin User', administrator: true, edit_capabilities: true, phone: '555-0100' },
      { name: 'Staff Member', administrator: false, edit_capabilities: true, phone: '555-0101' },
      { name: 'Volunteer', administrator: false, edit_capabilities: false, phone: '555-0102' },
    ])
    .select();

  if (userError) { console.error('Error inserting users:', userError); return; }
  console.log(`Inserted ${users.length} users.`);

  const adminId = users.find(u => u.name === 'Admin User')!.id;
  const staffId = users.find(u => u.name === 'Staff Member')!.id;

  // 3. INSERT HORSES
  const { data: horses, error: horseError } = await supabase
    .from('horses')
    .insert([
      {
        name: 'Thunder', breed: 'Mustang', age: 22, gender: 'Gelding', color: 'Bay',
        health_status: 'healthy', arrival_date: '2018-03-15', ex_racehorse: true,
        pasture: 'North Field', grooming_day: 'Monday',
        behavior_notes: 'Very friendly, loves carrots.',
        medical_notes: 'No current issues.', updated_by: adminId,
      },
      {
        name: 'Belle', breed: 'Arabian', age: 28, gender: 'Mare', color: 'Grey',
        health_status: 'needs_attention', arrival_date: '2015-06-01',
        heart_murmur: true, requires_extra_feed: true,
        pasture: 'South Pasture', grooming_day: 'Wednesday',
        behavior_notes: 'Shy around strangers.',
        medical_notes: 'Heart murmur - monitor closely.', updated_by: adminId,
      },
      {
        name: 'Rusty', breed: 'Quarter Horse', age: 30, gender: 'Gelding', color: 'Chestnut',
        health_status: 'palliative', arrival_date: '2012-09-10',
        cushings_positive: true, military_police_horse: true,
        pasture: 'Barn Area', grooming_day: 'Friday',
        behavior_notes: 'Gentle giant, great with kids.',
        medical_notes: 'Cushings positive, on Prascend.', updated_by: staffId,
      },
      {
        name: 'Daisy', breed: 'Thoroughbred', age: 18, gender: 'Mare', color: 'Dark Bay',
        health_status: 'healthy', arrival_date: '2020-01-20', ex_racehorse: true,
        pasture: 'East Field', grooming_day: 'Tuesday',
        behavior_notes: 'Energetic, needs daily exercise.', updated_by: staffId,
      },
      {
        name: 'Scout', breed: 'Paint', age: 25, gender: 'Gelding', color: 'Pinto',
        health_status: 'critical', arrival_date: '2016-11-05',
        kicks: true, heaves: true,
        pasture: 'Barn Area', grooming_day: 'Thursday',
        behavior_notes: 'Kicks - approach with caution.',
        medical_notes: 'Heaves, requires medication.', updated_by: adminId,
      },
    ])
    .select();

  if (horseError) { console.error('Error inserting horses:', horseError); return; }
  console.log(`Inserted ${horses.length} horses.`);

  // 4. INSERT MEDICAL RECORDS
  const thunderId = horses.find(h => h.name === 'Thunder')!.id;
  const belleId = horses.find(h => h.name === 'Belle')!.id;
  const rustyId = horses.find(h => h.name === 'Rusty')!.id;
  const daisyId = horses.find(h => h.name === 'Daisy')!.id;
  const scoutId = horses.find(h => h.name === 'Scout')!.id;

  const { error: recError } = await supabase
    .from('medical_records')
    .insert([
      { horse_id: thunderId, record_type: 'checkup', description: 'Annual wellness exam - all clear.', vet_name: 'Dr. Martinez', date: '2025-11-01', next_followup: '2026-11-01', notes: 'Teeth in good shape.' },
      { horse_id: thunderId, record_type: 'vaccination', description: 'Flu and tetanus booster.', vet_name: 'Dr. Martinez', date: '2025-11-01', next_followup: '2026-11-01' },
      { horse_id: belleId, record_type: 'checkup', description: 'Heart murmur evaluation.', vet_name: 'Dr. Chen', date: '2025-10-15', next_followup: '2026-01-15', notes: 'Grade 2 murmur, stable.' },
      { horse_id: belleId, record_type: 'treatment', description: 'Dental float procedure.', vet_name: 'Dr. Chen', date: '2025-08-20', notes: 'Mild hooks corrected.' },
      { horse_id: rustyId, record_type: 'treatment', description: 'Cushings blood panel and Prascend adjustment.', vet_name: 'Dr. Patel', date: '2025-12-01', next_followup: '2026-03-01', notes: 'ACTH levels slightly elevated, increased dosage.' },
      { horse_id: rustyId, record_type: 'checkup', description: 'Routine farrier and lameness check.', vet_name: 'Dr. Patel', date: '2025-09-10', notes: 'Mild arthritis in front left.' },
      { horse_id: daisyId, record_type: 'vaccination', description: 'West Nile and rabies vaccination.', vet_name: 'Dr. Martinez', date: '2025-10-05', next_followup: '2026-10-05' },
      { horse_id: scoutId, record_type: 'treatment', description: 'Heaves management review.', vet_name: 'Dr. Chen', date: '2025-11-20', next_followup: '2026-02-20', notes: 'Switched to soaked hay, improving.' },
    ]);

  if (recError) console.error('Error inserting medical records:', recError);
  else console.log('Inserted medical records.');

  // 5. INSERT AUDIT LOGS
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert([
      { user_id: adminId, table_name: 'horses', field_name: 'health_status', before_value: 'healthy', after_value: 'needs_attention' },
      { user_id: adminId, table_name: 'horses', field_name: 'medical_notes', before_value: null, after_value: 'Heart murmur - monitor closely.' },
      { user_id: staffId, table_name: 'horses', field_name: 'pasture', before_value: 'East Field', after_value: 'Barn Area' },
    ]);

  if (auditError) console.error('Error inserting audit logs:', auditError);
  else console.log('Inserted audit logs.');

  console.log('Seed complete!');
}

seed();
