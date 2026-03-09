export interface Product {
	available_stock?: number; // Stok yang tersedia setelah dikurangi peminjaman
	forms?: {
		product_id: number;
		total: number;
		status: string;
	}[];
	id: number;
	name: string;
	status:
		| "available"
		| "lost"
		| "checked out"
		| "disposed"
		| "under audit"
		| "in maintenance";
	total_stock: number;
}

export interface BorrowingDisplay {
	borrowDate: Date;
	borrower: string;
	class: string;
	comment: string | null;
	id: number;
	model: string;
	product: string;
	returnDate: Date | null;
	serial_number: string;
	status: string;
}

export interface User {
	created_at: string;
	email: string;
	id: string;
}
