import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { inspections, generators, departments } from '$lib/db/schema';
import { eq, sql, and, ilike, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const departmentId = url.searchParams.get('departmentId') || '';
	const month = url.searchParams.get('month') || '';
	const year = url.searchParams.get('year') || '';
	const machineStatus = url.searchParams.get('machineStatus') || '';
	const search = url.searchParams.get('search') || '';

	const conditions = [];
	if (departmentId) conditions.push(eq(generators.departmentId, departmentId));
	if (month) conditions.push(eq(inspections.month, parseInt(month)));
	if (year) conditions.push(eq(inspections.year, parseInt(year)));
	if (machineStatus) conditions.push(eq(inspections.machineStatus, machineStatus as 'ใช้งานได้' | 'ซ่อมแซม' | 'รอจำหน่าย'));
	if (search) {
		conditions.push(
			or(
				ilike(inspections.inspectorName, `%${search}%`),
				ilike(inspections.inspectionCode, `%${search}%`),
				ilike(generators.assetId, `%${search}%`)
			)
		);
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const list = await db
		.select({
			id: inspections.id,
			inspectionCode: inspections.inspectionCode,
			generatorId: inspections.generatorId,
			generatorAssetId: generators.assetId,
			departmentName: departments.name,
			month: inspections.month,
			year: inspections.year,
			inspectionDate: inspections.inspectionDate,
			inspectorName: inspections.inspectorName,
			overallStatus: inspections.overallStatus,
			machineStatus: inspections.machineStatus,
			overallRemark: inspections.overallRemark
		})
		.from(inspections)
		.leftJoin(generators, eq(generators.id, inspections.generatorId))
		.leftJoin(departments, eq(departments.id, generators.departmentId))
		.where(whereClause)
		.orderBy(sql`${inspections.createdAt} DESC`)
		.limit(200);

	return json({ success: true, data: list });
};
