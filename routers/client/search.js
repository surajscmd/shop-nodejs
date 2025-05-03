import express from "express";
import { Product } from "../../models/productscema.js"; 

const searchrouter = express.Router();


// Search API - Matches the term in either name OR brand (Path Parameter) with pagination
searchrouter.get("/search/:word", async (req, res) => {
  try {
    const { word } = req.params; // Get the search word from URL path
    const { page = 1, limit = 10 } = req.query; // Default page is 1, limit is 10
    
    if (!word) {
      return res.status(400).json({ success: false, message: "Search word is required" });
    }

    // Build the search query
    let searchQuery = {
      $or: [
        { name: { $regex: word, $options: "i" } },
        { brand: { $regex: word, $options: "i" } }
      ]
    };

    // Get the total number of matching products
    const totalCount = await Product.countDocuments(searchQuery);

    // Calculate total pages based on the total number of products and the limit
    const totalPages = Math.ceil(totalCount / limit);

    // Get the products based on the search query with pagination
    const products = await Product.find(searchQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Send response with pagination information
    res.json({
      success: true,
      products,
      totalCount,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});




export default searchrouter;
