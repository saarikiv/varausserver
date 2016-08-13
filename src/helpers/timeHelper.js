var JHLP = {}

module.exports = {
    getCourseTimeLocal: (weeksForward, timeOfStart, dayNumber) => {

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
        return day.getDate() + "." + day.getMonth()+1 + "." + day.getFullYear()
    },
    getTimeStr: (day) => {
        return day.toTimeString()
    },
    getUntilEndOfDayMsFromNow: (now) => {
        JHLP.nowTime = new Date();
        JHLP.nowTime.setTime(now);
        JHLP.nowTime.setHours(23);
        JHLP.nowTime.setMinutes(59);
        JHLP.nowTime.setSeconds(59);
        JHLP.nowTime.setMilliseconds(999);
        return (JHLP.nowTime.getTime() - now)
    },
    shiftUntilEndOfDayMs: (now) => {
        JHLP.nowTime = new Date();
        JHLP.nowTime.setTime(now);
        JHLP.nowTime.setHours(23);
        JHLP.nowTime.setMinutes(59);
        JHLP.nowTime.setSeconds(59);
        JHLP.nowTime.setMilliseconds(999);
        console.log("TIME HELPER - shift time to EOD:", JHLP.nowTime, (now - JHLP.nowTime.getTime()));
        return JHLP.nowTime.getTime()
    }

}