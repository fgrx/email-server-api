const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

const API_KEY = process.env.GETRESPONSE_API_KEY;
const CAMPAIGN_ID = process.env.GETRESPONSE_LIST_ID;

app.get("/", (req, res) => {
  res.send("hello");
});

app.post("/add-contact", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const response = await fetch("https://api.getresponse.com/v3/contacts", {
      method: "POST",
      headers: {
        "X-Auth-Token": `api-key ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
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
