<script lang="ts">
	import { page } from '$app/stores';

	$: ({ summary, departments, machineStats, month, year, monthName } = $page.data);

	let searchQuery = '';

	$: filteredDepartments = departments.filter((dept: any) =>
		dept.name.toLowerCase().includes(searchQuery.toLowerCase())
	);
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center">
					<span class="text-amber-300 text-xl">⚡</span>
				</div>
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">รายงานการตรวจ</h1>
					<p class="text-blue-200/70 mt-0.5 text-sm">ระบบตรวจสภาพเครื่องกำเนิดไฟฟ้า — การไฟฟ้าส่วนภูมิภาค (กฟภ.)</p>
				</div>
			</div>
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
				<div class="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
					<p class="text-sm text-gray-600 mb-1">เครื่องทั้งหมด</p>
					<p class="text-3xl font-bold text-slate-700">{summary.totalGenerators}</p>
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
						<span class="text-2xl font-bold text-slate-700">{summary.progress}%</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Machine Status Breakdown -->
		{#if summary.totalInspected > 0}
			<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
				<h3 class="text-xl font-semibold text-gray-800 mb-4">สถานะเครื่องจากผลการตรวจ</h3>
				<div class="grid grid-cols-3 gap-4">
					<div class="text-center p-4 bg-green-50 rounded-lg border border-green-100">
						<div class="text-3xl mb-1">✅</div>
						<p class="text-2xl font-bold text-green-700">{machineStats.working}</p>
						<p class="text-xs text-gray-600 mt-1">ใช้งานได้</p>
					</div>
					<div class="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
						<div class="text-3xl mb-1">🔧</div>
						<p class="text-2xl font-bold text-amber-700">{machineStats.repair}</p>
						<p class="text-xs text-gray-600 mt-1">ซ่อมแซม</p>
					</div>
					<div class="text-center p-4 bg-red-50 rounded-lg border border-red-100">
						<div class="text-3xl mb-1">⛔</div>
						<p class="text-2xl font-bold text-red-700">{machineStats.disposal}</p>
						<p class="text-xs text-gray-600 mt-1">รอจำหน่าย</p>
					</div>
				</div>
				{#if machineStats.repair > 0 || machineStats.disposal > 0}
					<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
						⚠️ มีเครื่องที่ต้องดำเนินการ {machineStats.repair + machineStats.disposal} เครื่อง — กรุณาตรวจสอบและติดตามผล
					</div>
				{/if}
			</div>
		{/if}

		<!-- Departments List -->
		<div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h3 class="text-xl font-semibold text-gray-800">สังกัดทั้งหมด</h3>
				<p class="text-sm text-gray-500">กดที่สังกัดเพื่อดูรายละเอียดและเริ่มตรวจ</p>
			</div>
			<div class="relative w-full sm:w-80">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="ค้นหาสังกัด / การไฟฟ้า..."
					class="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
				/>
				{#if searchQuery}
					<button
						on:click={() => (searchQuery = '')}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
					>✕</button>
				{/if}
			</div>
		</div>

		{#if searchQuery && filteredDepartments.length === 0}
			<div class="rounded-xl bg-white p-12 shadow-md text-center text-gray-400">
				ไม่พบสังกัดที่ค้นหา "{searchQuery}"
			</div>
		{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredDepartments as dept}
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
								<span class="font-semibold text-slate-700">{dept.progress}%</span>
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
		{/if}
	</main>
</div>
