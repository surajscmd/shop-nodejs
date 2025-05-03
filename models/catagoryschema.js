import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true }, // Slug field
  },
  { timestamps: true }
);

// Auto-generate slug from name before saving
categorySchema.pre("validate", function (next) {
    if (!this.slug) {
      this.slug = this.name.toLowerCase().replace(/\s+/g, "-"); // Converts "Men Shoes" to "men-shoes"
    }
    next();
  });

const Category = mongoose.model("Category", categorySchema);
export { Category };
