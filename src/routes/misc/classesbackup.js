const express = require("express");
const router = express.Router();
const connection = require("../db");

router.post("/", async (req, res) => {
  const content = req.body.content;
  if (!content.user_id)
    return res.status(400).send({ error: "Missing user id parameter" });

  const { data: userClasses, error: userClassesError } = await connection
    .from("class_users")
    .select("class_id")
    .eq("user_id", content.user_id);
  if (userClassesError)
    return res.status(500).send({ error: userClassesError });
  else {
    const { data, error } = await connection.from("classes").select("*");
    if (error) return res.status(500).send({ error: error });
    else {
      let returnClasses = [];

      userClasses.forEach((c) => {
        data.forEach((d) => {
          if (c.class_id === d.id) returnClasses.push(data);
        });
      });

      return res.status(200).send({ data: returnClasses });
    }
  }
});

router.get("/:id", async (req, res) => {
  const { data, error } = await connection
    .from("classes")
    .select("*")
    .eq("id", req.params.id);
  if (error) return res.status(500).send({ error: error });
  else {
    if (data.length > 0) return res.status(200).send({ data: data[0] });
    else return res.status(204).send({ noData: true });
  }
});

router.post("/new", async (req, res) => {
  const content = req.body.content;
  if (!content.owner_id || !content.name || !content.public)
    return res
      .status(400)
      .send({ error: "Missing one or more required parameters" });

  const { data, error } = await connection
    .from("classes")
    .insert([content])
    .select();
  if (error) return res.send(500).send({ error: error });
  else return res.send(200).send({ data: data[0] });
});

router.post("/adduser", async (req, res) => {
  const content = req.body.content;
  if (!content.class_id || !content.user_id)
    return res
      .status(400)
      .send({ error: "Missing one or more required parameters" });

  //Checks if user is already in the class
  const { data: presenceCheck, error: presenceCheckError } = await connection
    .from("class_users")
    .select("*")
    .eq("class_id", content.class_id)
    .eq("user_id", content.user_id);
  if (presenceCheckError)
    return res.send(500).send({ error: presenceCheckError });
  else {
    if (presenceCheck.length > 0)
      return res.status(409).send({ error: "User already in class" });
    else {
      const { data, error } = await connection
        .from("class_users")
        .insert([content]);
      if (error) return res.status(500).send({ error: error });
      else return res.status(200);
    }
  }
});

module.exports = router;
