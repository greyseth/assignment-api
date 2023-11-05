const db = require("@supabase/supabase-js");

const connection = db.createClient(
  "https://vqjkwmcimjeuokiukobz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamt3bWNpbWpldW9raXVrb2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTgzOTE0MTQsImV4cCI6MjAxMzk2NzQxNH0.38LZjZiPemSTDW7cP0UC8heKe7h1JG8WXD03p6yasjU"
);

module.exports = connection;
