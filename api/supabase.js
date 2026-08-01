
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://ktnvnwbscomdvuahqfnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bnZud2JzY29tZHZ1YWhxZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDc3NTIsImV4cCI6MjA5MTA4Mzc1Mn0.Jf8JVunxx_m8ta1UntJMsjSnO0808KeJp3k5GPyHPVM';


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage, 
    autoRefreshToken: true,
    persistSession: true,
    // En web detectamos el token del link de recuperación de contraseña.
    detectSessionInUrl: Platform.OS === 'web',
  },
});