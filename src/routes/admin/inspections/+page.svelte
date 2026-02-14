<script lang="ts">
	import { formatThaiDate } from '$lib/utils';
	import { onMount } from 'svelte';

	let inspectionList: any[] = [];
	let departmentsList: any[] = [];
	let loading = true;
	let filterDept = '';
	let filterMonth = '';
	let filterYear = '';
	let filterStatus = '';
	let search = '';

	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	filterMonth = String(currentMonth);
	filterYear = String(currentYear);

	const thaiMonths = [
		'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
		'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
	];

	async function loadInspections() {
		loading = true;
		const params = new URLSearchParams();
		if (filterDept) params.set('departmentId', filterDept);
		if (filterMonth) params.set('month', filterMonth);
		if (filterYear) params.set('year', filterYear);
		if (filterStatus) params.set('machineStatus', filterStatus);
		if (search) params.set('search', search);

		const res = await fetch(`/api/admin/inspections?${params}`);
		const data = await res.json();
		if (data.success) inspectionList = data.data;
		loading = false;
	}

	async function loadDepartments() {
		const res = await fetch('/api/admin/departments');
		const data = await res.json();
		if (data.success) departmentsList = data.data;
	}

	onMount(() => {
		loadDepartments();
		loadInspections();
	});

	function handleFilter() {
		loadInspections();
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">ประวัติการตรวจ</h1>
			<p class="text-gray-500 text-sm mt-1">ดูและค้นหาประวัติการตรวจทั้งหมด</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			<input
				type="text"
				bind:value={search}
				on:keydown={(e) => e.key === 'Enter' && handleFilter()}
				placeholder="ค้นหาผู้ตรวจ/รหัส..."
				class="col-span-2 sm:col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
			/>
			<select bind:value={filterDept} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกสังกัด</option>
				{#each departmentsList as dept}
					<option value={dept.id}>{dept.name}</option>
				{/each}
			</select>
			<select bind:value={filterMonth} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกเดือน</option>
				{#each thaiMonths as m, i}
					<option value={i + 1}>{m}</option>
				{/each}
			</select>
			<select bind:value={filterYear} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกปี</option>
				{#each [currentYear, currentYear - 1, currentYear - 2] as y}
					<option value={y}>{y + 543}</option>
				{/each}
			</select>
			<select bind:value={filterStatus} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกสถานะ</option>
				<option value="ใช้งานได้">ใช้งานได้</option>
				<option value="ซ่อมแซม">ซ่อมแซม</option>
				<option value="รอจำหน่าย">รอจำหน่าย</option>
			</select>
			<button
				on:click={handleFilter}
				class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
			>
				🔍 ค้นหา
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
		{#if loading}
			<div class="p-12 text-center text-gray-400">กำลังโหลด...</div>
		{:else if inspectionList.length === 0}
			<div class="p-12 text-center text-gray-400">ไม่พบข้อมูลการตรวจ</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="text-left px-3 py-3 font-medium">รหัสการตรวจ</th>
							<th class="text-left px-3 py-3 font-medium">เครื่อง</th>
							<th class="text-left px-3 py-3 font-medium">สังกัด</th>
							<th class="text-left px-3 py-3 font-medium">เดือน/ปี</th>
							<th class="text-left px-3 py-3 font-medium">ผู้ตรวจ</th>
							<th class="text-left px-3 py-3 font-medium">สถานะรวม</th>
							<th class="text-left px-3 py-3 font-medium">สถานะเครื่อง</th>
							<th class="text-left px-3 py-3 font-medium">วันที่ตรวจ</th>
							<th class="text-right px-3 py-3 font-medium">ดู</th>
						</tr>
					</thead>
					<tbody>
						{#each inspectionList as ins}
							<tr class="border-t border-gray-50 hover:bg-gray-50/50">
								<td class="px-3 py-3 font-mono text-xs">{ins.inspectionCode}</td>
								<td class="px-3 py-3 font-medium">{ins.generatorAssetId}</td>
								<td class="px-3 py-3 text-gray-600 text-xs">{ins.departmentName}</td>
								<td class="px-3 py-3 text-gray-600 text-xs">{ins.month}/{ins.year}</td>
								<td class="px-3 py-3 text-gray-600">{ins.inspectorName}</td>
								<td class="px-3 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs
										{ins.overallStatus === 'ปกติ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
										{ins.overallStatus}
									</span>
								</td>
								<td class="px-3 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs
										{ins.machineStatus === 'ใช้งานได้' ? 'bg-green-100 text-green-700' : ins.machineStatus === 'ซ่อมแซม' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
										{ins.machineStatus}
									</span>
								</td>
								<td class="px-3 py-3 text-gray-500 text-xs">{formatThaiDate(ins.inspectionDate)}</td>
								<td class="px-3 py-3 text-right">
									<a
										href="/inspection/{ins.id}"
										class="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
									>
										ดูรายละเอียด
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
				ทั้งหมด {inspectionList.length} รายการ
			</div>
		{/if}
	</div>
</div>
