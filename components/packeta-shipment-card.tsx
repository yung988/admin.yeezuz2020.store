"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PacketaShipmentCardProps {
  orderId: string
  hasPacketaPickupPoint: boolean
  packetaLabelId?: string
  packetaTrackingNumber?: string
  packetaPickupPointName?: string
}

export function PacketaShipmentCard({ 
  orderId, 
  hasPacketaPickupPoint, 
  packetaLabelId, 
  packetaTrackingNumber, 
  packetaPickupPointName 
}: PacketaShipmentCardProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createShipment = async () => {
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
        // Refresh stránky pro zobrazení nových údajů
        window.location.reload()
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

  const generateSingleLabel = async () => {
    if (!packetaLabelId) return
    
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

  if (!hasPacketaPickupPoint) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Packeta zásilka
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {packetaPickupPointName && (
          <div>
            <span className="font-medium">Výdejní místo:</span>
            <p className="text-sm text-muted-foreground">{packetaPickupPointName}</p>
          </div>
        )}

        {packetaLabelId ? (
          <>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant="default">Zásilka vytvořena</Badge>
            </div>
            
            {packetaTrackingNumber && (
              <div>
                <span className="font-medium">Tracking číslo:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {packetaTrackingNumber}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://www.zasilkovna.cz/sledovani?id=${packetaTrackingNumber}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Sledovat
                  </Button>
                </div>
              </div>
            )}

            <div>
              <span className="font-medium">Label ID:</span>
              <p className="text-sm text-muted-foreground font-mono">{packetaLabelId}</p>
            </div>

            <Button 
              onClick={generateSingleLabel} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              <Truck className="h-4 w-4 mr-2" />
              {loading ? "Generování..." : "Stáhnout štítek"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant="secondary">Zásilka nevytvořena</Badge>
            </div>
            
            <Button 
              onClick={createShipment} 
              disabled={loading}
              className="w-full"
            >
              <Package className="h-4 w-4 mr-2" />
              {loading ? "Vytváření..." : "Vytvořit Packeta zásilku"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
