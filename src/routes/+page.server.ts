import { db } from '$lib/db';
import { departments, generators, inspections } from '$lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getCurrentMonthYear, getThaiMonthName } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

	// Get all departments
	const deptList = await db.select().from(departments).orderBy(departments.name);

	// For each department, get generator counts, check monthly completeness, and compute KPI
	const deptKPIs = await Promise.all(
		deptList.map(async (dept) => {
			// Total active generators in this department
			const totalResult = await db
				.select({ count: count() })
				.from(generators)
				.where(and(eq(generators.departmentId, dept.id), eq(generators.isActive, true)));
			const total = totalResult[0]?.count || 0;

			if (total === 0) {
				return {
					id: dept.id,
					name: dept.name,
					total: 0,
					working: 0,
					repair: 0,
					disposal: 0,
					kpiPercent: 100,
					kpiScore: 5,
					inspected: 0,
					allMonthsComplete: true,
					incompleteMonths: [] as string[]
				};
			}

			// Check completeness for each month from January to current month
			const monthlyCompleteness = await db.execute(sql`
				SELECT ins.month, count(DISTINCT ins.generator_id)::int as inspected_count
				FROM inspections ins
				JOIN generators g ON g.id = ins.generator_id
				WHERE g.department_id = ${dept.id}
					AND g.is_active = true
					AND ins.year = ${currentYear}
					AND ins.month <= ${currentMonth}
				GROUP BY ins.month
				ORDER BY ins.month
			`);

			const monthMap = new Map<number, number>();
			for (const row of monthlyCompleteness.rows) {
				monthMap.set(row.month as number, row.inspected_count as number);
			}

			// Find incomplete months
			const incompleteMonths: string[] = [];
			for (let m = 1; m <= currentMonth; m++) {
				const inspectedInMonth = monthMap.get(m) || 0;
				if (inspectedInMonth < total) {
					incompleteMonths.push(getThaiMonthName(m));
				}
			}
			const allMonthsComplete = incompleteMonths.length === 0;

			// Get the latest inspection for each generator in this department
			const latestStatuses = await db.execute(sql`
				SELECT i.machine_status, count(*)::int as cnt
				FROM (
					SELECT DISTINCT ON (ins.generator_id) ins.machine_status
					FROM inspections ins
					JOIN generators g ON g.id = ins.generator_id
					WHERE g.department_id = ${dept.id} AND g.is_active = true
					ORDER BY ins.generator_id, ins.year DESC, ins.month DESC, ins.created_at DESC
				) i
				GROUP BY i.machine_status
			`);

			let working = 0;
			let repair = 0;
			let disposal = 0;
			let inspected = 0;

			for (const row of latestStatuses.rows) {
				const cnt = row.cnt as number;
				inspected += cnt;
				if (row.machine_status === 'ใช้งานได้') working = cnt;
				else if (row.machine_status === 'ซ่อมแซม') repair = cnt;
				else if (row.machine_status === 'รอจำหน่าย') disposal = cnt;
			}

			// KPI formula: ((total - disposal) - repair) / (total - disposal) * 100
			// Only calculate if all months are complete
			let kpiPercent = 0;
			let kpiScore = 0;

			if (allMonthsComplete) {
				const denominator = total - disposal;
				kpiPercent = denominator > 0
					? Math.round(((denominator - repair) / denominator) * 100)
					: 0;

				if (kpiPercent >= 100) kpiScore = 5;
				else if (kpiPercent >= 80) kpiScore = 4;
				else if (kpiPercent >= 70) kpiScore = 3;
				else if (kpiPercent >= 60) kpiScore = 2;
				else kpiScore = 1;
			}

			return {
				id: dept.id,
				name: dept.name,
				total,
				working,
				repair,
				disposal,
				kpiPercent,
				kpiScore,
				inspected,
				allMonthsComplete,
				incompleteMonths
			};
		})
	);

	// Overall summary — only count departments with all months complete for KPI
	const overallTotal = deptKPIs.reduce((s, d) => s + d.total, 0);
	const overallWorking = deptKPIs.reduce((s, d) => s + d.working, 0);
	const overallRepair = deptKPIs.reduce((s, d) => s + d.repair, 0);
	const overallDisposal = deptKPIs.reduce((s, d) => s + d.disposal, 0);
	const overallInspected = deptKPIs.reduce((s, d) => s + d.inspected, 0);
	const allComplete = deptKPIs.every((d) => d.allMonthsComplete);

	let overallKpiPercent = 0;
	let overallKpiScore = 0;

	if (allComplete) {
		const overallDenom = overallTotal - overallDisposal;
		overallKpiPercent = overallDenom > 0
			? Math.round(((overallDenom - overallRepair) / overallDenom) * 100)
			: 0;

		if (overallKpiPercent >= 100) overallKpiScore = 5;
		else if (overallKpiPercent >= 80) overallKpiScore = 4;
		else if (overallKpiPercent >= 70) overallKpiScore = 3;
		else if (overallKpiPercent >= 60) overallKpiScore = 2;
		else overallKpiScore = 1;
	}

	return {
		departments: deptKPIs,
		overall: {
			total: overallTotal,
			working: overallWorking,
			repair: overallRepair,
			disposal: overallDisposal,
			inspected: overallInspected,
			kpiPercent: overallKpiPercent,
			kpiScore: overallKpiScore,
			allComplete
		},
		currentMonth,
		currentYear
	};
};
