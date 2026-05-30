"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUsername(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const username = formData.get("username")?.toString();

  if (!username || username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Not authenticated." };
  }

  const { error } = await (supabase.from("users") as any)
    .update({ username })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update username." };
  }

  revalidatePath("/profile");
  return { success: "Username updated successfully!" };
}

export async function updatePassword(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const newPassword = formData.get("newPassword")?.toString();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated successfully!" };
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("users") as any)
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update avatar in database." };
  }

  revalidatePath("/profile");
  return { success: true };
}
