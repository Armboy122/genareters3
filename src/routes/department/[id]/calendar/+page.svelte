<script lang="ts">
	import { page } from '$app/stores';

	$: ({ department, year, calendar } = $page.data);

	$: totalInspected = calendar.reduce((s: number, m: any) => s + Number(m.inspected), 0);
	$: totalAll = calendar.reduce((s: number, m: any) => s + Number(m.total), 0);
	$: completedMonths = calendar.filter((m: any) => Number(m.inspected) >= Number(m.total) && Number(m.total) > 0).length;
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center gap-2 text-blue-200/60 text-sm mb-1">
				<a href="/dashboard" class="hover:text-white transition-colors">รายงานการตรวจ</a>
				<span>/</span>
				<span class="text-white">{department.name}</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">{department.name}</h1>
			<p class="text-blue-200/70 text-sm mt-0.5">สถิติการตรวจรายเดือน — ปี {year + 543}</p>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Summary Bar -->
		<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div class="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
					<p class="text-sm text-gray-600 mb-1">เครื่องทั้งหมด</p>
					<p class="text-2xl font-bold text-slate-700">{calendar[0]?.total || 0}</p>
				</div>
				<div class="text-center p-3 bg-green-50 rounded-lg border border-green-100">
					<p class="text-sm text-gray-600 mb-1">เดือนที่ตรวจครบ</p>
					<p class="text-2xl font-bold text-green-700">{completedMonths}/12</p>
				</div>
				<div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
					<p class="text-sm text-gray-600 mb-1">ตรวจแล้วทั้งปี</p>
					<p class="text-2xl font-bold text-blue-700">{totalInspected}</p>
				</div>
				<div class="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
					<p class="text-sm text-gray-600 mb-1">ยังไม่ตรวจทั้งปี</p>
					<p class="text-2xl font-bold text-orange-700">{totalAll - totalInspected}</p>
				</div>
			</div>
		</div>

		<!-- Year Selector -->
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-800">ปฏิทิน {year + 543}</h2>
			<div class="flex gap-2">
				<a
					href="/department/{department.id}/calendar?year={year - 1}"
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
				>
					← ปีก่อนหน้า
				</a>
				<a
					href="/department/{department.id}/calendar?year={year + 1}"
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
				>
					ปีถัดไป →
				</a>
			</div>
		</div>

		<!-- Calendar Grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
			{#each calendar as month}
				<a
					href="/department/{department.id}/month/{year}/{month.month}"
					class="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 border-l-4
						{month.inspected >= month.total && month.total > 0
							? 'border-green-500'
							: month.inspected > 0
								? 'border-orange-500'
								: 'border-gray-300'}"
				>
					<div class="flex items-center justify-between mb-3">
						<span class="text-lg font-semibold text-gray-800">{month.monthName}</span>
						{#if month.inspected >= month.total && month.total > 0}
							<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">✅ ครบ</span>
						{:else if month.inspected > 0}
							<span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">⚠️ {month.progress}%</span>
						{:else}
							<span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">⬜ ยังไม่เริ่ม</span>
						{/if}
					</div>
					<div class="text-center mb-3">
						<p class="text-3xl font-bold text-gray-800">{month.inspected}<span class="text-lg text-gray-400">/{month.total}</span></p>
						<p class="text-xs text-gray-500 mt-0.5">ตรวจแล้ว / ทั้งหมด</p>
					</div>
					<div>
						<div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-500 {month.inspected >= month.total && month.total > 0 ? 'bg-green-500' : month.inspected > 0 ? 'gradient-bg' : 'bg-gray-200'}"
								style="width: {month.progress}%"
							></div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</main>
</div>
