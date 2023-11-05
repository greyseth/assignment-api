const db = require("@supabase/supabase-js");
const { url, key } = require("./keys");

const connection = db.createClient(url, key);

module.exports = connection;
