"use client"

import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { ArrowDown, ArrowUp, BarChart3, FileText, Home, LogOut, Package, Search, Settings, Users } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { signOutAction } from "@/app/actions"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// Type for sorting
type SortConfig = {
  key: string
  direction: "ascending" | "descending"
} | null

// Type for borrowing status
// type BorrowedStatus = "waiting" | "active" | "returned" | "overdue"
type StatusType = "pending" | "borrowed" | "returned" | "rejected"
type ClassType = "X TKJ 1" | "XI TKJ 1" | "XI TKJ 2" | "XII TKJ 1" | "XII TKJ 2"

// Type for borrowing data
// type Borrowing = {
//   id: string
//   product: string
//   model: string
//   serialNumber: string
//   borrower: string
//   class: string
//   borrowDate: Date
//   returnDate: Date
//   status: string
//   comment: string
// }
type Borrowing = {
  id: string
  total: number
  name: string
  class: ClassType
  comment: string
  status: StatusType
  created_at: Date
  updated_at: Date
  product_id: {
    id: string
    name: string
    stock: number
  }
}

export default function BorrowingDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [editedStatus, setEditedStatus] = useState<StatusType>("pending")
  const [hasChanges, setHasChanges] = useState(false)

  //Handle Fetching Borrowings from Supabase

