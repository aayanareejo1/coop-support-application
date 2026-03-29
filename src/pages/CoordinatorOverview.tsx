import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle, Users } from "lucide-react";

const CoordinatorOverview = () => {
  const { data: applications } = useQuery({
    queryKey: ["all-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["all-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_reports").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: evaluations } = useQuery({
    queryKey: ["all-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evaluations").select("*");
      if (error) throw error;
      return data;
    },
  });

  const accepted = applications?.filter((a) => a.status === "accepted").length ?? 0;
  const rejected = applications?.filter((a) => a.status === "rejected").length ?? 0;
  const pending = applications?.filter((a) => a.status === "pending").length ?? 0;
  const provisional = applications?.filter((a) => a.status === "provisional").length ?? 0;
  const totalReports = reports?.length ?? 0;
  const missingReports = accepted - totalReports;
  const totalEvaluations = evaluations?.length ?? 0;

  const stats = [
    { label: "Accepted", value: accepted, icon: CheckCircle, color: "text-[hsl(var(--success))]" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "text-destructive" },
    { label: "Pending", value: pending, icon: Clock, color: "text-[hsl(var(--warning))]" },
    { label: "Provisional", value: provisional, icon: Clock, color: "text-primary" },
    { label: "Reports Submitted", value: totalReports, icon: FileText, color: "text-primary" },
    { label: "Missing Reports", value: Math.max(0, missingReports), icon: AlertTriangle, color: "text-destructive" },
    { label: "Evaluations", value: totalEvaluations, icon: Users, color: "text-[hsl(var(--accent))]" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Reporting Dashboard
          </h1>
          <p className="text-muted-foreground">Summary of applications, reports, and evaluations</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default CoordinatorOverview;
