import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Nastavení" breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Nastavení" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Obecné</TabsTrigger>
            <TabsTrigger value="shipping">Doprava</TabsTrigger>
            <TabsTrigger value="payments">Platby</TabsTrigger>
            <TabsTrigger value="emails">Emaily</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Základní informace o e-shopu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop-name">Název e-shopu</Label>
                    <Input id="shop-name" defaultValue="Fashion Store" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-email">Kontaktní email</Label>
                    <Input id="shop-email" type="email" defaultValue="info@fashionstore.cz" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-description">Popis e-shopu</Label>
                  <Textarea
                    id="shop-description"
                    defaultValue="Moderní e-shop s oblečením pro všechny příležitosti."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop-phone">Telefon</Label>
                    <Input id="shop-phone" defaultValue="+420 123 456 789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-address">Adresa</Label>
                    <Input id="shop-address" defaultValue="Václavské náměstí 1, Praha" />
                  </div>
                </div>
                <Button>Uložit změny</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nastavení dopravy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Česká pošta</Label>
                      <p className="text-sm text-muted-foreground">Standardní doručení</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input className="w-24" defaultValue="99" />
                      <span>Kč</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>PPL</Label>
                      <p className="text-sm text-muted-foreground">Rychlé doručení</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input className="w-24" defaultValue="149" />
                      <span>Kč</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Osobní odběr</Label>
                      <p className="text-sm text-muted-foreground">Zdarma</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input className="w-24" defaultValue="0" />
                      <span>Kč</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                <Button>Uložit nastavení dopravy</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platební metody</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bankovní převod</Label>
                      <p className="text-sm text-muted-foreground">Platba předem</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Platební karta</Label>
                      <p className="text-sm text-muted-foreground">Online platba</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dobírka</Label>
                      <p className="text-sm text-muted-foreground">Platba při doručení</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Button>Uložit platební metody</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email šablony</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-template">Typ šablony</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte šablonu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order-confirmation">Potvrzení objednávky</SelectItem>
                      <SelectItem value="order-shipped">Objednávka odeslána</SelectItem>
                      <SelectItem value="order-delivered">Objednávka doručena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Předmět emailu</Label>
                  <Input id="email-subject" defaultValue="Potvrzení vaší objednávky" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-content">Obsah emailu</Label>
                  <Textarea
                    id="email-content"
                    rows={8}
                    defaultValue="Děkujeme za vaši objednávku. Vaše objednávka byla úspěšně přijata a bude zpracována v nejbližší době."
                  />
                </div>
                <Button>Uložit šablonu</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
