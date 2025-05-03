import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // category: {
    //     type: String,
        
    //     required: false,
    //   },
    brand: {
      type: String,
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }, // For cloud storage (e.g., Cloudinary)
      },
    ],
    sizes: [
      {
        type: String, // Example: ['S', 'M', 'L', 'XL']
      },
    ],
    colors: [
      {
       type: String
      },
    ],
    weight: {
      type: Number, // Example: Weight in grams or kilograms
      default: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    warranty: {
      type: String, // Example: "1 Year Warranty"
      default: "No Warranty",
    },
    shippingInfo: {
      type: String, // Example: "Ships in 3-5 business days"
      default: "Standard shipping",
    },
    returnPolicy: {
      type: String, // Example: "30-day return policy"
      default: "No Returns",
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Review", // Linking reviews for population
        }],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    seller: {
      type: String,
      default: "skewcube in house",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
const Product = mongoose.model("Product", productSchema);
export { Product };
