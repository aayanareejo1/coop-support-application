import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success("Password reset email sent!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CSA
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Reset Password
          </h1>
          <p className="mt-2 text-muted-foreground">
            We'll send you a link to reset your password
          </p>
        </div>

        <Card>
          {sent ? (
            <>
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Check your email</CardTitle>
                <CardDescription className="text-center">
                  We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  Try a different email
                </Button>
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to sign in
                </Link>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleReset}>
              <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>Enter your email address and we'll send you a reset link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
