import { supabase } from './lib/supabase'; // Re-use the connection we made!

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. CLEANUP: Delete old data to avoid duplicates
  // Note: We delete 'medical_records' first because it depends on 'horses'
  const { error: cleanError1 } = await supabase.from('medical_records').delete().neq('id', 0);
  const { error: cleanError2 } = await supabase.from('horses').delete().neq('id', 0);

  if (cleanError1 || cleanError2) {
    console.error('❌ Error cleaning up:', cleanError1 || cleanError2);
    return;
  }
  console.log('🧹 Old data cleared.');

  // 2. INSERT HORSES
  const { data: horses, error: horseError } = await supabase
    .from('horses')
    .insert([
      { name: 'Thunder', breed: 'Mustang', age: 5, description: 'Wild spirit.' },
      { name: 'Belle', breed: 'Arabian', age: 7, description: 'Graceful racer.' },
      { name: 'Rusty', breed: 'Quarter Horse', age: 12, description: 'Reliable.' },
    ])
    .select(); // .select() is crucial to get the IDs back!

  if (horseError) {
    console.error('❌ Error inserting horses:', horseError);
    return;
  }
  console.log(`🐴 Inserted ${horses.length} horses.`);

  // 3. INSERT MEDICAL RECORDS (Linking to the horses we just made)
  // We use the 'horses' array we got back to find the real IDs.
  
  const thunderId = horses.find(h => h.name === 'Thunder')?.id;
  const belleId = horses.find(h => h.name === 'Belle')?.id;

  if (thunderId && belleId) {
    const { error: medError } = await supabase
      .from('medical_records')
      .insert([
        { horse_id: thunderId, date: '2024-01-15', notes: 'Routine vaccination.' },
        { horse_id: thunderId, date: '2024-02-01', notes: 'Hoof trim.' },
        { horse_id: belleId, date: '2024-03-10', notes: 'Dental checkup.' },
      ]);

    if (medError) console.error('❌ Error inserting medical records:', medError);
    else console.log('🏥 Inserted medical records.');
  }

  console.log('✅ Seed complete!');
}

seed();