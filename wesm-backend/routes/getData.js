var express = require("express");
var router = express.Router();

var electricModel = require("../config/models/electricModel");
var waterModel = require("../config/models/waterModel");

function convertToUTCDate(dateString) {
  try {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      throw new Error("Invalid date format. Use yyyy-mm-dd");
    }

    const [year, month, day] = dateString.split("-");

    const date = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    return date;
  } catch (error) {
    console.error("Error converting date:", error.message);
    throw error;
  }
}

router.get("/", async (req, res) => {
  var { type, sensor_id, date = undefined } = req.query;
  var model;
  console.log(date);

  if (type == "elec") {
    model = electricModel;
  } else if (type == "water") {
    model = waterModel;
  } else {
    res.status(404).send("Invalid 'type' value.");
    return;
  }

  try {
    var reqDate = new Date();
    var startDate = new Date();
    var endDate = new Date();

    if (date !== undefined) {
      reqDate = convertToUTCDate(date);
      endDate = new Date(reqDate.setHours(23, 59, 59, 999));
    } else {
      endDate = new Date(endDate.setFullYear(2077)); // OMG IS THAT A CYBERPUNK REFERENCE???????????
    }

    var result = await model
      .find({
        sensor_id: sensor_id,
        timestamp: { $lt: endDate },
      })
      .sort({ timestamp: -1 })
      .limit(1)
      .exec();

    if (result) {
      console.log(result);
      res.json(result);
    } else {
      console.error("Unable to reach database");
    }
  } catch (error) {
    console.error("Error while retrieving data from database: ", error.message);
  }
});

module.exports = router;
