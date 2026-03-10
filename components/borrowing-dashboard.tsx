"use client";

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
	Calendar,
	CheckCircle2,
	Package,
	RefreshCcw,
	Search,
	Trash,
	User,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	deleteOrder,
	getOrderDetails,
	getOrders,
	type StatusType,
	updateOrderStatus,
} from "@/app/dashboard/queries";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { createClient } from "@/utils/supabase/client";
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
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./ui/pagination";
import { Skeleton } from "./ui/skeleton";

// --- TYPES ---
interface OrderSummary {
	borrow_date: string;
	class: string;
	id: string | number;
	item_count: number;
	name: string;
	status: string;
}

interface OrderDetail {
	borrow_date: string;
	class: string;
	id: string | number;
	name: string;
	note?: string | null;
	order_product?: Array<{
		amount: number;
		products: {
			name: string;
			attachment?: string | null;
			available_stock: number;
			total_stock: number;
			model?: string | null;
			categories: { name: string } | null;
		} | null;
	}>;
	status: string;
}

export default function BorrowingDashboard() {
	const queryClient = useQueryClient();
	const supabase = useMemo(() => createClient(), []);
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	// --- Server-side State Management ---
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "borrow_date", desc: true },
	]);
	const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 15,
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusType | "all">("all");
	const debouncedSearchTerm = useDebounce(searchTerm, 500);

	const pagination = useMemo(
		() => ({ pageIndex, pageSize }),
		[pageIndex, pageSize]
	);

	// --- REAL-TIME SYNC ---
	useEffect(() => {
		const channel = supabase
			.channel("admin_dashboard_global")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "orders" },
				(payload) => {
					queryClient.invalidateQueries({ queryKey: ["orders"] });

					if (
						selectedOrderId &&
						(payload.new as { id: number }).id === Number(selectedOrderId)
					) {
						queryClient.invalidateQueries({
							queryKey: ["order-detail", selectedOrderId],
						});
					}

					if (payload.eventType === "INSERT") {
						toast("New Order Received!", {
							description: `Order from ${(payload.new as { name: string }).name}`,
							icon: <Package className="text-primary" />,
						});
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, queryClient, selectedOrderId]);

	// --- DATA FETCHING (Orders List) ---
	const { data, isLoading: ordersLoading } = useQuery({
		queryKey: [
			"orders",
			pagination,
			debouncedSearchTerm,
			statusFilter,
			sorting,
		],
		queryFn: () =>
			getOrders({
				pageIndex: pagination.pageIndex,
				pageSize: pagination.pageSize,
				searchTerm: debouncedSearchTerm,
				statusFilter,
				sortBy: sorting[0]?.id,
				sortOrder: sorting[0]?.desc ? "desc" : "asc",
			}),
	});

	// --- DATA FETCHING (Single Order Detail) ---
	const { data: orderDetail, isLoading: detailLoading } = useQuery({
		queryKey: ["order-detail", selectedOrderId],
		queryFn: () => getOrderDetails(selectedOrderId as string),
		enabled: !!selectedOrderId,
	});

	// --- MUTATIONS ---
	const { mutate: handleUpdateStatus, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, status }: { id: string | number; status: StatusType }) =>
			updateOrderStatus(id, status),
		onSuccess: () => {
			toast.success("Order status has been updated.");
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({
				queryKey: ["order-detail", selectedOrderId],
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to update: ${error.message}`);
		},
	});

	const { mutate: handleDeleteOrder, isPending: isDeleting } = useMutation({
		mutationFn: (id: string | number) => deleteOrder(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			toast.success("Order deleted successfully.");
		},
		onError: (error: Error) => {
			toast.error(`Failed to delete: ${error.message}`);
		},
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge
						className="border-yellow-200 bg-yellow-100 text-yellow-700"
						variant="secondary"
					>
						Pending
					</Badge>
				);
			case "approved":
				return (
					<Badge className="border-green-200 bg-green-100 text-green-700">
						Approved
					</Badge>
				);
			case "borrowed":
				return (
					<Badge className="border-blue-200 bg-blue-100 text-blue-700">
						Borrowed
					</Badge>
				);
			case "returned":
				return (
					<Badge className="border-gray-200 bg-gray-100 text-gray-700">
						Returned
					</Badge>
				);
			case "rejected":
				return <Badge variant="destructive">Rejected</Badge>;
			case "overdue":
				return (
					<Badge className="animate-pulse" variant="destructive">
						Overdue
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const columns: ColumnDef<OrderSummary>[] = [
		{
			header: "No",
			enableSorting: false,
			cell: ({ row }) =>
				pagination.pageIndex * pagination.pageSize + row.index + 1,
		},
		{
			accessorKey: "name",
			header: "Borrower",
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{row.original.name}</span>
					<span className="text-[10px] text-muted-foreground uppercase">
						{row.original.class}
					</span>
				</div>
			),
		},
		{
			accessorKey: "item_count",
			header: "Items",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="">{row.original.item_count} items</span>
			),
		},
		{
			accessorKey: "borrow_date",
			header: "Date",
			cell: ({ row }) =>
				format(new Date(row.original.borrow_date), "MMM dd, HH:mm"),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => getStatusBadge(row.original.status),
		},
		{
			id: "actions",
			header: "Actions",
			enableSorting: false,
			cell: ({ row }) => {
				const order = row.original;
				return (
					<div
						className="flex items-center justify-center gap-2"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
						role="presentation"
					>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									className="h-8 w-8 text-destructive hover:bg-destructive/10"
									disabled={isDeleting}
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
										This order will be deleted permanently.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => handleDeleteOrder(order.id)}
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
		data: (data?.data as OrderSummary[]) ?? [],
		columns,
		pageCount: data?.pageCount ?? 0,
		state: { pagination, sorting },
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
	});

	const handleRowClick = useCallback((order: OrderSummary) => {
		setSelectedOrderId(String(order.id));
		setIsDetailOpen(true);
	}, []);

	const detail = orderDetail as unknown as OrderDetail;

	return (
		<div className="flex w-screen justify-center">
			<Card className="m:8 min-h-screen w-full max-w-7xl rounded-none border-none shadow-xl sm:m-6 sm:min-h-full sm:rounded-md lg:m-8">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="font-semibold text-xl">
							Admin Dashboard
						</CardTitle>
						<CardDescription>
							Monitor and manage inventory orders
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<div className="mb-6 flex flex-col gap-4 sm:flex-row">
						<div className="relative flex-1">
							<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								className="h-10 pl-8"
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search borrower or note..."
								type="text"
								value={searchTerm}
							/>
						</div>
						<Select
							onValueChange={(v) => setStatusFilter(v as StatusType | "all")}
							value={statusFilter}
						>
							<SelectTrigger className="h-10 w-full sm:w-[180px]">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Orders</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="approved">Approved</SelectItem>
								<SelectItem value="borrowed">Borrowed</SelectItem>
								<SelectItem value="returned">Returned</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="overflow-hidden rounded-xl border bg-background">
						<Table>
							<TableHeader className="bg-muted">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead className="tracking-wider" key={header.id}>
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{ordersLoading ? (
									Array.from({ length: pageSize }).map((_, i) => (
										<TableRow key={i}>
											{columns.map((_, j) => (
												<TableCell key={j}>
													<Skeleton className="h-6 w-full" />
												</TableCell>
											))}
										</TableRow>
									))
								) : table.getRowModel().rows.length > 0 ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											className="cursor-pointer transition-colors hover:bg-muted/50"
											key={row.id}
											onClick={() => handleRowClick(row.original)}
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
											className="h-40 text-center text-muted-foreground italic"
											colSpan={columns.length}
										>
											No orders found.
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

			{/* Detail Dialog */}
			<Dialog onOpenChange={setIsDetailOpen} open={isDetailOpen}>
				<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-semibold">
							Detail Peminjaman #{selectedOrderId?.slice(-4)}
						</DialogTitle>
					</DialogHeader>

					{detailLoading ? (
						<div className="space-y-4 py-4">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : (
						detail && (
							<div className="space-y-6 py-4">
								{/* Borrower Summary */}
								<div className="grid grid-cols-1 gap-6 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
									<div className="space-y-3">
										<div className="flex items-center gap-2 text-sm">
											<User className="text-muted-foreground" size={16} />
											<span className="font-medium text-sm">{detail.name}</span>
											<Badge className="ml-1 text-[10px]" variant="outline">
												{detail.class}
											</Badge>
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Calendar className="text-muted-foreground" size={16} />
											<span>
												{format(new Date(detail.borrow_date), "PPP p")}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground text-xs">
												Status Saat Ini:
											</span>
											{getStatusBadge(detail.status)}
										</div>
									</div>
									<div className="space-y-2">
										<p className="font-semibold text-[10px] text-muted-foreground uppercase">
											Purpose
										</p>
										<p className="text-sm">{detail.note || "-"}</p>
									</div>
								</div>

								{/* Products Table */}
								<div className="space-y-3">
									<h3 className="font-semibold text-muted-foreground text-xs uppercase">
										Requested Equipment
									</h3>
									<div className="overflow-hidden rounded-lg border">
										<Table>
											<TableHeader className="bg-muted/50">
												<TableRow>
													<TableHead>Item</TableHead>
													<TableHead className="text-center">
														Stock Info
													</TableHead>
													<TableHead className="text-right">Amount</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{detail.order_product?.map((item, idx) => (
													<TableRow key={item.products?.name ?? idx}>
														<TableCell>
															<div className="flex items-center gap-3">
																<div className="size-10 flex-shrink-0 overflow-hidden rounded border bg-muted">
																	{item.products?.attachment ? (
																		<img
																			alt={item.products.name}
																			className="h-full w-full object-cover"
																			src={item.products.attachment}
																		/>
																	) : (
																		<div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
																			<Package size={16} />
																		</div>
																	)}
																</div>
																<div>
																	<p className="font-semibold text-sm">
																		{item.products?.name}
																	</p>
																	<p className="text-[10px] text-muted-foreground uppercase">
																		{item.products?.categories?.name} •{" "}
																		{item.products?.model || "Generic"}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell className="text-center">
															<span
																className={`rounded-full px-2 py-0.5 text-xs ${Number(item.products?.available_stock) < item.amount ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
															>
																{item.products?.available_stock} /{" "}
																{item.products?.total_stock} Avail
															</span>
														</TableCell>
														<TableCell className="text-center text-xs">
															{item.amount}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>

								{/* Admin Status Action */}
								<div className="space-y-2">
									<h3 className="font-semibold text-muted-foreground text-xs uppercase">
										Admin Actions
									</h3>
									<div className="flex flex-wrap gap-2">
										{detail.status === "pending" && (
											<>
												<Button
													disabled={isUpdating}
													onClick={() =>
														handleUpdateStatus({
															id: detail.id,
															status: "borrowed",
														})
													}
													variant={"secondary"}
												>
													<CheckCircle2 className="mr-2 size-4" /> Approve Order
												</Button>
												<Button
													disabled={isUpdating}
													onClick={() =>
														handleUpdateStatus({
															id: detail.id,
															status: "rejected",
														})
													}
													variant="destructive"
												>
													<XCircle className="mr-2 size-4" /> Reject
												</Button>
											</>
										)}

										{detail.status === "borrowed" && (
											<Button
												className="bg-gray-700 text-white hover:bg-gray-800"
												disabled={isUpdating}
												onClick={() =>
													handleUpdateStatus({
														id: detail.id,
														status: "returned",
													})
												}
											>
												<RefreshCcw className="mr-2 size-4" /> Confirm Return
											</Button>
										)}

										{(detail.status === "returned" ||
											detail.status === "rejected") && (
											<Button
												disabled={isUpdating}
												onClick={() =>
													handleUpdateStatus({
														id: detail.id,
														status: "pending",
													})
												}
												size={"sm"}
												variant="outline"
											>
												Reset to Pending
											</Button>
										)}
									</div>
									{isUpdating && (
										<p className="animate-pulse text-[10px] text-primary italic">
											Updating status in database...
										</p>
									)}
								</div>
							</div>
						)
					)}

					<DialogFooter>
						<Button onClick={() => setIsDetailOpen(false)} variant="outline">
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
