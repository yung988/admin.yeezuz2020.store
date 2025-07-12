import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdminOrEditor() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/auth/signin');
    }
    
    // Zkontrolujeme roli uživatele v databázi
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'editor')) {
      redirect('/unauthorized');
    }
    
    return { ...user, role: userData.role };
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/auth/signin');
  }
}
