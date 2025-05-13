"use client"

import { useState, useMemo, useEffect } from "react"
import { format, set } from "date-fns"
import {  ChevronDown, ChevronUp, FileText, Home, LogOut, Package, Search, Settings, Users } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination"

// Type for sorting
type SortConfig = {
  key: string
  direction: "ascending" | "descending"
} | null

type StatusType = "pending" | "borrowed" | "returned" | "rejected"
type ClassType = "X TKJ 1" | "XI TKJ 1" | "XI TKJ 2" | "XII TKJ 1" | "XII TKJ 2"

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
  const [page , setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
          const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL || '',
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          );
  
          const fetchData = async () => {
            // const from = (page - 1) * pageSize;
            // const to = page * pageSize - 1;
              const { data, error } = await supabase.from('forms').select("*,product_id(*)").order('created_at', { ascending: false })
              if (error) {
                  return 'error fetching notes: ' + error.message;
              }
             
                      // setTotalCount(count || 0)
              setBorrowings(data);
          };
  
          fetchData();
  
          const channel = supabase.channel('schema-public-form-changes')
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forms' }, (payload) => {
                  fetchData(); // Fetch the latest data when a change is detected
                  toast(
                  "Notification", // First argument should be the message
                  {
                    position: "top-center",
                    description: "Terdapat data baru ditambahkan",
                    duration: 10000,
                    // action: <Button variant="outline" onClick={() => console.log(borrowings)}>Lihat Detail</Button>, 
                    classNames: {
                      actionButton: 'm-96 size-4',
                      toast: 'flex flex-row justify-around',
                    }
                  }
                );
              })
              .subscribe();
  
          return () => {
              supabase.removeChannel(channel);
              
          };
      }, []);  

      const totalPages = Math.ceil(totalCount / pageSize)

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
    .update({
      status: newStatus,
      updated_at: new Date()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating status:', error.message);
    alert('Error updating status:' + data);
    return;
  }

  setBorrowings((prevBorrowings) =>
    prevBorrowings.map((borrowing) =>
      borrowing.id === id ? { ...borrowing, status: newStatus } : borrowing
    )
  );
  setIsDetailOpen(false);
  toast(
      "Notification",
      {
          duration: 2500,
          description: "Status berhasil diubah",
          // action: <Button variant="outline" onClick={() => setIsDetailOpen(true)}>Lihat Detail</Button>,
          position: "top-center",
          className: "bg-green-500 text-white",
          classNames: {
            description: "text-sm text-muted-foreground w-full",
            actionButton: "bg-green-500 text-white ml-4",
            title: "text-center font-bold text-white",
            toast: "justify-center m-0 p-0  "
          }
      }
  );
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
    <div className="flex h-screen bg-transparent w-screen flex-col items-center">

                <Card className="w-full sm:m-6 lg:m-8 rounded-none max-w-7xl sm:rounded-md">
                    <CardHeader>
                        <CardTitle>Data Peminjaman</CardTitle>
                        <CardDescription>Seluruh Data Peminjaman Inventory Tkj</CardDescription>
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
                                        <TableHead className="min-w-16">
                                            No
                                        </TableHead>
                                        <TableHead
                                            onClick={() => requestSort("product")}
                                            className=""
                                        >
                                            Product
                                            {getSortDirection("product") === "ascending" && <ChevronUp className="inline  ml-1 size-4 text-muted-foreground" />}
                                            {getSortDirection("product") === "descending" && <ChevronDown className="inline ml-1 size-4 text-muted-foreground" />}
                                        </TableHead>
                                        <TableHead className="" onClick={() => requestSort("borrower")}>
                                            Name
                                            {getSortDirection("borrower") === "ascending" && <ChevronUp className="inline  ml-1 size-4 text-muted-foreground" />}
                                            {getSortDirection("borrower") === "descending" && <ChevronDown className="inline  ml-1 size-4 text-muted-foreground" />}
                                        </TableHead>
                                        <TableHead className="" onClick={() => requestSort("class")}>
                                            Class
                                            {getSortDirection("class") === "ascending" && <ChevronUp className="inline  ml-1 size-4 text-muted-foreground" />}
                                            {getSortDirection("class") === "descending" && <ChevronDown className="inline  ml-1 size-4 text-muted-foreground" />}
                                        </TableHead>
                                        <TableHead className="" onClick={() => requestSort("total")}>
                                            total
                                            {getSortDirection("total") === "ascending" && <ChevronUp className="inline  ml-1 size-4 text-muted-foreground" />}
                                            {getSortDirection("total") === "descending" && <ChevronDown className="inline  ml-1 size-4 text-muted-foreground" />}
                                        </TableHead>
                                        
                                        <TableHead className="" onClick={() => requestSort("borrowDate")}>
                                            Date
                                            {getSortDirection("borrowDate") === "ascending" && <ChevronUp className="inline  ml-1 size-4 text-muted-foreground" />}
                                            {getSortDirection("borrowDate") === "descending" && <ChevronDown className="inline  ml-1 size-4 text-muted-foreground" />}
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredBorrowings.length > 0 ? (
                                        sortedAndFilteredBorrowings.map((borrowing) => (
                                            <TableRow key={borrowing.id} className="cursor-pointer">
                                                <TableCell className="font-medium text-sm w-4 text-muted-foreground">
                                                    {borrowings.indexOf(borrowing) + 1 + (page - 1) * pageSize}
                                                </TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.product_id.name.split(" ")[0]}</TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.name}</TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.class}</TableCell>
                                                <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.total}</TableCell>
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
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No borrowings found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {sortedAndFilteredBorrowings.length !== 15 && sortedAndFilteredBorrowings.length > 0 && <div className="text-center text-sm text-muted-foreground opacity-80 mt-4">(The end of the data)</div>}
                        {/* Pagination */}
                        {/* <Pagination className="mt-6" >
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                className={page === 1 ? "cursor-not-allowed opacity-50" : ""}
                                onClick={() => { if (page > 1) { setPage(page - 1); } }}
                              />
                            </PaginationItem >
                            <PaginationItem>
                              {Array.from({ length: totalPages }, (_, index) => (
                                <PaginationLink
                                  key={index + 1}
                                  href="#"
                                  onClick={()=> page !== 1? setPage(page + 1): null}
                                  isActive={page == index + 1}
                                >
                                  {index + 1}
                                </PaginationLink>
                              ))}
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext onClick={()=> page !== totalPages? setPage(page + 1): ""} 
                                className={page === totalPages ? "cursor-not-allowed opacity-50" : ""}/>
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination> */}
                    </CardContent>
                </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Detail Peminjaman</DialogTitle>
                    {/* <DialogDescription>Complete information about this borrowing record</DialogDescription> */}
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
                            <span className="text-sm font-medium">Total:</span>
                            <span className="col-span-3">{selectedBorrowing.total}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Borrow:</span>
                            <span className="text-nowrap">{format(selectedBorrowing.created_at, `dd MMMM yyyy, hh:mm `)}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Return:</span>
                            <span className="text-nowrap">{selectedBorrowing.updated_at? (format(selectedBorrowing.updated_at, "dd MMMM yyyy, hh:mm")) : ("-")}</span>
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
                            <span className="text-sm font-medium">Description:</span>
                            <span className="col-span-3">
                                {selectedBorrowing.comment ? (
                                    selectedBorrowing.comment
                                ) : (
                                    <span className="text-muted-foreground">No Description</span>
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

        {/* <div className="flex justify-between mt-4">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
        </div> */}
        
    </div>
)}
