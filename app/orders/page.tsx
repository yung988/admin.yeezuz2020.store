import Link from "next/link"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PacketaBulkPrint } from "@/components/packeta-bulk-print"
import { requireAdminOrEditor } from "@/lib/supabase-auth"
import { getOrders } from "@/lib/supabase-queries"
import { formatPrice } from "@/lib/format"
import { Eye } from "lucide-react"

export default async function OrdersPage() {
  const _user = await requireAdminOrEditor();
  const orders = await getOrders();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Čeká na platbu", variant: "secondary" as const },
      paid: { label: "Zaplaceno", variant: "default" as const },
      shipped: { label: "Odesláno", variant: "outline" as const },
      delivered: { label: "Doručeno", variant: "default" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  }

  // For now, show all orders - filtering will be implemented client-side later if needed
  const filteredOrders = orders;

  // Note: Interactive features like CSV export and Packeta actions will need
  // to be implemented as client components if needed

  return (
    <>
      <AdminHeader title="Objednávky" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Objednávky" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Hromadný tisk Packeta štítků */}
        <PacketaBulkPrint />

        <Card>
          <CardHeader>
            <CardTitle>Seznam objednávek ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo objednávky</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Zákazník</TableHead>
                  <TableHead>Celková částka</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Packeta</TableHead>
                  <TableHead className="w-[100px]">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.order_number || order.id}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(order.status).variant}>{getStatusBadge(order.status).label}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.packeta_pickup_point_id ? (
                        <span className="text-sm">Packeta</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
