import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import ProductsTable from "@/components/products-table";
import getQueryClient from "@/lib/get-query-client";
import { createClient } from "@/utils/supabase/server";
import { getProducts } from "./queries";

export default async function ProductsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/sign-in");
	}

	const queryClient = getQueryClient();
	await queryClient.prefetchQuery({
		queryKey: ["products"],
		queryFn: getProducts,
	});

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ProductsTable />
		</HydrationBoundary>
	);
}
