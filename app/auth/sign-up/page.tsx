"use client"

import type React from "react"

import { _getUser, signUp } from "@/lib/server-auth"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface InviteData {
  email: string;
  fullName: string;
  organizationName: string;
  organizationId: string;
  programId: string;
  inviteToken: string;
}

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<string>("")
  const [organizationName, setOrganizationName] = useState("")
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndInvite() {
      try {
        // Check for invite token in URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setIsVerifying(false);
          return;
        }

        console.log('Verifying invitation token:', token);
        
        try {
          const response = await fetch(`/api/invite-employee/verify?token=${token}`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data?.message || 'Invalid or expired invitation link');
          }

          if (!data || !data.email || !data.organizationName || !data.programId) {
            throw new Error('Invalid invitation data received');
          }

          console.log('Invitation verified successfully:', {
            ...data,
            inviteToken: token
          });

          setInviteData({
            ...data,
            inviteToken: token
          });

          // Pre-fill form with invite data
          setEmail(data.email);
          setFullName(data.fullName || '');
          setRole('employee');
          setOrganizationName(data.organizationName);
          
        } catch (error) {
          console.error('Verification error:', error);
          setError(error instanceof Error ? error.message : 'Failed to verify invitation');
          setInviteData(null); // Clear invite data on error
        }
      } catch (error) {
        console.error('Error in checkAuthAndInvite:', error);
        setError('Failed to verify invitation');
      } finally {
        setIsVerifying(false);
      }
    }
    checkAuthAndInvite();
  }, []);
  
  useEffect(() => {
    // If there's no token in URL but we have inviteData, clear it
    const params = new URLSearchParams(window.location.search);
    if (!params.get('token') && inviteData) {
      setInviteData(null);
      setEmail("");
      setFullName("");
      setRole("");
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true);
    setError(null);
    
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Check URL for token
      const params = new URLSearchParams(window.location.search);
      const hasTokenInUrl = params.get('token');
      
      // Validation for invitation flow
      if (hasTokenInUrl && !inviteData) {
        throw new Error("Invalid or expired invitation. Please request a new invitation.");
      }

      // Validation for regular sign-up flow
      if (!hasTokenInUrl) {
        if (!role) {
          throw new Error("Please select a role");
        }

        if (role === "organization_admin" && !organizationName) {
          throw new Error("Please enter your organization name");
        }
      }

      let signUpData;
      if (inviteData) {
        console.log('Starting invited user signup:', {
          email,
          fullName,
          role: 'employee',
          organizationId: inviteData.organizationId,
          programId: inviteData.programId
        });

        // Sign up with invitation data
        signUpData = await signUp({
          email,
          password,
          fullName,
          role: 'employee',
          organizationId: inviteData.organizationId,
          inviteToken: inviteData.inviteToken,
          programId: inviteData.programId
        });

        console.log('Invite signup response:', signUpData);
      } else {
        // Regular sign up
        signUpData = await signUp({ email, password, fullName, role, organizationName });
      }

      if (!signUpData?.user) {
        throw new Error("Failed to create account");
      }

      // Show success message
      setError(null);
      
      // Verify the session is established
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session) {
        throw new Error("Account created but session not established. Please try logging in.");
      }

      // Redirect to dashboard after successful signup
      console.log('Account created and session established, redirecting to dashboard');
      router.push("/dashboard");
    } catch (error) {
      console.error('Error during signup:', error);
      setError(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Award className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Certified</span>
          </div>
          {inviteData ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Accept Invitation</h1>
              <p className="text-gray-600">Complete your account setup to join {inviteData.organizationName}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-600">Get started with professional certification management</p>
            </>
          )}
        </div>
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create your account to start managing certifications</CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Verifying invitation...</p>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                {inviteData ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Invitation Details</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        You've been invited to join <span className="font-semibold">{inviteData.organizationName}</span>
                      </p>
                      <p className="text-sm text-blue-600">
                        Email: <span className="font-semibold">{inviteData.email}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-amber-800 mb-2">No Invitation</h3>
                    <p className="text-sm text-amber-700">
                      Creating a new account. If you have an invitation, please use the link from your invitation email.
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={!!inviteData}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!inviteData}
                  />
                </div>

                {!inviteData && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="organization_admin">Organization Admin</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {role === "organization_admin" && (
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Organization Name</Label>
                        <Input
                          id="organizationName"
                          type="text"
                          placeholder="Enter your organization name"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : inviteData ? "Accept Invitation" : "Create Account"}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
