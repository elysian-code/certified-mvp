import { createClient as createBrowserClient } from "@/lib/supabase/client"

interface SignUpParams {
  email: string
  password: string
  fullName: string
  role: string
  organizationName?: string
  organizationId?: string
  inviteToken?: string
  programId?: string
}

export async function signUp(params: SignUpParams) {
  try {
    console.log('Starting signup process with params:', {
      ...params,
      password: '[REDACTED]' // Don't log passwords
    });

    // First, validate the parameters
    if (!params.email || !params.password || !params.fullName) {
      throw new Error('Missing required fields');
    }

    // If it's an invite-based signup, verify required fields
    if (params.inviteToken) {
      if (!params.programId) {
        throw new Error('Program ID is required for invite-based signup');
      }
      console.log('Processing invite-based signup');
    } else {
      // Regular signup validation
      if (!params.role) {
        throw new Error('Role is required for regular signup');
      }
      if (params.role === 'organization_admin' && !params.organizationName) {
        throw new Error('Organization name is required for admin signup');
      }
      console.log('Processing regular signup');
    }

    const url = `${window.location.origin}/api/auth/signup`;
    console.log('Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params),
    });

    console.log('Response status:', response.status);

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Server returned an invalid response');
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || 'Failed to create account';
      console.error('Signup error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!responseData?.user) {
      console.error('Invalid response data:', responseData);
      throw new Error('Invalid server response: missing user data');
    }

    // Set up the client-side session
    console.log('Setting up client session');
    const supabase = createBrowserClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password
    });

    if (signInError) {
      console.error('Error setting up session:', signInError);
      throw new Error('Account created but failed to sign in. Please try logging in.');
    }

    console.log('Signup and session setup completed successfully');
    return { user: authData.user };
  } catch (error) {
    console.error('Signup error:', error);
    throw error instanceof Error ? error : new Error('Failed to create account');
  }
}

export async function login({ email, password }: { email: string; password: string }) {
  try {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to sign in')
  }
}

export async function logout() {
  try {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to sign out')
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    })
    if (error) throw error
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to reset password')
  }
}

export async function _getUser() {
  const supabase = createBrowserClient()
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}