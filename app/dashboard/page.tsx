import BorrowingDashboard from "@/components/borrowing-dashboard"
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {

    // const { createClient } = await import("@supabase/supabase-js")
    //           const supabase = createClient(
    //             process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    //             process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    //           )
    //   const {
    //     data: { user },
    //   } = await supabase.auth.getUser();
    //   console.log(user)
    
    //   if (!user) {
    //     return redirect("/sign-in");
    //   }
    

     const supabase = await createClient();
    
      const {
        data: { user },
      } = await supabase.auth.getUser();
    
      if (!user) {
        return redirect("/sign-in");
      }
    
      
  return <BorrowingDashboard />
}
