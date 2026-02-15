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

	const notDisposedBefore = sql`NOT EXISTS (
		SELECT 1 FROM inspections i
		WHERE i.generator_id = ${generators.id}
			AND i.machine_status = 'รอจำหน่าย'
			AND (i.year * 12 + i.month) < (${year} * 12 + ${month})
	)`;

	// Get all departments with generator counts (excluding disposed before this month)
	const departmentsWithStats = await db
		.select({
			id: departments.id,
			name: departments.name,
			totalGenerators: count(generators.id),
			inspectedCount: sql<number>`count(distinct ${inspections.generatorId})`
		})
		.from(departments)
		.leftJoin(generators, and(
			eq(generators.departmentId, departments.id),
			notDisposedBefore
		))
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

	// Calculate overall stats (excluding disposed before this month)
	const totalGenerators = await db
		.select({ count: count() })
		.from(generators)
		.where(notDisposedBefore)
		.then((res) => res[0]?.count || 0);

	const totalInspected = await db
		.select({ count: count() })
		.from(inspections)
		.innerJoin(generators, eq(inspections.generatorId, generators.id))
		.where(
			and(
				eq(inspections.month, month),
				eq(inspections.year, year),
				sql`NOT EXISTS (
					SELECT 1 FROM inspections i2
					WHERE i2.generator_id = ${generators.id}
						AND i2.machine_status = 'รอจำหน่าย'
						AND (i2.year * 12 + i2.month) < (${year} * 12 + ${month})
				)`
			)
		)
		.then((res) => res[0]?.count || 0);

	const progress = totalGenerators > 0 ? Math.round((totalInspected / totalGenerators) * 100) : 0;

	// Machine status breakdown for current month (excluding disposed before this month)
	const statusBreakdown = await db
		.select({
			machineStatus: inspections.machineStatus,
			count: sql<number>`count(*)::int`
		})
		.from(inspections)
		.innerJoin(generators, eq(inspections.generatorId, generators.id))
		.where(
			and(
				eq(inspections.month, month),
				eq(inspections.year, year),
				sql`NOT EXISTS (
					SELECT 1 FROM inspections i2
					WHERE i2.generator_id = ${generators.id}
						AND i2.machine_status = 'รอจำหน่าย'
						AND (i2.year * 12 + i2.month) < (${year} * 12 + ${month})
				)`
			)
		)
		.groupBy(inspections.machineStatus);

	const machineStats = {
		working: statusBreakdown.find((s) => s.machineStatus === 'ใช้งานได้')?.count || 0,
		repair: statusBreakdown.find((s) => s.machineStatus === 'ซ่อมแซม')?.count || 0,
		disposal: statusBreakdown.find((s) => s.machineStatus === 'รอจำหน่าย')?.count || 0
	};

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
		machineStats,
		month,
		year,
		monthName: getThaiMonthName(month)
	};
};
