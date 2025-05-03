import express from "express";
import Order from "../../models/orderschema.js"

const dashRouter = express.Router();

dashRouter.get("/dashboard", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    // 📆 Date range
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);

    // 📦 Summary metrics
    const totalOrders = await Order.countDocuments();
    const shippedOrders = await Order.countDocuments({ orderStatus: "Shipped" });
    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });

    // 📈 Orders trend (grouped by date)
    const trends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      summary: {
        totalOrders,
        shippedOrders,
        pendingOrders,
        deliveredOrders,
      },
      trends,
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data", error });
  }
});

export default dashRouter;
