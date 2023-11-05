const express = require("express");
const multer = require("multer");
// const upload = multer({ dest: "./uploads" });
const router = express.Router();
const connection = require("../db");

router.get("/:assign_id", async (req, res) => {
  const { data, error } = await connection
    .from("assignments")
    .select(
      "assign_id, title, description, users(username, user_id), classes(subjects), attachments, public, subject"
    )
    .eq("assign_id", req.params.assign_id);
  if (error) return res.status(500).json(error);
  else {
    if (data.length > 0) {
      const returnData = {
        assign_id: data[0].assign_id,
        title: data[0].title,
        description: data[0].description,
        subject: data[0].subject,
        attachments: data[0].attachments,
        class_subjects: data[0].classes.subjects,
        owner_name: data[0].users.username,
        owner_id: data[0].users.user_id,
        public: data[0].public,
      };

      return res.status(200).json({ data: returnData });
    } else return res.status(200).json({ data: undefined });
  }
});

router.get("/inclass/:class_id", async (req, res) => {
  const { data, error } = await connection
    .from("assignments")
    .select("*, users(username)")
    .order("created_at", { ascending: false })
    .eq("class_id", req.params.class_id)
    .eq("public", true);
  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0) {
      let returnData = [];
      data.forEach((d) => {
        returnData.push({
          assign_id: d.assign_id,
          owner_id: d.owner_id,
          owner_name: d.users.username,
          title: d.title,
          description: d.description,
          subject: d.subject,
          public: d.public,
        });
      });

      return res.status(200).json({ data: returnData });
    } else {
      return res.status(200).json({ data: undefined });
    }
  }
});

router.post("/postedby", async (req, res) => {
  const content = req.body;
  if (!content.user_id || !content.class_id)
    return res
      .status(400)
      .json({ error: "Missing one or more required paramters" });

  const { data, error } = await connection
    .from("assignments")
    .select("*, users(username)")
    .order("created_at", { ascending: false })
    .eq("class_id", content.class_id)
    .eq("owner_id", content.user_id);

  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0) {
      let returnData = [];
      data.forEach((d) => {
        returnData.push({
          assign_id: d.assign_id,
          owner_id: d.owner_id,
          owner_name: d.users.username,
          title: d.title,
          description: d.description,
          subject: d.subject,
          public: d.public,
        });
      });

      return res.status(200).json({ data: returnData });
    } else return res.status(200).json({ data: undefined });
  }
});

router.post("/new", async (req, res) => {
  const content = req.body;
  if (!content.owner_id || !content.class_id || !content.subject)
    return res
      .status(400)
      .json({ error: "Missing one or more request parameters" });

  const { data, error } = await connection
    .from("assignments")
    .insert([content])
    .select("assign_id");
  if (error) return res.status(500).json({ error: error });
  else return res.status(200).json({ data: data[0].assign_id });
});

router.post("/delete", async (req, res) => {
  const content = req.body;
  if (!content.owner_id || !content.assign_id)
    return res
      .status(400)
      .json({ error: "Missing one or more required parameters" });

  const { data, error } = await connection
    .from("assignments")
    .delete()
    .eq("assign_id", assign_id)
    .eq("owner_id", owner_id);
  if (error) return res.status(500).json({ error: error });
  else return res.jsonStatus(200);
});

router.post("/update", async (req, res) => {
  const content = req.body;
  if (!content.assign_id || !content.updData)
    return res.status(400).json({ error: "Missing assignment id" });

  const { data, error } = await connection
    .from("assignments")
    .update(content.updData)
    .eq("assign_id", content.assign_id)
    .select("assign_id");
  if (error) return res.status(500).json({ error: error });
  else {
    if (data.length > 0)
      return res.status(200).json({ data: data[0].assign_id });
    else return res.status(200).json({ data: undefined });
  }
});

router.post("/newupload", async (req, res) => {
  const content = req.body;
  if (!content.assign_id || !content.fileName)
    return res
      .status(400)
      .json({ error: "Missing one or more required parameters" });

  let newAttachments = [];
  if (content.attachments) {
    newAttachments = content.attachments;
    newAttachments.push(content.fileName);
  } else newAttachments = [content.fileName];

  const { data, error } = await connection
    .from("assignments")
    .update({ attachments: newAttachments })
    .eq("assign_id", content.assign_id)
    .select("attachments");

  if (error) return res.status(500).json({ error: error });
  else return res.status(200).json({ data: data[0].attachments });
});

router.get("/delete/:assign_id", async (req, res) => {
  //This is unoptimized
  const { data: assignCheck, error: assignCheckError } = await connection
    .from("assignments")
    .select("owner_id, attachments")
    .eq("assign_id", req.params.assign_id);
  if (assignCheckError) res.status(500).json({ error: error.message });
  else {
    if (assignCheck.length > 0) {
      const { data, error } = await connection
        .from("assignments")
        .delete()
        .eq("assign_id", req.params.assign_id);
      if (error) return res.status(500).json({ error: error.message });
      else {
        //Deletes associated files in bucket
        let files = [];
        assignCheck[0].attachments.forEach((at) => {
          if (!at.startsWith("https://"))
            files.push(`
          attachments/${assignCheck[0].owner_id}/${req.params.assign_id}/${at}
          `);
        });

        const { data: fileDelete, error: fileDeleteError } =
          await connection.storage.from("uploads").delete(files);
        if (fileDeleteError)
          return res.status(500).json({ error: fileDeleteError.message });
        else return res.status(200).json({ success: true });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, failMsg: "No assignment was found" });
    }
  }
});

router.post("/deleteattach", async (req, res) => {
  const content = req.body;
  if (!content.assign_id || !content.file || !content.attachments)
    return res
      .status(400)
      .json({ error: "Missing one or more required parameters" });

  const newAttachments = content.attachments;
  newAttachments.splice(
    newAttachments.findIndex((f) => f === content.file),
    1
  );

  //Removes from database row
  const { data: rowDelete, error: rowDeleteError } = await connection
    .from("assignments")
    .update({ attachments: newAttachments })
    .eq("assign_id", content.assign_id)
    .select("owner_id");
  if (rowDeleteError)
    return res.status(500).json({ error: rowDeleteError.message });

  //Deletes file from bucket (if applicable)
  if (content.file.startsWith("https://"))
    return res.status(200).json({ data: newAttachments });

  const { data: fileDelete, error: fileDeleteError } = await connection.storage
    .from("uploads")
    .remove([
      `attachments/${rowDelete[0].owner_id}/${content.assign_id}/${content.file}`,
    ]);
  if (fileDeleteError)
    return res.status(500).json({ error: fileDeleteError.message });
  else return res.status(200).json({ data: newAttachments });
});

module.exports = router;
