"use client"

import { useState, useMemo } from "react"
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

// Sample borrowing data with comments
const initialBorrowings = [
  {
    id: "1",
    product: "Laptop",
    model: "MacBook Pro",
    serialNumber: "MB-001",
    borrower: "John Doe",
    class: "Class A",
    borrowDate: new Date("2023-10-15"),
    returnDate: new Date("2023-10-30"),
    status: "returned",
    comment: "Needed for presentation to clients",
  },
  {
    id: "2",
    product: "Smartphone",
    model: "iPhone 15",
    serialNumber: "IP-002",
    borrower: "Jane Smith",
    class: "Class B",
    borrowDate: new Date("2023-11-05"),
    returnDate: new Date("2023-11-20"),
    status: "active",
    comment: "For testing new mobile app",
  },
  {
    id: "3",
    product: "Tablet",
    model: "iPad Pro",
    serialNumber: "IPD-003",
    borrower: "Robert Johnson",
    class: "Class C",
    borrowDate: new Date("2023-11-10"),
    returnDate: new Date("2023-11-25"),
    status: "waiting",
    comment: "",
  },
  {
    id: "4",
    product: "Laptop",
    model: "ThinkPad X1",
    serialNumber: "TP-001",
    borrower: "Emily Davis",
    class: "Class A",
    borrowDate: new Date("2023-10-20"),
    returnDate: new Date("2023-11-05"),
    status: "overdue",
    comment: "For development work",
  },
  {
    id: "5",
    product: "Smartphone",
    model: "Google Pixel",
    serialNumber: "PX-002",
    borrower: "Michael Wilson",
    class: "Class B",
    borrowDate: new Date("2023-11-01"),
    returnDate: new Date("2023-11-15"),
    status: "returned",
    comment: "Testing camera features",
  },
  {
    id: "6",
    product: "Tablet",
    model: "Surface Pro",
    serialNumber: "SP-001",
    borrower: "Sarah Brown",
    class: "Class C",
    borrowDate: new Date("2023-11-08"),
    returnDate: new Date("2023-11-23"),
    status: "active",
    comment: "For design work",
  },
  {
    id: "7",
    product: "Laptop",
    model: "Dell XPS",
    serialNumber: "XPS-003",
    borrower: "David Miller",
    class: "Class A",
    borrowDate: new Date("2023-10-25"),
    returnDate: new Date("2023-11-10"),
    status: "overdue",
    comment: "Needed for remote work",
  },
  {
    id: "8",
    product: "Smartphone",
    model: "Samsung Galaxy",
    serialNumber: "SG-001",
    borrower: "Jennifer Taylor",
    class: "Class B",
    borrowDate: new Date("2023-11-03"),
    returnDate: new Date("2023-11-18"),
    status: "waiting",
    comment: "",
  },
  {
    id: "9",
    product: "Tablet",
    model: "Galaxy Tab",
    serialNumber: "GT-002",
    borrower: "Daniel Anderson",
    class: "Class C",
    borrowDate: new Date("2023-11-07"),
    returnDate: new Date("2023-11-22"),
    status: "active",
    comment: "For client demos",
  },
  {
    id: "10",
    product: "Laptop",
    model: "MacBook Pro",
    serialNumber: "MB-002",
    borrower: "Lisa Thomas",
    class: "Class A",
    borrowDate: new Date("2023-10-18"),
    returnDate: new Date("2023-11-02"),
    status: "returned",
    comment: "For video editing project",
  },
]

// Type for sorting
type SortConfig = {
  key: string
  direction: "ascending" | "descending"
} | null

// Type for borrowing status
type BorrowingStatus = "waiting" | "active" | "returned"

// Type for borrowing data
type Borrowing = {
  id: string
  product: string
  model: string
  serialNumber: string
  borrower: string
  class: string
  borrowDate: Date
  returnDate: Date
  status: string
  comment: string
}

