import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building2,
  Palette,
  Bell,
  Shield,
  Globe,
  Mail,
  Users,
  Upload,
  Trash2,
  AlertCircle
} from "lucide-react"

export default async function OrganizationSettingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile with organization details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", data.user.id)
    .single()

  if (!profile || profile.role !== "organization_admin") {
    redirect("/dashboard")
  }

  const organization = profile.organization

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization&#39;s profile, branding, and preferences
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {organization.subscription_tier || "Free"} Plan
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-4 bg-muted p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  Manage your organization&#39;s basic information and details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action="/api/organization/update" className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={organization.logo_url} />
                      <AvatarFallback>{organization.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={organization.name}
                          placeholder="Enter organization name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        defaultValue={organization.website || ""}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Contact Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={organization.contact_email || ""}
                        placeholder="contact@organization.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={organization.description || ""}
                      placeholder="Brief description of your organization"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={organization.address || ""}
                      placeholder="Enter your organization's address"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="reset" variant="outline">
                      Reset
                    </Button>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Size</CardTitle>
                <CardDescription>
                  Information about your organization&#39;s team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{profile.total_employees || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Employees</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{profile.active_employees || 0}</div>
                    <div className="text-sm text-muted-foreground">Active Members</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{profile.pending_invites || 0}</div>
                    <div className="text-sm text-muted-foreground">Pending Invites</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Customize your organization&#39;s visual identity and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/api/organization/branding" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Organization Logo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={organization.logo_url} />
                        <AvatarFallback>{organization.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 flex-1">
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" /> Upload New
                          </Button>
                          <Button type="button" variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Recommended: 200x200px. Max size: 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          name="primaryColor"
                          type="color"
                          defaultValue={organization.primary_color || "#000000"}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={organization.primary_color || "#000000"}
                          className="flex-1"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          name="secondaryColor"
                          type="color"
                          defaultValue={organization.secondary_color || "#FFFFFF"}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={organization.secondary_color || "#FFFFFF"}
                          className="flex-1"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Certificate Customization</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label htmlFor="customLogo" className="text-base">Use Custom Logo</Label>
                        <p className="text-sm text-muted-foreground">
                          Add your logo to certificates
                        </p>
                      </div>
                      <Switch id="customLogo" defaultChecked={organization.use_logo_in_certificates} />
                    </div>
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label htmlFor="customColors" className="text-base">Use Brand Colors</Label>
                        <p className="text-sm text-muted-foreground">
                          Apply brand colors to certificates
                        </p>
                      </div>
                      <Switch id="customColors" defaultChecked={organization.use_colors_in_certificates} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="reset" variant="outline">
                    Reset
                  </Button>
                  <Button type="submit">
                    Save Branding
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive organization notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Email Notifications</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label className="text-base">Employee Invites</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when employees accept or decline invites
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label className="text-base">Certificate Awards</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when certificates are awarded
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label className="text-base">Program Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about program changes and updates
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Weekly Reports</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label className="text-base">Progress Report</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly employee progress reports
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Label className="text-base">Analytics Report</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly certification analytics
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    Save Notification Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure your organization&#39;s security preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Access Control</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <Label className="text-base">Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">
                            Require 2FA for all admin accounts
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <Label className="text-base">Single Sign-On (SSO)</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable SSO for your organization
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Certificate Security</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <Label className="text-base">Digital Signatures</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable digital signatures on certificates
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <Label className="text-base">Blockchain Verification</Label>
                          <p className="text-sm text-muted-foreground">
                            Store certificate hashes on blockchain
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-medium">Danger Zone</h3>
                    </div>
                    <div className="border border-destructive/50 rounded-lg p-4 space-y-4">
                      <div>
                        <h4 className="font-medium text-destructive">Delete Organization</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your organization and all associated data
                        </p>
                      </div>
                      <Button variant="destructive" type="button">
                        Delete Organization
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">
                      Save Security Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  Recent security and administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* We'll need to implement this with real data later */}
                  <div className="text-sm text-muted-foreground">
                    No recent activity to display
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}