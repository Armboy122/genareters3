import { db } from '$lib/db';
import { inspections, inspectionDetails, generators, departments, formTemplates } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const inspectionId = params.id;

	// Get inspection with generator and department info
	const inspectionRows = await db
		.select({
			id: inspections.id,
			inspectionCode: inspections.inspectionCode,
			generatorId: inspections.generatorId,
			month: inspections.month,
			year: inspections.year,
			inspectionDate: inspections.inspectionDate,
			inspectorName: inspections.inspectorName,
			overallStatus: inspections.overallStatus,
			machineStatus: inspections.machineStatus,
			overallRemark: inspections.overallRemark,
			formTemplateId: inspections.formTemplateId,
			generator: {
				id: generators.id,
				assetId: generators.assetId,
				type: generators.type,
				sizeKw: generators.sizeKw,
				product: generators.product,
				location: generators.location
			},
			department: {
				id: departments.id,
				name: departments.name
			},
			formTemplateName: formTemplates.name
		})
		.from(inspections)
		.leftJoin(generators, eq(inspections.generatorId, generators.id))
		.leftJoin(departments, eq(generators.departmentId, departments.id))
		.leftJoin(formTemplates, eq(inspections.formTemplateId, formTemplates.id))
		.where(eq(inspections.id, inspectionId))
		.limit(1);

	if (!inspectionRows[0]) {
		error(404, 'ไม่พบข้อมูลการตรวจ');
	}

	// Get inspection details
	const details = await db
		.select()
		.from(inspectionDetails)
		.where(eq(inspectionDetails.inspectionId, inspectionId))
		.orderBy(inspectionDetails.itemCode);

	return {
		inspection: {
			...inspectionRows[0],
			details
		}
	};
};
