import express from "express";
import { Product } from "../../models/productscema.js";
import { deleteFile, upload } from "../../utils/aws_s3.js";
import { Category } from "../../models/catagoryschema.js";

const addproductRouter = express.Router();
// add product
addproductRouter.post("/addproduct", upload.array("images", 5), async (req, res) => {
    try {
      const productData = req.body;
  
      // Validate required fields
      if (!productData.name || !productData.price || !productData.stock || !productData.category || !productData.brand || !productData.seller) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Handle image upload
      const images = req.files.map((file) => ({
        url: file.location, // S3 File URL
        public_id: file.key, // File Key in S3
      }));
  
      // Create a new product
      const newProduct = new Product({ ...productData, images });
      await newProduct.save();
  
      res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
// delet product
addproductRouter.delete("/deleteproduct/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete images from S3 concurrently using Promise.all
    await Promise.all(product.images.map((image) => deleteFile(image.public_id)));

    // Delete product from DB
    await Product.findByIdAndDelete(id);

    res.json({ success: true, message: "Product and images deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});



  // get product
  addproductRouter.get("/products", async (req, res) => {
    try {
      let query = {};
  
      // Filtering by price range
      if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
      }
  
      // Sorting (e.g., ?sort=price or ?sort=-price for descending)
      const sort = req.query.sort ? req.query.sort.replace(",", " ") : "-createdAt";
  
      // Pagination
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      // Fetching products
      const products = await Product.find(query)
        .populate("category", "name") // Populate category name
        .populate("reviews", "rating comment") // Populate reviews
        .sort(sort)
        .skip(skip)
        .limit(limit);
  
      // Get total count
      const total = await Product.countDocuments(query);
  
      res.json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: products,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
// get product by catagory
addproductRouter.get("/products/category", async (req, res) => {
  try {
    const { category: categorySlug, page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const query = {};

    // If category filter is applied
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      query.category = category._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("reviews", "rating comment")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});
// this is random prosuct
// Shuffle helper
function shuffleArray(array) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

// Generate N groups, each with exactly groupSize products
function generateRandomGroups(products, groupCount = 4, groupSize = 10) {
  const result = {};

  for (let i = 1; i <= groupCount; i++) {
    const shuffled = shuffleArray(products);
    const group = [];

    for (let j = 0; group.length < groupSize; j++) {
      const candidate = shuffled[j % shuffled.length];
      if (!group.find((p) => p._id.toString() === candidate._id.toString())) {
        group.push(candidate);
      }
    }

    result[`group${i}`] = group;
  }

  return result;
}

// API Route to fetch random product groups
addproductRouter.get("/products/randomgroups", async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category", "name slug")
      .populate("reviews", "rating comment")
      .lean();

    if (!products.length) {
      return res.status(404).json({ message: "No products found" });
    }

    const groupedProducts = generateRandomGroups(products, 4, 10);
    return res.status(200).json(groupedProducts);
  } catch (error) {
    console.error("Error generating product groups:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// Get a single product by ID
addproductRouter.get("/productsbyid/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "user",
        select: "name email", 
      },
    })
    .populate("category", "name");
  

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

  // API to edit/update a product
addproductRouter.patch("/editproduct/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Parse JSON if needed (for form-data)
    if (typeof updates === "string") {
      updates = JSON.parse(updates);
    }

    // Handle image updates (if new images are provided)
    if (req.files && req.files.length > 0) {
      // Delete old images from S3
      if (product.images && product.images.length > 0) {
        await Promise.all(product.images.map((image) => deleteFile(image.public_id)));
      }

      // Upload new images to S3
      const images = req.files.map((file) => ({
        url: file.location, // S3 File URL
        public_id: file.key, // File Key in S3
      }));
      updates.images = images;
    }

    // Update product in database
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });

    res.json({ success: true, message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});
  
export default addproductRouter;