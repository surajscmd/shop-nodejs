import express from "express";
import 'dotenv/config'
import cors from 'cors';
import connectDB from "./config/database.js"
import cookieparser  from 'cookie-parser'
const PORT = process.env.PORT || 5000; 
const app = express(); 
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.42.249:7777",
  "http://localhost:5174",
  "http://16.16.233.45:3000",
  "https://shop-admin-rust.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));


app.use(express.json());
app.use(cookieparser())

// router
import addproductRouter  from "./routers/admin/productadd.js"
import categoryRouter  from "./routers/admin/catogoryadd.js"
import authRouter  from "./routers/client/loggingin.js"
import reviewRouter from "./routers/client/review.js"
import cartRouter from "./routers/client/cartandwish.js"
import orderRouter from "./routers/admin/order.js"
import searchrouter from "./routers/client/search.js"
import  dashRouter  from "./routers/admin/dashboard.js"
app.use("/", addproductRouter);
app.use("/", categoryRouter);
app.use("/", authRouter);
app.use("/", reviewRouter);
app.use("/", cartRouter);
app.use("/", orderRouter);
app.use("/", searchrouter);
app.use("/", dashRouter);
connectDB()
  .then(() => {
    console.log("database connected sucessfully");
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("database cannot be connected " + ":" + err);
  });
