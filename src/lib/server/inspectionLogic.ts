import type { MachineStatus, OverallStatus } from '$lib/db';

// Re-export utility functions so existing server-side imports still work
export {
	getThaiMonthName,
	getShortThaiMonthName,
	formatThaiDate,
	isFutureMonth,
	isPastMonth,
	getCurrentMonthYear
} from '$lib/utils';

export interface InspectionItemInput {
	itemCode: string;
	status: 'ปกติ' | 'ไม่ปกติ';
	remark?: string;
}

export interface FormTemplateItem {
	itemCode: string;
	isDisposalCriteria: boolean;
}

/**
 * Calculate overall status based on inspection items
 * @returns 'ปกติ' if all items are normal, 'ไม่ปกติ' if any item is abnormal
 */
export function calculateOverallStatus(items: InspectionItemInput[]): OverallStatus {
	const hasAbnormal = items.some((item) => item.status === 'ไม่ปกติ');
	return hasAbnormal ? 'ไม่ปกติ' : 'ปกติ';
}

/**
 * Calculate machine status based on inspection items and disposal criteria
 *
 * Rules:
 * 1. "ใช้งานได้" — All items are "ปกติ"
 * 2. "ซ่อมแซม" — Some items are "ไม่ปกติ" but don't meet disposal criteria
 * 3. "รอจำหน่าย" — ALL items marked with is_disposal_criteria = true are "ไม่ปกติ"
 */
export function calculateMachineStatus(
	items: InspectionItemInput[],
	templateItems: FormTemplateItem[]
): MachineStatus {
	const disposalCriteriaItems = templateItems.filter((item) => item.isDisposalCriteria);

	if (disposalCriteriaItems.length === 0) {
		const hasAbnormal = items.some((item) => item.status === 'ไม่ปกติ');
		return hasAbnormal ? 'ซ่อมแซม' : 'ใช้งานได้';
	}

	const allDisposalCriteriaAbnormal = disposalCriteriaItems.every((criteriaItem) => {
		const inspectionItem = items.find((item) => item.itemCode === criteriaItem.itemCode);
		return inspectionItem?.status === 'ไม่ปกติ';
	});

	if (allDisposalCriteriaAbnormal) {
		return 'รอจำหน่าย';
	}

	const hasAbnormal = items.some((item) => item.status === 'ไม่ปกติ');
	return hasAbnormal ? 'ซ่อมแซม' : 'ใช้งานได้';
}

/**
 * Generate inspection code
 * Format: INS-{yyyyMMddHHmmss}-{random3digit}
 */
export function generateInspectionCode(): string {
	const now = new Date();
	const timestamp = now
		.toISOString()
		.replace(/[-:T.]/g, '')
		.slice(0, 14);
	const random = Math.floor(Math.random() * 1000)
		.toString()
		.padStart(3, '0');
	return `INS-${timestamp}-${random}`;
}

/**
 * Validate inspection items
 */
export function validateInspectionItems(items: InspectionItemInput[]): string[] {
	const errors: string[] = [];

	for (const item of items) {
		if (!item.status || (item.status !== 'ปกติ' && item.status !== 'ไม่ปกติ')) {
			errors.push(`รายการ ${item.itemCode}: กรุณาระบุสถานะ`);
		}

		if (item.status === 'ไม่ปกติ' && !item.remark?.trim()) {
			errors.push(`รายการ ${item.itemCode}: กรุณาระบุหมายเหตุเมื่อสถานะไม่ปกติ`);
		}
	}

	return errors;
}
