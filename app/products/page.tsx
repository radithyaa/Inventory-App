import ProductsTable from "@/components/products-table"
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProductsPage() {

//     const supabase = createClient()
//           const {
//             data: { user },
//           } = await supabase.auth.getUser();
        
//           if (!user) {
//             return redirect("/sign-in");
//           }
//   return <ProductsTable />

const supabase = await createClient();
    
      const {
        data: { user },
      } = await supabase.auth.getUser();
    
      if (!user) {
        return redirect("/sign-in");
      }
    
      
  return <ProductsTable />
}