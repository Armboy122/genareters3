/**
 * Get Thai month name
 * @param month - Month number (1-12)
 * @returns Thai month name
 */
export function getThaiMonthName(month: number): string {
	const months = [
		'มกราคม',
		'กุมภาพันธ์',
		'มีนาคม',
		'เมษายน',
		'พฤษภาคม',
		'มิถุนายน',
		'กรกฎาคม',
		'สิงหาคม',
		'กันยายน',
		'ตุลาคม',
		'พฤศจิกายน',
		'ธันวาคม'
	];
	return months[month - 1] || '';
}

/**
 * Get short Thai month name
 * @param month - Month number (1-12)
 * @returns Short Thai month name (e.g., "ม.ค.")
 */
export function getShortThaiMonthName(month: number): string {
	const months = [
		'ม.ค.',
		'ก.พ.',
		'มี.ค.',
		'เม.ย.',
		'พ.ค.',
		'มิ.ย.',
		'ก.ค.',
		'ส.ค.',
		'ก.ย.',
		'ต.ค.',
		'พ.ย.',
		'ธ.ค.'
	];
	return months[month - 1] || '';
}

/**
 * Format date to Thai format
 * @param date - Date object or string
 * @returns Formatted date string (e.g., "14 กุมภาพันธ์ 2569")
 */
export function formatThaiDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const day = d.getDate();
	const month = getThaiMonthName(d.getMonth() + 1);
	const year = d.getFullYear() + 543; // Convert to Buddhist year
	return `${day} ${month} ${year}`;
}

/**
 * Check if a month/year is in the future
 */
export function isFutureMonth(month: number, year: number): boolean {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	if (year > currentYear) return true;
	if (year === currentYear && month > currentMonth) return true;
	return false;
}

/**
 * Check if a month/year is in the past (not current or future)
 */
export function isPastMonth(month: number, year: number): boolean {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	if (year < currentYear) return true;
	if (year === currentYear && month < currentMonth) return true;
	return false;
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
	const now = new Date();
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear()
	};
}
