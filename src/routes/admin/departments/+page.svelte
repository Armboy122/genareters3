<script lang="ts">
	import { onMount } from 'svelte';

	let departments: any[] = [];
	let search = '';
	let loading = true;
	let showModal = false;
	let editingDept: any = null;
	let formName = '';
	let saving = false;
	let errorMessage = '';

	// Instant client-side filtering
	$: filteredDepts = departments.filter((dept) =>
		dept.name.toLowerCase().includes(search.toLowerCase())
	);

	async function loadDepartments() {
		loading = true;
		const res = await fetch('/api/admin/departments');
		const data = await res.json();
		if (data.success) departments = data.data;
		loading = false;
	}

	onMount(() => { loadDepartments(); });

	function openCreate() {
		editingDept = null;
		formName = '';
		errorMessage = '';
		showModal = true;
	}

	function openEdit(dept: any) {
		editingDept = dept;
		formName = dept.name;
		errorMessage = '';
		showModal = true;
	}

	async function handleSave() {
		if (!formName.trim()) {
			errorMessage = 'กรุณาระบุชื่อสังกัด';
			return;
		}
		saving = true;
		errorMessage = '';

		const method = editingDept ? 'PUT' : 'POST';
		const body = editingDept ? { id: editingDept.id, name: formName } : { name: formName };

		const res = await fetch('/api/admin/departments', {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		const data = await res.json();
		saving = false;

		if (data.success) {
			showModal = false;
			loadDepartments();
		} else {
			errorMessage = data.message || 'เกิดข้อผิดพลาด';
		}
	}

	async function handleDelete(dept: any) {
		if (!confirm(`ยืนยันลบสังกัด "${dept.name}" ?`)) return;

		const res = await fetch('/api/admin/departments', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: dept.id })
		});

		const data = await res.json();
		if (data.success) {
			loadDepartments();
		} else {
			alert(data.message || 'ไม่สามารถลบได้');
		}
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการสังกัด</h1>
			<p class="text-gray-500 text-sm mt-1">เพิ่ม แก้ไข หรือลบสังกัด/การไฟฟ้า — ทั้งหมด {departments.length} สังกัด</p>
		</div>
		<button
			on:click={openCreate}
			class="px-4 py-2.5 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium relative z-10"
		>
			+ เพิ่มสังกัดใหม่
		</button>
	</div>

	<!-- Search (instant filter) -->
	<div class="mb-6">
		<div class="relative">
			<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
			<input
				type="text"
				bind:value={search}
				placeholder="พิมพ์เพื่อค้นหาสังกัด / การไฟฟ้า... (กรองทันที)"
				class="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
			/>
			{#if search}
				<button
					on:click={() => (search = '')}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
				>✕</button>
			{/if}
		</div>
		{#if search}
			<p class="mt-2 text-xs text-gray-500">พบ {filteredDepts.length} จาก {departments.length} สังกัด</p>
		{/if}
	</div>

	<!-- Table -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
		{#if loading}
			<div class="p-12 text-center text-gray-400">กำลังโหลด...</div>
		{:else if filteredDepts.length === 0}
			<div class="p-12 text-center text-gray-400">
				{#if search}
					ไม่พบสังกัดที่ค้นหา "{search}"
				{:else}
					ไม่พบข้อมูลสังกัด
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="text-left px-4 py-3 font-medium w-12">#</th>
							<th class="text-left px-4 py-3 font-medium">ชื่อสังกัด</th>
							<th class="text-left px-4 py-3 font-medium w-32">จำนวนเครื่อง</th>
							<th class="text-right px-4 py-3 font-medium w-40">จัดการ</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDepts as dept, i}
							<tr class="border-t border-gray-50 hover:bg-gray-50/50">
								<td class="px-4 py-3 text-gray-400">{i + 1}</td>
								<td class="px-4 py-3 font-medium text-gray-800">{dept.name}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
										{dept.generatorCount} เครื่อง
									</span>
								</td>
								<td class="px-4 py-3 text-right">
									<button
										on:click={() => openEdit(dept)}
										class="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors mr-1"
									>
										แก้ไข
									</button>
									<button
										on:click={() => handleDelete(dept)}
										class="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
									>
										ลบ
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
				{#if search}
					แสดง {filteredDepts.length} จาก {departments.length} สังกัด
				{:else}
					ทั้งหมด {departments.length} สังกัด
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md">
			<div class="px-6 py-4 border-b border-gray-100">
				<h3 class="text-lg font-semibold text-gray-800">
					{editingDept ? 'แก้ไขสังกัด' : 'เพิ่มสังกัดใหม่'}
				</h3>
			</div>
			<div class="p-6">
				{#if errorMessage}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
						{errorMessage}
					</div>
				{/if}
				<label class="block text-sm font-medium text-gray-700 mb-2">ชื่อสังกัด</label>
				<input
					type="text"
					bind:value={formName}
					on:keydown={(e) => e.key === 'Enter' && handleSave()}
					placeholder="เช่น กฟจ.ยะลา"
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
				/>
			</div>
			<div class="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
				<button
					on:click={() => (showModal = false)}
					class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
				>
					ยกเลิก
				</button>
				<button
					on:click={handleSave}
					disabled={saving}
					class="px-4 py-2 text-sm gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 relative z-10"
				>
					{saving ? 'กำลังบันทึก...' : 'บันทึก'}
				</button>
			</div>
		</div>
	</div>
{/if}
