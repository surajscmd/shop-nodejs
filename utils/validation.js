import validator from "validator";

export const validateSignUpData = (req) => {
  const { name, email, password } = req.body;

  if (!name) {
    throw new Error("Name is not valid");
  }
  if (!validator.isEmail(email)) {
    throw new Error("Email is not valid!");
  }
  if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password!");
  }
};
