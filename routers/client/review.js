import express from "express";
const reviewRouter = express.Router();
import { Product } from "../../models/productscema.js";
import { adminAuth } from "../../auth/auth.js";
import { Review } from "../../models/reviewschema.js";

reviewRouter.post("/reviews/:productId", adminAuth, async (req, res) => {
    try {
      const user = req.admin;
      const { rating, comment } = req.body;
      const { productId } = req.params; // Get product ID from URL params
  
      if (!user || !productId || !rating || !comment) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const numericRating = Number(rating);
      if (isNaN(numericRating)) {
        return res.status(400).json({ message: "Rating must be a valid number between 1 and 5" });
      }
      if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
  
      // Check if product exists
      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Check if the user has already reviewed the product
      const existingReview = await Review.findOne({ user, product: productId });
      if (existingReview) {
        return res.status(400).json({ message: "User has already reviewed this product" });
      }
      // Update product's review count and cumulative rating
      const totalRating = productDoc.rating * productDoc.numReviews + numericRating;
      productDoc.rating = productDoc.numReviews > 0 ? totalRating / productDoc.numReviews : numericRating;
      productDoc.numReviews += 1;
      // Create and save new review
      const newReview = new Review({ user, product: productId, rating , comment });
      await newReview.save();
     
      // Add review ID to product's reviews array
      productDoc.reviews.push(newReview._id);
      await productDoc.save();

      res.status(201).json(newReview);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// edit review
  reviewRouter.put("/editreviews/:reviewId", adminAuth, async (req, res) => {
    try {
      const user = req.admin;
      const { rating, comment } = req.body;
      const { reviewId } = req.params;
  
      if (!rating && !comment) {
        return res.status(400).json({ message: "At least one field (rating or comment) is required" });
      }
  
      // Ensure rating is valid if provided
      if (rating !== undefined) {
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
          return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
        }
      }
  
      // Find review and check ownership
      const review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
  
      if (review.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this review" });
      }
  
      // Find the product associated with the review
      const product = await Product.findById(review.product);
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      // Update review
      const oldRating = review.rating;
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      await review.save();
  
      // Update product rating correctly
      const totalRating = product.rating * product.numReviews - oldRating + (rating ?? oldRating);
      product.rating = totalRating / product.numReviews;
      await product.save();
  
      res.status(200).json({ message: "Review updated successfully", review });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// delete review
  reviewRouter.delete("/deletereviews/:reviewId", adminAuth, async (req, res) => {
    try {
      const user = req.admin;
      const { reviewId } = req.params;
      
      // Find review and check ownership
      const review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
      
      if (review.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this review" });
      }
  
      // Find the product associated with the review
      const product = await Product.findById(review.product);
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      // Update product rating
      const oldRating = review.rating;
      product.reviews = product.reviews.filter((id) => id.toString() !== reviewId);
      product.numReviews -= 1;
      if (product.numReviews > 0) {
        product.rating = (product.rating * (product.numReviews + 1) - oldRating) / product.numReviews;
      } else {
        product.rating = 0;
      }
  
      await product.save();
      await review.deleteOne();
  
      res.status(200).json({ message: "Review deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

  export default reviewRouter;