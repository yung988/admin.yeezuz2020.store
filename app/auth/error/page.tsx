import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Chyba autentizace
          </CardTitle>
          <CardDescription>
            Něco se pokazilo při ověřování vašeho účtu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>Možné příčiny:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Platnost odkazu vypršela</li>
              <li>Odkaz byl již použit</li>
              <li>Neplatný nebo poškozený odkaz</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Link href="/auth/signin">
              <Button className="w-full">
                Zpět na přihlášení
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
