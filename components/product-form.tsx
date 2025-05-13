"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

// Define the schema for form validation using Zod


export default function ProductForm() {
  interface Product {
    id: number;
    name: string;
    total_stock: number;
    status: 'available' | 'lost' | 'checked out' | 'disposed' | 'under audit' | 'in maintenance'  | 'in repair' | 'in maintenance' 

    // Add other fields as needed based on your database schema
  }

  const [products, setProducts] = useState<Product[]>([]); // State to store fetched products
  const [isSubmitting, setIsSubmitting] = useState(false); // State to manage form submission status

  const formSchema = z.object({
    product: z.string().min(1, { message: "Product is required" }),
    total: z
      .coerce
      .number({message: "Total is required"})
      .positive({ message: "Total must be a positive" }),
    name: z.string({message: 'nama harus benar'}).min(1, { message: "Name is required" }),
    class: z.string().min(1, { message: "Class is required" }),
    date: z.date({ required_error: "Date is required" }),
    comment: z.string().optional(),
  });
  
  type FormValues = z.infer<typeof formSchema>;

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  // Fetch products from Supabase on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("Error fetching products:", error.message);
      } else {
        setProducts(data || []);
      }
    };

    fetchProducts();
  }, []);

  // Initialize the form with default values and validation schema
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      comment: ""
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("forms").insert([
        {
          product_id: Number(data.product),
          total: data.total,
          name: data.name,
          class: data.class,
          comment: data.comment,
        },
      ]);

      if (error) {
        console.error("Error inserting form:", error.message);
        alert("Failed to submit the form. Please check your input.");
      } else {

        toast(
              "Notification", // First argument should be the message
              {
                position: "top-center",
                description: "Form submitted successfully",
                duration: 2500,
                // action: <Button variant="outline" onClick={() => console.log(borrowings)}>Lihat Detail</Button>, 
                classNames: {
                  actionButton: 'm-96 size-4',
                  toast: 'flex flex-row justify-around',
                }
              }
            )
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast(
            "Notification", // First argument should be the message
            {
              position: "top-center",
              description: "Terdapat data baru ditambahkan",
              duration: 2500,
              // action: <Button variant="outline" onClick={() => console.log(borrowings)}>Lihat Detail</Button>, 
              classNames: {
                actionButton: 'm-96 size-4',
                toast: 'flex flex-row justify-around',
              }
            }
          )
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex m-0 bg-transparent justify-center w-screen ">
      <Card className="w-full m:8 sm:m-6 lg:m-8 rounded-none sm:rounded-md max-w-7xl">
        <CardHeader>
          <CardTitle className="text-2xl">Form Peminjaman</CardTitle>
          <CardDescription>Form untuk meminjam alat inventaris Tkj</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Selection */}
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Input */}
              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter total amount"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name Input */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Class Selection */}
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="X TKJ 1">X TKJ 1</SelectItem>
                        <SelectItem value="X TKJ 2">X TKJ 2</SelectItem>
                        <SelectItem value="XI TKJ 1">XI TKJ 1</SelectItem>
                        <SelectItem value="XI TKJ 2">XI TKJ 2</SelectItem>
                        <SelectItem value="XII TKJ 1">XII TKJ 1</SelectItem>
                        <SelectItem value="XII TKJ 2">XII TKJ 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comment Input */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Untuk keperluan..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Display */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="text-sm p-2 px-3 border rounded-md bg-muted/20 text-muted-foreground flex flex-row justify-between">
                        {format(field.value, "PPP")} <Calendar className="size-5 opacity-90" color="gray" />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
