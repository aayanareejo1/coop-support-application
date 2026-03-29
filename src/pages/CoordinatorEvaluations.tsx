import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const CoordinatorEvaluations = () => {
  const { data: evaluations } = useQuery({
    queryKey: ["all-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evaluations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Supervisor Evaluations
          </h1>
          <p className="text-muted-foreground">View all submitted evaluations</p>
        </div>

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
