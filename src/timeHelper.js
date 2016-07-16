var JHLP = {}

module.exports = {
    getCourseTimeGMT: (weeksForward, timeOfStart, dayNumber) => {

        JHLP.courseTime = new Date();
        JHLP.dayNumber = JHLP.courseTime.getDay()
        JHLP.dayNumber = (JHLP.dayNumber == 0) ? 7 : JHLP.dayNumber;
        JHLP.daysToAdd = weeksForward * 7 + dayNumber - JHLP.dayNumber;

        JHLP.courseTime.setHours(0);
        JHLP.courseTime.setMinutes(0);
        JHLP.courseTime.setSeconds(0);
        JHLP.courseTime.setMilliseconds(0);
        JHLP.courseTime.setTime(JHLP.courseTime.getTime() + JHLP.daysToAdd * 24 * 60 * 60 * 1000 + timeOfStart);

        return JHLP.courseTime;
    },
    getDayStr: (day) => {
        return day.getDate() + "." + day.getMonth() + "." + day.getFullYear()
    },
    getTimeStr: (day) => {
        return day.toTimeString()
    }
}