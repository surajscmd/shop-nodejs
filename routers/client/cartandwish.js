import express from "express";
import User from "../../models/userschema.js";
import { Product } from "../../models/productscema.js";
import { adminAuth } from "../../auth/auth.js";

const cartRouter = express.Router();
// Add to Cart
cartRouter.post("/cart", adminAuth, async (req, res) => {
  try {
    const user = req.admin;
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    const currentuser = await User.findById(user._id);
    if (!currentuser) return res.status(404).json({ message: "User not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    // Check if product already exists in cart
    const cartItem = user.cart.find((item) => item.productId.toString() === productId);
    if (cartItem) {
      cartItem.quantity += quantity; // Update quantity
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();
    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get cart
cartRouter.get("/cartproduct", adminAuth, async (req, res) => {
  try {
    const userId = req.admin._id;

      const user = await User.findById(userId).populate({
          path: "cart.productId", // populate each cart item's productId
          model: "Product",
      });

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
          message: "Cart retrieved successfully",
          cart: user.cart.map(item => ({
              product: item.productId,
              quantity: item.quantity
          }))
      });
  } catch (error) {
      res.status(500).json({ message: "Error fetching cart", error: error.message });
  }
});

// increase or decrease
cartRouter.put("/cart/updatequantity/:productId/:action", adminAuth, async (req, res) => {
  try {
    const { productId, action } = req.params;
    const user = await User.findById(req.admin._id);
    let cartItem = user.cart.find(item => item.productId.equals(productId));

    if (!cartItem) {
      if (action === "increase") {
        user.cart.push({ productId, quantity: 1 });
        await user.save();
        await user.populate("cart.productId");

        const cart = user.cart.map(item => ({
          product: item.productId,
          quantity: item.quantity,
        }));

        return res.status(200).json({
          message: "Product added to cart",
          cart,
        });
      } else if (action === "decrease") {
        return res.status(400).json({ message: "Cannot decrease quantity because product is not in cart." });
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }
    } 
    
    // If product is already in cart
    if (action === "increase") {
      cartItem.quantity += 1;
    } else if (action === "decrease") {
      if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
      } else {
        return res.status(400).json({ message: "Quantity can't be less than 1" });
      }
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await user.save();
    await user.populate("cart.productId");

    const cart = user.cart.map(item => ({
      product: item.productId,
      quantity: item.quantity,
    }));

    res.status(200).json({
      message: `Quantity ${action}d`,
      cart,
    });

  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({ message: "Error updating cart quantity", error: error.message });
  }
});
// Add to Wishlist
cartRouter.post("/wishlist/:id", adminAuth, async (req, res) => {
    try {
     
    const user = req.admin;
    const productId = req.params.id
  
      if (!productId) return res.status(400).json({ message: "Product ID is required" });
  
      const currentuser = await User.findById(user._id);
      if (!currentuser) return res.status(404).json({ message: "User not found" });
  
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      // Check if product already exists in wishlist
      const alreadyInWishlist = user.wishlist.some((item) => item.productId.toString() === productId);
      if (alreadyInWishlist) {
        return res.status(400).json({ message: "Product is already in wishlist" });
      }
  
      user.wishlist.push({ productId });
      await user.save();
  
      res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  // get wishlish
  cartRouter.get("/wishlishproduct", adminAuth, async (req, res) => {
    try {
      const userId = req.admin._id;
  
      const user = await User.findById(userId)
        .populate("wishlist.productId"); // populate full product
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // send wishlist as is (full product details)
      const wishlistItems = user.wishlist.map(item => item.productId);
  
      res.status(200).json({  message: "wishlist retrieved successfully", wishlist: wishlistItems });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching cart", error: error });
    }
  })
//   delete cart
cartRouter.delete("/cart/:id", adminAuth, async (req, res) => {
    try {
      const user = req.admin; 
      const productId = req.params.id; 
  
      const currentuser = await User.findById(user._id);
      if (!currentuser) return res.status(404).json({ message: "User not found" });
  
      // Filter out the product from cart
      user.cart = user.cart.filter(
        (item) => item.productId.toString() !== productId
      );
  
      await user.save();
  
      res.status(200).json({ message: "Product removed from cart", cart: user.cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
// Move product from wishlist to cart
cartRouter.delete("/wishlist/movetocart/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.admin._id;
    const productId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      (item) => item.productId.toString() !== productId
    );

    // Add to cart
    const existingCartItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.quantity += 1;
    } else {
      user.cart.push({ productId, quantity: 1 });
    }

    await user.save();

    res.status(200).json({ message: "Product moved from wishlist to cart" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to move product" });
  }
});

// delete wishlist
cartRouter.delete("/wishlist/:id", adminAuth, async (req, res) => {
    try {
      const user = req.admin; 
      const productId = req.params.id; 
      const currentuser = await User.findById(user._id);
      if (!currentuser) return res.status(404).json({ message: "User not found" });
  
      // Filter out the product from wishlist
      user.wishlist = user.wishlist.filter(
        (item) => item.productId.toString() !== productId
      );
  
      await user.save();
  
      res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
export default cartRouter;