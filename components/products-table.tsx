"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	ArrowRight,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	ImageIcon as ImageIconLucide,
	PenLine,
	Plus,
	Search,
	Trash,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	addOrUpdateProduct,
	deleteProduct,
	getCategories,
	getProductActiveBorrowers,
	getProducts,
	updateProduct,
} from "@/app/products/queries";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/types/database";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { CategoryAutocomplete } from "./ui/category-autocomplete";
import { Checkbox } from "./ui/checkbox";
import { ImageUpload } from "./ui/image-upload";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";

// --- TYPES ---
interface Borrower {
	amount: number;
	class: string;
	date: string;
	name: string;
	order_id: number;
	status: string;
}

// Schema for form validation using Zod
const productSchema = z.object({
	name: z.string().min(1, { message: "Product name is required" }),
	category_id: z.coerce.number().nullable().optional(),
	model: z.string().nullable().optional(),
	serial_number: z.string().nullable().optional(),
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

export default function ProductsTable() {
	const queryClient = useQueryClient();
	const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
	const [selectedProductForView, setSelectedProductForView] =
		React.useState<Product | null>(null);

	// --- Server-side State Management ---
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [{ pageIndex, pageSize }, setPagination] =
		React.useState<PaginationState>({
			pageIndex: 0,
			pageSize: 10,
		});
	const [searchTerm, setSearchTerm] = React.useState("");
	const [filterCategory, setFilterCategory] = React.useState("all");
	const [filterStatus, setFilterStatus] = React.useState("all");
	const [filterConsumable, setFilterConsumable] = React.useState("all"); // "all" | "true" | "false"
	const debouncedSearchTerm = useDebounce(searchTerm, 500);

	const pagination = React.useMemo(
		() => ({ pageIndex, pageSize }),
		[pageIndex, pageSize]
	);

	// Fetch Categories for Filter
	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: getCategories,
	});

	// --- DATA FETCHING ---
	const { data, isLoading, isError } = useQuery({
		queryKey: [
			"products",
			pagination.pageIndex,
			pagination.pageSize,
			debouncedSearchTerm,
			sorting,
			filterCategory,
			filterStatus,
			filterConsumable,
		],
		queryFn: () =>
			getProducts({
				pageIndex: pagination.pageIndex,
				pageSize: pagination.pageSize,
				searchTerm: debouncedSearchTerm,
				sortBy: sorting[0]?.id,
				sortOrder: sorting[0]?.desc ? "desc" : "asc",
				categoryId: filterCategory,
				status: filterStatus,
				isConsumable: filterConsumable,
			}),
	});

	const defaultData = React.useMemo(() => [], []);
	const pageCount = data?.pageCount ?? 0;

	// --- MUTATIONS ---
	const addOrUpdateMutation = useMutation({
		mutationFn: addOrUpdateProduct,
		onSuccess: () => {
			toast("Notification", {
				description: "Product processed successfully!",
				icon: <CheckCircle size={20} />,
			});
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (error: Error) => toast.error(`Error: ${error.message}`),
	});

	const editMutation = useMutation({
		mutationFn: (vars: { id: number; data: ProductFormValues }) =>
			updateProduct(vars.id, vars.data),
		onSuccess: () => {
			toast("Notification", {
				description: "Product updated successfully!",
				icon: <CheckCircle size={20} />,
			});
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (error: Error) => toast.error(`Error: ${error.message}`),
	});

	const deleteMutation = useMutation({
		mutationFn: deleteProduct,
		onSuccess: () => {
			toast("Notification", {
				description: "Product deleted successfully!",
				icon: <CheckCircle size={20} />,
			});
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (error: Error) => toast.error(`Error: ${error.message}`),
	});

	const getStatusBadge = (status: string, available: number) => {
		// New Logic: If DB status is NOT 'available', show original status
		if (status !== "available") {
			switch (status) {
				case "maintenance":
					return (
						<Badge className="bg-yellow-500" variant="warning">
							Maintenance
						</Badge>
					);
				case "damaged":
					return <Badge variant="destructive">Damaged</Badge>;
				case "lost":
					return (
						<Badge className="bg-red-700" variant="destructive">
							Lost
						</Badge>
					);
				case "disposed":
					return (
						<Badge className="opacity-70" variant="secondary">
							Disposed
						</Badge>
					);
				default:
					return <Badge variant="outline">{status}</Badge>;
			}
		}

		// If status is 'available', check stock
		if (available === 0) {
			return <Badge variant="secondary">Checked Out</Badge>;
		}

		return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
	};

	const columns: ColumnDef<Product>[] = [
		{
			accessorKey: "id",
			header: "No",
			cell: ({ row }) =>
				pagination.pageIndex * pagination.pageSize + row.index + 1,
		},
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{row.original.name || "-"}</span>
					{row.original.is_consumable && (
						<span className="text-[9px] uppercase">Bahan</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "category_name",
			header: "Category",
			enableSorting: false,
			cell: ({ getValue }) => getValue() || "-",
		},
		{
			accessorKey: "model",
			header: "Model",
			cell: ({ getValue }) => getValue() || "-",
		},
		{
			accessorKey: "total_stock",
			header: "Total",
			cell: ({ getValue }) => {
				const val = getValue();
				return val !== null && val !== undefined ? val : "-";
			},
		},
		{
			accessorKey: "available_stock",
			header: "Available",
			cell: ({ getValue }) => {
				const val = getValue();
				return val !== null && val !== undefined ? val : "-";
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			enableSorting: false,
			cell: ({ row }) => {
				const status = row.original.status;
				const available = Number(row.original.available_stock);
				if (!status && isNaN(available)) {
					return "-";
				}
				return getStatusBadge(status, available);
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const product = row.original;
				return (
					<div
						className="flex items-center justify-center gap-2"
						onClick={(e) => e.stopPropagation()}
					>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="h-8 w-8" size="icon" variant={"outline"}>
									<PenLine size={16} />
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>Edit Product</DialogTitle>
								</DialogHeader>
								<ProductForm
									isSubmitting={editMutation.isPending}
									onSubmit={(data) =>
										editMutation.mutate({ id: product.id, data })
									}
									product={product}
								/>
							</DialogContent>
						</Dialog>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									className="h-8 w-8 text-destructive hover:bg-destructive/10"
									size="icon"
									variant={"outline"}
								>
									<Trash size={16} />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => deleteMutation.mutate(product.id)}
									>
										Continue
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: data?.data ?? defaultData,
		columns,
		pageCount,
		state: { pagination, sorting },
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
	});

	if (isError) {
		return (
			<div className="text-center text-red-500">
				Error fetching products. Please try again later.
			</div>
		);
	}

	return (
		<div className="flex w-screen justify-center bg-transparent">
			<Card className="m:8 min-h-screen w-full max-w-7xl rounded-none border-none sm:m-6 sm:min-h-full sm:rounded-md lg:m-8">
				<CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
					<div>
						<CardTitle className="font-semibold text-xl">
							Inventory Products
						</CardTitle>
						<CardDescription>Manajemen stok dan kondisi barang</CardDescription>
					</div>
					<Button onClick={() => setIsAddDialogOpen(true)} size={"sm"}>
						<Plus className="mr-2 h-4 w-4" /> Add Product
					</Button>
				</CardHeader>
				<CardContent>
					{/* FILTER HEADER */}
					<div className="mb-6 flex flex-wrap gap-3">
						<div className="relative min-w-[200px] flex-1">
							<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
							<Input
								className="pl-8"
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search name, model, serial..."
								type="text"
								value={searchTerm}
							/>
						</div>

						<Select onValueChange={setFilterCategory} value={filterCategory}>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{categories?.map((c) => (
									<SelectItem key={c.id} value={c.id.toString()}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select onValueChange={setFilterStatus} value={filterStatus}>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="available">Available</SelectItem>
								<SelectItem value="maintenance">Maintenance</SelectItem>
								<SelectItem value="damaged">Damaged</SelectItem>
								<SelectItem value="lost">Lost</SelectItem>
								<SelectItem value="disposed">Disposed</SelectItem>
							</SelectContent>
						</Select>

						<Select
							onValueChange={setFilterConsumable}
							value={filterConsumable}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="false">Asset (Alat)</SelectItem>
								<SelectItem value="true">Consumable (Bahan)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="overflow-x-auto rounded-md border">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead
												className={
													header.column.getCanSort() ? "cursor-pointer" : ""
												}
												key={header.id}
												onClick={header.column.getToggleSortingHandler()}
											>
												<div className="flex items-center gap-1">
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
													{{
														asc: <ChevronDown size={14} />,
														desc: <ChevronUp size={14} />,
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{isLoading ? (
									Array.from({ length: pageSize }).map((_, i) => (
										<TableRow key={i}>
											{columns.map((_, j) => (
												<TableCell key={j}>
													<Skeleton className="h-5 w-full" />
												</TableCell>
											))}
										</TableRow>
									))
								) : table.getRowModel().rows.length > 0 ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											className="cursor-pointer hover:bg-muted/50"
											key={row.id}
											onClick={() => setSelectedProductForView(row.original)}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext()
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											className="h-24 text-center"
											colSpan={columns.length}
										>
											No products found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<Pagination className="mt-6">
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									className={
										table.getCanPreviousPage()
											? "cursor-pointer"
											: "pointer-events-none opacity-50"
									}
									onClick={() => table.previousPage()}
								/>
							</PaginationItem>
							{Array.from({ length: table.getPageCount() }).map((_, i) => (
								<PaginationItem key={i}>
									<PaginationLink
										className="cursor-pointer"
										isActive={pagination.pageIndex === i}
										onClick={() => table.setPageIndex(i)}
									>
										{i + 1}
									</PaginationLink>
								</PaginationItem>
							))}
							<PaginationItem>
								<PaginationNext
									className={
										table.getCanNextPage()
											? "cursor-pointer"
											: "pointer-events-none opacity-50"
									}
									onClick={() => table.nextPage()}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</CardContent>
			</Card>

			{/* VIEW DETAIL DIALOG */}
			<Dialog
				onOpenChange={(open) => !open && setSelectedProductForView(null)}
				open={!!selectedProductForView}
			>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Product Details</DialogTitle>
					</DialogHeader>
					{selectedProductForView && (
						<div className="space-y-6">
							<div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
								{selectedProductForView.attachment ? (
									<Image
										alt={selectedProductForView.name}
										className="h-full w-full object-contain"
										height={300}
										src={selectedProductForView.attachment}
										width={300}
									/>
								) : (
									<div className="flex flex-col items-center text-muted-foreground">
										<ImageIconLucide className="mb-2 opacity-20" size={48} />
										<p className="text-xs">No image available</p>
									</div>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="space-y-1">
									<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Product Name
									</p>
									<p className="flex items-center gap-2">
										{selectedProductForView.name}
										{selectedProductForView.is_consumable && (
											<Badge className="h-4 border-orange-200 bg-orange-100 px-1 text-[8px] text-orange-700">
												BAHAN
											</Badge>
										)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Category
									</p>
									<p className="">
										{selectedProductForView.category_name || "-"}
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Model
									</p>
									<p className="">{selectedProductForView.model || "-"}</p>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Serial Number
									</p>
									<p className="">
										{selectedProductForView.serial_number || "-"}
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Stock (Total / Available)
									</p>
									<p className="">
										{selectedProductForView.total_stock} /{" "}
										{selectedProductForView.available_stock}
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Current Status
									</p>
									<div>
										{getStatusBadge(
											selectedProductForView.status,
											Number(selectedProductForView.available_stock)
										)}
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<h3 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
										Active Borrowers
									</h3>
								</div>
								<ActiveBorrowersTable
									productId={Number(selectedProductForView.id)}
								/>
							</div>

							{selectedProductForView.attachment && (
								<div className="border-t pt-4">
									<Button asChild className="w-full text-xs" variant="outline">
										<a
											href={selectedProductForView.attachment}
											rel="noreferrer"
											target="_blank"
										>
											<ExternalLink className="mr-2" size={14} /> View Original
											Attachment
										</a>
									</Button>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* ADD DIALOG */}
			<Dialog onOpenChange={setIsAddDialogOpen} open={isAddDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add New Product</DialogTitle>
					</DialogHeader>
					<ProductForm
						isSubmitting={addOrUpdateMutation.isPending}
						onFinished={() => setIsAddDialogOpen(false)}
						onSubmit={(data) => addOrUpdateMutation.mutate(data)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function ActiveBorrowersTable({ productId }: { productId: number }) {
	const { data: borrowers, isLoading } = useQuery({
		queryKey: ["product-borrowers", productId],
		queryFn: () => getProductActiveBorrowers(productId),
	});

	if (isLoading) {
		return <Skeleton className="h-20 w-full" />;
	}

	const activeOnly =
		(borrowers as unknown as Borrower[])?.filter(
			(b) => b.status === "borrowed" || b.status === "pending"
		) || [];

	if (activeOnly.length === 0) {
		return (
			<div className="rounded-lg border bg-muted/20 py-6 text-center text-muted-foreground text-sm italic">
				No active borrowers for this item.
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border bg-background">
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-9 py-0 text-xs">Name</TableHead>
						<TableHead className="h-9 py-0 text-center text-xs">
							Amount
						</TableHead>
						<TableHead className="h-9 py-0 text-right text-xs">
							Borrow Time
						</TableHead>
						<TableHead className="h-9 py-0 text-right text-xs">
							Action
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activeOnly.map((b, i) => (
						<TableRow className="hover:bg-transparent" key={i}>
							<TableCell className="py-2">
								<div className="flex flex-col">
									<span className="text-xs">{b.name}</span>
									<span className="text-[10px] text-muted-foreground uppercase">
										{b.class}
									</span>
								</div>
							</TableCell>
							<TableCell className="py-2 text-center text-xs">
								{b.amount}
							</TableCell>
							<TableCell className="py-2 text-right font-medium text-[10px] text-muted-foreground">
								{b.date ? format(new Date(b.date), "MMM dd, HH:mm") : "-"}
							</TableCell>
							<TableCell className="py-2 text-right">
								<Button
									asChild
									className="h-7 w-7"
									size="icon"
									variant="outline"
								>
									<Link href={`/orders/${b.order_id}`} target="_blank">
										<ArrowRight size={14} />
									</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function ProductForm({
	onSubmit,
	isSubmitting,
	product,
	onFinished,
}: {
	onSubmit: (data: ProductFormValues) => void;
	isSubmitting: boolean;
	product?: Product;
	onFinished?: () => void;
}) {
	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: getCategories,
	});

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productSchema),
		defaultValues: product
			? {
					name: product.name,
					total_stock: product.total_stock,
					status: product.status as any,
					category_id: product.category_id,
					model: product.model || "",
					serial_number: product.serial_number || "",
					attachment: product.attachment || "",
					is_consumable: product.is_consumable ?? false,
				}
			: {
					name: "",
					total_stock: 1,
					status: "available",
					category_id: undefined,
					model: "",
					serial_number: "",
					attachment: "",
					is_consumable: false,
				},
	});

	const handleSubmit = async (data: ProductFormValues) => {
		await onSubmit(data);
		if (!isSubmitting && onFinished) {
			onFinished();
		}
	};

	return (
		<Form {...form}>
			<form
				className="max-h-[75vh] space-y-4 overflow-y-auto px-1"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Product Name</FormLabel>
							<FormControl>
								<Input placeholder="e.g. Router Mikrotik" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="category_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Category</FormLabel>
								<FormControl>
									<CategoryAutocomplete
										categories={categories || []}
										disabled={isSubmitting}
										onChange={field.onChange}
										value={field.value}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="model"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Model</FormLabel>
								<FormControl>
									<Input placeholder="e.g. RB951Ui-2HnD" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="serial_number"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Serial Number</FormLabel>
								<FormControl>
									<Input placeholder="Unique ID (optional)" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="total_stock"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Total Stock</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter total stock"
										type="number"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="is_consumable"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
							<FormControl>
								<Checkbox
									checked={field.value}
									disabled={isSubmitting}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Barang Habis Pakai</FormLabel>
								<FormDescription>
									Ceklis jika barang ini adalah bahan yang tidak perlu
									dikembalikan (ex. kabel, konektor, dll).
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="attachment"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Product Image (Optional)</FormLabel>
							<FormControl>
								<ImageUpload
									disabled={isSubmitting}
									onChange={field.onChange}
									value={field.value ?? undefined}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Condition Status</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a status" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="available">Available (Good)</SelectItem>
									<SelectItem value="maintenance">Maintenance</SelectItem>
									<SelectItem value="damaged">Damaged</SelectItem>
									<SelectItem value="lost">Lost</SelectItem>
									<SelectItem value="disposed">Disposed</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<DialogFooter className="pt-4">
					<Button className="w-full" disabled={isSubmitting} type="submit">
						{isSubmitting ? "Processing..." : "Save Product Data"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
