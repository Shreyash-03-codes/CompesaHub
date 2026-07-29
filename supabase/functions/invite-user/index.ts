import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email, roles } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create user via Supabase GoTrue Admin API
    const createResp = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          email,
          password: "temp123456",
          email_confirm: true,
        }),
      }
    );

    const createData = await createResp.json();

    if (!createResp.ok) {
      return new Response(JSON.stringify({ error: createData.msg || "Failed to create user" }), {
        status: createResp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = createData.id;

    // Create user profile
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        id: userId,
        email,
        name: email.split("@")[0],
      }),
    });

    // Assign roles
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const roleRows = roles.map((role: string) => ({
        user_id: userId,
        role,
      }));

      await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify(roleRows),
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
