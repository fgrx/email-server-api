const express = require("express");
require("dotenv").config();

const cors = require("cors");

const app = express();

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(",");

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.options("*", cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ALLOWED_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

const API_KEY = process.env.GETRESPONSE_API_KEY;
const CAMPAIGN_ID = process.env.GETRESPONSE_LIST_ID;

app.get("/", (req, res) => {
  res.send("hello");
});

app.post("/add-contact", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "email and name are required" });
    }

    const response = await fetch("https://api.getresponse.com/v3/contacts", {
      method: "POST",
      headers: {
        "X-Auth-Token": `api-key ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name,
        campaign: {
          campaignId: CAMPAIGN_ID,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.message}`);
    }

    const data = await response.json();
    res.status(201).json(data);
  } catch (error) {
    console.error("Error adding contact:", error.message);
    res.status(500).json({
      error: "Failed to add contact",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
