const express = require("express");
const router = express.Router();
const connection = require("../db");

router.get("/:user_id", async (req, res) => {
  const { data, error } = await connection
    .from("users")
    .select("username, email, bio")
    .eq("user_id", req.params.user_id);
  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0) return res.status(200).json({ data: data[0] });
    else
      return res
        .status(404)
        .json({ error: "User Id " + req.params.user_id + " not found" });
  }
});

router.post("/login", async (req, res) => {
  const content = req.body;
  if (!content.email || !content.password)
    return res
      .status(400)
      .json({ error: "Missing one or more request parameters" });

  const { data, error } = await connection
    .from("users")
    .select("user_id, login_token, username")
    .eq("email", content.email)
    .eq("password", content.password);
  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0)
      return res.status(200).json({
        success: true,
        username: data[0].username,
        login_id: data[0].user_id,
        login_token: data[0].login_token,
      });
    else
      return res
        .status(200)
        .json({ success: false, failMsg: "Invalid email and/or password" });
  }
});

router.post("/cookielogin", async (req, res) => {
  const content = req.body;
  if (!content.user_id || !content.login_token)
    res.status(400).json({ error: "Missing one or more request parameters" });

  const { data, error } = await connection
    .from("users")
    .select("user_id, username")
    .eq("user_id", content.user_id)
    .eq("login_token", content.login_token);
  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0) {
      return res.status(200).json({ success: true, data: data[0] });
    } else
      return res
        .status(200)
        .json({ success: false, failMsg: "Incorrect id or token" });
  }
});

router.post("/signup", async (req, res) => {
  const content = req.body;
  if (!content.username || !content.email || !content.password) {
    res.status(400).json({ error: "Missing one or more request parameters" });
    return;
  }

  //User check
  const { data: emailValidation, error: emailValidationError } =
    await connection
      .from("users")
      .select("username")
      .eq("email", content.email);
  if (emailValidationError)
    return res
      .status(500)
      .json({ success: false, failMsg: emailValidationError });
  else {
    if (emailValidation.length > 0)
      return res.status(200).json({
        success: false,
        failMsg: "User with email " + content.email + " already exists",
      });
  }

  const { data, error } = await connection
    .from("users")
    .insert([content])
    .select("user_id, login_token, username");
  if (error) return res.status(500).json({ success: false, failMsg: error });
  else return res.status(200).json({ success: true, data: data[0] });
});

router.post("/update/:id", async (req, res) => {
  const content = req.body;
  if (!content.user_id || !content.updatedData)
    return res.status(400).json({ error: "Missing required parameters" });

  const { data, error } = await connection
    .from("users")
    .update(content)
    .eq("user_id", req.params.id)
    .select("user_id");
  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0) return res.status(200).json({ data: data[0] });
    else return res.status(204).json({ error: "User Id not found" });
  }
});

module.exports = router;
