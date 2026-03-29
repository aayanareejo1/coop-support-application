import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Upload, CheckCircle, Clock, XCircle, FileText, Download, AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle; color?: string }> = {
  pending: { label: "Pending Review", variant: "secondary", icon: Clock },
  provisional_accepted: { label: "Provisionally Accepted", variant: "outline", icon: CheckCircle, color: "text-[hsl(var(--success))]" },
  provisional_rejected: { label: "Provisionally Rejected", variant: "destructive", icon: XCircle },
  accepted: { label: "Finally Accepted", variant: "default", icon: CheckCircle },
  rejected: { label: "Finally Rejected", variant: "destructive", icon: XCircle },
  provisional: { label: "Provisional", variant: "outline", icon: Clock },
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ studentNumber?: string; email?: string }>({});

  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ["my-application", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: report } = useQuery({
    queryKey: ["my-report", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_reports")
        .select("*")
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: deadline } = useQuery({
    queryKey: ["deadlines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deadlines").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: extension } = useQuery({
    queryKey: ["my-extension", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadline_extensions")
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: placementIssue } = useQuery({
    queryKey: ["my-placement-issue", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placement_issues")
        .select("*")
        .eq("student_id", user!.id)
        .eq("resolved", false)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Report template
  const { data: templateUrl } = useQuery({
    queryKey: ["report-template"],
    queryFn: async () => {
      const { data } = await supabase.storage.from("templates").list("", { limit: 1, search: "report-template" });
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from("templates").getPublicUrl(data[0].name);
        return { url: urlData.publicUrl, name: data[0].name };
      }
      return null;
    },
  });

  const validate = () => {
    const errs: typeof errors = {};
    if (!/^\d+$/.test(studentNumber)) errs.studentNumber = "Student ID must contain numbers only";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitApp = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        student_id: user!.id,
        name,
        student_number: studentNumber,
        email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      queryClient.invalidateQueries({ queryKey: ["my-application"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadReport = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("reports").upload(path, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("work_reports").insert({
        student_id: user!.id,
        file_path: path,
        file_name: file.name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report uploaded!");
      queryClient.invalidateQueries({ queryKey: ["my-report"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const effectiveDeadline = extension ? new Date(extension.new_deadline) : deadline ? new Date(deadline.deadline_date) : null;
  const isDeadlinePassed = effectiveDeadline ? effectiveDeadline < new Date() : false;

  if (appLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Student Dashboard
        </h1>
        <p className="text-muted-foreground">Manage your co-op application and report</p>
      </div>

      {placementIssue && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Placement Issue Flagged</p>
              <p className="text-sm text-muted-foreground">{placementIssue.reason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!application ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Submit Application</CardTitle>
            <CardDescription>Fill in your details to apply for the co-op program</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validate()) submitApp.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={studentNumber}
                  onChange={(e) => { setStudentNumber(e.target.value); setErrors((p) => ({ ...p, studentNumber: undefined })); }}
                  required
                  placeholder="12345678"
                />
                {errors.studentNumber && <p className="text-sm text-destructive">{errors.studentNumber}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  required
                  placeholder="you@university.edu"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <Button type="submit" disabled={submitApp.isPending}>
                {submitApp.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = statusConfig[application.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <Badge variant={cfg.variant} className="text-sm px-3 py-1">
                      <Icon className="mr-1 h-4 w-4" />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Name:</span> {application.name}</div>
                <div><span className="text-muted-foreground">Student #:</span> {application.student_number}</div>
                <div><span className="text-muted-foreground">Email:</span> {application.email}</div>
              </div>
              {application.provisional_decision_at && (
                <p className="text-xs text-muted-foreground">
                  Provisional decision: {new Date(application.provisional_decision_at).toLocaleString()}
                </p>
              )}
              {application.final_decision_at && (
                <p className="text-xs text-muted-foreground">
                  Final decision: {new Date(application.final_decision_at).toLocaleString()}
                </p>
              )}
              {application.reviewer_notes && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <span className="font-medium">Reviewer Notes:</span> {application.reviewer_notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report template download */}
          {templateUrl && (
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Report Template</p>
                    <p className="text-sm text-muted-foreground">Download the template before writing your report</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={templateUrl.url} download={templateUrl.name} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {application.status === "accepted" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Work-Term Report</CardTitle>
                <CardDescription>
                  {effectiveDeadline && (
                    <span>
                      Deadline: <strong>{effectiveDeadline.toLocaleDateString()}</strong>
                      {extension && <span className="text-primary ml-2">(Extended)</span>}
                      {isDeadlinePassed && <span className="text-destructive ml-2">(Passed)</span>}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report ? (
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{report.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(report.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : isDeadlinePassed ? (
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <p className="text-destructive text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      The submission deadline has passed. You can no longer upload your report.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact your coordinator if you need a deadline extension.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Upload your work-term report as a PDF file.</p>
                    <Input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            toast.error("Only PDF files are accepted");
                            return;
                          }
                          uploadReport.mutate(file);
                        }
                      }}
                      disabled={uploadReport.isPending}
                    />
                    {uploadReport.isPending && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
