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
import { Send, Upload, CheckCircle, Clock, XCircle, FileText } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
  pending: { label: "Pending Review", variant: "secondary", icon: Clock },
  provisional: { label: "Provisionally Accepted", variant: "outline", icon: Clock },
  accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");

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

  const isDeadlinePassed = deadline ? new Date(deadline.deadline_date) < new Date() : false;

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
                submitApp.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required placeholder="STU-12345" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@university.edu" />
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
                  const cfg = statusConfig[application.status];
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
              {application.reviewer_notes && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <span className="font-medium">Reviewer Notes:</span> {application.reviewer_notes}
                </div>
              )}
            </CardContent>
          </Card>

          {application.status === "accepted" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Work-Term Report</CardTitle>
                <CardDescription>
                  {deadline && (
                    <span>
                      Deadline: <strong>{new Date(deadline.deadline_date).toLocaleDateString()}</strong>
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
                  <p className="text-destructive text-sm">The submission deadline has passed.</p>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadReport.mutate(file);
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
