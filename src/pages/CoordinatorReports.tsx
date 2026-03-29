import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, XCircle, Bell, Upload, Clock } from "lucide-react";
import { toast } from "sonner";

const CoordinatorReports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: extensions } = useQuery({
    queryKey: ["all-extensions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deadline_extensions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reminderLogs } = useQuery({
    queryKey: ["reminder-logs", "report"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reminder_logs").select("*").eq("reminder_type", "report").order("sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: templateFile } = useQuery({
    queryKey: ["report-template-file"],
    queryFn: async () => {
      const { data } = await supabase.storage.from("templates").list("", { limit: 10, search: "report-template" });
      return data && data.length > 0 ? data[0] : null;
    },
  });

  const sendReminder = useMutation({
    mutationFn: async (app: { student_id: string; email: string; name: string }) => {
      const { error } = await supabase.from("reminder_logs").insert({
        recipient_id: app.student_id,
        recipient_email: app.email,
        reminder_type: "report",
        sent_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder logged successfully");
      queryClient.invalidateQueries({ queryKey: ["reminder-logs"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadTemplate = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `report-template${file.name.substring(file.name.lastIndexOf("."))}`;
      // Delete existing template first
      if (templateFile) {
        await supabase.storage.from("templates").remove([templateFile.name]);
      }
      const { error } = await supabase.storage.from("templates").upload(fileName, file, { upsert: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template uploaded!");
      queryClient.invalidateQueries({ queryKey: ["report-template-file"] });
      queryClient.invalidateQueries({ queryKey: ["report-template"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const reportsByStudent = new Map(reports?.map((r) => [r.student_id, r]));
  const extensionsByStudent = new Map<string, typeof extensions extends (infer T)[] | undefined ? T : never>();
  extensions?.forEach((ext) => {
    if (!extensionsByStudent.has(ext.student_id) || new Date(ext.created_at) > new Date(extensionsByStudent.get(ext.student_id)!.created_at)) {
      extensionsByStudent.set(ext.student_id, ext);
    }
  });
  const lastReminderByStudent = new Map<string, string>();
  reminderLogs?.forEach((log) => {
    if (!lastReminderByStudent.has(log.recipient_id)) {
      lastReminderByStudent.set(log.recipient_id, log.sent_at);
    }
  });
  const deadline = deadlines?.[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Work-Term Reports
          </h1>
          <p className="text-muted-foreground">Track report submissions from accepted students</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {deadline && (
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  Default deadline: <strong>{new Date(deadline.deadline_date).toLocaleDateString()}</strong>
                </span>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Report Template</p>
                  <p className="text-xs text-muted-foreground">{templateFile ? templateFile.name : "No template uploaded"}</p>
                </div>
              </div>
              <div>
                <Input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="w-[200px]"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadTemplate.mutate(file);
                  }}
                  disabled={uploadTemplate.isPending}
                />
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <TableHead>Deadline</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Last Reminder</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications?.map((app) => {
                  const report = reportsByStudent.get(app.student_id);
                  const ext = extensionsByStudent.get(app.student_id);
                  const effectiveDeadline = ext ? new Date(ext.new_deadline) : deadline ? new Date(deadline.deadline_date) : null;
                  const lastReminder = lastReminderByStudent.get(app.student_id);

                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>{app.student_number}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell className="text-sm">
                        {effectiveDeadline?.toLocaleDateString() ?? "—"}
                        {ext && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Clock className="mr-1 h-3 w-3" /> Extended
                          </Badge>
                        )}
                      </TableCell>
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
                      <TableCell className="text-xs text-muted-foreground">
                        {lastReminder ? new Date(lastReminder).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell>
                        {!report && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendReminder.mutate({ student_id: app.student_id, email: app.email, name: app.name })}
                            disabled={sendReminder.isPending}
                          >
                            <Bell className="h-4 w-4 mr-1" /> Remind
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!applications || applications.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
