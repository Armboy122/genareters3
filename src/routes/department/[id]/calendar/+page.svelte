<script lang="ts">
	import { page } from '$app/stores';

	$: ({ department, year, calendar } = $page.data);
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold tracking-tight">{department.name}</h1>
					<p class="text-blue-200/70 text-sm">สถิติการตรวจรายเดือน</p>
				</div>
				<a
					href="/dashboard"
					class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
				>
					← กลับหน้าหลัก
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Year Selector -->
		<div class="mb-8 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-800">ปฏิทิน {year}</h2>
			<div class="flex gap-2">
				<a
					href="/department/{department.id}/calendar?year={year - 1}"
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
				>
					← ปีก่อนหน้า
				</a>
				<a
					href="/department/{department.id}/calendar?year={year + 1}"
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
					class="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 {month.statusColor}"
				>
					<div class="flex items-center justify-between mb-3">
						<span class="text-2xl">{month.statusIcon}</span>
						<span class="text-sm text-gray-600">{month.monthName}</span>
					</div>
					<div class="text-center">
						<p class="text-3xl font-bold text-gray-800">{month.inspected}/{month.total}</p>
						<p class="text-sm text-gray-600">ตรวจแล้ว / ทั้งหมด</p>
					</div>
					<div class="mt-4">
						<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
							<div
								class="h-full gradient-bg transition-all duration-500"
								style="width: {month.progress}%"
							></div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</main>
</div>
