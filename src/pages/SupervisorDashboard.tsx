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
import { Star, Upload } from "lucide-react";

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [rating, setRating] = useState("3");
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const [pdfStudentName, setPdfStudentName] = useState("");
  const [pdfStudentNumber, setPdfStudentNumber] = useState("");

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

  // Validate that student number belongs to an accepted application
  const validateStudentNumber = async (sNum: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("applications")
      .select("id, student_number, status")
      .eq("student_number", sNum)
      .eq("status", "accepted")
      .maybeSingle();
    if (error || !data) {
      toast.error("No accepted student found with this Student Number. Evaluations can only be submitted for accepted students.");
      return false;
    }
    return true;
  };

  const submitForm = useMutation({
    mutationFn: async () => {
      const valid = await validateStudentNumber(studentNumber);
      if (!valid) throw new Error("Invalid student number");

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
    onError: (e: Error) => {
      if (e.message !== "Invalid student number") toast.error(e.message);
    },
  });

  const uploadPdf = useMutation({
    mutationFn: async ({ file, sName, sNum }: { file: File; sName: string; sNum: string }) => {
      const valid = await validateStudentNumber(sNum);
      if (!valid) throw new Error("Invalid student number");

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
      setPdfStudentName("");
      setPdfStudentNumber("");
      queryClient.invalidateQueries({ queryKey: ["my-evaluations"] });
    },
    onError: (e: Error) => {
      if (e.message !== "Invalid student number") toast.error(e.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Supervisor Dashboard
        </h1>
        <p className="text-muted-foreground">Submit evaluations for students you supervise</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <strong>Note:</strong> Evaluations can only be submitted for students with an accepted co-op application. Please ensure the Student Number matches the student's official ID.
      </div>

      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="form">Online Form</TabsTrigger>
          <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Form</CardTitle>
              <CardDescription>Fill in the evaluation for an accepted co-op student</CardDescription>
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
                    <Input
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      required
                      placeholder="Must match accepted application"
                    />
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
                  {submitForm.isPending ? "Validating & Submitting..." : "Submit Evaluation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Evaluation PDF</CardTitle>
              <CardDescription>Upload a completed evaluation form as PDF for an accepted co-op student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Student Name</Label>
                  <Input value={pdfStudentName} onChange={(e) => setPdfStudentName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Student Number</Label>
                  <Input
                    value={pdfStudentNumber}
                    onChange={(e) => setPdfStudentNumber(e.target.value)}
                    required
                    placeholder="Must match accepted application"
                  />
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
                      uploadPdf.mutate({ file, sName: pdfStudentName, sNum: pdfStudentNumber });
                    } else if (file) {
                      toast.error("Please fill in student name and number first");
                    }
                  }}
                  disabled={uploadPdf.isPending}
                />
              </div>
              {uploadPdf.isPending && <p className="text-sm text-muted-foreground">Validating and uploading...</p>}
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
