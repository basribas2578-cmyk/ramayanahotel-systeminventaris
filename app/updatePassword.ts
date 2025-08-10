"use server";

import { createClient } from "@supabase/supabase-js";

// Gunakan environment variable Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateUserPassword(userId: string, newPassword: string) {
  if (!userId || !newPassword) {
    return { error: "User ID dan password baru wajib diisi" };
  }

  try {
    // Update password user
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { error: err.message };
  }
}
