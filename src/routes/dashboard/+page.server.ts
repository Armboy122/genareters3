import { db } from '$lib/db';
import { departments, generators, inspections } from '$lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getCurrentMonthYear, getThaiMonthName } from '$lib/server/inspectionLogic';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('dashboard:summary');

	const monthParam = url.searchParams.get('month');
	const yearParam = url.searchParams.get('year');

	const current = getCurrentMonthYear();
	const month = monthParam ? parseInt(monthParam) : current.month;
	const year = yearParam ? parseInt(yearParam) : current.year;

	// Get all departments with generator counts
	const departmentsWithStats = await db
		.select({
			id: departments.id,
			name: departments.name,
			totalGenerators: count(generators.id),
			inspectedCount: sql<number>`count(distinct ${inspections.generatorId})`
		})
		.from(departments)
		.leftJoin(generators, eq(generators.departmentId, departments.id))
		.leftJoin(
			inspections,
			and(
				eq(inspections.generatorId, generators.id),
				eq(inspections.month, month),
				eq(inspections.year, year)
			)
		)
		.groupBy(departments.id, departments.name)
		.orderBy(departments.name);

	// Calculate overall stats
	const totalGenerators = await db
		.select({ count: count() })
		.from(generators)
		.then((res) => res[0]?.count || 0);

	const totalInspected = await db
		.select({ count: count() })
		.from(inspections)
		.where(and(eq(inspections.month, month), eq(inspections.year, year)))
		.then((res) => res[0]?.count || 0);

	const progress = totalGenerators > 0 ? Math.round((totalInspected / totalGenerators) * 100) : 0;

	return {
		departments: departmentsWithStats.map((dept) => ({
			...dept,
			progress: dept.totalGenerators > 0
				? Math.round((dept.inspectedCount / dept.totalGenerators) * 100)
				: 0,
			status:
				dept.inspectedCount === 0
					? 'ยังไม่เริ่ม'
					: dept.inspectedCount === dept.totalGenerators
						? 'ครบ'
						: 'กำลังดำเนินการ'
		})),
		summary: {
			totalGenerators,
			totalInspected,
			totalRemaining: totalGenerators - totalInspected,
			progress
		},
		month,
		year,
		monthName: getThaiMonthName(month)
	};
};
