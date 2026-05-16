import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Store, Lock, Eye, EyeOff, Save } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateProfileSchema, changePasswordSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

type ProfileForm = z.infer<typeof updateProfileSchema>;
type PasswordForm = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      storeName: user?.storeName || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    },
    onError: (error: any) => {
      const msg = error.message?.includes("400") ? "Email already in use" : "Failed to update profile";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password changed", description: "Your password has been updated." });
    },
    onError: (error: any) => {
      const msg = error.message?.includes("400") ? "Current password is incorrect" : "Failed to change password";
      toast({ title: "Password change failed", description: msg, variant: "destructive" });
    },
  });

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details</p>
      </div>

      {/* Avatar + name */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.storeName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Store className="h-3 w-3" /> {user.storeName}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
          <CardDescription>Update your name, email, and store details</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...profileForm.register("firstName")} placeholder="First name" />
                {profileForm.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...profileForm.register("lastName")} placeholder="Last name" />
                {profileForm.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...profileForm.register("email")} placeholder="you@example.com" />
              {profileForm.formState.errors.email && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input {...profileForm.register("phone")} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input {...profileForm.register("storeName")} placeholder="My Corner Store" />
            </div>

            <Button type="submit" disabled={profileMutation.isPending} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {profileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  {...passwordForm.register("currentPassword")}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  {...passwordForm.register("newPassword")}
                  placeholder="At least 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <Button type="submit" variant="outline" disabled={passwordMutation.isPending} className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {passwordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
