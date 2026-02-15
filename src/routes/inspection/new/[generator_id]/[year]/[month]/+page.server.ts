import { db } from '$lib/db';
import { generators, formTemplates, formTemplateItems, inspections, inspectionDetails, departments } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	calculateMachineStatus,
	calculateOverallStatus,
	validateInspectionItems,
	generateInspectionCode
} from '$lib/server/inspectionLogic';

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

export const actions: Actions = {
	create: async ({ request, locals, params }) => {
		const data = await request.formData();
		const inspectorName = data.get('inspectorName') as string;
		const items = JSON.parse(data.get('items') as string);
		const overallRemark = data.get('overallRemark') as string;
		const generatorId = params.generator_id;
		const month = parseInt(params.month);
		const year = parseInt(params.year);

		const finalInspectorName = inspectorName || locals.user?.displayName;

		if (!generatorId || !month || !year || !finalInspectorName) {
			return fail(400, { error: 'ข้อมูลไม่ครบถ้วน' });
		}

		try {
			// Get generator's form template
			const generator = await db
				.select({ formTemplateId: generators.formTemplateId })
				.from(generators)
				.where(eq(generators.id, generatorId))
				.limit(1);

			if (!generator[0]) {
				return fail(400, { error: 'ไม่พบเครื่อง' });
			}
			if (!generator[0].formTemplateId) {
				return fail(400, { error: 'เครื่องนี้ยังไม่ได้กำหนดแบบฟอร์ม' });
			}

			// Get form template items
			const templateItems = await db
				.select({
					itemCode: formTemplateItems.itemCode,
					description: formTemplateItems.description,
					isDisposalCriteria: formTemplateItems.isDisposalCriteria
				})
				.from(formTemplateItems)
				.where(eq(formTemplateItems.formTemplateId, generator[0].formTemplateId))
				.orderBy(formTemplateItems.sortOrder);

			// Build items array with descriptions from template
			const templateItemMap = new Map(templateItems.map((t) => [t.itemCode, t]));
			const itemsList = Object.entries(items as Record<string, { status: string; remark: string }>).map(
				([itemCode, val]) => ({
					itemCode,
					status: val.status as 'ปกติ' | 'ไม่ปกติ',
					remark: val.remark || '',
					description: templateItemMap.get(itemCode)?.description || itemCode
				})
			);

			// Validate items
			const validationErrors = validateInspectionItems(itemsList);
			if (validationErrors.length > 0) {
				return fail(400, { error: validationErrors.join(', ') });
			}

			// Check for existing inspection
			const existing = await db
				.select({ id: inspections.id })
				.from(inspections)
				.where(
					and(
						eq(inspections.generatorId, generatorId),
						eq(inspections.month, month),
						eq(inspections.year, year)
					)
				)
				.limit(1);

			if (existing[0]) {
				return fail(400, { error: 'เครื่องนี้ถูกตรวจแล้วในเดือนนี้' });
			}

			// Calculate statuses
			const overallStatus = calculateOverallStatus(itemsList);
			const machineStatus = calculateMachineStatus(itemsList, templateItems);
			const inspectionCode = generateInspectionCode();

			// Create inspection record
			const newInspection = await db
				.insert(inspections)
				.values({
					inspectionCode,
					generatorId,
					month,
					year,
					inspectionDate: new Date(),
					formTemplateId: generator[0].formTemplateId,
					inspectorName: finalInspectorName,
					overallStatus,
					machineStatus,
					overallRemark: overallRemark || null
				})
				.returning();

			// Create inspection details
			await db.insert(inspectionDetails).values(
				itemsList.map((item) => ({
					inspectionId: newInspection[0].id,
					itemCode: item.itemCode,
					description: item.description,
					status: item.status,
					remark: item.remark || null
				}))
			);

			// Update generator isActive based on machineStatus
			await db
				.update(generators)
				.set({ isActive: machineStatus !== 'รอจำหน่าย', updatedAt: new Date() })
				.where(eq(generators.id, generatorId));

			return { success: true, inspectionId: newInspection[0].id };
		} catch (err) {
			console.error('Create inspection error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	update: async ({ request, locals }) => {
		const data = await request.formData();
		const inspectionId = data.get('inspectionId') as string;
		const inspectorName = data.get('inspectorName') as string;
		const items = JSON.parse(data.get('items') as string);
		const overallRemark = data.get('overallRemark') as string;

		const finalInspectorName = inspectorName || locals.user?.displayName;

		if (!inspectionId || !finalInspectorName) {
			return fail(400, { error: 'ข้อมูลไม่ครบถ้วน' });
		}

		try {
			// Get existing inspection
			const existingInspection = await db
				.select()
				.from(inspections)
				.where(eq(inspections.id, inspectionId))
				.limit(1);

			if (!existingInspection[0]) {
				return fail(404, { error: 'ไม่พบการตรวจ' });
			}

			// Get generator's form template
			const generator = await db
				.select({ formTemplateId: generators.formTemplateId })
				.from(generators)
				.where(eq(generators.id, existingInspection[0].generatorId))
				.limit(1);

			if (!generator[0]?.formTemplateId) {
				return fail(404, { error: 'ไม่พบเครื่องหรือแบบฟอร์ม' });
			}

			// Get form template items
			const templateItems = await db
				.select({
					itemCode: formTemplateItems.itemCode,
					description: formTemplateItems.description,
					isDisposalCriteria: formTemplateItems.isDisposalCriteria
				})
				.from(formTemplateItems)
				.where(eq(formTemplateItems.formTemplateId, generator[0].formTemplateId))
				.orderBy(formTemplateItems.sortOrder);

			// Build items array
			const templateItemMap = new Map(templateItems.map((t) => [t.itemCode, t]));
			const itemsList = Object.entries(items as Record<string, { status: string; remark: string }>).map(
				([itemCode, val]) => ({
					itemCode,
					status: val.status as 'ปกติ' | 'ไม่ปกติ',
					remark: val.remark || '',
					description: templateItemMap.get(itemCode)?.description || itemCode
				})
			);

			// Validate items
			const validationErrors = validateInspectionItems(itemsList);
			if (validationErrors.length > 0) {
				return fail(400, { error: validationErrors.join(', ') });
			}

			// Calculate statuses
			const overallStatus = calculateOverallStatus(itemsList);
			const machineStatus = calculateMachineStatus(itemsList, templateItems);

			// Update inspection
			await db
				.update(inspections)
				.set({
					inspectorName: finalInspectorName,
					overallStatus,
					machineStatus,
					overallRemark: overallRemark || null,
					updatedAt: new Date()
				})
				.where(eq(inspections.id, inspectionId));

			// Delete old details and create new ones
			await db.delete(inspectionDetails).where(eq(inspectionDetails.inspectionId, inspectionId));

			await db.insert(inspectionDetails).values(
				itemsList.map((item) => ({
					inspectionId,
					itemCode: item.itemCode,
					description: item.description,
					status: item.status,
					remark: item.remark || null
				}))
			);

			// Update generator isActive based on machineStatus
			await db
				.update(generators)
				.set({ isActive: machineStatus !== 'รอจำหน่าย', updatedAt: new Date() })
				.where(eq(generators.id, existingInspection[0].generatorId));

			return { success: true };
		} catch (err) {
			console.error('Update inspection error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	}
};
