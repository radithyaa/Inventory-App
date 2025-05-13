"use client"

// Importing necessary libraries and components
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PenLine, Plus, Search, Trash, Trash2 } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createClient } from "@supabase/supabase-js"
import type { Product } from "@/types/database"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { set } from "date-fns"

// Schema for form validation using Zod
const productSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }), // Product name must not be empty
  total_stock: z.coerce.number().int().positive({ message: "Total stock must be a positive number" }), // Total stock must be a positive integer
  status: z.enum(["available", "lost", "checked out", "disposed", "under audit", "in maintenance"]), // Status must be one of the specified strings
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
      status: "available"
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

  const handleRemove = async function (id: number){
    const {data, error} = await supabase
    .from('products')
    .delete()
    .eq('id', id)

    if (error) {
      console.error('Error menghapus produk:', error)
      return null
    }
  
    setProducts(products.filter((product) => product.id !== id))

  }

  // Filter products based on the search term
  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Handle form submission to add a new product
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true)

    try {
      // Insert new product into the "products" table
      // Check if a product with the same name already exists
      const { data: existingProduct, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .ilike("name", data.name)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // Handle unexpected errors (ignore "PGRST116" which means no rows found)
        console.error("Error checking existing product:", fetchError)
        alert("Error checking existing product. Please try again.")
        return
      }

      if (existingProduct) {
        // If product exists, update its total stock
        const { error: updateError } = await supabase
          .from("products")
          .update({ total_stock: existingProduct.total_stock + data.total_stock })
          .eq("id", existingProduct.id)

        if (updateError) {
          console.error("Error updating product stock:", updateError)
          alert("Error updating product stock. Please try again.")
          return
        }
      } else {
        // If product does not exist, insert a new product
        const { error: insertError } = await supabase.from("products").insert([data])

        if (insertError) {
          console.error("Error adding product:", insertError)
          alert("Error adding product. Please try again.")
          return
        }
      }

      // Reset form, close dialog, and refresh product list
      form.reset()
      setIsDialogOpen(false)
      fetchProducts()
      toast(
              "Notification", // First argument should be the message
              {
                position: "top-center",
                description: "Data berhasil ditambahkan",
                duration: 2500,
                // action: <Button variant="outline" onClick={() => console.log(borrowings)}>Lihat Detail</Button>, 
                classNames: {
                  actionButton: 'm-96 size-4',
                  toast: 'flex flex-row justify-around',
                }
              }
            );
      // alert("Product added successfully!")
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
      <Card className="w-full min-h-screen sm:min-h-full m:8 sm:m-6 lg:m-8 max-w-7xl rounded-none sm:rounded-md ">
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell>{products.findIndex((p) => p.id === product.id) + 1}</TableCell>
                      <TableCell>{product.name.charAt(0).toUpperCase() + product.name.slice(1)}</TableCell>
                      <TableCell>{product.total_stock}</TableCell>
                      <TableCell>
                        <span>
                          {product.available_stock}
                        </span>
                      </TableCell>
                      <TableCell>{product.available_stock === 0? "Checked Out": product.status.charAt(0).toUpperCase() + product.status.slice(1)}</TableCell>
                      <TableCell className="flex text-center items-center content-center justify-center gap-1 md:gap-4">
                          {/* Dialog for editing product */}
                      <Dialog>
                        <DialogTrigger asChild><Button variant={"outline"} className="px-3"
                                                onClick={() => {
                                                  form.reset({
                                                    name: product.name,
                                                    total_stock: product.total_stock,
                                                    status: product.status,
                                                  })
                                                }}
                                              ><PenLine size={"18px"}/></Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                              Edit Detail Product
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(async (data) => {
                              setIsSubmitting(true);
                              try {
                              const { error } = await supabase
                                .from("products")
                                .update(data)
                                .eq("id", product.id);

                              if (error) {
                                console.error("Error updating product:", error);
                                console.error(data)
                                toast(
                                      "Notification", // First argument should be the message
                                      {
                                        position: "top-center",
                                        description: "gagal memperbarui data",
                                        duration: 2500,
                                        // action: <Button variant="outline" onClick={() => console.log(borrowings)}>Lihat Detail</Button>, 
                                        classNames: {
                                          actionButton: 'm-96 size-4',
                                          toast: 'flex flex-row justify-around',
                                        }
                                      }
                                    )
                                return;
                              }

                              toast(
                                    "Notification", // First argument should be the message
                                    {
                                      position: "top-center",
                                      description: "Berhasil mengubah data",
                                      duration: 2500,
                                      // action: <Button variant="outline" onClick={() => console.log(borrowings)}>Lihat Detail</Button>,
                                      classNames: {
                                        actionButton: 'm-96 size-4',
                                        toast: 'flex flex-row justify-around',
                                      }
                                    }
                                  )
                                  

                                  setProducts((prevProducts) =>
                                    prevProducts.map((p) =>
                                      p.id === product.id ? { ...p, ...data } : p
                                    )
                                  );
                                  setIsDialogOpen(false); // Close dialog
                              } catch (error) {
                              console.error("Error updating product:", error);
                              } finally {
                              setIsSubmitting(false);
                              }
                            })} className="space-y-4">
                              {/* Product Name Field */}
                              <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                  <Input
                                  placeholder="Enter product name"
                                  defaultValue={product.name}
                                  {...field}
                                  />
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
                                  defaultValue={product.total_stock}
                                  {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                              )}
                              />

                              {/* Select status field */}
                              <FormField
                              control={form.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} defaultValue={product.status}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="checked out">Checked Out</SelectItem>
                                    <SelectItem value="disposed">Disposed</SelectItem>
                                    <SelectItem value="under audit">Under audit</SelectItem>
                                    <SelectItem value="in maintenance">In Maintenance</SelectItem>
                                  </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                              )}
                              />

                              {/* Submit Button */}
                              <DialogFooter>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Changing..." : "Apply"}
                              </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                            <AlertDialog>         
                            <AlertDialogTrigger asChild ><Button variant={"outline"} className="px-3"><Trash size={"18px"}/></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Apakah anda serius?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini tidak dapat dikembalikan. Ini akan menghapus permanen data ini dan tidak akan pernah kembali lagi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={()=> handleRemove(product.id)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>                       
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
