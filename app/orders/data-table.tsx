"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const { toast } = useToast()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedOrdersWithPacketa = selectedRows.filter(row => 
    (row.original as any).packeta_label_id && !(row.original as any).packeta_printed
  )

  const handlePrintLabels = async () => {
    if (selectedOrdersWithPacketa.length === 0) {
      toast({
        title: "Upozornění",
        description: "Nejsou vybrané žádné objednávky s nevytištěnými Packeta štítky",
        variant: "destructive"
      })
      return
    }

    const orderIds = selectedOrdersWithPacketa.map(row => (row.original as any).id)

    try {
      // Vygeneruj PDF se štítky
      const response = await fetch('/api/packeta/generate-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds })
      })

      if (response.ok) {
        // Otevři PDF v novém okně pro tisk
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const printWindow = window.open(url, '_blank')
        
        if (printWindow) {
          printWindow.onload = () => {
            // Automaticky spustí dialog pro tisk
            printWindow.print()
            
            // Označ objednávky jako vytištěné po zavření okna tisku
            printWindow.onafterprint = async () => {
              await markOrdersAsPrinted(orderIds)
              printWindow.close()
            }
          }
        }
        
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Úspěch",
          description: `PDF se štítky pro ${orderIds.length} objednávek bylo otevřeno pro tisk`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Chyba",
          description: error.error || "Chyba při generování štítků",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error printing labels:', error)
      toast({
        title: "Chyba",
        description: "Chyba při tisku štítků",
        variant: "destructive"
      })
    }
  }

  const markOrdersAsPrinted = async (orderIds: string[]) => {
    try {
      const response = await fetch('/api/packeta/mark-printed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds })
      })

      if (response.ok) {
        toast({
          title: "Úspěch",
          description: `${orderIds.length} objednávek bylo označeno jako vytištěno`,
        })
        // Refresh stránky pro zobrazení změn
        window.location.reload()
      } else {
        const error = await response.json()
        toast({
          title: "Chyba",
          description: error.error || "Chyba při označování objednávek",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error marking orders as printed:', error)
      toast({
        title: "Chyba",
        description: "Chyba při označování objednávek",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrovat podle zákazníka..."
          value={(table.getColumn("customer_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("customer_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center space-x-2">
          {selectedOrdersWithPacketa.length > 0 && (
            <Button
              onClick={handlePrintLabels}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Vytisknout štítky ({selectedOrdersWithPacketa.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sloupce <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Žádné výsledky.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} z{" "}
          {table.getFilteredRowModel().rows.length} řádek(ů) vybráno.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Předchozí
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Další
          </Button>
        </div>
      </div>
    </div>
  )
}
