var mongoose = require('mongoose');

const waterSchema = mongoose.Schema({
    sensor_id: String,
    node_id: String,
    timestamp: Date,
    water: Number
});
const waterModel = mongoose.model('node_1', waterSchema);

module.exports = waterModel;