"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const borrowingSchema = z.object({
	name: z.string().min(1, "Name is required"),
	class: z.string().min(1, "Class is required"),
	note: z.string().optional(),
	borrow_date: z.date().default(new Date()),
	products: z
		.array(
			z.object({
				product_id: z.number(),
				amount: z.number().positive(),
			})
		)
		.min(1, "At least one product is required"),
});

type BorrowingValues = z.infer<typeof borrowingSchema>;

/**
 * Creates a new order and its associated products in a single transaction-like flow
 */
export async function createOrderRequest(data: BorrowingValues) {
	const supabase = await createClient();
	const validatedData = borrowingSchema.parse(data);

	// 1. Create the Order (Main administrative data)
	const { data: order, error: orderError } = await supabase
		.from("orders")
		.insert([
			{
				name: validatedData.name,
				class: validatedData.class,
				note: validatedData.note,
				borrow_date: validatedData.borrow_date,
				status: "pending", // Default status for new orders
			},
		])
		.select("id")
		.single();

	if (orderError) {
		console.error("Order Insert Error:", orderError.message);
		throw new Error("Failed to create order.");
	}

	// 2. Insert all selected products into order_product table
	const productsToInsert = data.products.map((p) => ({
		order_id: order.id,
		product_id: p.product_id,
		amount: p.amount,
	}));

	const { error: productError } = await supabase
		.from("order_product")
		.insert(productsToInsert);

	if (productError) {
		console.error("Order Products Insert Error:", productError.message);
		// Note: In a real production app, you might want to rollback the order insert if this fails
		throw new Error("Failed to add products to the order.");
	}

	revalidatePath("/dashboard");
	revalidatePath("/products");

	// Return the order ID so the frontend can redirect to the tracking page
	return { success: true, orderId: order.id };
}
