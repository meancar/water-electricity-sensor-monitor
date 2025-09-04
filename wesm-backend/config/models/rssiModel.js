var mongoose = require('mongoose');

const rssiSchema = mongoose.Schema({
    node_id: String,
    rssi: Number,
    timestamp: Date,
});
const rssiModel = mongoose.model('rssi', rssiSchema);

module.exports = rssiModel;