import { db } from '$lib/db';
import { generators, formTemplates, formTemplateItems, inspections, inspectionDetails, departments } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const generatorId = params.generator_id;
	const year = parseInt(params.year);
	const month = parseInt(params.month);

	// Validate month and year
	if (month < 1 || month > 12) {
		error(400, 'เดือนไม่ถูกต้อง');
	}

	// Get generator info
	const generator = await db
		.select({
			id: generators.id,
			assetId: generators.assetId,
			type: generators.type,
			sizeKw: generators.sizeKw,
			product: generators.product,
			location: generators.location,
			formTemplateId: generators.formTemplateId,
			department: {
				id: departments.id,
				name: departments.name
			}
		})
		.from(generators)
		.leftJoin(departments, eq(generators.departmentId, departments.id))
		.where(eq(generators.id, generatorId))
		.limit(1);

	if (!generator[0]) {
		error(404, 'ไม่พบเครื่องกำเนิดไฟฟ้า');
	}

	if (!generator[0].formTemplateId) {
		error(400, 'เครื่องนี้ยังไม่ได้กำหนดแบบฟอร์ม');
	}

	// Get form template items
	const formTemplate = await db
		.select({
			id: formTemplates.id,
			name: formTemplates.name
		})
		.from(formTemplates)
		.where(eq(formTemplates.id, generator[0].formTemplateId))
		.limit(1);

	const templateItems = await db
		.select()
		.from(formTemplateItems)
		.where(eq(formTemplateItems.formTemplateId, generator[0].formTemplateId))
		.orderBy(formTemplateItems.sortOrder);

	// Group items by category
	const groupedItems = templateItems.reduce((acc, item) => {
		const category = item.category;
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(item);
		return acc;
	}, {} as Record<string, typeof templateItems>);

	// Get existing inspection if any (current month)
	const existingInspectionRows = await db
		.select()
		.from(inspections)
		.where(
			and(
				eq(inspections.generatorId, generatorId),
				eq(inspections.month, month),
				eq(inspections.year, year)
			)
		)
		.limit(1);

	let existingInspection = null;
	if (existingInspectionRows[0]) {
		const details = await db
			.select()
			.from(inspectionDetails)
			.where(eq(inspectionDetails.inspectionId, existingInspectionRows[0].id));

		existingInspection = {
			...existingInspectionRows[0],
			details
		};
	}

	// Get previous month's inspection for pre-filling (only when no existing inspection for current month)
	let previousMonthInspection = null;
	if (!existingInspection) {
		const prevMonth = month === 1 ? 12 : month - 1;
		const prevYear = month === 1 ? year - 1 : year;

		const prevInspectionRows = await db
			.select()
			.from(inspections)
			.where(
				and(
					eq(inspections.generatorId, generatorId),
					eq(inspections.month, prevMonth),
					eq(inspections.year, prevYear)
				)
			)
			.limit(1);

		if (prevInspectionRows[0]) {
			const prevDetails = await db
				.select()
				.from(inspectionDetails)
				.where(eq(inspectionDetails.inspectionId, prevInspectionRows[0].id));

			previousMonthInspection = {
				...prevInspectionRows[0],
				details: prevDetails
			};
		}
	}

	return {
		generator: generator[0],
		formTemplate: formTemplate[0],
		groupedItems,
		existingInspection,
		previousMonthInspection,
		year,
		month
	};
};
