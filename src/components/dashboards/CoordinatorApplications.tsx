import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import type { Database } from "@/integrations/supabase/types";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type Application = Database["public"]["Tables"]["applications"]["Row"];

const statusBadge: Record<ApplicationStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "secondary", label: "Pending" },
  provisional: { variant: "outline", label: "Provisional" },
  provisional_accepted: { variant: "outline", label: "Prov. Accepted" },
  provisional_rejected: { variant: "destructive", label: "Prov. Rejected" },
  accepted: { variant: "default", label: "Accepted" },
  rejected: { variant: "destructive", label: "Rejected" },
};

const CoordinatorApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>("pending");
  const [notes, setNotes] = useState("");

  // Extension dialog
  const [extDialog, setExtDialog] = useState<Application | null>(null);
  const [extDate, setExtDate] = useState("");
  const [extReason, setExtReason] = useState("");

  // Placement issue dialog
  const [issueDialog, setIssueDialog] = useState<Application | null>(null);
  const [issueReason, setIssueReason] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["all-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateApp = useMutation({
    mutationFn: async () => {
      const isProvisional = newStatus === "provisional" || newStatus === "provisional_accepted" || newStatus === "provisional_rejected";
      const isFinal = newStatus === "accepted" || newStatus === "rejected";

      const updateData: Record<string, unknown> = { status: newStatus, reviewer_notes: notes };
      if (isProvisional) updateData.provisional_decision_at = new Date().toISOString();
      if (isFinal) updateData.final_decision_at = new Date().toISOString();

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", selected!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application updated");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const grantExtension = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("deadline_extensions").insert({
        student_id: extDialog!.student_id,
        new_deadline: new Date(extDate).toISOString(),
        reason: extReason,
        granted_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deadline extension granted");
      setExtDialog(null);
      setExtDate("");
      setExtReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const flagPlacement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("placement_issues").insert({
        student_id: issueDialog!.student_id,
        reason: issueReason,
        flagged_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Placement issue recorded");
      setIssueDialog(null);
      setIssueReason("");
      queryClient.invalidateQueries({ queryKey: ["placement-issues"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = applications?.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Applications
          </h1>
          <p className="text-muted-foreground">Review and manage student applications</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="provisional_accepted">Prov. Accepted</SelectItem>
            <SelectItem value="provisional_rejected">Prov. Rejected</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student #</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((app) => {
                  const cfg = statusBadge[app.status];
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>{app.student_number}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelected(app);
                              setNewStatus(app.status);
                              setNotes(app.reviewer_notes || "");
                            }}
                          >
                            Review
                          </Button>
                          {app.status === "accepted" && (
                            <Button variant="ghost" size="sm" onClick={() => setExtDialog(app)}>
                              Extend
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setIssueDialog(app)}>
                            Flag
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filtered || filtered.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No applications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {selected.name}</div>
                <div><span className="text-muted-foreground">Student #:</span> {selected.student_number}</div>
                <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                {selected.provisional_decision_at && (
                  <div><span className="text-muted-foreground">Provisional decision:</span> {new Date(selected.provisional_decision_at).toLocaleString()}</div>
                )}
                {selected.final_decision_at && (
                  <div><span className="text-muted-foreground">Final decision:</span> {new Date(selected.final_decision_at).toLocaleString()}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Decision</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="provisional">Provisional</SelectItem>
                    <SelectItem value="provisional_accepted">Provisional Accept</SelectItem>
                    <SelectItem value="provisional_rejected">Provisional Reject</SelectItem>
                    <SelectItem value="accepted">Final Accept</SelectItem>
                    <SelectItem value="rejected">Final Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional reviewer notes..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={() => updateApp.mutate()} disabled={updateApp.isPending}>
              {updateApp.isPending ? "Saving..." : "Save Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extension Dialog */}
      <Dialog open={!!extDialog} onOpenChange={(open) => !open && setExtDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Deadline Extension</DialogTitle>
          </DialogHeader>
          {extDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Granting extension for <strong>{extDialog.name}</strong> ({extDialog.student_number})
              </p>
              <div className="space-y-2">
                <Label>New Deadline</Label>
                <Input type="date" value={extDate} onChange={(e) => setExtDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={extReason} onChange={(e) => setExtReason(e.target.value)} placeholder="Reason for extension..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtDialog(null)}>Cancel</Button>
            <Button onClick={() => grantExtension.mutate()} disabled={grantExtension.isPending || !extDate}>
              {grantExtension.isPending ? "Granting..." : "Grant Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placement Issue Dialog */}
      <Dialog open={!!issueDialog} onOpenChange={(open) => !open && setIssueDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Placement Issue</DialogTitle>
          </DialogHeader>
          {issueDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Flagging issue for <strong>{issueDialog.name}</strong> ({issueDialog.student_number})
              </p>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={issueReason} onChange={(e) => setIssueReason(e.target.value)} placeholder="Describe the issue..." required />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialog(null)}>Cancel</Button>
            <Button onClick={() => flagPlacement.mutate()} disabled={flagPlacement.isPending || !issueReason}>
              {flagPlacement.isPending ? "Flagging..." : "Flag Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoordinatorApplications;
