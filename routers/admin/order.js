import express from "express";
import User from "../../models/userschema.js";
import Order from "../../models/orderschema.js";
import { adminAuth } from "../../auth/auth.js";


const orderRouter = express.Router();
// order from client side
orderRouter.post("/order", adminAuth, async (req, res) => {
    try {
      // Fetch user and populate cart productsconst user = await req.admin.populate("cart.productId");
      // const user = await User.findById(req.admin._id).populate("cart.productId"); 
      const user = await req.admin.populate("cart.productId");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (!user.cart || user.cart.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
  
      const { paymentMethod } = req.body;
  
      // Extract items from the cart
      const items = user.cart.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price * item.quantity, // Ensure price exists in Product schema
      }));
  
      // Calculate total price
      const totalPrice = items.reduce((acc, item) => acc + item.price, 0);
  
      // Adjust shipping address using user profile
      const shippingAddress = {
        fullName: user.name,
        street: user.address.street,
        city: user.address.city,
        state: user.address.state,
        country: user.address.country,
        pinCode: user.address.pinCode,
      };
  
      // Create new order
      const order = new Order({
        user: user._id,
        items,
        totalPrice,
        paymentMethod,
        shippingAddress,
      });
  
      // Save order
      const createdOrder = await order.save();
  
      // Add order to user's order history
      user.orders.push({ orderId: createdOrder._id });
  
      // Clear user's cart after order placement
      user.cart = [];
      await user.save();
  
      res.status(201).json(createdOrder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // get orders lisr for admins

  orderRouter.get("/adminorderlist", adminAuth, async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("user", "name email phone") // Populate user details
        .populate("items.product", "name price description images"); // Populate product details
  
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


orderRouter.get("/user/orders", adminAuth, async (req, res) => {
  try {
    const user = await req.admin.populate({
      path: "orders.orderId",
      populate: {
        path: "items.product",
        select: "name price description images brand discountPrice",
      },
    });

    res.status(200).json(user.orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// delete api for admins
orderRouter.delete("/orderdelete/:orderId", adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const admin = await req.admin
     // Ensure the user is an admin
     if (admin.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Remove order from user's order history
    await User.findByIdAndUpdate(order.user, {
      $pull: { orders: { orderId: order._id } },
    });

    // Delete order from DB
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//cancle order 

orderRouter.patch("/ordercancel/:orderId", adminAuth, async (req, res) => {
  try {
    const user =  await req.admin; // Extract user from request
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the user is either an admin or the order owner
    if (user.role !== "admin" && order.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to cancel this order" });
    }

    // Prevent cancellation if the order is already shipped or delivered
    if (["Shipped", "Delivered"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "Order cannot be canceled at this stage" });
    }

    // Update order status to "Cancelled"
    order.orderStatus = "Cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update oder status from admin section
orderRouter.put("/order/:orderId/status/:orderStatus",adminAuth, async (req, res) => {
  try {
    const user = await req.admin; // Extract user from request
    const { orderId, orderStatus } = req.params;

    // Allowed order statuses
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered"];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only an admin can update order status
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update order status" });
    }

    // Update order status
    order.orderStatus = orderStatus;

    // If delivered, set the delivery date
    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



  

export default orderRouter;