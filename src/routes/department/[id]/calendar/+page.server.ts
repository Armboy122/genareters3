import { db } from '$lib/db';
import { departments, generators, inspections } from '$lib/db/schema';
import { eq, and, sql, count, inArray } from 'drizzle-orm';
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

	// Get all generators for this department
	const allGens = await db
		.select({ id: generators.id })
		.from(generators)
		.where(eq(generators.departmentId, departmentId));

	// Get the earliest month each generator was disposed (machine_status = 'รอจำหน่าย')
	const disposedGens = allGens.length > 0
		? await db
				.select({
					generatorId: inspections.generatorId,
					disposedMonth: sql<number>`MIN(${inspections.year} * 12 + ${inspections.month})`.as('disposed_month')
				})
				.from(inspections)
				.where(
					and(
						eq(inspections.machineStatus, 'รอจำหน่าย'),
						inArray(inspections.generatorId, allGens.map(g => g.id))
					)
				)
				.groupBy(inspections.generatorId)
		: [];

	const disposedMap = new Map(disposedGens.map(d => [d.generatorId, d.disposedMonth]));

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
	const inspectionMap = new Map(monthlyInspections.map((s) => [s.month, Number(s.inspectedCount)]));

	// Build calendar data for all 12 months
	const calendar = Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		const viewMonth = year * 12 + month;

		// Count generators that are NOT disposed before this month
		const totalGenerators = allGens.filter(g => {
			const disposedAt = disposedMap.get(g.id);
			// If never disposed, or disposed in this month or later → still active
			return !disposedAt || disposedAt >= viewMonth;
		}).length;

		const inspected = Number(inspectionMap.get(month)) || 0;
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
