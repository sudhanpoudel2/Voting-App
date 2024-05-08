import { User } from "../models/userModel.js";

export default async function (req, res, next) {
  try {
    const userId = req.body.id;
    // console.log("User ID:", userId);
    const user = await User.findById(userId);
    // console.log("User:", user);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (user.usertype !== "admin") {
      return res.status(403).send({ message: "Only admin can access!" });
    }

    next();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
}
