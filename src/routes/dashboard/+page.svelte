<script lang="ts">
	import { page } from '$app/stores';

	$: ({ summary, departments, month, year, monthName } = $page.data);
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold">ระบบตรวจสภาพเครื่องกำเนิดไฟฟ้า</h1>
			<p class="text-purple-100 mt-1">การไฟฟ้าส่วนภูมิภาค (กฟภ.)</p>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Month/Year Selector -->
		<div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h2 class="text-2xl font-bold text-gray-800">ภาพรวม</h2>
				<p class="text-gray-600">
					เดือน {monthName} {year}
				</p>
			</div>
			<div class="flex gap-2">
				<a
					href="/dashboard?month={month === 1 ? 12 : month - 1}&year={month === 1 ? year - 1 : year}"
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
				>
					← เดือนก่อนหน้า
				</a>
				<a
					href="/dashboard?month={month === 12 ? 1 : month + 1}&year={month === 12 ? year + 1 : year}"
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
				>
					เดือนถัดไป →
				</a>
			</div>
		</div>

		<!-- Overall Summary -->
		<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">สถิติการตรวจทั้งหมด</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="text-center p-4 bg-purple-50 rounded-lg">
					<p class="text-sm text-gray-600 mb-1">เครื่องทั้งหมด</p>
					<p class="text-3xl font-bold text-purple-700">{summary.totalGenerators}</p>
				</div>
				<div class="text-center p-4 bg-green-50 rounded-lg">
					<p class="text-sm text-gray-600 mb-1">ตรวจแล้ว</p>
					<p class="text-3xl font-bold text-green-700">{summary.totalInspected}</p>
				</div>
				<div class="text-center p-4 bg-orange-50 rounded-lg">
					<p class="text-sm text-gray-600 mb-1">ยังไม่ได้ตรวจ</p>
					<p class="text-3xl font-bold text-orange-700">{summary.totalRemaining}</p>
				</div>
				<div class="text-center p-4 bg-blue-50 rounded-lg sm:col-span-2 lg:col-span-1">
					<p class="text-sm text-gray-600 mb-1">ความคืบหน้า</p>
					<div class="flex items-center justify-center gap-4">
						<div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
							<div
								class="h-full gradient-bg transition-all duration-500"
								style="width: {summary.progress}%"
							></div>
						</div>
						<span class="text-2xl font-bold text-purple-700">{summary.progress}%</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Departments List -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each departments as dept}
				<a
					href="/department/{dept.id}/calendar"
					class="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4
						{dept.status === 'ครบ' ? 'border-green-500' : dept.status === 'กำลังดำเนินการ' ? 'border-orange-500' : 'border-gray-300'}"
				>
					<div class="flex justify-between items-start mb-4">
						<h3 class="text-lg font-semibold text-gray-800">{dept.name}</h3>
						{#if dept.status === 'ครบ'}
							<span class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">✅ ครบ</span>
						{:else if dept.status === 'กำลังดำเนินการ'}
							<span class="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">⚠️ กำลังดำเนินการ</span>
						{:else}
							<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">⬜ ยังไม่เริ่ม</span>
						{/if}
					</div>

					<div class="space-y-3">
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">เครื่องทั้งหมด</span>
							<span class="font-semibold text-gray-800">{dept.totalGenerators}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">ตรวจแล้ว</span>
							<span class="font-semibold text-green-600">{dept.inspectedCount}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">ยังไม่ได้ตรวจ</span>
							<span class="font-semibold text-orange-600">{dept.totalGenerators - dept.inspectedCount}</span>
						</div>
						<div class="mt-4">
							<div class="flex justify-between text-sm mb-1">
								<span class="text-gray-600">ความคืบหน้า</span>
								<span class="font-semibold text-purple-700">{dept.progress}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
								<div
									class="h-full gradient-bg transition-all duration-500"
									style="width: {dept.progress}%"
								></div>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</main>
</div>
