import { db } from '$lib/db';
import { departments, generators, inspections } from '$lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getThaiMonthName } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const departmentId = params.id;

	// Get department info
	const department = await db
		.select()
		.from(departments)
		.where(eq(departments.id, departmentId))
		.limit(1);

	if (!department[0]) {
		error(404, 'ไม่พบสังกัด');
	}

	const yearParam = url.searchParams.get('year');
	const currentYear = new Date().getFullYear();
	const year = yearParam ? parseInt(yearParam) : currentYear;

	// Get total generators for this department
	const totalResult = await db
		.select({ count: count() })
		.from(generators)
		.where(eq(generators.departmentId, departmentId));
	const totalGenerators = totalResult[0]?.count || 0;

	// Get inspections per month for this department in the given year
	const monthlyInspections = await db
		.select({
			month: inspections.month,
			inspectedCount: sql<number>`count(distinct ${inspections.generatorId})`
		})
		.from(inspections)
		.innerJoin(generators, eq(inspections.generatorId, generators.id))
		.where(
			and(
				eq(generators.departmentId, departmentId),
				eq(inspections.year, year)
			)
		)
		.groupBy(inspections.month)
		.orderBy(inspections.month);

	// Create map for quick lookup
	const inspectionMap = new Map(monthlyInspections.map((s) => [s.month, s.inspectedCount]));

	// Build calendar data for all 12 months
	const calendar = Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		const inspected = inspectionMap.get(month) || 0;
		const progress = totalGenerators > 0 ? Math.round((inspected / totalGenerators) * 100) : 0;

		let statusColor = 'bg-gray-100 text-gray-700';
		let statusIcon = '⬜';

		if (inspected === 0) {
			statusColor = 'bg-gray-100 text-gray-700';
			statusIcon = '⬜';
		} else if (inspected >= totalGenerators) {
			statusColor = 'bg-green-100 text-green-700';
			statusIcon = '🟢';
		} else {
			statusColor = 'bg-yellow-100 text-yellow-700';
			statusIcon = '🟡';
		}

		return {
			month,
			monthName: getThaiMonthName(month),
			total: totalGenerators,
			inspected,
			progress,
			statusColor,
			statusIcon
		};
	});

	return {
		department: department[0],
		year,
		calendar
	};
};
