const mongoose = require('mongoose');

const syncperformanceSchema = new mongoose.Schema({
    meeting_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'meetings',
    },
    totalAvg: {
        type: String,
        required: true
    },
    resultByActivities: [{
        type: Object,
    }],
    /*resultByActivities=[
        {activity: "1", avg: "88", result: ["",""..], time:["",""..]},
        ....
    ]
    */
    dateEnd: {
        type: Date,
    },
    trainee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


const SyncPerformance = mongoose.model('syncperformance', syncperformanceSchema);
module.exports = { SyncPerformance };