"use client";

import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Package,
	User,
	XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";

// ─── INTERFACES ──────────────────────────────────────────────────────────────
interface Order {
	borrow_date: string;
	class: string;
	id: string | number;
	name: string;
	note?: string;
	status: string;
}

interface OrderProductItem {
	amount: number;
	products: {
		id: number;
		name: string;
		model?: string | null;
		attachment?: string | null;
		categories: {
			name: string;
		} | null;
	} | null;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
	string,
	{
		icon: React.ReactNode;
		label: string;
		description: string;
		badgeClass: string;
		accentClass: string;
		glowClass: string;
		pulse: boolean;
	}
> = {
	pending: {
		icon: <Clock className="size-8" />,
		label: "Menunggu Persetujuan",
		description:
			"Admin sedang meninjau daftar pinjaman Anda. Mohon tunggu sebentar.",
		badgeClass: "bg-amber-500/10 text-amber-600 border-amber-300",
		accentClass: "bg-amber-500",
		glowClass: "shadow-amber-100",
		pulse: true,
	},
	approved: {
		icon: <CheckCircle2 className="size-8" />,
		label: "Permintaan Disetujui!",
		description:
			"Silakan ambil barang Anda di ruang alat. Tunjukkan halaman ini kepada petugas.",
		badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-300",
		accentClass: "bg-emerald-500",
		glowClass: "shadow-emerald-100",
		pulse: false,
	},
	rejected: {
		icon: <XCircle className="size-8" />,
		label: "Permintaan Ditolak",
		description:
			"Maaf, permintaan Anda tidak dapat diproses. Silakan hubungi admin.",
		badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
		accentClass: "bg-destructive",
		glowClass: "shadow-red-100",
		pulse: false,
	},
	borrowed: {
		icon: <Package className="size-8" />,
		label: "Sedang Dipinjam",
		description: "Barang sedang dalam peminjaman Anda. Jaga dengan baik ya!",
		badgeClass: "bg-primary/10 text-primary border-primary/30",
		accentClass: "bg-primary",
		glowClass: "shadow-primary/10",
		pulse: false,
	},
	returned: {
		icon: <CheckCircle2 className="size-8" />,
		label: "Sudah Dikembalikan",
		description: "Semua barang telah dikembalikan dengan baik. Terima kasih!",
		badgeClass: "bg-muted text-muted-foreground border-border",
		accentClass: "bg-muted-foreground",
		glowClass: "shadow-muted",
		pulse: false,
	},
};

// ─── PROGRESS STEPS ──────────────────────────────────────────────────────────
const STEPS = ["pending", "borrowed", "returned"];

function StatusProgress({ status }: { status: string }) {
	const currentIdx = STEPS.indexOf(status);
	const isRejected = status === "rejected";

	return (
		<div className="w-full px-2">
			<div className="relative flex items-center justify-between">
				{/* connecting line */}
				<div className="absolute top-4 right-4 left-4 h-0.5 bg-border" />
				<div
					className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
					style={{
						width: isRejected
							? "0%"
							: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 100) - 4}%`,
					}}
				/>

				{STEPS.map((step, idx) => {
					const done = !isRejected && idx <= currentIdx;
					const active = !isRejected && idx === currentIdx;
					const labels: Record<string, string> = {
						pending: "Menunggu",
						borrowed: "Dipinjam",
						returned: "Dikembalikan",
					};

					return (
						<div
							className="relative z-10 flex flex-col items-center gap-2"
							key={step}
						>
							<div
								className={`flex size-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
									done
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-background text-muted-foreground"
								} ${active ? "ring-4 ring-primary/20" : ""}`}
							>
								{done && idx < currentIdx ? (
									<CheckCircle2 className="size-4" />
								) : (
									<span className="font-bold text-xs">{idx + 1}</span>
								)}
							</div>
							<span
								className={`font-semibold text-[10px] uppercase tracking-wide ${
									done ? "text-primary" : "text-muted-foreground"
								}`}
							>
								{labels[step]}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
				<Skeleton className="h-9 w-48 rounded-xl" />
				<Skeleton className="h-52 w-full rounded-3xl" />
				<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
					<Skeleton className="h-48 rounded-2xl" />
					<Skeleton className="col-span-2 h-48 rounded-2xl" />
				</div>
			</div>
		</div>
	);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function OrderTrackingPage() {
	const params = useParams();
	const id = params.id as string;
	const router = useRouter();
	const supabase = createClient();
	const [order, setOrder] = useState<Order | null>(null);
	const [products, setProducts] = useState<OrderProductItem[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchOrderDetails = useCallback(async () => {
		const { data: orderData, error: orderError } = await supabase
			.from("orders")
			.select("*")
			.eq("id", id)
			.is("deleted_at", null)
			.single();

		if (orderError) {
			toast.error("Order not found");
			router.push("/forms");
			return;
		}

		const { data: productData, error: productError } = await supabase
			.from("order_product")
			.select(`
        amount,
        products (
          id,
          name,
          model,
          attachment,
          categories (name)
        )
      `)
			.eq("order_id", id)
			.is("deleted_at", null);

		if (productError) {
			console.error(productError);
		}

		setOrder(orderData as unknown as Order);
		setProducts((productData as unknown as OrderProductItem[]) || []);
		setLoading(false);
	}, [id, router, supabase]);

	useEffect(() => {
		fetchOrderDetails();

		const channel = supabase
			.channel(`order_tracking_${id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "orders",
					filter: `id=eq.${id}`,
				},
				(payload) => {
					const newStatus = payload.new.status;
					setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));

					if (newStatus === "rejected") {
						toast.error("Maaf, pesanan Anda DITOLAK.", {
							duration: 5000,
							icon: <XCircle className="text-destructive" />,
						});
					} else if (newStatus === "borrowed") {
						toast.info("Status: Barang sedang Anda pinjam.");
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [id, fetchOrderDetails, supabase]);

