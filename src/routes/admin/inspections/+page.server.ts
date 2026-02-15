import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { inspections, generators, departments, formTemplates } from '$lib/db/schema';
import { eq, sql, desc, and, or, ilike, gte, lte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const departmentId = url.searchParams.get('departmentId') || '';
	const overallStatus = url.searchParams.get('overallStatus') || '';
	const month = url.searchParams.get('month') || '';
	const year = url.searchParams.get('year') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const offset = (page - 1) * limit;

	const conditions = [];
	if (search) {
		conditions.push(
			or(
				ilike(generators.assetId, `%${search}%`),
				ilike(inspections.inspectorName, `%${search}%`)
			)
		);
	}
	if (departmentId) conditions.push(eq(generators.departmentId, departmentId));
	if (overallStatus === 'ปกติ' || overallStatus === 'ไม่ปกติ') {
		conditions.push(eq(inspections.overallStatus, overallStatus));
	}
	if (month && year) {
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
		const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
		conditions.push(gte(inspections.inspectionDate, startDate));
		conditions.push(lte(inspections.inspectionDate, endDate));
	} else if (year) {
		const startDate = new Date(parseInt(year), 0, 1);
		const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
		conditions.push(gte(inspections.inspectionDate, startDate));
		conditions.push(lte(inspections.inspectionDate, endDate));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [inspectionList, countResult, departmentsList] = await Promise.all([
		db
			.select({
				id: inspections.id,
				inspectionCode: inspections.inspectionCode,
				inspectionDate: inspections.inspectionDate,
				month: inspections.month,
				year: inspections.year,
				overallStatus: inspections.overallStatus,
				machineStatus: inspections.machineStatus,
				overallRemark: inspections.overallRemark,
				inspectorName: inspections.inspectorName,
				generatorAssetId: generators.assetId,
				generatorType: generators.type,
				departmentName: departments.name,
				formTemplateName: formTemplates.name,
				createdAt: inspections.createdAt
			})
			.from(inspections)
			.leftJoin(generators, eq(generators.id, inspections.generatorId))
			.leftJoin(departments, eq(departments.id, generators.departmentId))
			.leftJoin(formTemplates, eq(formTemplates.id, inspections.formTemplateId))
			.where(whereClause)
			.orderBy(desc(inspections.inspectionDate))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(inspections)
			.leftJoin(generators, eq(generators.id, inspections.generatorId))
			.where(whereClause),
		db
			.select()
			.from(departments)
			.orderBy(departments.name)
	]);

	return {
		inspections: inspectionList,
		pagination: {
			page,
			limit,
			total: countResult[0].count,
			totalPages: Math.ceil(countResult[0].count / limit)
		},
		departments: departmentsList,
		filters: { search, departmentId, overallStatus, month, year }
	};
};
