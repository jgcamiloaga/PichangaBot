import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Crear un único cliente de Supabase para interactuar con la DB
const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseKey;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Advertencia: Variables de entorno SUPABASE_URL o SUPABASE_KEY no definidos. Asegúrate de configurarlos.");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
