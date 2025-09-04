var mongoose = require('mongoose');

const electricSchema = mongoose.Schema({
    sensor_id: String,
    node_id: String,
    timestamp: Date,
    power: Number,
    voltage: Number
});
const electricModel = mongoose.model('node_2', electricSchema);

module.exports = electricModel;