import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm shadow-xl border-none">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-primary mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md">
            {/* Cloud Logo Placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">HillDash Admin</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@hilldash.com"
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="focus-visible:ring-primary"
              />
            </div>
            {message && (
              <p className="text-sm font-medium text-destructive">{message}</p>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button form="login-form" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
