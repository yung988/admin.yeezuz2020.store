import { AdminHeader } from "@/components/admin-header"
import { requireAdminOrEditor } from "@/lib/supabase-auth"
import { getOrders } from "@/lib/supabase-queries"
import { DataTable } from "./data-table"
import { columns, Order } from "./columns"

export default async function OrdersPage() {
  const _user = await requireAdminOrEditor();
  const orders = await getOrders();


  return (
    <>
      <AdminHeader title="Objednávky" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Objednávky" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <DataTable columns={columns} data={orders} />
      </div>
    </>
  )
}
