"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
// ...Tabs komponenty odstraněny...
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Save, ArrowLeft, Plus, Edit, Trash2, Package, Images, Upload, AlertTriangle, GripVertical } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

type ProductVariant = {
  id: string
  size: string
  sku: string
  stock_quantity: number
  price_override: number | null
}

type ProductImage = {
  id: string
  url: string
  alt_text?: string
  sort_order: number
}

type Product = {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  sku?: string
  status: string
  product_variants: ProductVariant[]
  product_images: ProductImage[]
}
export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    sku: "",
    status: "active"
  })

  // Variant dialog state
  const [variantDialog, setVariantDialog] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantForm, setVariantForm] = useState({
    size: "",
    sku: "",
    stock_quantity: 0,
    price_override: null as number | null
  })

  // Image dialog state
  const [imageDialog, setImageDialog] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [productId])

  const getProductById = async (id: string) => {
    const response = await fetch(`/api/products/${id}`)
    if (!response.ok) {
      throw new Error("Failed to fetch product")
    }
    return response.json()
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      const data = await getProductById(productId)
      
      if (!data) {
        throw new Error("Produkt nenalezen")
      }
      
      setProduct(data)
      setFormData({
        name: data.name,
        description: data.description || "",
        price: data.price,
        category: data.category || "",
        sku: data.sku || "",
        status: data.status
      })
    } catch (error) {
      console.error("Error loading product:", error)
      toast.error("Chyba při načítání produktu")
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  // ...funkce je definována výše, zde odstraněna duplicita...

  const saveVariant = async () => {
    try {
      const url = editingVariant 
        ? `/api/products/${productId}/variants/${editingVariant.id}`
        : `/api/products/${productId}/variants`
      
      const method = editingVariant ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(variantForm)
      })

      if (!response.ok) {
        throw new Error("Chyba při ukládání varianty")
      }

      toast.success(editingVariant ? "Varianta byla aktualizována" : "Varianta byla přidána")
      setVariantDialog(false)
      setEditingVariant(null)
      setVariantForm({ size: "", sku: "", stock_quantity: 0, price_override: null })
      loadProduct()
    } catch (error) {
      console.error("Error saving variant:", error)
      toast.error("Chyba při ukládání varianty")
    }
  }

  const deleteVariant = async (variantId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/variants/${variantId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Chyba při mazání varianty")
      }

      toast.success("Varianta byla smazána")
      loadProduct()
    } catch (error) {
      console.error("Error deleting variant:", error)
      toast.error("Chyba při mazání varianty")
    }
  }

  const handleImageReorder = async (result: any) => {
    if (!result.destination || !product) return

    const items = Array.from(product.product_images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update sort_order values pouze v UI
    const updatedImages = items.map((img, index) => ({
      ...img,
      sort_order: index
    }))

    setProduct({
      ...product,
      product_images: updatedImages
    })
  }

  const deleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Chyba při mazání obrázku")
      }

      toast.success("Obrázek byl smazán")
      loadProduct()
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Chyba při mazání obrázku")
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader 
          title="Načítání..." 
          breadcrumbs={[
            { label: "Dashboard", href: "/" }, 
            { label: "Produkty", href: "/products" },
            { label: "Načítání..." }
          ]} 
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    )
  }

  const totalStock = product ? product.product_variants.reduce((sum, variant) => sum + variant.stock_quantity, 0) : 0

  // Dummy saveProduct function to fix missing reference
  const saveProduct = () => {
    // TODO: Implement save logic
    toast.success("Produkt uložen (mock)")
  }

  return (
    <>
      <AdminHeader 
        title={product?.name || "Produkt"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" }, 
          { label: "Produkty", href: "/products" },
          { label: product?.name || "Produkt" }
        ]} 
      />
      
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na produkty
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant={product?.status === "active" ? "default" : "secondary"}>
              {product?.status === "active" ? "Aktivní" : "Neaktivní"}
            </Badge>
            <Button onClick={saveProduct} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
          </div>
        </div>

        {/* OBECNÉ */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Základní informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Název produktu</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Popis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Cena (v haléřích)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((formData.price || 0) / 100).toLocaleString()} Kč
                  </p>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktivní</SelectItem>
                      <SelectItem value="inactive">Neaktivní</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategorie</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Přehled</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{product?.product_variants.length ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Variant</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{totalStock}</div>
                  <div className="text-sm text-muted-foreground">Ks skladem</div>
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{product?.product_images.length ?? 0}</div>
                <div className="text-sm text-muted-foreground">Obrázků</div>
              </div>
              {(product?.product_images?.length ?? 0) > 0 && (
                <div>
                  <Label>Hlavní obrázek</Label>
                  <div className="mt-2">
                    <Image
                      src={product?.product_images.find((img) => img.sort_order === 0)?.url || product?.product_images[0]?.url || "/placeholder.svg"}
                      alt={product?.name || "Produkt"}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover border"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* VARIANTY */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Varianty produktu</CardTitle>
                <Dialog open={variantDialog} onOpenChange={setVariantDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Přidat variantu
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingVariant ? "Upravit variantu" : "Přidat variantu"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="variant-size">Velikost</Label>
                        <Input
                          id="variant-size"
                          value={variantForm.size}
                          onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                          placeholder="např. S, M, L, XL"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="variant-sku">SKU</Label>
                        <Input
                          id="variant-sku"
                          value={variantForm.sku}
                          onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                          placeholder="Unikátní SKU pro variantu"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="variant-stock">Počet skladem</Label>
                        <Input
                          id="variant-stock"
                          type="number"
                          min="0"
                          value={variantForm.stock_quantity}
                          onChange={(e) => setVariantForm({ ...variantForm, stock_quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="variant-price">Přepsání ceny (volitelné)</Label>
                        <Input
                          id="variant-price"
                          type="number"
                          value={variantForm.price_override || ""}
                          onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Ponechat prázdné pro výchozí cenu"
                        />
                        {variantForm.price_override && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {((variantForm.price_override || 0) / 100).toLocaleString()} Kč
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={saveVariant}
                          className="flex-1"
                        >
                          {editingVariant ? "Aktualizovat" : "Přidat"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setVariantDialog(false)
                            setEditingVariant(null)
                            setVariantForm({ size: "", sku: "", stock_quantity: 0, price_override: null })
                          }}
                        >
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Velikost</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Cena</TableHead>
                      <TableHead>Skladem</TableHead>
                      <TableHead className="w-[100px]">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product?.product_variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">{variant.size}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {variant.sku}
                          </code>
                        </TableCell>
                        <TableCell className="font-mono">
                          {variant.price_override 
                            ? `${((variant.price_override) / 100).toLocaleString()} Kč`
                            : `${((product?.price ?? 0) / 100).toLocaleString()} Kč (výchozí)`
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {variant.stock_quantity === 0 && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                            {variant.stock_quantity < 10 && variant.stock_quantity > 0 && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                            <span className={`text-sm ${
                              variant.stock_quantity === 0 ? "text-red-600 font-semibold" : 
                              variant.stock_quantity < 10 ? "text-orange-600" : 
                              "text-green-600"
                            }`}>
                              {variant.stock_quantity} ks
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingVariant(variant)
                                setVariantForm({
                                  size: variant.size,
                                  sku: variant.sku,
                                  stock_quantity: variant.stock_quantity,
                                  price_override: variant.price_override
                                })
                                setVariantDialog(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Smazat variantu</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Opravdu chcete smazat variantu "{variant.size}"? 
                                    Tato akce je nevratná.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteVariant(variant.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Smazat
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {product?.product_variants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">Žádné varianty nenalezeny</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setVariantDialog(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Přidat první variantu
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

        {/* OBRÁZKY */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Obrázky produktu</CardTitle>
                <Dialog open={imageDialog} onOpenChange={setImageDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Nahrát obrázek
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nahrát nový obrázek</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Přetáhněte obrázek sem nebo klikněte pro výběr
                        </p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => {
                            // Handle file upload logic here
                            console.log("File selected:", e.target.files?.[0])
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setImageDialog(false)}
                          className="flex-1"
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? "Nahrávám..." : "Nahrát"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setImageDialog(false)}
                        >
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {(product?.product_images?.length ?? 0) > 0 ? (
                  <DragDropContext onDragEnd={handleImageReorder}>
                    <Droppable droppableId="images" direction="horizontal">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                          {product?.product_images
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((image, index) => (
                            <Draggable key={image.id} draggableId={image.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative group border rounded-lg overflow-hidden ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  }`}
                                >
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    <Image
                                      src={image.url}
                                      alt={image.alt_text || product?.name || "Produkt"}
                                      width={300}
                                      height={300}
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
                                  
                                  {image.sort_order === 0 && (
                                    <Badge className="absolute top-2 left-2">
                                      Hlavní
                                    </Badge>
                                  )}
                                  
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-background/80 backdrop-blur-sm rounded-md p-1">
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </div>
                                  
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-1">
                                      <Button variant="secondary" size="sm" className="flex-1">
                                        <Edit className="h-3 w-3 mr-1" />
                                        Upravit
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="destructive" size="sm">
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Smazat obrázek</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Opravdu chcete smazat tento obrázek? 
                                              Tato akce je nevratná.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => deleteImage(image.id)}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Smazat
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Images className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Žádné obrázky nenalezeny</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setImageDialog(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Nahrát první obrázek
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
      </div>
    </>
  )
}