export default function BorrowingDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [borrowings, setBorrowings] = useState<Borrowing[]>(initialBorrowings)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [editedStatus, setEditedStatus] = useState<string>("")
  const [hasChanges, setHasChanges] = useState(false)

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
        borrowing.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrowing.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrowing.class.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || borrowing.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Then sort the filtered data
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        // Handle date sorting
        if (sortConfig.key === "borrowDate" || sortConfig.key === "returnDate") {
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
      case "waiting":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "returned":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
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
  const handleStatusUpdate = (id: string, newStatus: string) => {
    setBorrowings((prevBorrowings) =>
      prevBorrowings.map((borrowing) => (borrowing.id === id ? { ...borrowing, status: newStatus } : borrowing)),
    )
  }

  // Handle status change in detail dialog
  const handleStatusChange = (status: string) => {
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
    const allowedStatuses = ["waiting", "active", "returned"]

    // Filter out the current status
    return allowedStatuses.filter((status) => status !== currentStatus)
  }

  return (
    <div className="flex h-screen bg-gray-100 w-screen">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold pl-2">Inventory</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            <a
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-900"
            >
              <Home className="mr-3 h-5 w-5 text-gray-500" />
              Dashboard
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="mr-3 h-5 w-5 text-gray-500" />
              Products
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Users className="mr-3 h-5 w-5 text-gray-500" />
              Borrowers
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="mr-3 h-5 w-5 text-gray-500" />
              Reports
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <BarChart3 className="mr-3 h-5 w-5 text-gray-500" />
              Statistics
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-500" />
              Settings
            </a>
          </nav>
        </div>
        <div className="p-4 border-t">
          {/* <button
            onClick={async () => {
              const { createClient } = await import("@supabase/supabase-js")
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
              )
              const { error } = await supabase.auth.signOut()
              if (error) {
                console.error("Error logging out:", error.message)
              } else {
                window.location.href = "/"
              }
            }}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-500" />
            Logout */}

            <form action={signOutAction}>
                    <Button type="submit" variant={"outline"} className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-none w-full justify-start h-full"> 
                    <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                      Sign out
                    </Button>
                  </form>
          {/* </button> */}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Borrowings</h1>
              <Button asChild>
                <a href="/">Add New</a>
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          <Card>
            <CardHeader>
              <CardTitle>Borrowing Records</CardTitle>
              <CardDescription>Manage and track all equipment borrowings</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => requestSort("product")}>
                        Product
                        {getSortDirection("product") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                        {getSortDirection("product") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => requestSort("borrower")}>
                        Borrower
                        {getSortDirection("borrower") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                        {getSortDirection("borrower") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => requestSort("class")}>
                        Class
                        {getSortDirection("class") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                        {getSortDirection("class") === "descending" && <ArrowDown className="inline ml-1 h-4 w-4" />}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => requestSort("borrowDate")}>
                        Borrow Date
                        {getSortDirection("borrowDate") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                        {getSortDirection("borrowDate") === "descending" && (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => requestSort("returnDate")}>
                        Return Date
                        {getSortDirection("returnDate") === "ascending" && <ArrowUp className="inline ml-1 h-4 w-4" />}
                        {getSortDirection("returnDate") === "descending" && (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        )}
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredBorrowings.length > 0 ? (
                      sortedAndFilteredBorrowings.map((borrowing) => (
                        <TableRow key={borrowing.id} className="cursor-pointer">
                          <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.product}</TableCell>
                          <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.borrower}</TableCell>
                          <TableCell onClick={() => handleRowClick(borrowing)}>{borrowing.class}</TableCell>
                          <TableCell onClick={() => handleRowClick(borrowing)}>
                            {format(borrowing.borrowDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell onClick={() => handleRowClick(borrowing)}>
                            {format(borrowing.returnDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell onClick={() => handleRowClick(borrowing)}>
                                <Badge
                                  variant="outline"
                                  className={`${getStatusColor(borrowing.status)} cursor-pointer`}
                                >
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {sortedAndFilteredBorrowings.length} of {borrowings.length} borrowings
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
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
                <span className="col-span-3">{selectedBorrowing.product}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Model:</span>
                <span className="col-span-3">{selectedBorrowing.model}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Serial Number:</span>
                <span className="col-span-3">{selectedBorrowing.serialNumber}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Borrower:</span>
                <span className="col-span-3">{selectedBorrowing.borrower}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Class:</span>
                <span className="col-span-3">{selectedBorrowing.class}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Borrow Date:</span>
                <span className="col-span-3">{format(selectedBorrowing.borrowDate, "MMMM dd, yyyy")}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Return Date:</span>
                <span className="col-span-3">{format(selectedBorrowing.returnDate, "MMMM dd, yyyy")}</span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Status:</span>
                <div className="col-span-3">
                  <Select value={editedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className={getStatusColor(editedStatus)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
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
                    <em className="text-gray-400">No comment provided</em>
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
  )
}