//   const initialBorrowings = [
//     {
//       id: "1",
//       product: "Laptop",
//       model: "MacBook Pro",
//       serialNumber: "MB-001",
//       borrower: "John Doe",
//       class: "Class A",
//       borrowDate: new Date("2023-10-15"),
//       returnDate: new Date("2023-10-30"),
//       status: "returned",
//       comment: "Needed for presentation to clients",
//     },
//     {
//       id: "2",
//       product: "Smartphone",
//       model: "iPhone 15",
//       serialNumber: "IP-002",
//       borrower: "Jane Smith",
//       class: "Class B",
//       borrowDate: new Date("2023-11-05"),
//       returnDate: new Date("2023-11-20"),
//       status: "active",
//       comment: "For testing new mobile app",
//     },
//     {
//       id: "3",
//       product: "Tablet",
//       model: "iPad Pro",
//       serialNumber: "IPD-003",
//       borrower: "Robert Johnson",
//       class: "Class C",
//       borrowDate: new Date("2023-11-10"),
//       returnDate: new Date("2023-11-25"),
//       status: "waiting",
//       comment: "",
//     },
//     {
//       id: "4",
//       product: "Laptop",
//       model: "ThinkPad X1",
//       serialNumber: "TP-001",
//       borrower: "Emily Davis",
//       class: "Class A",
//       borrowDate: new Date("2023-10-20"),
//       returnDate: new Date("2023-11-05"),
//       status: "overdue",
//       comment: "For development work",
//     },
//     {
//       id: "5",
//       product: "Smartphone",
//       model: "Google Pixel",
//       serialNumber: "PX-002",
//       borrower: "Michael Wilson",
//       class: "Class B",
//       borrowDate: new Date("2023-11-01"),
//       returnDate: new Date("2023-11-15"),
//       status: "returned",
//       comment: "Testing camera features",
//     },
//     {
//       id: "6",
//       product: "Tablet",
//       model: "Surface Pro",
//       serialNumber: "SP-001",
//       borrower: "Sarah Brown",
//       class: "Class C",
//       borrowDate: new Date("2023-11-08"),
//       returnDate: new Date("2023-11-23"),
//       status: "active",
//       comment: "For design work",
//     },
//     {
//       id: "7",
//       product: "Laptop",
//       model: "Dell XPS",
//       serialNumber: "XPS-003",
//       borrower: "David Miller",
//       class: "Class A",
//       borrowDate: new Date("2023-10-25"),
//       returnDate: new Date("2023-11-10"),
//       status: "overdue",
//       comment: "Needed for remote work",
//     },
//     {
//       id: "8",
//       product: "Smartphone",
//       model: "Samsung Galaxy",
//       serialNumber: "SG-001",
//       borrower: "Jennifer Taylor",
//       class: "Class B",
//       borrowDate: new Date("2023-11-03"),
//       returnDate: new Date("2023-11-18"),
//       status: "waiting",
//       comment: "",
//     },
//     {
//       id: "9",
//       product: "Tablet",
//       model: "Galaxy Tab",
//       serialNumber: "GT-002",
//       borrower: "Daniel Anderson",
//       class: "Class C",
//       borrowDate: new Date("2023-11-07"),
//       returnDate: new Date("2023-11-22"),
//       status: "active",
//       comment: "For client demos",
//     },
//     {
//       id: "10",
//       product: "Laptop",
//       model: "MacBook Pro",
//       serialNumber: "MB-002",
//       borrower: "Lisa Thomas",
//       class: "Class A",
//       borrowDate: new Date("2023-10-18"),
//       returnDate: new Date("2023-11-02"),
//       status: "returned",
//       comment: "For video editing project",
//     },
//   ]

  useEffect(() => {
          const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL || '',
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          );
  
          const fetchNotes = async () => {
              const { data, error } = await supabase.from('forms').select(`*,product_id(*)`);
              if (error) {
                  return 'error fetching notes: ' + error.message;
              }
              setBorrowings(data || []);
          };
  
          fetchNotes();
  
          const channel = supabase.channel('schema-public-form-changes')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'forms' }, (payload) => {
                  fetchNotes(); // Fetch the latest data when a change is detected
              })
              .subscribe();
  
          return () => {
              supabase.removeChannel(channel);
          };
      }, []);  

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Get sort direction for a column
  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction
  }

  // Sort and filter borrowings
  const sortedAndFilteredBorrowings = useMemo(() => {
    // First filter the borrowings
    const filteredData = borrowings.filter((borrowing) => {
      const matchesSearch =
        borrowing.product_id.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrowing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrowing.class.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || borrowing.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Then sort the filtered data
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        // Handle date sorting
        if (sortConfig.key === "created_at" || sortConfig.key === "updated_at") {
          const dateA = a[sortConfig.key as keyof Borrowing] as unknown as Date
          const dateB = b[sortConfig.key as keyof Borrowing] as unknown as Date

          if (sortConfig.direction === "ascending") {
            return dateA.getTime() - dateB.getTime()
          } else {
            return dateB.getTime() - dateA.getTime()
          }
        }

        // Handle string sorting
        if (a[sortConfig.key as keyof Borrowing] < b[sortConfig.key as keyof Borrowing]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key as keyof Borrowing] > b[sortConfig.key as keyof Borrowing]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredData
  }, [borrowings, searchTerm, statusFilter, sortConfig])

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "borrowed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "returned":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        // For any other status (like "overdue"), use a neutral color
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Handle row click to show details
  const handleRowClick = (borrowing: Borrowing) => {
    setSelectedBorrowing(borrowing)
    setEditedStatus(borrowing.status)
    setHasChanges(false)
    setIsDetailOpen(true)
  }

  // Handle status update
const handleStatusUpdate = async (id: string, newStatus: StatusType) => {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data, error } = await supabase
    .from('forms')
    .update({status: newStatus,
            updated_at: new Date().toISOString()
     })
    .eq('id', id);
        // .from('forms').select(`*,product_id(*)`)


    if (error) {
        console.error('Error updating status:', error.message);
        alert('Error updating status:'+ data);
        return;
    }
    alert('Status updated:'+ JSON.stringify(data));


    setBorrowings((prevBorrowings) =>
        prevBorrowings.map((borrowing) =>
            borrowing.id === id ? { ...borrowing, status: newStatus } : borrowing
        )
    );
    setIsDetailOpen(false)
};

  // Handle status change in detail dialog
  const handleStatusChange = (status: StatusType) => {
    setEditedStatus(status)
    setHasChanges(true)
  }

  // Apply changes from detail dialog
  const applyChanges = () => {
    if (selectedBorrowing && hasChanges) {
      handleStatusUpdate(selectedBorrowing.id, editedStatus)
      setHasChanges(false)

      // Update the selected borrowing to reflect changes
      setSelectedBorrowing({
        ...selectedBorrowing,
        status: editedStatus,
      })
    }
  }

  // Get available status options based on current status
  const getStatusOptions = (currentStatus: string) => {
    // Only allow these three statuses
    const allowedStatuses = ["processed", "accepted", "activated", "rejected"]

    // Filter out the current status
    return allowedStatuses.filter((status) => status !== currentStatus)
  }
return (
    <div className="flex h-screen bg-background w-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-card border-r">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold pl-2">Inventory</h2>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1">
                    <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground">
                        <Home className="mr-3 h-5 w-5" />
                        Dashboard
                    </Link>
                    <Button variant={"ghost"} asChild>
                    <Link href="/products" className="flex items-center px-4 py-2 text-sm font-medium rounded-md">
                        <Package className="mr-3 h-5 w-5" />
                        Products
                    </Link>
                    </Button>
                </nav>
            </div>
            <div className="border-t py-4">
                <form action={signOutAction}>
                    <Button type="submit" variant={"default"} className="flex items-center px-4 py-2 text-sm font-medium rounded-md w-full h- justify-start bg-transparent b-0 hover:bg-muted hover:text-muted-foreground">
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign out
                    </Button>
                </form>
            </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top header */}
            <header className="bg-muted shadow">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Borrowings</h1>
                        <Button asChild>
                            <Link href="/forms">Add New</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted">
                <Card>
                    <CardHeader>
                        <CardTitle>Borrowing Records</CardTitle>
                        <CardDescription>Manage and track all equipment borrowings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search borrowings..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="borrowed">Borrow</SelectItem>
                                    <SelectItem value="returned">Return</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead onClick={() => requestSort("product")}>
                                            Product
                                            {getSortDirection("product") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                                            {getSortDirection("product") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                                        </TableHead>
                                        <TableHead onClick={() => requestSort("borrower")}>
                                            Name
                                            {getSortDirection("borrower") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                                            {getSortDirection("borrower") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                                        </TableHead>
                                        <TableHead onClick={() => requestSort("class")}>
                                            Class
                                            {getSortDirection("class") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                                            {getSortDirection("class") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                                        </TableHead>
                                        <TableHead onClick={() => requestSort("borrowDate")}>
                                            Date
                                            {getSortDirection("borrowDate") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                                            {getSortDirection("borrowDate") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredBorrowings.length > 0 ? (
                                        sortedAndFilteredBorrowings.map((borrowing) => (
                                            <TableRow key={borrowing.id} className="cursor-pointer">
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.product_id.name.split(" ")[0]}</TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.name}</TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.class}</TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>
                                                    {format(borrowing.created_at, "MMM dd, yyyy")}
                                                </TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>
                                                    <Badge variant="outline" className={getStatusColor(borrowing.status)}>
                                                        {borrowing.status.charAt(0).toUpperCase() + borrowing.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No borrowings found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Borrowing Details</DialogTitle>
                    <DialogDescription>Complete information about this borrowing record</DialogDescription>
                </DialogHeader>

                {selectedBorrowing && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Product:</span>
                            <span className="col-span-3">{selectedBorrowing.product_id.name}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Borrower:</span>
                            <span className="col-span-3">{selectedBorrowing.name}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Class:</span>
                            <span className="col-span-3">{selectedBorrowing.class}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Borrow:</span>
                            <span className="text-nowrap">{format(selectedBorrowing.updated_at, "dd MMMM yyyy, hh:mm")}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Return:</span>
                            <span className="text-nowrap">{format(selectedBorrowing.updated_at, "dd MMMM yyyy, hh:mm")}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Status:</span>
                            <div className="col-span-3">
                                <Select value={editedStatus} onValueChange={handleStatusChange}>
                                    <SelectTrigger className={getStatusColor(editedStatus)}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="borrowed">Borrowed</SelectItem>
                                        <SelectItem value="returned">Returned</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Comment:</span>
                            <span className="col-span-3">
                                {selectedBorrowing.comment ? (
                                    selectedBorrowing.comment
                                ) : (
                                    <em className="text-muted-foreground">No comment provided</em>
                                )}
                            </span>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="default" onClick={applyChanges} disabled={!hasChanges} className="mr-2">
                        Apply
                    </Button>
                    <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
)}
