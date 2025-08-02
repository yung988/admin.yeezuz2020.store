import { createClient } from './supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function authenticateRequest(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: 'Unauthorized' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error authenticating request:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export async function requireAuth(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  
  if (!user || error) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return user;
}

// Pro budoucí použití s rolemi
export async function requireAdmin(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  
  if (!user || error) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  // TODO: Přidat kontrolu rolí z databáze
  // const supabase = await createClient();
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user.id)
  //   .single();
  // 
  // if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
  //   return NextResponse.json(
  //     { error: 'Forbidden - admin access required' },
  //     { status: 403 }
  //   );
  // }

  return user;
}
