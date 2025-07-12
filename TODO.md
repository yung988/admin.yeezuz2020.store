# TODO Seznam - Admin Panel

Tento dokument obsahuje přehled všech dummy/nefunkčních tlačítek a funkcí v admin panelu, které je třeba implementovat.

## 1. Stránka pro přidání nového produktu (`/products/new/page.tsx`)

- [x] **Tlačítko "Uložit produkt"** (řádek 128) - nemá žádnou funkci

  - [x] Upravený formulář s propojenými state a odesíláním dat na API
  - [x] Vytvořena API route pro ukládání nových produktů
- [x] **Tlačítko "Nahrát obrázky"** - nemá funkcionalitu

## 2. Stránka objednávek (`/orders/page.tsx`)

- [x] **Nahradit mock data** skutečnými daty z databáze
- [x] **Implementovat API pro načítání objednávek**
- [x] **Přidat filtrování a vyhledávání** v objednávkách
- [x] **Přidat export objednávek**

## 3. Detailní stránka objednávky (`/orders/[id]/page.tsx`)

- [x] **Nahradit mock data** skutečnými daty z databáze
- [x] **Vytvořena API route pro detail objednávky**
- [x] **Tlačítko "Aktualizovat status"** (řádek 85) - implementovat funkci
- [x] **Select pro změnu statusu** - přidat funkcionalitu ukládání
- [x] **API pro aktualizaci statusu objednávky**
- [x] **Email notifikace** při změně statusu

## 4. Stránka zákazníků (`/customers/page.tsx`)

- [x] **Nahradit mock data** skutečnými daty z databáze
- [x] **API pro načítání zákazníků**
- [ ] **Detailní stránka zákazníka** s historií objednávek
- [ ] **Export seznamu zákazníků**

## 5. Stránka nastavení (`/settings/page.tsx`)

### 5.1 Obecná nastavení
- [ ] **Tlačítko "Uložit změny"** (řádek 58) - implementovat ukládání
- [ ] **API pro nastavení obchodu**

### 5.2 Nastavení dopravy
- [ ] **Tlačítko "Uložit nastavení dopravy"** (řádek 104) - implementovat
- [ ] **API pro správu dopravních metod**
- [ ] **Dynamické přidávání/odebírání dopravních metod**

### 5.3 Platební metody
- [ ] **Tlačítko "Uložit platební metody"** (řádek 138) - implementovat
- [ ] **API pro správu platebních metod**
- [ ] **Integrace s platebními bránami**

### 5.4 Email šablony
- [ ] **Tlačítko "Uložit šablonu"** (řádek 174) - implementovat
- [ ] **API pro správu email šablon**
- [ ] **WYSIWYG editor** pro email šablony

## 6. Stránka editace produktu (`/products/[id]/page.tsx`)

- [x] **Tlačítko "Uložit"** - už je funkční ✅
- [x] **Drag & drop pro pořadí obrázků** - funkční ✅
- [x] **Nahrávání obrázků** - funkční ✅
- [x] **Mazání obrázků** - funkční ✅
- [ ] **Tlačítko "Upravit" u obrázků** (řádek 797) - implementovat editaci alt textu

## 7. API chybějící funkcionality

### 7.1 Objednávky
- [x] **GET /api/orders** - načítání objednávek
- [x] **GET /api/orders/[id]** - detail objednávky
- [x] **PATCH /api/orders/[id]** - aktualizace statusu objednávky
- [x] **POST /api/orders/[id]/email** - odeslání email notifikace

### 7.2 Zákazníci
- [x] **GET /api/customers** - načítání zákazníků
- [ ] **GET /api/customers/[id]** - detail zákazníka
- [ ] **GET /api/customers/[id]/orders** - historie objednávek zákazníka

### 7.3 Nastavení
- [ ] **GET/POST /api/settings/general** - obecná nastavení
- [ ] **GET/POST /api/settings/shipping** - nastavení dopravy
- [ ] **GET/POST /api/settings/payments** - platební metody
- [ ] **GET/POST /api/settings/email-templates** - email šablony

### 7.4 Produkty
- [ ] **POST /api/products** - vytvoření nového produktu
- [ ] **GET/POST /api/products/[id]/variants** - správa variant produktu

## 8. Databázové tabulky k vytvoření

- [ ] **Tabulka `settings`** - pro uložení nastavení obchodu
- [ ] **Tabulka `shipping_methods`** - už existuje ✅
- [ ] **Tabulka `payment_methods`** - pro platební metody
- [ ] **Tabulka `email_templates`** - pro email šablony

## 9. Doplňující funkcionality

### 9.1 Dashboard
- [ ] **Export dat** do CSV/Excel
- [ ] **Pokročilé filtrování** v tabulkách
- [ ] **Notifikace** o nízkých zásobách
- [ ] **Statistiky** prodejů po kategoriích

### 9.2 Produkty
- [ ] **Bulk operace** (hromadné změny cen, statusů)
- [ ] **Import produktů** z CSV
- [ ] **Duplikování produktů**
- [ ] **SEO nastavení** (meta description, keywords)

### 9.3 Objednávky
- [ ] **Tisk objednávek** a faktur
- [ ] **Tracking čísel** pro zásilky
- [ ] **Komunikace se zákazníky** přes admin panel

### 9.4 Bezpečnost a práva
- [ ] **Role-based access control** (RBAC)
- [ ] **Audit log** změn v systému
- [ ] **Two-factor authentication** (2FA)

## 10. UI/UX vylepšení

- [ ] **Loading states** pro všechny asynchronní operace
- [ ] **Error handling** a user-friendly chybové zprávy
- [ ] **Breadcrumbs** navigace
- [ ] **Keyboard shortcuts** pro časté operace
- [ ] **Responsive design** pro mobilní zařízení
- [ ] **Dark mode** toggle

---

## Priorita implementace

### 🔥 Vysoká priorita
1. Nová stránka produktu s funkčním formulářem
2. Správa objednávek se skutečnými daty
3. API pro změnu statusu objednávek

### 🟡 Střední priorita
4. Správa zákazníků
5. Základní nastavení obchodu
6. Email notifikace

### 🟢 Nízká priorita
7. Pokročilé funkcionality (bulk operace, import/export)
8. UI/UX vylepšení
9. Bezpečnostní funkce

---

*Poslední aktualizace: 12. 7. 2025*

## Poznámky k dokončeným úkolům

### Zákazníci (dokončeno)
- Nahrazena mock data skutečnými daty z databáze Supabase na stránce `/customers/page.tsx`
- Vytvořen API endpoint `/api/customers` pro načítání zákazníků s agregovanými daty objednávek
- Implementováno filtrování zákazníků podle jména a emailu
- Přidán loading state během načítání dat
