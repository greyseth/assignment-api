const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
// const formidable = require("formidable");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();

// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(multer());
app.use(cors());
app.use(
  morgan("combined", {
    skip: (req, res) => {
      return res.statusCode < 400;
    },
  })
);

const userRouter = require("./routes/users");
const classRouter = require("./routes/classes");
const assignmentRouter = require("./routes/assignments");

app.use("/users", userRouter);
app.use("/classes", classRouter);
app.use("/assignments", assignmentRouter);

app.post("testupload", async (req, res) => {});

app.listen(3001, () => {
  console.log("The API is running on port 3001");
});
