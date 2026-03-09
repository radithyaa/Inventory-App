"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type StatusType =
	| "pending"
	| "approved"
	| "borrowed"
	| "returned"
	| "rejected"
	| "overdue";

interface GetOrdersParams {
	pageIndex?: number;
	pageSize?: number;
	searchTerm?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	statusFilter?: StatusType | "all";
}

export const getOrders = async ({
	pageIndex = 0,
	pageSize = 10,
	searchTerm = "",
	statusFilter = "all",
	sortBy = "created_at",
	sortOrder = "desc",
}: GetOrdersParams = {}) => {
	const supabase = await createClient();

	const from = pageIndex * pageSize;
	const to = from + pageSize - 1;

	// Base query joining orders with their products count, filtering out soft-deleted ones
	let query = supabase
		.from("orders")
		.select(
			`
			*,
			order_product(count)
		`,
			{ count: "exact" }
		)
		.is("deleted_at", null); // Filter soft deleted

	// Apply search filter (name or note)
	if (searchTerm) {
		query = query.or(
			`name.ilike.%${searchTerm}%,note.ilike.%${searchTerm}%`
		);
	}

	// Apply status filter
	if (statusFilter !== "all") {
		query = query.eq("status", statusFilter);
	}

	// Apply sorting
	if (sortBy) {
		query = query.order(sortBy, { ascending: sortOrder === "asc" });
	} else {
		query = query.order("created_at", { ascending: false });
	}

	// Apply pagination
	query = query.range(from, to);

	const { data, error, count } = await query;

	if (error) {
		console.error("Error fetching orders:", error);
		throw new Error("Could not fetch orders");
	}

	return {
		data: data.map((order) => ({
			...order,
			item_count: order.order_product?.[0]?.count || 0,
		})),
		pageCount: Math.ceil((count ?? 0) / pageSize),
	};
};

export const getOrderDetails = async (orderId: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("orders")
		.select(`
			*,
			order_product(
				amount,
				products(
					id,
					name,
					model,
					serial_number,
					attachment,
					available_stock,
					total_stock,
					categories(name)
				)
			)
		`)
		.eq("id", orderId)
		.single();

	if (error) {
		throw new Error(error.message);
	}
	return data;
};

/**
 * Updates the order status and ensures database persistence
 */
export const updateOrderStatus = async (
	id: number | string,
	status: StatusType
) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("orders")
		.update({
			status,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select();

	if (error) {
		console.error("DB Update Error:", error.message);
		throw new Error(`Update failed: ${error.message}`);
	}

	revalidatePath("/dashboard");
	revalidatePath("/products");
	revalidatePath(`/orders/${id}`);

	return { success: true, newStatus: data[0].status };
};

/**
 * Soft delete an order by setting deleted_at
 */
export const deleteOrder = async (id: number | string) => {
	const supabase = await createClient();

	const { error } = await supabase
		.from("orders")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", id);

	if (error) {
		console.error("Delete Error:", error.message);
		throw new Error(`Delete failed: ${error.message}`);
	}

	revalidatePath("/dashboard");
};
