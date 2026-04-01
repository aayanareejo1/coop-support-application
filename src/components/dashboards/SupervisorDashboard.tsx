import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Upload, Link, CheckCircle, XCircle, Clock } from "lucide-react";

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [rating, setRating] = useState("3");
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const { data: myLinks } = useQuery({
    queryKey: ["my-links", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supervisor_student_links" as any)
        .select("*")
        .eq("supervisor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; student_number: string; status: string; created_at: string }[];
    },
    enabled: !!user,
  });

  const { data: evaluations } = useQuery({
    queryKey: ["my-evaluations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("supervisor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitForm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("evaluations").insert({
        supervisor_id: user!.id,
        student_name: studentName,
        student_number: studentNumber,
        eval_type: "form",
        rating: parseInt(rating),
        comments,
        recommendation,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evaluation submitted!");
      setStudentName("");
      setStudentNumber("");
      setRating("3");
      setComments("");
      setRecommendation("");
      queryClient.invalidateQueries({ queryKey: ["my-evaluations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const requestLink = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("supervisor_student_links" as any).insert({
        supervisor_id: user!.id,
        student_number: linkStudentNumber,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link request submitted — awaiting coordinator approval");
      setLinkStudentNumber("");
      queryClient.invalidateQueries({ queryKey: ["my-links"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadPdf = useMutation({
    mutationFn: async ({ file, sName, sNum }: { file: File; sName: string; sNum: string }) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("evaluations").upload(path, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("evaluations").insert({
        supervisor_id: user!.id,
        student_name: sName,
        student_number: sNum,
        eval_type: "pdf",
        file_path: path,
        file_name: file.name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PDF evaluation uploaded!");
      queryClient.invalidateQueries({ queryKey: ["my-evaluations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const [pdfStudentName, setPdfStudentName] = useState("");
  const [pdfStudentNumber, setPdfStudentNumber] = useState("");
  const [linkStudentNumber, setLinkStudentNumber] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Supervisor Dashboard
        </h1>
        <p className="text-muted-foreground">Submit evaluations for students you supervise</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link className="h-5 w-5" /> My Students</CardTitle>
          <CardDescription>Request to be linked to a student by entering their student number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => { e.preventDefault(); requestLink.mutate(); }}
            className="flex gap-2"
          >
            <Input
              placeholder="Student number"
              value={linkStudentNumber}
              onChange={(e) => setLinkStudentNumber(e.target.value)}
              className="max-w-[200px]"
              required
            />
            <Button type="submit" size="sm" disabled={requestLink.isPending}>
              {requestLink.isPending ? "Sending..." : "Request Link"}
            </Button>
          </form>
          {myLinks && myLinks.length > 0 && (
            <div className="space-y-2">
              {myLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2 text-sm">
                  {link.status === "approved" ? (
                    <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                  ) : link.status === "rejected" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">Student #{link.student_number}</span>
                  <span className="capitalize text-muted-foreground">{link.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="form">Online Form</TabsTrigger>
          <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Form</CardTitle>
              <CardDescription>Fill in the evaluation for a student</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitForm.mutate();
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Student Name</Label>
                    <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Student Number</Label>
                    <Input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Performance Rating</Label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} — {["Poor", "Below Average", "Average", "Good", "Excellent"][n - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Performance feedback..." />
                </div>
                <div className="space-y-2">
                  <Label>Recommendation</Label>
                  <Textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="Your recommendation..." />
                </div>
                <Button type="submit" disabled={submitForm.isPending}>
                  {submitForm.isPending ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Evaluation PDF</CardTitle>
              <CardDescription>Upload a completed evaluation form as PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Student Name</Label>
                  <Input value={pdfStudentName} onChange={(e) => setPdfStudentName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Student Number</Label>
                  <Input value={pdfStudentNumber} onChange={(e) => setPdfStudentNumber(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>PDF File</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && pdfStudentName && pdfStudentNumber) {
                      if (file.type !== "application/pdf") {
                        toast.error("Only PDF files are accepted");
                        e.target.value = "";
                        return;
                      }
                      uploadPdf.mutate({ file, sName: pdfStudentName, sNum: pdfStudentNumber });
                    } else if (file) {
                      toast.error("Please fill in student name and number first");
                    }
                  }}
                  disabled={uploadPdf.isPending}
                />
              </div>
              {uploadPdf.isPending && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations?.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.student_name}</TableCell>
                  <TableCell>{ev.student_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{ev.eval_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {ev.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                        {ev.rating}/5
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ev.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {(!evaluations || evaluations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No evaluations submitted yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;
