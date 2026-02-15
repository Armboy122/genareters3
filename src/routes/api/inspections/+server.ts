import { db } from '$lib/db';
import { generators, inspections, inspectionDetails, formTemplateItems } from '$lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import {
	calculateMachineStatus,
	calculateOverallStatus,
	validateInspectionItems,
	generateInspectionCode
} from '$lib/server/inspectionLogic';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentication check
		if (!locals.user) {
			return json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
		}

		// Role check - only admin and inspector can create inspections
		if (locals.user.role === 'viewer') {
			return json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
		}

		const body = await request.json();
		const { generatorId, month, year, inspectorName, items, overallRemark } = body;

		// Use logged-in user's displayName as fallback for inspectorName
		const finalInspectorName = inspectorName || locals.user.displayName;

		if (!generatorId || !month || !year || !finalInspectorName) {
			return json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
		}

	// Get generator's form template
	const generator = await db
		.select({ formTemplateId: generators.formTemplateId })
		.from(generators)
		.where(eq(generators.id, generatorId))
		.limit(1);

	if (!generator[0]) {
		return json({ success: false, message: 'ไม่พบเครื่อง' }, { status: 400 });
	}

	if (!generator[0].formTemplateId) {
		return json({ success: false, message: 'เครื่องนี้ยังไม่ได้กำหนดแบบฟอร์ม' }, { status: 400 });
	}

	// Get form template items for descriptions and disposal criteria
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
		return json({ success: false, message: validationErrors.join(', ') }, { status: 400 });
	}

	// Check for existing inspection (unique constraint)
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
		return json(
			{ success: false, message: 'เครื่องนี้ถูกตรวจแล้วในเดือนนี้' },
			{ status: 400 }
		);
	}

	// Calculate statuses
	const overallStatus = calculateOverallStatus(itemsList);
	const machineStatus = calculateMachineStatus(itemsList, templateItems);

	// Generate inspection code
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

	return json({ success: true, inspectionId: newInspection[0].id });
	} catch (error) {
		console.error('POST /api/inspections error:', error);
		return json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentication check
		if (!locals.user) {
			return json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
		}

		// Role check - only admin and inspector can update inspections
		if (locals.user.role === 'viewer') {
			return json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
		}

		const body = await request.json();
		const { inspectionId, inspectorName, items, overallRemark } = body;

		// Use logged-in user's displayName as fallback for inspectorName
		const finalInspectorName = inspectorName || locals.user.displayName;

		if (!inspectionId || !finalInspectorName) {
			return json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
		}

	// Get existing inspection
	const existingInspection = await db
		.select()
		.from(inspections)
		.where(eq(inspections.id, inspectionId))
		.limit(1);

	if (!existingInspection[0]) {
		return json({ success: false, message: 'ไม่พบการตรวจ' }, { status: 404 });
	}

	// Get generator's form template
	const generator = await db
		.select({ formTemplateId: generators.formTemplateId })
		.from(generators)
		.where(eq(generators.id, existingInspection[0].generatorId))
		.limit(1);

	if (!generator[0]?.formTemplateId) {
		return json({ success: false, message: 'ไม่พบเครื่องหรือแบบฟอร์ม' }, { status: 404 });
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
		return json({ success: false, message: validationErrors.join(', ') }, { status: 400 });
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

	return json({ success: true });
	} catch (error) {
		console.error('PUT /api/inspections error:', error);
		return json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
	}
};
