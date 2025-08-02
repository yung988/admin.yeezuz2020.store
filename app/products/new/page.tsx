"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sku: "",
    status: "active"
  })
  
  const [variants, setVariants] = useState([
    { size: "S", stock: 0 },
    { size: "M", stock: 0 },
    { size: "L", stock: 0 },
    { size: "XL", stock: 0 },
  ])
  
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; alt: string }>>([])
  const [productId, setProductId] = useState<string | null>(null)

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true)
    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('images', file))
    try {
      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        throw new Error('Failed to upload images')
      }
      const uploaded = await response.json()
      setUploadedImages(uploaded)
      toast.success('Obrázky úspěšně nahrané')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Chyba při nahrávání obrázků')
    } finally {
      setUploadingImages(false)
    }
  }

  const updateVariantStock = (index: number, stock: number) => {
    const newVariants = [...variants]
    newVariants[index].stock = stock
    setVariants(newVariants)
  }
  
  const saveProduct = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Název a cena jsou povinné")
      return
    }
    
    try {
      setLoading(true)
      
      // Převod ceny na haléře
      const priceInCents = Math.round(parseFloat(formData.price) * 100)
      
      const productPayload = {
        ...formData,
        price: priceInCents,
        variants: variants.filter(v => v.stock > 0) // Pouze varianty se skladem
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productPayload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Chyba při vytváření produktu')
      }
      
      const newProduct = await response.json()
      toast.success('Produkt byl úspěšně vytvořen')
      
      // Přesměrování na stránku produktu
      router.push(`/products/${newProduct.id}`)
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(error instanceof Error ? error.message : 'Chyba při vytváření produktu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AdminHeader
        title="Přidat produkt"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Produkty", href: "/products" },
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
                <Input 
                  id="name" 
                  placeholder="Zadejte název produktu" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea 
                  id="description" 
                  placeholder="Zadejte popis produktu" 
                  rows={4} 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Cena (Kč)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01"
                    placeholder="1600" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Zadejte cenu v korunách (např. 1600)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input 
                    id="sku" 
                    placeholder="PRD-001" 
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                <Switch 
                  id="active" 
                  checked={formData.status === "active"}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })}
                />
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
          <Button onClick={saveProduct} disabled={loading}>
            {loading ? "Ukládám..." : "Uložit produkt"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Zrušit</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
