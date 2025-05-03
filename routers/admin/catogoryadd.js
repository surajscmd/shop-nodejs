import express from "express";
import { Category } from "../../models/catagoryschema.js";

const categoryRouter = express.Router();

// Add a New Category
categoryRouter.post("/addcategory", async (req, res) => {
  try {
    const { name } = req.body;

    // Validate name
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Create new category
    const category = new Category({ name });
    await category.save();

    res.status(201).json({ message: "Category added successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a Category by ID
categoryRouter.delete("/deletecategory/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Categories
categoryRouter.get("/allcategories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }); // Sort by latest
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default categoryRouter;
