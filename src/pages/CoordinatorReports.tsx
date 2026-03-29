import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle } from "lucide-react";

const CoordinatorReports = () => {
  const { data: applications } = useQuery({
    queryKey: ["accepted-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("status", "accepted");
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

  const { data: deadlines } = useQuery({
    queryKey: ["deadlines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deadlines").select("*");
      if (error) throw error;
      return data;
    },
  });

  const reportsByStudent = new Map(reports?.map((r) => [r.student_id, r]));
  const deadline = deadlines?.[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Work-Term Reports
          </h1>
          <p className="text-muted-foreground">
            Track report submissions from accepted students
          </p>
        </div>

        {deadline && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm">
                Report deadline: <strong>{new Date(deadline.deadline_date).toLocaleDateString()}</strong>
              </span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Accepted Students & Report Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student #</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications?.map((app) => {
                  const report = reportsByStudent.get(app.student_id);
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>{app.student_number}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>
                        {report ? (
                          <Badge variant="default" className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                            <CheckCircle className="mr-1 h-3 w-3" /> Submitted
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" /> Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report ? new Date(report.submitted_at).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!applications || applications.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No accepted students yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CoordinatorReports;
