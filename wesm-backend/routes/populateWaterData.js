var express = require("express");
var router = express.Router();
const waterModel = require("../config/models/waterModel");

async function populateData(sensorId) {
  try {
    // Generate 60 random power values between 1 and 100, sorted in ascending order
    const waterValues = Array.from({ length: 60 }, () =>
      (Math.random() * 30 + 1).toFixed(2)
    ).sort((a, b) => a - b);

    today = new Date();
    // Set start date to 59 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 59);

    // Create documents array
    const documents = [];
    for (let day = 0; day < 60; day++) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + day);
      const seconds = Math.floor(Math.random() * 60);
      date.setUTCHours(1, 30, seconds, 0);

      const doc = {
        sensor_id: sensorId,
        node_id: "node_1",
        timestamp: date,
        water: waterValues[day],
      };
      documents.push(doc);
    }

    // Insert all documents into the database
    await waterModel.insertMany(documents);
    console.log(`Data inserted successfully to ${sensorId}`);
  } catch (err) {
    console.error("Error inserting data", err);
  }
}

router.get("/", async (req, res) => {
  var { sensor_id = undefined } = req.query;
  try {
    if (sensor_id) {
      populateData(sensor_id);
    } else {
      console.error("invalid or missing sensor_id.");
    }
  } catch (err) {
    res.json("Unable to populate ", sensor_id);
  }
  res.json("Data populated successfully.");
});

module.exports = router;
