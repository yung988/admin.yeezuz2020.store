import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notFound } from "next/navigation"
import { OrderStatusForm } from "@/components/order-status-form"

interface OrderItem {
  product: string
  quantity: number
  price: number
}

interface ShippingAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

interface Customer {
  name: string
  email: string
  phone: string
}

interface Order {
  id: string
  customer: Customer
  items: OrderItem[]
  total: number
  status: string
  date: string
  shippingAddress: ShippingAddress
}

async function getOrder(id: string): Promise<Order | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch order')
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  
  if (!order) {
    notFound()
  }

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
      <AdminHeader
        title={`Objednávka ${order.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Objednávky", href: "/orders" },
          { label: order.id },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Informace o zákazníkovi */}
          <Card>
            <CardHeader>
              <CardTitle>Zákazník</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-2">Doručovací adresa</p>
                <div className="text-sm text-muted-foreground">
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status objednávky */}
          <Card>
            <CardHeader>
              <CardTitle>Status objednávky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span>Aktuální status:</span>
                <Badge variant={getStatusBadge(order.status).variant}>{getStatusBadge(order.status).label}</Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Změnit status:</label>
                <Select defaultValue={order.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Čeká na platbu</SelectItem>
                    <SelectItem value="paid">Zaplaceno</SelectItem>
                    <SelectItem value="shipped">Odesláno</SelectItem>
                    <SelectItem value="delivered">Doručeno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Aktualizovat status</Button>
            </CardContent>
          </Card>

          {/* Shrnutí objednávky */}
          <Card>
            <CardHeader>
              <CardTitle>Shrnutí</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Datum objednávky:</span>
                <span>{new Date(order.date).toLocaleDateString("cs-CZ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Číslo objednávky:</span>
                <span className="font-medium">{order.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Celková částka:</span>
                <span>{order.total} Kč</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objednané produkty */}
        <Card>
          <CardHeader>
            <CardTitle>Objednané produkty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.product}</p>
                    <p className="text-sm text-muted-foreground">Množství: {item.quantity}x</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.price * item.quantity} Kč</p>
                    <p className="text-sm text-muted-foreground">{item.price} Kč/ks</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Celkem:</span>
                <span>{order.total} Kč</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