	if (loading || !order) {
		return <LoadingSkeleton />;
	}

	const cfg = STATUS_CONFIG[order.status] ?? {
		icon: <AlertTriangle className="size-8" />,
		label: order.status,
		description: "Status tidak diketahui.",
		badgeClass: "bg-muted text-muted-foreground border-border",
		accentClass: "bg-muted-foreground",
		glowClass: "",
		pulse: false,
	};

	const totalItems = products.reduce((acc, curr) => acc + curr.amount, 0);

	return (
		<div className="min-h-screen w-full bg-muted/20">
			<div className="fade-in slide-in-from-bottom-4 mx-auto max-w-7xl animate-in space-y-5 p-4 duration-500 md:p-8">
				{/* ── TOP NAV ── */}
				<div className="flex items-center justify-between">
					<Button onClick={() => router.push("/forms")} variant="outline">
						<ArrowLeft className="size-4" />
						Buat Permintaan Baru
					</Button>
				</div>

				{/* ── STATUS HERO CARD ── */}
				<Card className={`overflow-hidden border-0 shadow-xl ${cfg.glowClass}`}>
					<CardContent className="flex flex-col items-center gap-6 px-6 py-8 text-center md:px-12 md:py-6">
						{/* Icon */}
						<div
							className={`flex size-20 items-center justify-center rounded-2xl ${cfg.badgeClass} border`}
						>
							<div className={cfg.pulse ? "animate-pulse" : ""}>{cfg.icon}</div>
						</div>

						{/* Text */}
						<div className="space-y-2">
							<h1 className="font-bold text-2xl text-foreground tracking-tight md:text-3xl">
								{cfg.label}
							</h1>
							<p className="mx-auto max-w-sm text-muted-foreground text-sm leading-relaxed">
								{cfg.description}
							</p>
						</div>

						{/* Badge */}
						<Badge
							className={`rounded-full px-4 py-1 font-semibold text-xs uppercase tracking-widest ${cfg.badgeClass}`}
							variant="outline"
						>
							{order.status}
						</Badge>

						{/* Progress stepper */}
						{order.status !== "rejected" && (
							<div className="w-full pt-2">
								<StatusProgress status={order.status} />
							</div>
						)}
					</CardContent>
				</Card>

				{/* ── INFO + ITEMS GRID ── */}
				<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
					{/* BORROWER INFO */}
					<Card className="overflow-hidden border shadow-sm md:col-span-1">
						<CardHeader className="border-b bg-muted/30 px-5 py-4">
							<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
								Data Peminjam
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 p-5">
							<InfoRow
								icon={<User size={15} />}
								label="Nama Lengkap"
								value={order.name}
							/>
							<InfoRow
								icon={<Package size={15} />}
								label="Kelas"
								value={order.class}
							/>
							<InfoRow
								icon={<Calendar size={15} />}
								label="Tanggal Pinjam"
								value={new Date(order.borrow_date).toLocaleDateString("id-ID", {
									dateStyle: "long",
								})}
							/>
							{order.note && (
								<>
									<Separator />
									<div className="flex items-start gap-3">
										<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
											<FileText size={13} />
										</div>
										<div>
											<p className="mb-1 font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">
												Catatan
											</p>
											<p className="text-foreground text-xs italic leading-relaxed">
												&quot;{order.note}&quot;
											</p>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* ITEM LIST */}
					<Card className="overflow-hidden border shadow-sm md:col-span-2">
						<CardHeader className="border-b bg-muted/30 px-5 py-4">
							<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
								Daftar Barang
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5">
							<div className="space-y-3">
								{products.map((item) => (
									<div
										className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-muted/30"
										key={item.products?.id ?? Math.random()}
									>
										<div className="flex min-w-0 items-center gap-3">
											{/* Thumbnail */}
											<div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
												{item.products?.attachment ? (
													<img
														alt={item.products.name}
														className="h-full w-full object-cover"
														src={item.products.attachment}
													/>
												) : (
													<Package className="size-5 text-muted-foreground/40" />
												)}
											</div>
											{/* Name + category */}
											<div className="min-w-0">
												<p className="truncate font-semibold text-foreground text-sm">
													{item.products?.name}
												</p>
												<p className="text-[11px] text-muted-foreground uppercase tracking-wide">
													{item.products?.categories?.name}
													{item.products?.model
														? ` • ${item.products.model}`
														: ""}
												</p>
											</div>
										</div>

										{/* Amount badge */}
										<div className="shrink-0">
											<span className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-xl bg-primary/10 px-2.5 font-bold text-primary text-sm">
												{item.amount}x
											</span>
										</div>
									</div>
								))}
							</div>

							<Separator className="my-4" />

							<div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
								<span className="font-medium text-muted-foreground text-sm">
									Total Barang Dipinjam
								</span>
								<span className="rounded-xl bg-primary px-3 py-1 font-bold text-primary-foreground text-sm">
									{totalItems} unit
								</span>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ── FOOTER ── */}
				<p className="text-center text-muted-foreground text-xs">
					ID Pesanan:{" "}
					<span className="font-mono font-semibold">
						#{String(id).slice(-8).toUpperCase()}
					</span>
					{" · "}Jangan tutup halaman ini agar pembaruan status tetap berjalan.
				</p>
			</div>
		</div>
	);
}

// ─── HELPER COMPONENT ─────────────────────────────────────────────────────────
function InfoRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				{icon}
			</div>
			<div className="min-w-0">
				<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">
					{label}
				</p>
				<p className="truncate font-semibold text-foreground text-sm">
					{value}
				</p>
			</div>
		</div>
	);
}
