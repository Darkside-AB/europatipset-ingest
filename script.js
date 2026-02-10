import "dotenv/config";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const API_URL =
  "https://darkside-betting-api.vercel.app/api/europatipset/draws";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Fetch from API
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("API request failed: " + res.status);
  }

  // 2. Parse JSON  ✅ this defines `data`
  const data = await res.json();

  // 3. Create hash of JSON
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");

  // 4. Insert into Supabase
  const { error } = await supabase
    .from("europatipset_snapshots")
    .insert({
      payload: data,
      payload_hash: hash
    });

  if (error) {
    // Ignore duplicate hash errors (optional but nice)
    if (error.code === "23505") {
      console.log("Duplicate snapshot — already stored.");
      return;
    }

    console.error("Supabase insert error:", error);
    process.exit(1);
  }

  console.log("Snapshot stored successfully!");
}

run();
