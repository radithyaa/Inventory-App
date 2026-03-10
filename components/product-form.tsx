"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	Minus,
	Package,
	Plus,
	Search,
	ShoppingCart,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createOrderRequest } from "@/app/forms/actions";
import { getProducts } from "@/app/products/queries";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "./ui/card";

// --- VALIDATION SCHEMA ---
const orderSchema = z.object({
	name: z.string().min(2, "Name is required"),
	class: z.string().min(1, "Class is required"),
	note: z.string().optional(),
	borrow_date: z.date().default(new Date()),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface CartItem {
	amount: number;
	available_stock: number;
	category?: string;
	id: number;
	image?: string;
	name: string;
}

export default function InventoryBorrowingForm() {
	const router = useRouter();
	const [cart, setCart] = useState<CartItem[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);

	// --- DATA FETCHING ---
	const { data: productsData, isLoading } = useQuery({
		queryKey: ["allProductsForBorrowing"],
		queryFn: () => getProducts({ pageSize: 1000 }),
	});

	// --- FILTER LOGIC ---
	const filteredProducts = useMemo(() => {
		if (!productsData?.data) {
			return [];
		}
		const term = searchTerm.toLowerCase();
		return productsData.data
			.filter(
				(p) =>
					p.name.toLowerCase().includes(term) ||
					(p.model?.toLowerCase() || "").includes(term) ||
					(p.serial_number?.toLowerCase() || "").includes(term) ||
					(p.category_name?.toLowerCase() || "").includes(term)
			)
			.filter((p) => Number(p.available_stock) > 0);
	}, [productsData, searchTerm]);

	// --- CART ACTIONS ---
	const addToCart = (product: any) => {
		setCart((prev) => {
			const existing = prev.find((item) => item.id === product.id);
			if (existing) {
				if (existing.amount >= Number(product.available_stock)) {
					toast.error("Stok tidak mencukupi");
					return prev;
				}
				return prev.map((item) =>
					item.id === product.id ? { ...item, amount: item.amount + 1 } : item
				);
			}
			return [
				...prev,
				{
					id: product.id,
					name: product.name,
					amount: 1,
					available_stock: Number(product.available_stock),
					image: product.attachment,
					category: product.category_name,
				},
			];
		});
	};

	const updateQuantity = (id: number, delta: number) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const newAmount = Math.max(1, item.amount + delta);
					if (newAmount > item.available_stock) {
						toast.error("Melebihi stok tersedia");
						return item;
					}
					return { ...item, amount: newAmount };
				}
				return item;
			})
		);
	};

	const removeFromCart = (id: number) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	const totalItemsCount = cart.reduce((sum, item) => sum + item.amount, 0);

	// --- SUBMISSION LOGIC ---
	const form = useForm<OrderFormValues>({
		resolver: zodResolver(orderSchema),
		defaultValues: { name: "", class: "", note: "", borrow_date: new Date() },
	});

	const { mutate: submitOrder, isPending: isSubmitting } = useMutation({
		mutationFn: (values: OrderFormValues) =>
			createOrderRequest({
				...values,
				products: cart.map((item) => ({
					product_id: item.id,
					amount: item.amount,
				})),
			}),
		onSuccess: (res) => {
			if (res.success && res.orderId) {
				router.push(`/orders/${res.orderId}`);
			}
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const onSubmit = (values: OrderFormValues) => {
		if (cart.length === 0) {
			return toast.error("Keranjang Anda kosong!");
		}
		submitOrder(values);
	};

	return (
		<>
			{/* ── MAIN PAGE ── */}
			<Card className="mt-8 min-h-screen bg-background">
				{/* Header */}
				<div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
					<div className="mx-auto flex max-w-7xl items-center justify-between pb-4 sm:px-6 lg:px-8">
						<div className="">
							<h1 className="font-semibold text-foreground text-xl tracking-tight">
								Inventaris
							</h1>
							<p className="w-full text-muted-foreground text-sm">
								Pilih barang yang dibutuhkan
							</p>
						</div>
						{cart.length > 0 && (
							<Button
								className="relative flex items-center gap-2 rounded-sm bg-primary py-2 font-semibold text-primary-foreground text-sm shadow-lg transition-all hover:opacity-90"
								onClick={() => setDialogOpen(true)}
							>
								<ShoppingCart size={16} />
								Pinjam Sekarang
								<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive font-semibold text-[11px] text-destructive-foreground">
									{cart.length}
								</span>
							</Button>
						)}
					</div>
				</div>

				<div className="mx-auto -mt-2 max-w-7xl px-4 sm:px-6">
					{/* Search */}
					<div className="relative mb-8">
						<Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="h-12 pl-11 focus-visible:ring-2 focus-visible:ring-ring"
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Cari nama, model, kategori, atau no seri..."
							value={searchTerm}
						/>
					</div>

					{/* Product Grid */}
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{isLoading ? (
							Array.from({ length: 10 }).map((_, i) => (
								<div className="space-y-3" key={i}>
									<Skeleton className="aspect-[4/3] w-full rounded-2xl" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-8 w-full rounded-xl" />
								</div>
							))
						) : filteredProducts.length === 0 ? (
							<div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed py-24">
								<Package className="text-muted-foreground/30" size={48} />
								<p className="font-medium text-muted-foreground">
									Produk tidak ditemukan
								</p>
							</div>
						) : (
							filteredProducts.map((product) => {
								const rawName =
									`${product.category_name || ""} ${product.name || ""} ${product.model || ""} `.trim();
								const productName = rawName
									? rawName.charAt(0).toUpperCase() + rawName.slice(1)
									: "-";

								const inCart = cart.find((c) => c.id === product.id);

								return (
									<div
										className="group relative cursor-pointer"
										key={product.id}
										onClick={() => addToCart(product)}
									>
										<div
											className={`relative overflow-hidden rounded-2xl bg-card shadow-sm ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
												inCart ? "ring-primary" : "ring-border"
											}`}
										>
											{/* Image */}
											<div className="relative aspect-[4/3] overflow-hidden bg-muted">
												<Image
													alt={product.name}
													className="h-full w-full object-contain"
													height={300}
													src={product.attachment}
													width={300}
												/>
												{/* Gradient overlay */}
												<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

												{/* Stock badge */}
												<div className="absolute top-2.5 left-2.5">
													<span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 font-semibold text-[11px] text-foreground shadow-sm backdrop-blur-sm">
														<span
															className={`h-1.5 w-1.5 rounded-full ${
																Number(product.available_stock) > 5
																	? "bg-primary"
																	: "bg-destructive"
															}`}
														/>
														{product.available_stock} stok
													</span>
												</div>

												{/* In-cart indicator */}
												{inCart && (
													<div className="absolute top-2.5 right-2.5">
														<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-semibold text-[11px] text-primary-foreground shadow">
															{inCart.amount}
														</span>
													</div>
												)}
											</div>

											{/* Info */}
											<div className="p-3">
												<p className="mb-3 line-clamp-2 min-h-[2.5rem] font-semibold text-[13px] text-card-foreground leading-snug">
													{productName}
												</p>

												{inCart ? (
													/* Inline quantity control */
													<div
														className="flex items-center justify-between rounded-xl bg-primary px-1 py-1"
														onClick={(e) => e.stopPropagation()}
													>
														<button
															className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground transition hover:bg-primary-foreground/30 active:scale-90"
															onClick={() => {
																if (inCart.amount === 1) {
																	removeFromCart(product.id);
																} else {
																	updateQuantity(product.id, -1);
																}
															}}
															type="button"
														>
															<Minus size={13} />
														</button>

														<span className="flex flex-col items-center leading-none">
															<span className="font-semibold text-primary-foreground text-sm">
																{inCart.amount}
															</span>
															<span className="text-[10px] text-primary-foreground/70">
																/ {inCart.available_stock} stok
															</span>
														</span>

														<button
															className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground transition hover:bg-primary-foreground/30 active:scale-90"
															onClick={() => updateQuantity(product.id, 1)}
															type="button"
														>
															<Plus size={13} />
														</button>
													</div>
												) : (
													<button className="flex w-full transition-allactive:scale-95 items-center justify-center gap-1.5 rounded-xl bg-muted py-2.5 font-semibold text-[13px] text-muted-foreground">
														<Plus size={14} />
														Tambah
													</button>
												)}
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</Card>

			{/* Floating Cart Bar (mobile) */}
			{cart.length > 0 && (
				<div className="fixed right-0 bottom-0 left-0 z-40 border-t bg-background/95 p-4 backdrop-blur-md md:hidden">
					<button
						className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-xl"
						onClick={() => setDialogOpen(true)}
					>
						<span className="flex items-center gap-2 font-semibold">
							<ShoppingCart size={18} />
							{cart.length} jenis barang
						</span>
						<span className="flex items-center gap-1 font-semibold">
							Pinjam <ArrowRight size={16} />
						</span>
					</button>
				</div>
			)}

			{/* ── DIALOG FORM ── */}
			<Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
				<DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-3xl p-0">
					{/* Dialog Header */}
					<div className="border-b px-6 pt-6 pb-5">
						<DialogHeader>
							<DialogTitle className="font-semibold text-foreground text-xl">
								Form Peminjaman
							</DialogTitle>
							<DialogDescription className="text-muted-foreground">
								Lengkapi data diri untuk melanjutkan peminjaman
							</DialogDescription>
						</DialogHeader>
					</div>

					{/* Scrollable body */}
					<div className="flex-1 overflow-y-auto">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)}>
								<div className="space-y-5 px-6 py-5">
									{/* Nama */}
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													Nama Lengkap
												</FormLabel>
												<FormControl>
													<Input
														className="h-11 rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
														placeholder="Ketik nama lengkap..."
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Kelas */}
									<FormField
										control={form.control}
										name="class"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													Kelas
												</FormLabel>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger className="h-11 rounded-xl focus:ring-2 focus:ring-ring">
															<SelectValue placeholder="Pilih kelas Anda" />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="rounded-xl">
														{[
															"X TKJ 1",
															"X TKJ 2",
															"XI TKJ 1",
															"XI TKJ 2",
															"XII TKJ 1",
															"XII TKJ 2",
														].map((c) => (
															<SelectItem key={c} value={c}>
																{c}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Catatan */}
									<FormField
										control={form.control}
										name="note"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													Catatan / Keperluan
												</FormLabel>
												<FormControl>
													<Textarea
														className="min-h-[90px] resize-none rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
														placeholder="Contoh: Untuk praktik jaringan di Lab 1"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Ringkasan Pinjaman */}
								<div className="mx-6 mb-5 rounded-2xl bg-muted/50 p-4 ring-1 ring-border">
									<Label className="mb-3 block font-semibold text-muted-foreground text-xs uppercase tracking-wide">
										Ringkasan Pinjaman
									</Label>
									<div className="max-h-36 space-y-2 overflow-y-auto">
										{cart.map((item) => (
											<div
												className="flex items-center justify-between gap-3"
												key={item.id}
											>
												<div className="flex min-w-0 items-center gap-2.5">
													<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-[11px] text-primary-foreground">
														{item.amount}
													</span>
													<span className="truncate font-medium text-[13px] text-foreground">
														{item.name}
													</span>
												</div>
												<div className="flex shrink-0 items-center gap-1.5">
													<button
														className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted"
														onClick={() => updateQuantity(item.id, -1)}
														type="button"
													>
														<Minus size={11} />
													</button>
													<button
														className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted"
														onClick={() => updateQuantity(item.id, 1)}
														type="button"
													>
														<Plus size={11} />
													</button>
													<button
														className="flex h-6 w-6 items-center justify-center rounded-md text-destructive transition hover:bg-destructive/10"
														onClick={() => removeFromCart(item.id)}
														type="button"
													>
														<Trash2 size={11} />
													</button>
												</div>
											</div>
										))}
									</div>
									<Separator className="my-3" />
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground text-sm">Total</span>
										<span className="text-foreground text-sm">
											{totalItemsCount} unit
										</span>
									</div>
								</div>

								{/* Submit */}
								<div className="border-t bg-background px-6 py-4">
									<Button
										className="h-12 w-full rounded-md font-semibold shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
										disabled={isSubmitting}
										type="submit"
									>
										{isSubmitting ? (
											<span className="flex items-center gap-2">
												<span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
												Memproses...
											</span>
										) : (
											"Kirim Permintaan Pinjaman"
										)}
									</Button>
								</div>
							</form>
						</Form>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
