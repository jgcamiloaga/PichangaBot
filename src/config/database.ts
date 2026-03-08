import { createClient } from '@supabase/supabase-js';
import { config } from './env';

const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseKey;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Advertencia: Variables de entorno SUPABASE_URL o SUPABASE_KEY no definidos. Asegúrate de configurarlos.");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
