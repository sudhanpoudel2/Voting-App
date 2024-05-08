import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String },
    password: { type: String },
    address: { type: String },
    DoB: { type: String },
    citizenship: { type: String },
    phone: { type: String },
    email: { type: String },
    usertype: { type: String, enum: ["client", "admin"], default: "client" },
    isvoted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
