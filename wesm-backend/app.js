var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var dotenv = require("dotenv");
var cors = require("cors");

dotenv.config();

// import connectDB from './config/db.js';

var connectDB = require("./config/db.js");
connectDB();

const indexRouter = require("./routes/index");
const streamDataRouter = require("./routes/stream_data");
// const getOldWaterRouter = require('./routes/getOldWater');
// const getOldElectricRouter = require('./routes/getOldElectric');
const getDataRouter = require("./routes/getData");
const getDataRangeRouter = require("./routes/getDataRange");
const populateDataRouter = require("./routes/populateElecData");
const populateWaterRouter = require("./routes/populateWaterData");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/stream_data", streamDataRouter);
app.use("/api/get", getDataRouter);
app.use("/api/get/range", getDataRangeRouter);
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/populate/elec", populateDataRouter);
app.use("/populate/water", populateWaterRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(3000, () => console.log("Server is running"));

module.exports = app;
