var express = require("express");
var router = express.Router();
const rssiModel = require("../config/models/rssiModel");

async function populateRssi(nodeId) {
  try {
    const rssiValues = Array.from({ length: 200 }, () =>
      Math.floor(Math.random() * 100 - 120)
    );

    let today = new Date();
    let interval = 15;
    
    var startDate = new Date();
    startDate.setMinutes(today.getMinutes() - (interval * 199));

    // Create documents array
    const documents = [];
    for (let i = 0; i < 200; i++) {
      let date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + (i * interval));

      const doc = {
        node_id: nodeId,
        rssi: rssiValues[i],
        timestamp: date,
      };
      documents.push(doc);
    }

    // Insert all documents into the database
    await rssiModel.insertMany(documents);
    console.log(`Data inserted successfully for ${nodeId}`);
  } catch (err) {
    console.error("Error inserting data: ", err);
  }
}

router.get("/", async (req, res) => {
  var { node_id = undefined } = req.query;
  try {
    if (node_id === "node_1" || node_id === "node_2") {
      populateRssi(node_id);
    } else {
      console.error("invalid or missing node_id.");
    }
  } catch (err) {
    res.json("Unable to populate ", node_id);
  }
  res.json("RSSI populated successfully.");
});

module.exports = router;
