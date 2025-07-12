"use client";

import { Download, Eye, Package, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  shipping_method: string;
  shipping_cost: number;
  packeta_pickup_point_id: string | null;
  packeta_pickup_point_name: string | null;
  packeta_label_id: string | null;
  packeta_tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPacketaLabel = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const response = await fetch("/api/packeta/create-label", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create label");
      }

      // Aktualizovat seznam objednávek
      await fetchOrders();

      alert(`Štítek vytvořen! Tracking číslo: ${data.trackingNumber}`);
    } catch (error) {
      console.error("Error creating label:", error);
      alert(`Chyba při vytváření štítku: ${(error as Error).message}`);
    } finally {
      setProcessingOrder(null);
    }
  };

  const downloadLabel = async (packetId: string, orderNumber: string) => {
    try {
      const response = await fetch(`/api/packeta/create-label?packetId=${packetId}`);

      if (!response.ok) {
        throw new Error("Failed to download label");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packeta-label-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading label:", error);
      alert("Chyba při stahování štítku");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: "secondary" as const, label: "Čekající" },
      paid: { variant: "default" as const, label: "Zaplaceno" },
      processing: { variant: "outline" as const, label: "Zpracování" },
      shipped: { variant: "outline" as const, label: "Odesláno" },
      delivered: { variant: "outline" as const, label: "Doručeno" },
      cancelled: { variant: "destructive" as const, label: "Zrušeno" },
    };

    const config = statusMap[status as keyof typeof statusMap] || {
      variant: "secondary" as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-4">Načítání objednávek...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Správa objednávek</h1>
        <Button onClick={fetchOrders} variant="outline">
          Obnovit
        </Button>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.order_number}</CardTitle>
                  <p className="text-sm text-zinc-600">
                    {new Date(order.created_at).toLocaleDateString("cs-CZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(order.status)}
                  {getStatusBadge(order.payment_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Zákazník */}
                <div>
                  <h4 className="font-medium mb-2">Zákazník</h4>
                  <p className="text-sm">{order.customer_name}</p>
                  <p className="text-sm text-zinc-600">{order.customer_email}</p>
                  {order.customer_phone && (
                    <p className="text-sm text-zinc-600">{order.customer_phone}</p>
                  )}
                </div>

                {/* Objednávka */}
                <div>
                  <h4 className="font-medium mb-2">Objednávka</h4>
                  <p className="text-sm">
                    Celkem: {(order.total_amount / 100).toLocaleString("cs-CZ")} Kč
                  </p>
                  <p className="text-sm text-zinc-600">
                    Doprava: {(order.shipping_cost / 100).toLocaleString("cs-CZ")} Kč
                  </p>
                  <p className="text-sm text-zinc-600">Způsob: {order.shipping_method}</p>
                </div>

                {/* Packeta info */}
                {order.packeta_pickup_point_id && (
                  <div>
                    <h4 className="font-medium mb-2">Zásilkovna</h4>
                    <p className="text-sm">{order.packeta_pickup_point_name}</p>
                    <p className="text-sm text-zinc-600">ID: {order.packeta_pickup_point_id}</p>
                    {order.packeta_tracking_number && (
                      <p className="text-sm text-zinc-600">
                        Tracking: {order.packeta_tracking_number}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Akce */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Detail
                </Button>

                {order.packeta_pickup_point_id && !order.packeta_label_id && (
                  <Button
                    onClick={() => createPacketaLabel(order.id)}
                    disabled={processingOrder === order.id}
                    size="sm"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {processingOrder === order.id ? "Vytváření..." : "Vytvořit štítek"}
                  </Button>
                )}

                {order.packeta_label_id && (
                  <Button
                    onClick={() => downloadLabel(order.packeta_label_id!, order.order_number)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Stáhnout štítek
                  </Button>
                )}

                {order.packeta_label_id && order.status === "paid" && (
                  <Button size="sm" variant="outline">
                    <Truck className="w-4 h-4 mr-2" />
                    Označit jako odesláno
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-zinc-600">Žádné objednávky</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
