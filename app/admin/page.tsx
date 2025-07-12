import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockMetrics, mockOrders, mockSalesData } from "@/lib/mock-data"
import { Package, ShoppingCart, AlertTriangle, CreditCard } from "lucide-react"

export default function AdminDashboard() {
  const recentOrders = mockOrders.slice(0, 5)

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Čeká na platbu", variant: "secondary" as const },
      paid: { label: "Zaplaceno", variant: "default" as const },
      shipped: { label: "Odesláno", variant: "outline" as const },
      delivered: { label: "Doručeno", variant: "default" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  }

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Metriky */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkové tržby</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalRevenue.toLocaleString()} Kč</div>
              <p className="text-xs text-muted-foreground">+20.1% oproti minulému měsíci</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objednávky dnes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.todayOrders}</div>
              <p className="text-xs text-muted-foreground">{mockMetrics.monthlyOrders} tento měsíc</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produkty</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Celkem v katalogu</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nízké zásoby</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.lowStock}</div>
              <p className="text-xs text-muted-foreground">Produktů s nízkými zásobami</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Graf prodejů */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Prodeje za posledních 7 dní</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] flex items-end justify-between gap-2">
                {mockSalesData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-primary rounded-t-sm min-w-[30px]"
                      style={{
                        height: `${(data.sales / Math.max(...mockSalesData.map((d) => d.sales))) * 150}px`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{new Date(data.date).getDate()}.</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Poslední objednávky */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Poslední objednávky</CardTitle>
              <CardDescription>Nejnovější objednávky z vašeho e-shopu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.name}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{order.total} Kč</p>
                      <Badge variant={getStatusBadge(order.status).variant}>{getStatusBadge(order.status).label}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
