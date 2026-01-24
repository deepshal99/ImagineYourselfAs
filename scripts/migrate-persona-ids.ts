import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://syemomuztccylkgjpjsy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW1vbXV6dGNjeWxrZ2pwanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk4NDIsImV4cCI6MjA4MDAxNTg0Mn0.leWIAincqFnt7hzICS3f6rI6__O_KT8j2MBlY0HF_es';

const supabase = createClient(supabaseUrl, supabaseKey);

const generateSemanticId = (name: string, category: string): string => {
    const prefix = (category || 'other').toLowerCase();
    const slug = (name || 'persona').toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
    return `${prefix}_${slug}`;
};

async function migratePersonaIds() {
    console.log('Fetching personas with custom_ IDs...');

    // Get all personas with custom_ IDs
    const { data: personas, error } = await supabase
        .from('discovered_personas')
        .select('*')
        .like('id', 'custom_%');

    if (error) {
        console.error('Error fetching personas:', error);
        return;
    }

    if (!personas || personas.length === 0) {
        console.log('No personas with custom_ IDs found.');
        return;
    }

    console.log(`Found ${personas.length} personas to migrate:`);
    personas.forEach(p => console.log(`  - ${p.id} → ${p.name} (${p.category})`));

    for (const persona of personas) {
        const newId = generateSemanticId(persona.name, persona.category);
        console.log(`\nMigrating: ${persona.id} → ${newId}`);

        // Check if newId already exists
        const { data: existing } = await supabase
            .from('discovered_personas')
            .select('id')
            .eq('id', newId)
            .single();

        if (existing) {
            console.log(`  ⚠️ Skipping: ${newId} already exists`);
            continue;
        }

        // Insert new record with semantic ID
        const { error: insertError } = await supabase
            .from('discovered_personas')
            .insert({
                ...persona,
                id: newId
            });

        if (insertError) {
            console.error(`  ❌ Insert failed:`, insertError.message);
            continue;
        }

        // Delete old record
        const { error: deleteError } = await supabase
            .from('discovered_personas')
            .delete()
            .eq('id', persona.id);

        if (deleteError) {
            console.error(`  ❌ Delete old record failed:`, deleteError.message);
            continue;
        }

        console.log(`  ✅ Migrated successfully`);
    }

    console.log('\n🎉 Migration complete!');
}

migratePersonaIds();
