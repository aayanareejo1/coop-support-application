import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, CheckCircle, XCircle, Bell, Upload, Clock, CalendarClock, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const CoordinatorReports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newDeadlineDate, setNewDeadlineDate] = useState("");
  const [reviewDialog, setReviewDialog] = useState<{ id: string; student_id: string; file_name: string; status: string; feedback: string | null } | null>(null);
  const [reviewStatus, setReviewStatus] = useState("reviewed");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [approveDates, setApproveDates] = useState<Record<string, string>>({});

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

  const { data: extensionRequests } = useQuery({
    queryKey: ["extension-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadline_extension_requests")
        .select("*")
        .order("created_at", { ascending: false });
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
      try {
        await fetch(import.meta.env.VITE_SUPABASE_URL + "/functions/v1/send-reminder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            recipient_email: app.email,
            recipient_name: app.name,
            reminder_type: "report",
          }),
        });
      } catch (err) {
        console.error("send-reminder edge function error:", err);
      }
    },
    onSuccess: () => {
      toast.success("Reminder logged successfully");
      queryClient.invalidateQueries({ queryKey: ["reminder-logs"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateDeadline = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("deadlines")
        .update({ deadline_date: newDeadlineDate })
        .eq("id", deadline!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deadline updated!");
      setNewDeadlineDate("");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const reviewReport = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("work_reports")
        .update({ status: reviewStatus, reviewed_by: user!.id, reviewed_at: new Date().toISOString(), feedback: reviewFeedback || null })
        .eq("id", reviewDialog!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report reviewed");
      setReviewDialog(null);
      setReviewFeedback("");
      queryClient.invalidateQueries({ queryKey: ["all-reports"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const resolveExtRequest = useMutation({
    mutationFn: async ({ id, student_id, status, newDeadline }: { id: string; student_id: string; status: "approved" | "rejected"; newDeadline?: string }) => {
      const { error } = await supabase
        .from("deadline_extension_requests")
        .update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (status === "approved" && newDeadline) {
        const { error: extError } = await supabase.from("deadline_extensions").insert({
          student_id,
          new_deadline: new Date(newDeadline).toISOString(),
          reason: "Approved via extension request",
          granted_by: user!.id,
        });
        if (extError) throw extError;
      }
    },
    onSuccess: () => {
      toast.success("Extension request resolved");
      queryClient.invalidateQueries({ queryKey: ["extension-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-extensions"] });
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

          {deadline && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4" /> Set Deadline
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="deadline-input" className="text-xs text-muted-foreground">New date</Label>
                  <Input
                    id="deadline-input"
                    type="date"
                    value={newDeadlineDate}
                    onChange={(e) => setNewDeadlineDate(e.target.value)}
                    disabled={updateDeadline.isPending}
                  />
                </div>
                <Button
                  onClick={() => updateDeadline.mutate()}
                  disabled={!newDeadlineDate || updateDeadline.isPending}
                >
                  {updateDeadline.isPending ? "Saving..." : "Update Deadline"}
                </Button>
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
                        {report ? (() => {
                          const s = report.status ?? "pending_review";
                          const map: Record<string, { label: string; className: string }> = {
                            pending_review: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
                            reviewed:       { label: "Reviewed",       className: "bg-blue-100 text-blue-800 border-blue-200" },
                            approved:       { label: "Approved",       className: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]" },
                            rejected:       { label: "Rejected",       className: "" },
                          };
                          const cfg = map[s] ?? map.pending_review;
                          return <Badge variant={s === "rejected" ? "destructive" : "outline"} className={cfg.className}>{cfg.label}</Badge>;
                        })() : (
                          <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Missing</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lastReminder ? new Date(lastReminder).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {report && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReviewDialog(report);
                                setReviewStatus(report.status ?? "reviewed");
                                setReviewFeedback(report.feedback ?? "");
                              }}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" /> Review
                            </Button>
                          )}
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
                        </div>
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
        {/* Extension Requests */}
        {extensionRequests && extensionRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Extension Requests</CardTitle>
              <CardDescription>Student-submitted requests for deadline extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extensionRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{applications?.find((a) => a.student_id === req.student_id)?.name ?? req.student_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{req.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {req.status === "pending" ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : req.status === "approved" ? (
                          <Badge variant="outline" className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Approved</Badge>
                        ) : (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              className="w-[140px] h-8 text-xs"
                              value={approveDates[req.id] ?? ""}
                              onChange={(e) => setApproveDates((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={!approveDates[req.id] || resolveExtRequest.isPending}
                              onClick={() => resolveExtRequest.mutate({ id: req.id, student_id: req.student_id, status: "approved", newDeadline: approveDates[req.id] })}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-destructive"
                              disabled={resolveExtRequest.isPending}
                              onClick={() => resolveExtRequest.mutate({ id: req.id, student_id: req.student_id, status: "rejected" })}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Report Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          {reviewDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">File: <strong>{reviewDialog.file_name}</strong></p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Feedback (optional)</Label>
                <Textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Leave feedback for the student..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button onClick={() => reviewReport.mutate()} disabled={reviewReport.isPending}>
              {reviewReport.isPending ? "Saving..." : "Save Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CoordinatorReports;
