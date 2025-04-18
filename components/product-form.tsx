"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, set } from "date-fns"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"
import { comment } from "postcss"

const formSchema = z.object({
  product: z.string().min(1, { message: "Product is required" }),
  // brand: z.string().min(1, { message: "Brand is required" }),
  // model: z.string().min(1, { message: "Model is required" }),
  // serialNumber: z.string().optional(),
  total: z.coerce.number().positive({ message: "Total must be a positive number" }),
  name: z.string().min(1, { message: "Name is required" }),
  class: z.string().min(1, { message: "Class is required" }),
  // status: z.string().min(1, { message: "Status is required" }),
  date: z.date({ required_error: "Date is required" }),
  comment: z.string().optional(), // Use .optional() to make it optional
})

type FormValues = z.infer<typeof formSchema>

export default function ProductForm() {

  const [products, setProducts] = useState<any[]>([])
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
  // Sample product data
  useEffect(() => {

  
          const fetchNotes = async () => {
              const { data, error } = await supabase.from('products').select(`*`);
              if (error) {
                  return 'error fetching notes: ' + error.message;
              }
              setProducts(data || []);
          };
  
          fetchNotes();
          console.log( "fetched products:" + products)
      }, []);
      
  // const products = [
  //   {
  //     id: "laptop",
  //     name: "Laptop",
  //     models: [
  //       { id: "macbook", name: "MacBook Pro" },
  //       { id: "thinkpad", name: "ThinkPad X1" },
  //       { id: "xps", name: "Dell XPS" },
  //     ],
  //   },
  //   {
  //     id: "smartphone",
  //     name: "Smartphone",
  //     models: [
  //       { id: "iphone", name: "iPhone 15" },
  //       { id: "pixel", name: "Google Pixel" },
  //       { id: "galaxy", name: "Samsung Galaxy" },
  //     ],
  //   },
  //   {
  //     id: "tablet",
  //     name: "Tablet",
  //     models: [
  //       { id: "ipad", name: "iPad Pro" },
  //       { id: "surface", name: "Surface Pro" },
  //       { id: "galaxy-tab", name: "Galaxy Tab" },
  //     ],
  //   },
  // ]
  // // Serial numbers by model
  // const serialNumbers = {
  //   macbook: ["MB-001", "MB-002", "MB-003"],
  //   thinkpad: ["TP-001", "TP-002", "TP-003"],
  //   xps: ["XPS-001", "XPS-002", "XPS-003"],
  //   iphone: ["IP-001", "IP-002", "IP-003"],
  //   pixel: ["PX-001", "PX-002", "PX-003"],
  //   galaxy: ["SG-001", "SG-002", "SG-003"],
  //   ipad: ["IPD-001", "IPD-002", "IPD-003"],
  //   surface: ["SP-001", "SP-002", "SP-003"],
  //   "galaxy-tab": ["GT-001", "GT-002", "GT-003"],
  // }

  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      // model: "",
      // serialNumber: "",
      total: 1,
      name: "",
      class: "",
      // status: "active", // Set default status to active
      date: new Date(), // Set default date to current date
      comment: "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      const { error } = await supabase
        .from('forms')
        .insert([
          {
            product_id: Number(data.product),
            total: data.total,
            name: data.name,
            class: data.class,
            comment: data.comment,
            // status: "processed",
            // returned_at: null,
          }
        ]);

      if (error) {
        console.error('Error inserting form:', error.message);
        alert('Failed to submit the form. Please check your input.');
      } else {
        console.log('Form inserted successfully:', data);
        alert('Form submitted successfully!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred.');
    }
  }

  return (
    <Card className="w-full max-w-5xl my-5">
      <CardHeader>
        <CardTitle className="text-2xl">Product Form</CardTitle>
        <CardDescription>Please fill in all the required fields below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedProduct(value)
                      // Reset dependent fields
                      // form.setValue("model", "")
                      // form.setValue("serialNumber", "")
                      setSelectedModel("")
                    }}
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

            {/* <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedModel(value)
                      // Reset serial number when model changes
                      form.setValue("serialNumber", "")
                    }}
                    defaultValue={field.value}
                    disabled={!selectedProduct}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedProduct &&
                        products
                          .find((product) => product.name === selectedProduct)
                          ?.products.map((product: any) => (
                            <SelectItem key={product.id} value={product.name}>
                              {product.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedModel}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a serial number" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedModel &&
                        serialNumbers[selectedModel as keyof typeof serialNumbers]?.map((serial) => (
                          <SelectItem key={serial} value={serial}>
                            {serial}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

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
                      onChange={(e) => {
                        field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <div className="p-2 border rounded-md bg-muted/20">{format(field.value, "PPP")}</div>
                  </FormControl>
                  <FormDescription>Current date</FormDescription>
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="date"
              disabled = {true}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <div className="text-sm p-2 px-3 border rounded-md bg-muted/20 text-muted-foreground flex flex-row justify-between">{format(field.value, "PPP")} <Calendar className="size-5 opacity-90" color="gray"/></div>
                  </FormControl>
                  {/* <FormDescription>Current date (not editable)</FormDescription> */}
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Untuk keperluan..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  {/* <FormDescription></FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
