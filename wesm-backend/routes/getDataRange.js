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
  var { type, sensor_id, start_date, end_date } = req.query;
  
  if (start_date === undefined || end_date === undefined) {
    res.json('start_date or end_date missing.');
    return;
  }

  var model;
  if (type == "elec") {
    model = electricModel;
  } else if (type == "water") {
    model = waterModel;
  } else {
    res.status(404).send("Invalid 'type' value.");
    return;
  }

  try {
    let startDate = convertToUTCDate(start_date);
    let endDate = convertToUTCDate(end_date);

    startDate = new Date(startDate.setUTCHours(0,0,0,0));
    endDate = new Date(endDate.setUTCHours(23,59,59,999));

    let results = await model
      .find({
        sensor_id: sensor_id,
        timestamp: { $gte: startDate, $lte: endDate },
      })
      .exec();
    
    if (results) {
      for (let i = 0; i < results.length; i++) {
        console.log(`${results[i].timestamp.toISOString()}: ${results[i].power ?? results[i].water}`);
      }
      res.json(results);
    } else {
      console.error('Unable to get data from database.');
    }
  } catch (error) {
    console.error("Error while retrieving data from database: ", error);
  }
});

module.exports = router;
