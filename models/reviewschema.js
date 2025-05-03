import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookups
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true, // Helps in fetching reviews for a product efficiently
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users who liked the review
      },
    ],
  },
  { timestamps: true }
);

// Index to ensure a user can only review a product once
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export { Review };
