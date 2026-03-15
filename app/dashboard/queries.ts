"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type StatusType = "pending" | "approved" | "borrowed" | "returned" | "rejected" | "overdue";

interface GetOrdersParams {
	pageIndex?: number;
	pageSize?: number;
	searchTerm?: string;
	statusFilter?: StatusType | "all";
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export const getOrders = async ({
	pageIndex = 0,
	pageSize = 10,
	searchTerm = "",
	statusFilter = "all",
	sortBy = "borrow_date",
	sortOrder = "desc",
}: GetOrdersParams = {}) => {
	const supabase = await createClient();

	const from = pageIndex * pageSize;
	const to = from + pageSize - 1;

	let query = supabase
		.from("orders")
		.select(`
			*,
			order_product(count)
		`, { count: "exact" })
    .is("deleted_at", null);

	if (searchTerm) {
		query = query.or(`name.ilike.%${searchTerm}%,class.ilike.%${searchTerm}%,note.ilike.%${searchTerm}%`);
	}

	if (statusFilter !== "all") {
		query = query.eq("status", statusFilter);
	}

	if (sortBy) {
		query = query.order(sortBy, { ascending: sortOrder === "asc" });
	} else {
    query = query.order("created_at", { ascending: false });
  }

	query = query.range(from, to);

	const { data, error, count } = await query;

	if (error) {
		console.error("Error fetching orders:", error);
		throw new Error("Could not fetch orders");
	}

	return {
		data: (data || []).map(order => ({
			...order,
			item_count: order.order_product?.[0]?.count || 0
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
					is_consumable,
					categories(name)
				)
			)
		`)
		.eq("id", orderId)
		.single();

	if (error) throw new Error(error.message);
	return data;
};

/**
 * Updates order status and manages consumable stock (Deduct on Borrow, Add back on Reject)
 */
export const updateOrderStatus = async (
	id: number | string,
	status: StatusType,
) => {
	const supabase = await createClient();

  // 1. Get CURRENT order status to know if we need to undo or apply stock changes
  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  const oldStatus = currentOrder?.status;
  let finalStatus = status;

  // 2. Fetch order items
  const { data: orderItems } = await supabase
    .from("order_product")
    .select("amount, products(id, total_stock, is_consumable, status)")
    .eq("order_id", id);

  if (orderItems) {
    const items = orderItems as any[];

    // --- CASE A: MOVING TO 'BORROWED' (Deduct Stock) ---
    // If we are marking as borrowed and it wasn't borrowed/returned before
    if (status === "borrowed" && oldStatus !== "borrowed" && oldStatus !== "returned") {
      let allConsumable = true;

      for (const item of items) {
        if (item.products?.is_consumable) {
          const newTotal = Math.max(0, (item.products.total_stock || 0) - item.amount);
          
          await supabase
            .from("products")
            .update({ 
              total_stock: newTotal,
              // If new total is 0, auto-set product status to 'disposed'
              status: newTotal === 0 ? 'disposed' : item.products.status 
            })
            .eq("id", item.products.id);
        } else {
          allConsumable = false;
        }
      }

      // If everything in order is consumable, finish the order immediately
      if (allConsumable && items.length > 0) {
        finalStatus = "returned";
      }
    }

    // --- CASE B: REJECTING A PREVIOUSLY DEDUCTED ORDER (Add back Stock) ---
    // If we reject/reset an order that was already marked as borrowed or returned
    if ((status === "rejected" || status === "pending") && (oldStatus === "borrowed" || oldStatus === "returned")) {
      for (const item of items) {
        if (item.products?.is_consumable) {
          const newTotal = (item.products.total_stock || 0) + item.amount;
          
          await supabase
            .from("products")
            .update({ 
              total_stock: newTotal,
              // When adding back stock, set product status back to 'available' if it was disposed
              status: item.products.status === 'disposed' ? 'available' : item.products.status
            })
            .eq("id", item.products.id);
        }
      }
    }
  }

	// 3. Update the order table
	const { data, error } = await supabase
		.from("orders")
		.update({ 
			status: finalStatus, 
			updated_at: new Date().toISOString() 
		})
		.eq("id", id)
		.select();

	if (error) throw new Error(`Update failed: ${error.message}`);

	revalidatePath("/dashboard");
  revalidatePath("/products");
	revalidatePath(`/orders/${id}`);
  
  return { success: true, newStatus: data[0].status };
};

export const deleteOrder = async (id: number | string) => {
	const supabase = await createClient();
	const { error } = await supabase
		.from("orders")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", id);

	if (error) throw new Error(error.message);
	revalidatePath("/dashboard");
};
