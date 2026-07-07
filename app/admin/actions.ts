"use server";

import { revalidatePath } from "next/cache";
import { markFollowedUp } from "@/lib/db";

/**
 * Server Action: marks a lead as followed up, then revalidates the admin
 * dashboard so the table/badges reflect the change immediately.
 */
export async function markLeadFollowedUp(id: number): Promise<void> {
  markFollowedUp(id);
  revalidatePath("/admin");
}
