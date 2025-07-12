import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProductsWithVariants } from "@/lib/supabase-queries"
import { Plus, MoreHorizontal, Edit, Trash2, Search, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function ProductsPage() {
  const products = await getProductsWithVariants();

  // Vykalkuluji statistiky
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.status === 'active').length || 0;
  const lowStockProducts = products?.filter(p => {
    const totalStock = p.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock_quantity || 0), 0) || 0;
    return totalStock < 10;
  }).length || 0;
  const variantsCount = products?.reduce((sum, p) => sum + (p.product_variants?.length || 0), 0) || 0;

  return (
    <>
      <AdminHeader title="Produkty" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Produkty" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Statistiky */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Celkem produktů</span>
              </div>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Badge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Aktivní</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Nízký sklad</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Variant</span>
              </div>
              <div className="text-2xl font-bold">{variantsCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Hledat produkty..." className="pl-8 w-[300px]" />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny kategorie</SelectItem>
                <SelectItem value="obleceni">Oblečení</SelectItem>
                <SelectItem value="doplnky">Doplňky</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="active">Aktivní</SelectItem>
                <SelectItem value="inactive">Neaktivní</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Přidat produkt
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seznam produktů ({totalProducts})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Obrázek</TableHead>
                  <TableHead>Název</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Cena</TableHead>
                  <TableHead>Varianty</TableHead>
                  <TableHead>Skladem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products && products.length > 0 ? (
                  products.map((product: any) => {
                    const totalStock = product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock_quantity || 0), 0) || 0;
                    const mainImage = product.product_images?.find((img: any) => img.sort_order === 0) || product.product_images?.[0];
                    const variantsCount = product.product_variants?.length || 0;
                    
                    return (
                      <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="relative">
                            <Image
                              src={mainImage?.url || "/placeholder.svg"}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="rounded-md object-cover border"
                            />
                            {product.product_images && product.product_images.length > 1 && (
                              <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs px-1">
                                +{product.product_images.length - 1}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {product.sku || "—"}
                          </code>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="font-mono">
                          {((product.price || 0) / 100).toLocaleString()} Kč
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{variantsCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {totalStock < 10 && totalStock > 0 && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                            {totalStock === 0 && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-sm ${
                              totalStock === 0 ? "text-red-600 font-semibold" : 
                              totalStock < 10 ? "text-orange-600" : 
                              "text-green-600"
                            }`}>
                              {totalStock} ks
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === "active" ? "default" : "secondary"}>
                            {product.status === "active" ? "Aktivní" : "Neaktivní"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/products/${product.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Upravit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/products/${product.id}?tab=variants`}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Varianty
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Smazat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Žádné produkty nenalezeny</p>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/products/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Přidat první produkt
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
