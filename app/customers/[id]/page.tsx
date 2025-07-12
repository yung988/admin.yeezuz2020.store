"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  created_at: string
  stats: {
    totalOrders: number
    totalSpent: number
    averageOrderValue: number
    statusStats: Record<string, number>
  }
  recentOrders: Array<{
    id: string
    total_amount: number
    status: string
    created_at: string
  }>
}

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchCustomer() {
      try {
        const response = await fetch(`/api/customers/${id}`)
        if (response.ok) {
          const data = await response.json()
          setCustomer(data)
        } else {
          setError('Zákazník nenalezen')
        }
      } catch (error) {
        console.error('Error fetching customer:', error)
        setError('Chyba při načítání zákazníka')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [id])

  if (loading) return <p>Načítání...</p>
  if (!customer) return <p>Zákazník nenalezen</p>

  return (
    <>
      <AdminHeader title={`Detail zákazníka: ${customer.name}`} breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Zákazníci", href: "/customers" }, { label: customer.name }]} />
      <Card>
        <CardHeader>
          <CardTitle>Informace o zákazníkovi</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {customer.email}</p>
          <p>Telefon: {customer.phone || '-'}</p>
          <p>Celkově utraceno: {customer.totalSpent}</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Historie objednávek</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID objednávky</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Celková částka</TableHead>
                <TableHead>Datum vytvoření</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.total_amount}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

