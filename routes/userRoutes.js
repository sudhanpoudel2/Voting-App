import express from "express";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { loginValidation, registerValidation } from "../helper/validation.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", registerValidation, async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).send({ error: error.array() });
    }

    const dob = new Date(req.body.DoB);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs); // miliseconds from epoch
    const userAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (userAge < 18) {
      return res
        .status(400)
        .send({ message: "Registration is restricted for users under 18." });
    }

    const password = req.body.password;

    // Hash Password
    const hashPassword = await bcrypt.hash(password, 10);

    const register = await User.create({
      name: req.body.name,
      password: hashPassword,
      DoB: req.body.DoB,
      citizenship: req.body.citizenship,
      phone: req.body.phone,
      email: req.body.email,
      usertype: req.body.usertype,
    });
    res.status(200).send({ message: "user register successfully!!", register });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in register user api", error });
  }
});

router.post("/login", loginValidation, async (req, res) => {
  try {
    const { citizenship, password } = req.body;
    const user = await User.findOne({ citizenship });
    if (!user) {
      return res.status(400).send({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials!" });
    }
    user.password = undefined;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    res.status(200).send({ message: "Login successful", token, user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in login api", error });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById({ _id: req.body.id });
    if (!user) {
      return res.status(404).send({ message: "user not found" });
    }
    user.password = undefined;
    res.status(200).send({ message: "user found!", user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in get user api", error });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  try {
    const { id, address, phone, email } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { address, phone, email },
      { new: true }
    );
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "user update successfully", user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in update user api", error });
  }
});

router.put("/updatePassword", authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.body.id;
  console.log(`user : ${userId}`);
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Old password is incorrect" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, { password: hashPassword });

    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
});

export default router;
