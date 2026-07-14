const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const { initProductTable } = require("./models/productModel");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
pool.connect()
  .then(() => {
    console.log("Connected to Neon PostgreSQL");
    return initProductTable();
  })
  .then(() => {
    console.log("Products table ready");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);

app.get("/", (req, res) => {
  res.send("Backend API running");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API running on ${PORT}`);
});