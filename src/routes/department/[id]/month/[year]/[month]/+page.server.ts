import { db } from '$lib/db';
import { departments, generators, inspections, formTemplates, formTemplateItems } from '$lib/db/schema';
import { eq, and, desc, sql, count, inArray } from 'drizzle-orm';
import { getThaiMonthName, formatThaiDate } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const departmentId = params.id;
	const year = parseInt(params.year);
	const month = parseInt(params.month);

	// Validate month and year
	if (month < 1 || month > 12) {
		error(400, 'เดือนไม่ถูกต้อง');
	}

	// Get department info
	const department = await db
		.select()
		.from(departments)
		.where(eq(departments.id, departmentId))
		.limit(1);

	if (!department[0]) {
		error(404, 'ไม่พบสังกัด');
	}

	// Get all generators for this department
	const allGenerators = await db
		.select({
			id: generators.id,
			assetId: generators.assetId,
			type: generators.type,
			sizeKw: generators.sizeKw,
			product: generators.product,
			location: generators.location,
			formTemplateId: generators.formTemplateId,
			isActive: generators.isActive
		})
		.from(generators)
		.where(eq(generators.departmentId, departmentId))
		.orderBy(generators.assetId);

	// Get inspections for this month/year
	const monthlyInspections = await db
		.select({
			id: inspections.id,
			generatorId: inspections.generatorId,
			inspectionCode: inspections.inspectionCode,
			inspectionDate: inspections.inspectionDate,
			inspectorName: inspections.inspectorName,
			overallStatus: inspections.overallStatus,
			machineStatus: inspections.machineStatus
		})
		.from(inspections)
		.where(
			and(
				eq(inspections.month, month),
				eq(inspections.year, year)
			)
		);

	// Create inspection map
	const inspectionMap = new Map(
			monthlyInspections.map((insp) => [insp.generatorId, insp])
		);

	// Get form templates for names
	const formTemplateIds = allGenerators
		.map((g) => g.formTemplateId)
		.filter((id): id is string => id !== null);

	const formTemplatesList = formTemplateIds.length > 0
		? await db
				.select()
				.from(formTemplates)
				.where(inArray(formTemplates.id, formTemplateIds))
		: [];

	const templateMap = new Map(
			formTemplatesList.map((t) => [t.id, t.name])
		);

	// Combine data
	const generatorsWithStatus = allGenerators.map((gen) => {
		const inspection = inspectionMap.get(gen.id);
		const templateName = gen.formTemplateId ? templateMap.get(gen.formTemplateId) : 'ไม่ระบุ';

		return {
			...gen,
			templateName,
			isInspected: !!inspection,
			inspection,
			statusColor: inspection
				? inspection.machineStatus === 'รอจำหน่าย'
					? 'border-red-500'
					: inspection.machineStatus === 'ซ่อมแซม'
						? 'border-amber-500'
						: 'border-green-500'
				: 'border-gray-400'
		};
	});

	// Sort: uninspected first, then inspected
	generatorsWithStatus.sort((a, b) => {
		if (a.isInspected === b.isInspected) return 0;
		return a.isInspected ? 1 : -1;
	});

	const inspectedCount = generatorsWithStatus.filter((g) => g.isInspected).length;
	const uninspectedCount = generatorsWithStatus.length - inspectedCount;

	return {
		department: department[0],
		year,
		month,
		monthName: getThaiMonthName(month),
		generators: generatorsWithStatus,
		inspectedCount,
		uninspectedCount
	};
};
