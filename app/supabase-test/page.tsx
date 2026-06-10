"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Checking Supabase connection...");

  useEffect(() => {
    async function checkSupabase() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) {
        setStatus("Supabase error: " + error.message);
        return;
      }

      setStatus("Supabase connected successfully ✅");
      console.log("Profiles data:", data);
    }

    checkSupabase();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>HireVify Supabase Test</h1>
      <p>{status}</p>
    </main>
  );
}