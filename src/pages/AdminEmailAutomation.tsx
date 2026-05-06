import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EmailManager from "@/components/admin/EmailManager";

export default function AdminEmailAutomation() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/admin/email-list")}>
        ← Back to email list
      </Button>
      <EmailManager />
    </div>
  );
}
