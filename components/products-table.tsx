"use client"

// Importing necessary libraries and components
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createClient } from "@supabase/supabase-js"
import type { Product } from "@/types/database"

// Schema for form validation using Zod
const productSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }), // Product name must not be empty
  total_stock: z.coerce.number().int().positive({ message: "Total stock must be a positive number" }), // Total stock must be a positive integer
})

// Type inference for form values
type ProductFormValues = z.infer<typeof productSchema>

export default function ProductsTable() {
  // State variables
  const [products, setProducts] = useState<Product[]>([]) // Stores the list of products
  const [isLoading, setIsLoading] = useState(true) // Loading state for fetching products
  const [isDialogOpen, setIsDialogOpen] = useState(false) // State to control the dialog visibility
  const [searchTerm, setSearchTerm] = useState("") // Search term for filtering products
  const [isSubmitting, setIsSubmitting] = useState(false) // State for form submission

  // Initialize Supabase client
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // React Hook Form setup with Zod validation
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      total_stock: 1,
    },
  })

  // Function to fetch products and calculate available stock
  const fetchProducts = async () => {
    try {
      setIsLoading(true)

      // Fetch all products from the "products" table
      const { data: productsData, error: productsError } = await supabase.from("products").select("*").order("id")

      if (productsError) {
        console.error("Error fetching products:", productsError)
        return
      }

      // Fetch active borrowings to calculate available stock
      const { data: borrowingsData, error: borrowingsError } = await supabase
        .from("forms")
        .select("product_id, total")
        .in("status", ["borrowed", "pending"]) // Only count items that are not returned

      if (borrowingsError) {
        console.error("Error fetching borrowings:", borrowingsError)
        return
      }

      // Calculate available stock for each product
      const productsWithAvailableStock = productsData.map((product) => {
        const productBorrowings = borrowingsData.filter((b) => b.product_id === product.id) // Filter borrowings for the product
        const totalBorrowed = productBorrowings.reduce((sum, borrowing) => sum + borrowing.total, 0) // Sum up borrowed items
        const availableStock = Math.max(0, product.total_stock - totalBorrowed) // Calculate available stock

        return {
          ...product,
          available_stock: availableStock,
        }
      })

      setProducts(productsWithAvailableStock || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Filter products based on the search term
  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Handle form submission to add a new product
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true)

    try {
      // Insert new product into the "products" table
      const { error } = await supabase.from("products").insert([data])

      if (error) {
        console.error("Error adding product:", error)
        alert("Error adding product. Please try again.")
        return
      }

      // Reset form, close dialog, and refresh product list
      form.reset()
      setIsDialogOpen(false)
      fetchProducts()
      alert("Product added successfully!")
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Error adding product. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex bg-transparent w-screen justify-center">
      {/* Sidebar */}

      {/* Main content area */}
      <Card className="w-full m:8 sm:m-6 lg:m-8 max-w-7xl rounded-none sm:rounded-md ">
        <CardHeader className="flex flex-row items-center justify-between sm">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Seluruh data produk inventaris Tkj</CardDescription>
          </div>
          <Button size={"sm"} onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search input */}
          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Products Table */}
          <div className="border rounded-md ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Available Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell>{products.findIndex((p) => p.id === product.id) + 1}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.total_stock}</TableCell>
                      <TableCell>
                        <span className={product.available_stock === 0 ? " text-primary font-medium" : ""}>
                          {product.available_stock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding a new product */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the details to add a new product to your inventory.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Product Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Stock Field */}
              <FormField
                control={form.control}
                name="total_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter total stock amount"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 1 : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Apply"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
