// import { createClient } from '@/utils/supabase/server'

// export default async function Page() {
//   const supabase = await createClient()
//   const { data: notes } = await supabase.from('forms').select(`*,product_id(*) `)

//   return <pre>{JSON.stringify(notes, null, 2)}</pre>
// }

// ----------------------------------------------------------------


'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js'
import { Sidebar } from '@/components/ui/sidebar';

export default function Page() {
    const [notes, setNotes] = useState<object[]>([]);

    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        const fetchNotes = async () => {
            const { data, error } = await supabase.from('forms').select(`*,product_id(*)`);
            if (error) {
                return 'error fetching notes: ' + error.message;
            }
            setNotes(data || []);
        };

        fetchNotes();

        const channel = supabase.channel('schema-public-form-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'forms' }, (payload) => {
                fetchNotes(); // Fetch the latest data when a change is detected
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (<><pre>{JSON.stringify(notes, null, 2)}
    
    </pre>
    
    </>);
}