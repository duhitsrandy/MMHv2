import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteUserAccount } from "@/lib/account/delete-user-account";

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteUserAccount(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/mobile/account DELETE] Error:", error);
    return NextResponse.json(
      { error: "Could not delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}
