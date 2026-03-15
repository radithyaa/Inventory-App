"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

// Schema for form validation using Zod
const productSchema = z.object({
	name: z.string().min(1, { message: "Product name is required" }),
	category_id: z.coerce.number().optional().nullable(),
	model: z.string().optional().nullable(),
	serial_number: z.string().optional().nullable(),
	attachment: z
		.string()
		.url({ message: "Must be a valid URL" })
		.optional()
		.or(z.literal(""))
		.nullable(),
	total_stock: z.coerce
		.number()
		.int()
		.nonnegative({ message: "Total stock must be zero or positive" }),
	status: z.enum(["available", "damaged", "lost", "maintenance", "disposed"]),
	is_consumable: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface GetProductsParams {
	categoryId?: string;
	isConsumable?: string; // "all" | "true" | "false"
	pageIndex?: number;
	pageSize?: number;
	searchTerm?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	status?: string;
}

interface OrderProductRelation {
	amount: number;
	orders: {
		status: string;
	} | null;
}

export const getProducts = async ({
	pageIndex = 0,
	pageSize = 10,
	searchTerm = "",
	sortBy = "id",
	sortOrder = "asc",
	categoryId = "all",
	status = "all",
	isConsumable = "all",
}: GetProductsParams = {}) => {
	const supabase = await createClient();

	const from = pageIndex * pageSize;
	const to = from + pageSize - 1;

	// Base query for products - FILTERING BY deleted_at IS NULL
	let productsQuery = supabase
		.from("products")
		.select(
			`
			*,
			categories(name),
			order_product(
				amount,
				orders(status)
			)
		`,
			{ count: "exact" }
		)
		.is("deleted_at", null);

	// Apply search filter (search in name, model, serial_number)
	if (searchTerm) {
		productsQuery = productsQuery.or(
			`name.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`
		);
	}

	// Apply Category Filter
	if (categoryId && categoryId !== "all") {
		productsQuery = productsQuery.eq("category_id", categoryId);
	}

	// Apply Status Filter
	if (status && status !== "all") {
		productsQuery = productsQuery.eq("status", status);
	}

	// Apply Consumable Filter
	if (isConsumable !== "all") {
		productsQuery = productsQuery.eq("is_consumable", isConsumable === "true");
	}

	// Apply sorting
	if (sortBy) {
		productsQuery = productsQuery.order(sortBy, {
			ascending: sortOrder === "desc",
		});
	} else {
		productsQuery = productsQuery.order("created_at", { ascending: false });
	}

	// Apply pagination
	productsQuery = productsQuery.range(from, to);

	const {
		data: productsData,
		error: productsError,
		count,
	} = await productsQuery;

	if (productsError) {
		console.error("Error fetching products:", productsError);
		throw new Error("Could not fetch products");
	}

	// Calculate available stock for each product
	const productsWithAvailableStock = productsData.map((product) => {
		const rawOrderProducts =
			product.order_product as unknown as OrderProductRelation[];

		// Note: we only count orders that are not deleted (logic handled by DB join or here)
		const activeOrders =
			rawOrderProducts?.filter(
				(op) =>
					op.orders?.status === "borrowed" || op.orders?.status === "pending"
			) || [];

		const totalBorrowed = activeOrders.reduce(
			(sum, op) => sum + (Number(op.amount) || 0),
			0
		);

		const available_stock = Math.max(
			0,
			(product.total_stock || 0) - totalBorrowed
		);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { order_product, ...rest } = product;
		return {
			...rest,
			category_name: product.categories?.name,
			available_stock,
		};
	});

	return {
		data: productsWithAvailableStock,
		pageCount: Math.ceil((count ?? 0) / pageSize),
	};
};

export const getCategories = async () => {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("categories")
		.select("*")
		.order("name", { ascending: true });

	if (error) {
		throw new Error(error.message);
	}
	return data;
};

export const createCategory = async (name: string) => {
	const supabase = await createClient();

	const { data: existing } = await supabase
		.from("categories")
		.select("id")
		.ilike("name", name)
		.single();

	if (existing) {
		return existing.id;
	}

	const { data, error } = await supabase
		.from("categories")
		.insert([{ name }])
		.select("id")
		.single();

	if (error) {
		throw new Error(error.message);
	}
	revalidatePath("/products");
	return data.id;
};

/**
 * ALWAYS INSERT a new product row, never update existing by name.
 */
export const addOrUpdateProduct = async (data: ProductFormValues) => {
	const supabase = await createClient();
	const validated = productSchema.parse(data);

	if (validated.category_id === 0) {
		validated.category_id = null;
	}

	// Always insert a new row as requested
	const { data: newProduct, error } = await supabase
		.from("products")
		.insert([validated])
		.select()
		.single();

	if (error) {
		throw new Error(error.message);
	}

	revalidatePath("/products");
	return "added";
};

export const updateProduct = async (id: number, data: ProductFormValues) => {
	const supabase = await createClient();
	const validated = productSchema.parse(data);

	if (validated.category_id === 0) {
		validated.category_id = null;
	}

	const { error } = await supabase
		.from("products")
		.update(validated)
		.eq("id", id);

	if (error) {
		throw new Error(error.message);
	}
	revalidatePath("/products");
};

export const deleteProduct = async (id: number) => {
	const supabase = await createClient();

	const { error } = await supabase
		.from("products")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", id);

	if (error) {
		throw new Error(error.message);
	}
	revalidatePath("/products");
};

interface BorrowerResult {
	amount: number;
	class: string;
	date: string;
	name: string;
	order_id: number;
	status: string;
}

interface DBBorrowerJoin {
	amount: number;
	order_id: number;
	orders: {
		name: string;
		class: string;
		borrow_date: string;
		status: string;
	} | null;
}

export const getProductActiveBorrowers = async (
	productId: number
): Promise<BorrowerResult[]> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("order_product")
		.select(`
			order_id,
			amount,
			orders (
				name,
				class,
				borrow_date,
				status
			)
		`)
		.eq("product_id", productId)
		.is("deleted_at", null)
		.or("status.eq.borrowed,status.eq.pending", { foreignTable: "orders" });

	if (error) {
		throw new Error(error.message);
	}

	const rawData = data as unknown as DBBorrowerJoin[];

	return (rawData || [])
		.filter((item) => item.orders)
		.map((item) => ({
			order_id: Number(item.order_id),
			name: item.orders?.name || "Unknown",
			class: item.orders?.class || "N/A",
			amount: Number(item.amount),
			date: item.orders?.borrow_date || "",
			status: item.orders?.status || "pending",
		}));
};
