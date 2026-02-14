<script lang="ts">
	import { onMount } from 'svelte';

	let generators: any[] = [];
	let departmentsList: any[] = [];
	let templatesList: any[] = [];
	let loading = true;
	let search = '';
	let filterDept = '';
	let filterType = '';
	let filterTemplate = '';
	let currentPage = 1;
	let pagination = { page: 1, limit: 25, total: 0, totalPages: 0 };

	let showModal = false;
	let editingGen: any = null;
	let saving = false;
	let errorMessage = '';

	let form = {
		assetId: '',
		type: '',
		sizeKw: '',
		product: '',
		location: '',
		departmentId: '',
		formTemplateId: ''
	};

	const generatorTypes = ['สำนักงาน', 'ฉุกเฉิน 3 จ. 4 อ.', 'รถโมบายล์', 'โรงจักร', 'พระตำหนักฯ'];

	async function loadGenerators() {
		loading = true;
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (filterDept) params.set('departmentId', filterDept);
		if (filterType) params.set('type', filterType);
		if (filterTemplate) params.set('formTemplateId', filterTemplate);
		params.set('page', String(currentPage));
		params.set('limit', '25');

		const res = await fetch(`/api/admin/generators?${params}`);
		const data = await res.json();
		if (data.success) {
			generators = data.data;
			pagination = data.pagination;
		}
		loading = false;
	}

	async function loadDropdowns() {
		const [deptRes, tmplRes] = await Promise.all([
			fetch('/api/admin/departments'),
			fetch('/api/admin/form-templates')
		]);
		const deptData = await deptRes.json();
		const tmplData = await tmplRes.json();
		if (deptData.success) departmentsList = deptData.data;
		if (tmplData.success) templatesList = tmplData.data;
	}

	onMount(() => {
		loadDropdowns();
		loadGenerators();
	});

	function openCreate() {
		editingGen = null;
		form = { assetId: '', type: '', sizeKw: '', product: '', location: '', departmentId: '', formTemplateId: '' };
		errorMessage = '';
		showModal = true;
	}

	function openEdit(gen: any) {
		editingGen = gen;
		form = {
			assetId: gen.assetId,
			type: gen.type,
			sizeKw: gen.sizeKw,
			product: gen.product || '',
			location: gen.location,
			departmentId: gen.departmentId,
			formTemplateId: gen.formTemplateId || ''
		};
		errorMessage = '';
		showModal = true;
	}

	async function handleSave() {
		if (!form.assetId.trim() || !form.type || !form.sizeKw || !form.location.trim() || !form.departmentId) {
			errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
			return;
		}
		saving = true;
		errorMessage = '';

		const method = editingGen ? 'PUT' : 'POST';
		const body = editingGen ? { id: editingGen.id, ...form } : form;

		const res = await fetch('/api/admin/generators', {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		const data = await res.json();
		saving = false;

		if (data.success) {
			showModal = false;
			loadGenerators();
		} else {
			errorMessage = data.message || 'เกิดข้อผิดพลาด';
		}
	}

	async function toggleActive(gen: any) {
		const newStatus = !gen.isActive;
		if (!confirm(`ยืนยัน${newStatus ? 'เปิด' : 'ปิด'}ใช้งานเครื่อง "${gen.assetId}" ?`)) return;

		await fetch('/api/admin/generators', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: gen.id, isActive: newStatus })
		});
		loadGenerators();
	}

	function handleFilter() {
		currentPage = 1;
		loadGenerators();
	}

	function goToPage(p: number) {
		currentPage = p;
		loadGenerators();
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการเครื่องกำเนิดไฟฟ้า</h1>
			<p class="text-gray-500 text-sm mt-1">เพิ่ม แก้ไข หรือปิดใช้งานเครื่อง</p>
		</div>
		<button
			on:click={openCreate}
			class="px-4 py-2.5 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium relative z-10"
		>
			+ เพิ่มเครื่องใหม่
		</button>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
			<input
				type="text"
				bind:value={search}
				on:keydown={(e) => e.key === 'Enter' && handleFilter()}
				placeholder="ค้นหา รหัส/ผลิตภัณฑ์/สถานที่..."
				class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
			/>
			<select bind:value={filterDept} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกสังกัด</option>
				{#each departmentsList as dept}
					<option value={dept.id}>{dept.name}</option>
				{/each}
			</select>
			<select bind:value={filterType} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกประเภท</option>
				{#each generatorTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
			<select bind:value={filterTemplate} on:change={handleFilter} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="">ทุกแบบฟอร์ม</option>
				{#each templatesList as tmpl}
					<option value={tmpl.id}>{tmpl.name}</option>
				{/each}
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
		{:else if generators.length === 0}
			<div class="p-12 text-center text-gray-400">ไม่พบข้อมูลเครื่อง</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="text-left px-3 py-3 font-medium">รหัสทรัพย์สิน</th>
							<th class="text-left px-3 py-3 font-medium">ประเภท</th>
							<th class="text-left px-3 py-3 font-medium">kW</th>
							<th class="text-left px-3 py-3 font-medium">ผลิตภัณฑ์</th>
							<th class="text-left px-3 py-3 font-medium">สถานที่</th>
							<th class="text-left px-3 py-3 font-medium">สังกัด</th>
							<th class="text-left px-3 py-3 font-medium">แบบฟอร์ม</th>
							<th class="text-left px-3 py-3 font-medium">สถานะ</th>
							<th class="text-right px-3 py-3 font-medium">จัดการ</th>
						</tr>
					</thead>
					<tbody>
						{#each generators as gen}
							<tr class="border-t border-gray-50 hover:bg-gray-50/50 {gen.isActive ? '' : 'opacity-50'}">
								<td class="px-3 py-3 font-mono text-xs font-medium">{gen.assetId}</td>
								<td class="px-3 py-3 text-gray-600">{gen.type}</td>
								<td class="px-3 py-3 text-gray-600">{gen.sizeKw}</td>
								<td class="px-3 py-3 text-gray-600">{gen.product || '-'}</td>
								<td class="px-3 py-3 text-gray-600 max-w-[150px] truncate">{gen.location}</td>
								<td class="px-3 py-3 text-gray-600 text-xs">{gen.departmentName}</td>
								<td class="px-3 py-3">
									<span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
										{gen.formTemplateName || 'ไม่ระบุ'}
									</span>
								</td>
								<td class="px-3 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs {gen.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
										{gen.isActive ? 'ใช้งาน' : 'ปิด'}
									</span>
								</td>
								<td class="px-3 py-3 text-right whitespace-nowrap">
									<button
										on:click={() => openEdit(gen)}
										class="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors mr-1"
									>
										แก้ไข
									</button>
									<button
										on:click={() => toggleActive(gen)}
										class="px-2 py-1 text-xs rounded transition-colors
										{gen.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}"
									>
										{gen.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
				<span>แสดง {generators.length} จาก {pagination.total} รายการ</span>
				{#if pagination.totalPages > 1}
					<div class="flex gap-1">
						{#each Array(pagination.totalPages) as _, i}
							<button
								on:click={() => goToPage(i + 1)}
								class="px-3 py-1 rounded text-xs transition-colors
								{currentPage === i + 1 ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}"
							>
								{i + 1}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-gray-100">
				<h3 class="text-lg font-semibold text-gray-800">
					{editingGen ? 'แก้ไขเครื่อง' : 'เพิ่มเครื่องใหม่'}
				</h3>
			</div>
			<div class="p-6 space-y-4">
				{#if errorMessage}
					<div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorMessage}</div>
				{/if}

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">รหัสทรัพย์สิน *</label>
					<input type="text" bind:value={form.assetId} placeholder="เช่น 311000772"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">ประเภท *</label>
						<select bind:value={form.type} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
							<option value="">เลือกประเภท</option>
							{#each generatorTypes as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">ขนาด (kW) *</label>
						<input type="number" bind:value={form.sizeKw} placeholder="เช่น 100"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">ผลิตภัณฑ์</label>
					<input type="text" bind:value={form.product} placeholder="เช่น CUMMINS"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">สถานที่ติดตั้ง *</label>
					<input type="text" bind:value={form.location} placeholder="เช่น สนง.ยะลา"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">สังกัด *</label>
					<select bind:value={form.departmentId} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
						<option value="">เลือกสังกัด</option>
						{#each departmentsList as dept}
							<option value={dept.id}>{dept.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">แบบฟอร์มที่ใช้ตรวจ</label>
					<select bind:value={form.formTemplateId} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
						<option value="">ไม่ระบุ</option>
						{#each templatesList as tmpl}
							<option value={tmpl.id}>{tmpl.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
				<button on:click={() => (showModal = false)} class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
					ยกเลิก
				</button>
				<button on:click={handleSave} disabled={saving}
					class="px-4 py-2 text-sm gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 relative z-10">
					{saving ? 'กำลังบันทึก...' : 'บันทึก'}
				</button>
			</div>
		</div>
	</div>
{/if}
