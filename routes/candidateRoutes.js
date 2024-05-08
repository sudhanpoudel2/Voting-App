import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { Candidate } from "../models/candidateModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { candidateAddValidation } from "../helper/validation.js";
import { validationResult } from "express-validator";
import { log } from "console";
import { User } from "../models/userModel.js";

const router = express.Router();

const allowedExtensions = [".jpg", ".jpeg", ".png"];

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const currentWorkingDirectory = process.cwd();
    const destinationDirectory = path.join(
      currentWorkingDirectory,
      "public",
      "image"
    );
    ensureDirectoryExists(destinationDirectory);
    cb(null, destinationDirectory);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.split(" ").join("_");
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${fileName}-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024,
    files: 1,
  },
  fileFilter: function (req, file, cb) {
    const isImage = allowedExtensions.includes(
      path.extname(file.originalname).toLowerCase()
    );
    if (!isImage) {
      cb(
        new multer.MulterError("INVALID_FILE_TYPE", {
          message: `Invalid file type: ${file.originalname}`,
        })
      );
    } else {
      cb(null, true);
    }
  },
});

const handleMulterErrors = (err, req, res, next) => {
  console.log("Error:", err.code);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).send({
      message:
        "The file size exceeded the limit. Please select a smaller file.",
    });
  } else if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).send({
      message: `You can only upload one files at a time.`,
    });
  } else if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).send({
      message: "The file type is not allowed. Only png,jpg,jpeg",
    });
  }
};

router.post(
  "/",
  upload.single("image"),
  handleMulterErrors,
  candidateAddValidation,
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).send({ error: error.array() });
      }

      const basePath = `http://localhost:8080/public/image/`;
      const imagePath = basePath + req.file.filename;

      const addCandidate = await Candidate.create({
        name: req.body.name,
        party: req.body.party,
        image: imagePath,
      });
      res
        .status(200)
        .send({ message: "candidate added successfully!", addCandidate });
    } catch (error) {
      console.log(error);
      res.status(400).send({ message: "Error in adding candidate", error });
    }
  }
);

router.put(
  "/:_id",
  upload.single("image"),
  handleMulterErrors,
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const id = req.params._id;
      const { name, party, image } = req.body;
      let updateFields = { name, party };
      if (req.file) {
        updateFields.image = req.file.filename;
      }

      const candidate = await Candidate.findByIdAndUpdate(id, updateFields, {
        new: true,
      });
      console.log(`Candidte : ${candidate}`);
      if (!candidate) {
        return res.status(404).send({ message: "candidate not found" });
      }
      res.status(200).send({ message: "updated successfully!!", candidate });
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .send({ message: "Error in update candidate profile", error });
    }
  }
);

router.delete("/:_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params._id;
    const candidate = await Candidate.findByIdAndDelete(id);
    if (!candidate) {
      res.status(404).send({ message: "candidate not found" });
    }
    res
      .status(200)
      .send({ message: "candidate profile delete successfully!!" });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .send({ message: "Error in delete candidate profile", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const candidateList = await Candidate.find();
    if (!candidateList) {
      res.status(404).send({ message: "Empty Candidate List!" });
    }
    res.status(200).send({ message: "Candidate List!!", candidateList });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Erroi in candidate List", error });
  }
});

router.post("/vote/:candidateID", authMiddleware, async (req, res) => {
  const candidateID = req.params.candidateID;
  const userID = req.body.id;
  try {
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).send({ message: "candidate not found" });
    }

    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).send({ message: "user not found" });
    }
    if (user.isvoted) {
      return res.status(400).send({ message: "you are already voted" });
    }
    if (user.usertype == "admin") {
      return res.status(400).send({ message: "admin is not allowed  " });
    }
    await Candidate.findByIdAndUpdate(candidateID, {
      $inc: { voteCount: 1 },
      $push: { votes: { user: userID } },
    });
    await User.findByIdAndUpdate(userID, { isvoted: true });

    res.status(200).send({ message: "Vote successful" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in Voting Api", error });
  }
});

router.get("/vote/count", async (req, res) => {
  try {
    const candidateVote = await Candidate.find().sort({ voteCount: "desc" });

    const record = candidateVote.map((data) => {
      return {
        party: data.party,
        count: data.voteCount,
      };
    });
    res.status(200).send({ message: "vote record", record });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in count vote api", error });
  }
});

export default router;
