const express = require("express");
const router = express.Router();
const connection = require("../db");

router.get("/:user_id", async (req, res) => {
  const { data: joinedClasses, error: joinedClassesError } = await connection
    .from("class_users")
    .select("class_id")
    .eq("user_id", req.params.user_id);
  if (joinedClassesError)
    return res.status(500).json({ error: joinedClassesError });
  else {
    if (joinedClasses.length > 0) {
      //Get array filled with class ids
      let classIds = [];
      joinedClasses.forEach((c) => {
        classIds.push(c.class_id);
      });

      //Query all classes with the ids
      const { data: classes, error: classesError } = await connection
        .from("classes")
        .select("class_id, subjects, name, owner_id, users(username)")
        .in("class_id", classIds);
      if (!classesError) {
        const returnData = [];

        classes.forEach((c) => {
          returnData.push({
            class_id: c.class_id,
            name: c.name,
            subjects: c.subjects,
            owner_id: c.owner_id,
            owner_name: c.users.username,
          });
        });

        return res.status(200).json({ data: returnData });
      } else return res.status(500).json({ error: classesError });
    } else {
      return res.status(200).json({ data: undefined });
    }
  }
});

router.get("/id/:class_id", async (req, res) => {
  const { data, error } = await connection
    .from("classes")
    .select("*")
    .eq("class_id", req.params.class_id);
  if (error) return res.status(500).send({ error: error });
  else {
    if (data.length > 0) return res.status(200).send({ data: data[0] });
    else return res.status(200).send({ data: undefined });
  }
});

router.post("/join", async (req, res) => {
  const content = req.body;
  if (!content.user_id || !content.class_id)
    return res
      .status(400)
      .json({ error: "Missing one or more required parameters" });

  //Add user to class
  const { data, error } = await connection
    .from("class_users")
    .insert([content])
    .select("class_id");
  if (error) return res.status(500).json({ error: error });
  else return res.status(200).json({ data: data[0].class_id });
});

router.post("/new", async (req, res) => {
  const content = req.body;
  if (!content.owner_id || !content.name)
    return res
      .status(400)
      .json({ error: "Missing one or more required parameters" });

  content.subjects = [];

  const { data, error } = await connection
    .from("classes")
    .insert([content])
    .select("class_id");
  if (error) return res.status(500).json({ error: error });
  else {
    const { data: joinData, error: joinDataError } = await connection
      .from("class_users")
      .insert([{ class_id: data[0].class_id, user_id: content.owner_id }]);
    if (joinDataError) return res.status(500).json({ error: joinDataError });
    else return res.status(200).json({ data: data[0].class_id });
  }
});

router.post("/newsubject", async (req, res) => {
  const content = req.body;
  if (!content.class_id || !content.name)
    return res
      .status(400)
      .json({ error: "Missing one or more required parameters" });

  // const newSubjects = content.subjects
  //   ? content.subjects.push(content.name)
  //   : [content.name];
  let newSubjects = [];
  if (content.subjects) {
    newSubjects = content.subjects;
    newSubjects.push(content.name);
  } else newSubjects = [content.name];

  const { data, error } = await connection
    .from("classes")
    .update({ subjects: newSubjects })
    .eq("class_id", content.class_id)
    .select("subjects");

  if (error) return res.status(500).json({ error: error });
  else return res.status(200).json({ data: data[0].subjects });
});

module.exports = router;
