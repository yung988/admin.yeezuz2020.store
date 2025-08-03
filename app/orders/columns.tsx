"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, CheckCircle2, Eye } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export type Order = {
  id: string
  order_number?: string
  customer_name?: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  currency: string
  status: string
  payment_status: string
  shipping_method?: string
  packeta_pickup_point_id?: string
  packeta_pickup_point_name?: string
  packeta_label_id?: string
  packeta_tracking_number?: string
  packeta_printed?: boolean
  packeta_printed_at?: string
  created_at: string
  updated_at: string
}

const getStatusBadge = (status: string) => {
  const statusMap = {
    pending: { label: "Čeká na platbu", variant: "secondary" as const },
    confirmed: { label: "Potvrzeno", variant: "default" as const },
    paid: { label: "Zaplaceno kartou", variant: "default" as const },
    shipped: { label: "Odesláno", variant: "outline" as const },
    delivered: { label: "Doručeno", variant: "default" as const },
    cancelled: { label: "Zrušeno", variant: "destructive" as const },
  }
  return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
}

const formatPrice = (amount: number, currency: string = "CZK") => {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: currency,
  }).format(amount / 100) // Assuming amount is in cents
}

export const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Vybrat všechny"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Vybrat řádek"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "order_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Číslo objednávky
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const order = row.original
      const orderNumber = order.order_number || order.id.slice(0, 8)
      
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <Link 
              href={`/orders/${order.id}`} 
              className="font-medium hover:underline text-blue-600"
            >
              #{orderNumber}
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem asChild>
              <Link href={`/orders/${order.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Zobrazit detail
              </Link>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => navigator.clipboard.writeText(`${order.id}`)}
            >
              Zkopírovat ID
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Datum
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="text-sm">
          {date.toLocaleDateString("cs-CZ")}
        </div>
      )
    },
  },
  {
    accessorKey: "customer_name",
    header: "Zákazník",
    cell: ({ row }) => {
      const order = row.original
      return (
        <div>
          <div className="font-medium">{order.customer_name || "—"}</div>
          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
          {order.customer_phone && (
            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end"
        >
          Částka
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const order = row.original
      return (
        <div className="text-right font-medium">
          {formatPrice(order.total_amount, order.currency)}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const badge = getStatusBadge(status)
      
      return (
        <Badge variant={badge.variant}>
          {badge.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "shipping_method",
    header: "Doprava",
    cell: ({ row }) => {
      const order = row.original
      
      if (order.packeta_pickup_point_id) {
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <span>Zásilkovna</span>
              {order.packeta_printed && (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              )}
            </div>
            {order.packeta_pickup_point_name && (
              <div className="text-xs text-muted-foreground truncate max-w-32">
                {order.packeta_pickup_point_name}
              </div>
            )}
          </div>
        )
      }
      
      return (
        <span className="text-sm text-muted-foreground">
          {order.shipping_method === 'standard' ? 'Standardní' : order.shipping_method || '—'}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Otevřít menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akce</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Zkopírovat ID objednávky
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}`}>
                Zobrazit detail
              </Link>
            </DropdownMenuItem>
            {order.packeta_tracking_number && (
              <DropdownMenuItem
                onClick={() => window.open(`https://www.zasilkovna.cz/sledovani?id=${order.packeta_tracking_number}`, '_blank')}
              >
                Sledovat zásilku
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
