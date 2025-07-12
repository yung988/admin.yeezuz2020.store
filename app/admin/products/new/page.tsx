"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload } from "lucide-react"
import Link from "next/link"

export default function NewProductPage() {
  const [variants, setVariants] = useState([
    { size: "S", stock: 0 },
    { size: "M", stock: 0 },
    { size: "L", stock: 0 },
    { size: "XL", stock: 0 },
  ])

  const updateVariantStock = (index: number, stock: number) => {
    const newVariants = [...variants]
    newVariants[index].stock = stock
    setVariants(newVariants)
  }

  return (
    <>
      <AdminHeader
        title="Přidat produkt"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Produkty", href: "/admin/products" },
          { label: "Přidat produkt" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Základní informace */}
          <Card>
            <CardHeader>
              <CardTitle>Základní informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Název produktu</Label>
                <Input id="name" placeholder="Zadejte název produktu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea id="description" placeholder="Zadejte popis produktu" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Cena (Kč)</Label>
                  <Input id="price" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="PRD-001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tricka">Trička</SelectItem>
                    <SelectItem value="kalhoty">Kalhoty</SelectItem>
                    <SelectItem value="bundy">Bundy</SelectItem>
                    <SelectItem value="sukne">Sukně</SelectItem>
                    <SelectItem value="saty">Šaty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Aktivní produkt</Label>
              </div>
            </CardContent>
          </Card>

          {/* Obrázky */}
          <Card>
            <CardHeader>
              <CardTitle>Obrázky produktu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <Button variant="outline">Nahrát obrázky</Button>
                  <p className="mt-2 text-sm text-muted-foreground">Přetáhněte soubory sem nebo klikněte pro výběr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Varianty */}
        <Card>
          <CardHeader>
            <CardTitle>Varianty produktu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {variants.map((variant, index) => (
                <div key={variant.size} className="space-y-2">
                  <Label>Velikost {variant.size}</Label>
                  <Input
                    type="number"
                    placeholder="Počet kusů"
                    value={variant.stock}
                    onChange={(e) => updateVariantStock(index, Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Akce */}
        <div className="flex items-center gap-4">
          <Button>Uložit produkt</Button>
          <Button variant="outline" asChild>
            <Link href="/admin/products">Zrušit</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
