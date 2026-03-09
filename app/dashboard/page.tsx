import { redirect } from "next/navigation";
import BorrowingDashboard from "@/components/borrowing-dashboard";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/sign-in");
	}

	return <BorrowingDashboard />;
}
