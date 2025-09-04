var express = require("express");
var router = express.Router();

var rssiModel = require("../config/models/rssiModel");

router.get("/", async (req, res) => {
  var { node_id = undefined } = req.query;
  var model = rssiModel;
  try {
    if (node_id) {
        var data = await model
          .find({
            node_id: node_id,
          })
          .sort({ timestamp: -1 })
          .limit(1)
          .exec();
        if (data) {
          res.json(data[0].rssi);
        } else {
          console.error("Unable to reach database: ");
        }
    } else {
        console.error("Invalid node_id");
    }
  } catch (error) {
    console.error("Error while fetching sensor status: ", error);
    res.json("Error while querying.");
  }
});

module.exports = router;