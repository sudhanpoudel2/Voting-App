import { check } from "express-validator";
import { User } from "../models/userModel.js";

export const registerValidation = [
  check("name", "Name is required").not().isEmpty(),
  check(
    "password",
    "password must be greater than 6 and contains at least one uppercase,lowercase,number and special character"
  ).isStrongPassword({
    minLength: 6,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }),
  check("address", "Address is required").not().isEmpty(),
  check("DoB", "Date of birth is required").not().isEmpty(),
  check("citizenship", "citizenship number is required").not().isEmpty(),
  check("citizenship").custom(async (value) => {
    const existingUser = await User.findOne({ citizenship: value });
    if (existingUser) {
      throw new Error("citizenship number already exists");
    }
  }),
  check("phone", "phone number should be contains 10 digits").isLength({
    min: 10,
    max: 10,
  }),
  check("phone").custom(async (value) => {
    const existingUser = await User.findOne({ phone: value });
    if (existingUser) {
      throw new Error("Phone already exists");
    }
    return true;
  }),
  check("email", "Email is required").not().isEmpty(),
  check("usertype").custom(async (value) => {
    const existingUser = await User.findOne({ usertype: value });
    if (existingUser) {
      throw new Error("admin already exist");
    }
    return true;
  }),
];

export const loginValidation = [
  check("citizenship", "Citizenship is required").not().isEmpty(),
  check("password", "Password is required").not().isEmpty(),
];

export const candidateAddValidation = [
  check("name", "Name is required").not().isEmpty(),
  check("party", "Party is required").not().isEmpty(),
  // check("image", "Image is required").not().isEmpty(),
];
