import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle, Users, Flag } from "lucide-react";
import { toast } from "sonner";

const CoordinatorOverview = () => {
  const queryClient = useQueryClient();

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

  const { data: placementIssues } = useQuery({
    queryKey: ["placement-issues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("placement_issues").select("*").eq("resolved", false);
      if (error) throw error;
      return data;
    },
  });

  const resolveIssue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("placement_issues")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Issue resolved");
      queryClient.invalidateQueries({ queryKey: ["placement-issues"] });
    },
  });

  const provAccepted = applications?.filter((a) => a.status === "provisional_accepted").length ?? 0;
  const provRejected = applications?.filter((a) => a.status === "provisional_rejected").length ?? 0;
  const accepted = applications?.filter((a) => a.status === "accepted").length ?? 0;
  const rejected = applications?.filter((a) => a.status === "rejected").length ?? 0;
  const pending = applications?.filter((a) => a.status === "pending").length ?? 0;
  const totalReports = reports?.length ?? 0;
  const missingReports = Math.max(0, accepted - totalReports);

  const reportedStudentIds = new Set(reports?.map((r) => r.student_id));
  const missingEvaluations = applications?.filter((a) => a.status === "accepted" && !reportedStudentIds.has(a.student_id)).length ?? 0;

  const stats = [
    { label: "Prov. Accepted", value: provAccepted, icon: CheckCircle, color: "text-primary" },
    { label: "Prov. Rejected", value: provRejected, icon: XCircle, color: "text-[hsl(var(--warning))]" },
    { label: "Finally Accepted", value: accepted, icon: CheckCircle, color: "text-[hsl(var(--success))]" },
    { label: "Finally Rejected", value: rejected, icon: XCircle, color: "text-destructive" },
    { label: "Pending", value: pending, icon: Clock, color: "text-muted-foreground" },
    { label: "Missing Reports", value: missingReports, icon: FileText, color: "text-destructive" },
    { label: "No Report Submitted", value: missingEvaluations, icon: Users, color: "text-destructive" },
    { label: "Placement Issues", value: placementIssues?.length ?? 0, icon: Flag, color: "text-[hsl(var(--warning))]" },
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

        {/* Placement Issues Section */}
        {placementIssues && placementIssues.length > 0 && (
          <Card className="border-[hsl(var(--warning))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
                Active Placement Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placementIssues.map((issue) => {
                    const app = applications?.find((a) => a.student_id === issue.student_id);
                    return (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{app?.name ?? issue.student_id.slice(0, 8)}</TableCell>
                        <TableCell>{issue.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveIssue.mutate(issue.id)}
                            disabled={resolveIssue.isPending}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default CoordinatorOverview;
