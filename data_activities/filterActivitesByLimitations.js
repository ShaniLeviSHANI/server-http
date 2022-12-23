const { activities } = require('./activity_list');

/* A function returns a list of activities sorted according to an array of limitations */
const tailoredActivities = (limitations) => {
    let system_activity_offers = [];
    if (limitations) {
        Object.keys(activities)
            .filter(key => !limitations.includes(key))
            .reduce((obj, key) => {
                obj[key] = activities[key];
                system_activity_offers = obj;
                return obj;
            }, {});
        return system_activity_offers;
    }
    else {
        system_activity_offers = activities;
        return activities;
    }
}

module.exports = {
    tailoredActivities
};