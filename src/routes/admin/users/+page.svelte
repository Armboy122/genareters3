<script lang="ts">
	import { onMount } from 'svelte';

	let userList: any[] = [];
	let departmentsList: any[] = [];
	let loading = true;
	let search = '';
	let showModal = false;
	let editingUser: any = null;
	let saving = false;
	let errorMessage = '';

	let form = {
		username: '',
		password: '',
		displayName: '',
		role: 'inspector' as string,
		departmentId: ''
	};

	const roleLabels: Record<string, string> = {
		admin: 'ผู้ดูแลระบบ',
		inspector: 'ผู้ตรวจ',
		viewer: 'ผู้ดู'
	};

	const roleColors: Record<string, string> = {
		admin: 'bg-red-100 text-red-700',
		inspector: 'bg-blue-100 text-blue-700',
		viewer: 'bg-gray-100 text-gray-600'
	};

	async function loadUsers() {
		loading = true;
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		const res = await fetch(`/api/admin/users?${params}`);
		const data = await res.json();
		if (data.success) userList = data.data;
		loading = false;
	}

	async function loadDepartments() {
		const res = await fetch('/api/admin/departments');
		const data = await res.json();
		if (data.success) departmentsList = data.data;
	}

	onMount(() => {
		loadDepartments();
		loadUsers();
	});

	function openCreate() {
		editingUser = null;
		form = { username: '', password: '', displayName: '', role: 'inspector', departmentId: '' };
		errorMessage = '';
		showModal = true;
	}

	function openEdit(user: any) {
		editingUser = user;
		form = {
			username: user.username,
			password: '',
			displayName: user.displayName,
			role: user.role,
			departmentId: user.departmentId || ''
		};
		errorMessage = '';
		showModal = true;
	}

	async function handleSave() {
		if (!form.username.trim() || !form.displayName.trim() || !form.role) {
			errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
			return;
		}
		if (!editingUser && !form.password) {
			errorMessage = 'กรุณาระบุรหัสผ่าน';
			return;
		}
		saving = true;
		errorMessage = '';

		const method = editingUser ? 'PUT' : 'POST';
		const body: any = editingUser ? { id: editingUser.id, ...form } : { ...form };
		if (editingUser && !form.password) delete body.password;

		const res = await fetch('/api/admin/users', {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		const data = await res.json();
		saving = false;

		if (data.success) {
			showModal = false;
			loadUsers();
		} else {
			errorMessage = data.message || 'เกิดข้อผิดพลาด';
		}
	}

	async function toggleActive(user: any) {
		const newStatus = !user.isActive;
		if (!confirm(`ยืนยัน${newStatus ? 'เปิด' : 'ปิด'}ใช้งานผู้ใช้ "${user.displayName}" ?`)) return;

		await fetch('/api/admin/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: user.id, isActive: newStatus })
		});
		loadUsers();
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
			<p class="text-gray-500 text-sm mt-1">เพิ่ม แก้ไข หรือปิดใช้งานผู้ใช้</p>
		</div>
		<button
			on:click={openCreate}
			class="px-4 py-2.5 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium relative z-10"
		>
			+ เพิ่มผู้ใช้ใหม่
		</button>
	</div>

	<!-- Search -->
	<div class="mb-6 flex gap-2">
		<input
			type="text"
			bind:value={search}
			on:keydown={(e) => e.key === 'Enter' && loadUsers()}
			placeholder="ค้นหาชื่อผู้ใช้..."
			class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
		/>
		<button on:click={loadUsers} class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm">
			🔍 ค้นหา
		</button>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
		{#if loading}
			<div class="p-12 text-center text-gray-400">กำลังโหลด...</div>
		{:else if userList.length === 0}
			<div class="p-12 text-center text-gray-400">ไม่พบข้อมูลผู้ใช้</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="text-left px-4 py-3 font-medium">ชื่อผู้ใช้</th>
							<th class="text-left px-4 py-3 font-medium">ชื่อแสดงผล</th>
							<th class="text-left px-4 py-3 font-medium">บทบาท</th>
							<th class="text-left px-4 py-3 font-medium">สังกัด</th>
							<th class="text-left px-4 py-3 font-medium">สถานะ</th>
							<th class="text-right px-4 py-3 font-medium">จัดการ</th>
						</tr>
					</thead>
					<tbody>
						{#each userList as user}
							<tr class="border-t border-gray-50 hover:bg-gray-50/50 {user.isActive ? '' : 'opacity-50'}">
								<td class="px-4 py-3 font-mono text-xs font-medium">{user.username}</td>
								<td class="px-4 py-3 font-medium text-gray-800">{user.displayName}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs {roleColors[user.role] || 'bg-gray-100 text-gray-600'}">
										{roleLabels[user.role] || user.role}
									</span>
								</td>
								<td class="px-4 py-3 text-gray-600 text-xs">{user.departmentName || 'ทุกสังกัด'}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs {user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
										{user.isActive ? 'ใช้งาน' : 'ปิด'}
									</span>
								</td>
								<td class="px-4 py-3 text-right whitespace-nowrap">
									<button
										on:click={() => openEdit(user)}
										class="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors mr-1"
									>
										แก้ไข
									</button>
									<button
										on:click={() => toggleActive(user)}
										class="px-3 py-1.5 text-xs rounded-lg transition-colors
										{user.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}"
									>
										{user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
				ทั้งหมด {userList.length} ผู้ใช้
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
					{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
				</h3>
			</div>
			<div class="p-6 space-y-4">
				{#if errorMessage}
					<div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorMessage}</div>
				{/if}

				<div>
					<label for="modal-username" class="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้ *</label>
					<input id="modal-username" type="text" bind:value={form.username} placeholder="username"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>

				<div>
					<label for="modal-password" class="block text-sm font-medium text-gray-700 mb-1">
						รหัสผ่าน {editingUser ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}
					</label>
					<input id="modal-password" type="password" bind:value={form.password} placeholder="••••••"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>

				<div>
					<label for="modal-displayname" class="block text-sm font-medium text-gray-700 mb-1">ชื่อแสดงผล *</label>
					<input id="modal-displayname" type="text" bind:value={form.displayName} placeholder="ชื่อ-นามสกุล"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>

				<div>
					<label for="modal-role" class="block text-sm font-medium text-gray-700 mb-1">บทบาท *</label>
					<select id="modal-role" bind:value={form.role} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
						<option value="admin">ผู้ดูแลระบบ (Admin)</option>
						<option value="inspector">ผู้ตรวจ (Inspector)</option>
						<option value="viewer">ผู้ดู (Viewer)</option>
					</select>
				</div>

				<div>
					<label for="modal-dept" class="block text-sm font-medium text-gray-700 mb-1">สังกัดที่รับผิดชอบ</label>
					<select id="modal-dept" bind:value={form.departmentId} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
						<option value="">ทุกสังกัด</option>
						{#each departmentsList as dept}
							<option value={dept.id}>{dept.name}</option>
						{/each}
					</select>
					<p class="text-xs text-gray-400 mt-1">ถ้าไม่ระบุ = เข้าถึงได้ทุกสังกัด</p>
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
