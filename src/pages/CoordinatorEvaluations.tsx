import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Bell } from "lucide-react";
import { toast } from "sonner";

const CoordinatorEvaluations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: evaluations } = useQuery({
    queryKey: ["all-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evaluations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reminderLogs } = useQuery({
    queryKey: ["reminder-logs", "evaluation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reminder_logs").select("*").eq("reminder_type", "evaluation").order("sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get supervisors who have roles, including their email from profiles
  const { data: supervisors } = useQuery({
    queryKey: ["supervisor-profiles"],
    queryFn: async () => {
      const { data: roles, error } = await supabase.from("user_roles").select("user_id").eq("role", "supervisor");
      if (error) throw error;
      if (!roles || roles.length === 0) return [];
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("*").in("user_id", userIds);
      if (pErr) throw pErr;
      return profiles;
    },
  });

  const sendReminder = useMutation({
    mutationFn: async (sup: { user_id: string; full_name: string }) => {
      // TODO: add an `email` column to the `profiles` table so a real address
      // can be stored here. Using user_id as a unique identifier in the meantime.
      const { error } = await supabase.from("reminder_logs").insert({
        recipient_id: sup.user_id,
        recipient_email: sup.user_id,
        reminder_type: "evaluation",
        sent_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder logged");
      queryClient.invalidateQueries({ queryKey: ["reminder-logs"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const supervisorsWithoutEvals = supervisors?.filter(
    (sup) => !evaluations?.some((ev) => ev.supervisor_id === sup.user_id)
  );

  const lastReminderBySupervisor = new Map<string, string>();
  reminderLogs?.forEach((log) => {
    if (!lastReminderBySupervisor.has(log.recipient_id)) {
      lastReminderBySupervisor.set(log.recipient_id, log.sent_at);
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Supervisor Evaluations
          </h1>
          <p className="text-muted-foreground">View all submitted evaluations and send reminders</p>
        </div>

        {supervisorsWithoutEvals && supervisorsWithoutEvals.length > 0 && (
          <Card className="border-[hsl(var(--warning))]">
            <CardHeader>
              <CardTitle className="text-sm">Supervisors Without Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Reminder</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supervisorsWithoutEvals.map((sup) => (
                    <TableRow key={sup.user_id}>
                      <TableCell className="font-medium">{sup.full_name || "Unknown"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lastReminderBySupervisor.get(sup.user_id)
                          ? new Date(lastReminderBySupervisor.get(sup.user_id)!).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendReminder.mutate(sup)}
                          disabled={sendReminder.isPending}
                        >
                          <Bell className="h-4 w-4 mr-1" /> Remind
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Recommendation</TableHead>
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
                    <TableCell className="max-w-[200px] truncate">{ev.recommendation || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {(!evaluations || evaluations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No evaluations submitted yet
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

export default CoordinatorEvaluations;
