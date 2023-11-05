const express = require("express");
const router = express.Router();
const connection = require("../db");

router.get("/", async (req, res) => {
  const content = req.body.content;
  if (!content.user_id || !content.class_id) {
    res
      .status(400)
      .send({ error: "Missing one or more required request parameters" });
    return;
  }

  const { data, error } = await connection
    .from("assignments")
    .select("*")
    .eq("class_id", content.class_id)
    .or(`user_id.eq.${content.user_id}, public.eq.true`);
  if (error) return res.status(500).send({ error: error });
  else return res.status(200).send({ data: data });
});

router.get("/:id", async (req, res) => {
  const { data, error } = await connection
    .from("assignments")
    .select("*")
    .eq("id", req.params.id);
  if (error) return res.status(500).send({ error: error });
  else {
    if (data.length > 0) return res.status(200).send({ data: data[0] });
    else
      return res
        .status(404)
        .send({ error: "Assignment Id " + req.params.id + " not found" });
  }
});

router.post("/new", async (req, res) => {
  const content = req.body.content;
  if (
    !content.title ||
    !content.class_id ||
    !content.subject ||
    !content.user_id ||
    !content.public
  ) {
    res
      .status(400)
      .send({ error: "Missing one or more required request parameters" });
    return;
  }

  //User validation
  const { data: userCheck, error: userCheckError } = await connection
    .from("users")
    .select("username")
    .eq("id", content.user_id);
  if (userCheckError) return res.status(500).send({ error: userCheckError });
  else {
    if (userCheck.length <= 0)
      return res.status(400).send({ error: "Invalid user id" });
  }

  //Class validation
  const { data: classCheck, error: classCheckError } = await connection
    .from("classes")
    .select("name")
    .eq("id", content.class_id);
  if (userCheckError) return res.status(500).send({ error: classCheckError });
  else {
    if (userCheck.length <= 0)
      return res.status(400).send({ error: "Invalid class id" });
  }

  const { data, error } = await connection
    .from("assignments")
    .insert([content])
    .select("title");
  if (error) return res.status(500).send({ error: error });
  else return res.status(200).send(data);
});

router.get("/delete/:id", async (req, res) => {
  const { data, error } = await connection
    .from("assignments")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).send({ error: error });
  else return res.status(200);
});

module.exports = router;
