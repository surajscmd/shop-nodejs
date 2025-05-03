import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      pinCode: { type: String, default: "" },
    },
    phone: {
      type: String,
      default: "",
    },
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    orders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      },
    ],
    wishlist: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Generate JWT Token
userSchema.methods.getJWT = async function () {
  return jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Validate Password
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  return await bcrypt.compare(passwordInputByUser, this.password);
};

export default mongoose.model("User", userSchema);
