import moment, { Moment } from 'moment';

// Compres for overlapping time periods by getting start and end dates for 2 date periods and compares them
export const isOverlapingPeriod = (startDateA: Moment, endDateA: Moment, startDateB: Moment, endDateB: Moment) => {
	return (startDateA <= endDateB && startDateB <= endDateA)
}

// Calculates the day difference between the overlaping periods
export const getOveralpingDays = (startDateA: Moment, endDateA: Moment, startDateB: Moment, endDateB: Moment) => {
	// Takes the bigger (latest) start date and the smaller end that
	const start = startDateA > startDateB ? startDateA : startDateB
	const end = endDateA < endDateB ? endDateA : endDateB

	return end.diff(start, 'days')
}

// Converts the given string date to DateTime type
// In the case of null as argument the reuturned element will be DateTime for "today"
export const normalizeStringDate = (date: string) => {
	const normalizedDate = date === null ? moment(moment().fromNow()) : moment(date.trim())
	return normalizedDate
}