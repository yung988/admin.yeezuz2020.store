"use client"

import { useEffect, useState } from "react";
import Link from "next/link"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Download, Package, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: string
  created_at: string
  packeta_pickup_point_id?: string
  packeta_pickup_point_name?: string
  packeta_label_id?: string
  packeta_tracking_number?: string
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Čeká na platbu", variant: "secondary" as const },
      paid: { label: "Zaplaceno", variant: "default" as const },
      shipped: { label: "Odesláno", variant: "outline" as const },
      delivered: { label: "Doručeno", variant: "default" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const createPacketaShipment = async (orderId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/packeta/create-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Úspěch",
          description: data.message || "Packeta zásilka byla vytvořena",
        })
        // Refresh orders
        const ordersResponse = await fetch("/api/orders")
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setOrders(ordersData)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Chyba",
          description: error.error || "Chyba při vytváření zásilky",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating shipment:', error)
      toast({
        title: "Chyba",
        description: "Chyba při vytváření zásilky",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadPacketaLabel = async (orderId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/packeta/generate-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: [orderId] })
      })

      if (response.ok) {
        // Stáhni PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `packeta-label-${orderId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Úspěch",
          description: "Štítek byl stažen",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Chyba",
          description: error.error || "Chyba při generování štítku",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating label:', error)
      toast({
        title: "Chyba",
        description: "Chyba při generování štítku",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const csvData = filteredOrders.map(order => ({
      'Číslo objednávky': order.order_number || order.id,
      'Datum': new Date(order.created_at).toLocaleDateString("cs-CZ"),
      'Zákazník - Jméno': order.customer_name,
      'Zákazník - Email': order.customer_email,
      'Celková částka': (order.total_amount / 100).toLocaleString(),
      'Status': getStatusBadge(order.status).label
    }))
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(';'),
      ...csvData.map(row => Object.values(row).join(';'))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `objednavky_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <>
      <AdminHeader title="Objednávky" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Objednávky" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat objednávky..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny statusy</SelectItem>
              <SelectItem value="pending">Čeká na platbu</SelectItem>
              <SelectItem value="paid">Zaplaceno</SelectItem>
              <SelectItem value="shipped">Odesláno</SelectItem>
              <SelectItem value="delivered">Doručeno</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

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
                    <TableCell>{(order.total_amount / 100).toLocaleString()} Kč</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(order.status).variant}>{getStatusBadge(order.status).label}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.packeta_pickup_point_id ? (
                        <div className="flex items-center gap-1">
                          {order.packeta_label_id ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => downloadPacketaLabel(order.id)}
                              disabled={loading}
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => createPacketaShipment(order.id)}
                              disabled={loading}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
