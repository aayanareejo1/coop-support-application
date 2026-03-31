import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipient_email, recipient_name, reminder_type } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    let subject: string;
    let html: string;

    if (reminder_type === "report") {
      subject = "Reminder: Work-Term Report Submission";
      html = `
        <p>Hi ${recipient_name},</p>
        <p>This is a reminder that your <strong>work-term report</strong> has not yet been submitted.</p>
        <p>Please log in to the co-op portal and submit your report before the deadline.</p>
        <p>If you have already submitted it or believe this is an error, please contact your co-op coordinator.</p>
        <br/>
        <p>Co-op Support Team</p>
      `;
    } else {
      subject = "Reminder: Student Evaluation Submission";
      html = `
        <p>Hi ${recipient_name},</p>
        <p>This is a reminder that you have not yet submitted a <strong>student evaluation</strong>.</p>
        <p>Please log in to the co-op portal and complete the evaluation for your student.</p>
        <p>If you have already submitted it or believe this is an error, please contact the co-op coordinator.</p>
        <br/>
        <p>Co-op Support Team</p>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Co-op Support <onboarding@resend.dev>",
        to: [recipient_email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Resend error: ${errorText}`);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
