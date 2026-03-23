import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import AdminAccessGrantTab from "@/components/admin-system/AdminAccessGrantTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminGrantAccess() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to grant access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Grant Access
            </h1>
            <p className="text-muted-foreground">
              Grant courses, paths, Sri Yantra, Creative Soul, Stargate, and membership tiers that match the live app:{' '}
              <span className="text-foreground font-medium">Prana–Flow</span> (rank 1),{' '}
              <span className="text-foreground font-medium">Siddha–Quantum</span> (rank 2),{' '}
              <span className="text-foreground font-medium">Akasha–Infinity</span> (lifetime, rank 3)—without payment.
            </p>
          </div>
        </div>

        <AdminAccessGrantTab />
      </div>
    </div>
  );
}
