export type Product = {
  id: number
  name: string
  total_stock: number
  available_stock?: number // Stok yang tersedia setelah dikurangi peminjaman
}

export type BorrowingDisplay = {
  id: number
  product: string
  model: string
  serial_number: string
  borrower: string
  class: string
  borrowDate: Date
  returnDate: Date | null
  status: string
  comment: string | null
}

export type User = {
  id: string
  email: string
  created_at: string
}
