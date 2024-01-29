// functions to convert between unix timestamps and dates
function unix_to_date(unix_timestamp) {
	unix_timestamp = parseInt(unix_timestamp);
	return new Date(unix_timestamp * 1000);
}
function date_to_unix(date) {
	return date.getTime() / 1000 | 0;
}

// sums up an array of numbers, returns Number (or whatever inputs are)
function sum_n(array) {
	return array.reduce((accumulator, currentVal) => accumulator + currentVal, 0);
}

// generates random integer in [from, from + range) range
function random_int(from, range) {
	return Math.floor(from + Math.random() * range);
}

// picks random element from the array
function random_element(array, flat = true) {
	assert(array.length, "empty array");
	const i = random_int(0, array.length);
	const e = array[i];
	return flat? e: {e, i};
}

// user-friendly number printer
function print_n(n) {
	const THOUSAND = 1_000;
	const MILLION = 1_000_000;
	const BILLION = 1_000_000_000;

	if(n < THOUSAND) {
		return n + '';
	}
	if(n < MILLION) {
		const k = n / THOUSAND;
		return print_f2(k) + "k";
	}
	if(n < BILLION) {
		const m = n / MILLION;
		return print_f2(m) + "M";
	}
	const b = n / BILLION;
	return print_f2(b) + "G";
}

// prints a number with 2 digits after decimal point
function print_f2(n) {
	return Math.round(n * 100) / 100;
}

module.exports = {
	unix_to_date,
	date_to_unix,
	sum_n,
	random_int,
	random_element,
	print_n,
}
