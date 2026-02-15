<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';

	let pageData = $derived($page.data);
	let generator = $derived(pageData.generator);
	let formTemplate = $derived(pageData.formTemplate);
	let groupedItems = $derived(pageData.groupedItems);
	let existingInspection = $derived(pageData.existingInspection);
	let previousMonthInspection = $derived(pageData.previousMonthInspection);
	let year = $derived(pageData.year);
	let month = $derived(pageData.month);

	let formData = $state({
		inspectorName: '',
		items: {} as Record<string, { status: string; remark: string }>,
		overallRemark: ''
	});

	let errorMessage = $state('');
	let isSubmitting = $state(false);
	let initialized = $state(false);
	let usedPreviousMonth = $state(false);
	let loadingPrevious = $state(false);

	// Toast state
	let toastMessage = $state('');
	let toastType: 'success' | 'error' | 'warning' = $state('success');
	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
		clearTimeout(toastTimer);
		toastMessage = message;
		toastType = type;
		toastVisible = true;
		toastTimer = setTimeout(() => {
			toastVisible = false;
		}, 3500);
	}

	function scrollToElement(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			el.classList.add('ring-2', 'ring-red-400', 'ring-offset-2');
			setTimeout(() => el.classList.remove('ring-2', 'ring-red-400', 'ring-offset-2'), 3000);
		}
	}

	// Initialize form data: existing inspection gets pre-filled, new inspection starts EMPTY
	$effect(() => {
		if (!initialized && (existingInspection || groupedItems)) {
			initialized = true;
			if (existingInspection) {
				// Edit mode: fill from existing data
				formData.inspectorName = existingInspection.inspectorName;
				formData.overallRemark = existingInspection.overallRemark || '';
				for (const category in groupedItems) {
					for (const item of groupedItems[category]) {
						formData.items[item.itemCode] = { status: '', remark: '' };
					}
				}
				for (const detail of existingInspection.details) {
					formData.items[detail.itemCode] = {
						status: detail.status,
						remark: detail.remark || ''
					};
				}
			} else if (groupedItems) {
				// New inspection: all items start with NO status selected
				for (const category in groupedItems) {
					for (const item of groupedItems[category]) {
						formData.items[item.itemCode] = { status: '', remark: '' };
					}
				}
			}
		}
	});

	// Calculate summary
	let normalCount = $derived(Object.values(formData.items).filter((i) => i.status === 'ปกติ').length);
	let abnormalCount = $derived(Object.values(formData.items).filter((i) => i.status === 'ไม่ปกติ').length);
	let unselectedCount = $derived(Object.values(formData.items).filter((i) => !i.status).length);
	let totalItems = $derived(Object.keys(formData.items).length);
	let hasPreviousData = $derived(!!previousMonthInspection);

	function loadPreviousMonth() {
		if (!previousMonthInspection) return;
		loadingPrevious = true;
		usedPreviousMonth = true;
		formData.inspectorName = formData.inspectorName || previousMonthInspection.inspectorName;
		for (const detail of previousMonthInspection.details) {
			if (formData.items[detail.itemCode] !== undefined) {
				formData.items[detail.itemCode] = {
					status: detail.status,
					remark: detail.remark || ''
				};
			}
		}
		formData = formData;
		loadingPrevious = false;
	}

	function selectAllNormal() {
		for (const key in formData.items) {
			formData.items[key].status = 'ปกติ';
		}
		formData = formData;
	}

	function selectAllAbnormal() {
		for (const key in formData.items) {
			formData.items[key].status = 'ไม่ปกติ';
		}
		formData = formData;
	}

	function clearAll() {
		for (const key in formData.items) {
			formData.items[key] = { status: '', remark: '' };
		}
		usedPreviousMonth = false;
		formData = formData;
	}

	function setItemStatus(itemCode: string, status: 'ปกติ' | 'ไม่ปกติ') {
		formData.items[itemCode].status = status;
		formData = formData;
	}

	async function handleSubmit() {
		errorMessage = '';

		if (!formData.inspectorName.trim()) {
			errorMessage = 'กรุณาระบุชื่อผู้ตรวจ';
			showToast('กรุณาระบุชื่อผู้ตรวจ', 'warning');
			scrollToElement('inspectorName');
			return;
		}

		// Validate all items have a status selected — scroll to first unselected
		if (unselectedCount > 0) {
			errorMessage = `ยังมี ${unselectedCount} รายการที่ยังไม่ได้เลือกสถานะ กรุณาเลือกให้ครบทุกรายการ`;
			showToast(`ยังเหลืออีก ${unselectedCount} รายการที่ยังไม่ได้เลือก`, 'warning');
			// Find & scroll to first unselected item
			for (const [itemCode, item] of Object.entries(formData.items)) {
				if (!item.status) {
					scrollToElement(`item-${itemCode}`);
					break;
				}
			}
			return;
		}

		// Validate abnormal items have remarks — scroll to first missing remark
		for (const [itemCode, item] of Object.entries(formData.items)) {
			if (item.status === 'ไม่ปกติ' && !item.remark?.trim()) {
				errorMessage = `กรุณาระบุหมายเหตุสำหรับรายการ "${itemCode}" ที่มีสถานะไม่ปกติ`;
				showToast(`กรุณาระบุหมายเหตุรายการ ${itemCode}`, 'warning');
				scrollToElement(`item-${itemCode}`);
				return;
			}
		}

		const confirmMessage = `ยืนยันบันทึกการตรวจ?\n\nปกติ: ${normalCount} รายการ\nไม่ปกติ: ${abnormalCount} รายการ`;
		if (!confirm(confirmMessage)) return;

		isSubmitting = true;

		try {
			const actionName = existingInspection ? 'update' : 'create';

			const submitData = new FormData();
			submitData.append('inspectorName', formData.inspectorName);
			submitData.append('items', JSON.stringify(formData.items));
			submitData.append('overallRemark', formData.overallRemark);
			if (existingInspection) {
				submitData.append('inspectionId', existingInspection.id);
			}

			const response = await fetch(`?/${actionName}`, {
				method: 'POST',
				body: submitData
			});

			const result = await response.json();

			// SvelteKit action responses have a different shape
			if (result.type === 'success') {
				showToast('บันทึกข้อมูลสำเร็จ', 'success');
				setTimeout(() => {
					goto(`/department/${generator.department.id}/month/${year}/${month}`);
				}, 1000);
			} else if (result.type === 'failure') {
				errorMessage = result.data?.error || 'บันทึกข้อมูลไม่สำเร็จ';
				showToast(errorMessage, 'error');
			} else {
				errorMessage = 'บันทึกข้อมูลไม่สำเร็จ';
				showToast(errorMessage, 'error');
			}
		} catch (e) {
			errorMessage = 'เกิดข้อผิดพลาดในการบันทึก';
			showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center gap-2 text-blue-200/60 text-sm mb-1">
				<a href="/department/{generator.department.id}/calendar" class="hover:text-white transition-colors">{generator.department.name}</a>
				<span>/</span>
				<a href="/department/{generator.department.id}/month/{year}/{month}" class="hover:text-white transition-colors">รายการเครื่อง</a>
				<span>/</span>
				<span class="text-white">ตรวจ</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">
				{existingInspection ? 'แก้ไขข้อมูลการตรวจ' : 'บันทึกข้อมูลการตรวจ'}
			</h1>
			<p class="text-blue-200/70 text-sm mt-0.5">
				{generator.assetId} | {generator.type} | {generator.sizeKw} kW | {generator.product || '-'}
			</p>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Previous Month Button / Notice -->
		{#if !existingInspection && hasPreviousData && !usedPreviousMonth}
			<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div class="flex items-center gap-3">
					<span class="text-xl">📋</span>
					<div>
						<p class="font-semibold text-blue-800">มีข้อมูลเดือนก่อนหน้า</p>
						<p class="text-sm text-blue-600">กดปุ่มเพื่อดึงข้อมูลจากเดือนที่แล้วมาช่วยกรอก</p>
					</div>
				</div>
				<button
					type="button"
					onclick={loadPreviousMonth}
					disabled={loadingPrevious}
					class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
				>
					{#if loadingPrevious}
						<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						กำลังดึง...
					{:else}
						📥 ดึงข้อมูลเดือนก่อน
					{/if}
				</button>
			</div>
		{:else if usedPreviousMonth}
			<div class="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center justify-between gap-3">
				<div class="flex items-center gap-3">
					<span class="text-xl">✅</span>
					<div>
						<p class="font-semibold">ดึงข้อมูลจากเดือนที่แล้วมาแล้ว</p>
						<p class="text-sm">กรุณาตรวจสอบและแก้ไขก่อนบันทึก</p>
					</div>
				</div>
				<button
					type="button"
					onclick={clearAll}
					class="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs"
				>
					ล้างทั้งหมด
				</button>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
				{errorMessage}
			</div>
		{/if}

		<!-- Inspector Name -->
		<div class="mb-6">
			<label for="inspectorName" class="block text-sm font-medium text-gray-700 mb-2">
				ชื่อผู้ตรวจ <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="inspectorName"
				bind:value={formData.inspectorName}
				class="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
				placeholder="ระบุชื่อผู้ตรวจ"
			/>
		</div>

		<!-- Quick Select Buttons -->
		<div class="mb-6 flex flex-wrap gap-2">
			<button
				type="button"
				onclick={selectAllNormal}
				class="flex-1 min-w-[140px] px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
			>
				✅ เลือกปกติทั้งหมด
			</button>
			<button
				type="button"
				onclick={selectAllAbnormal}
				class="flex-1 min-w-[140px] px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
			>
				❌ เลือกไม่ปกติทั้งหมด
			</button>
			<button
				type="button"
				onclick={clearAll}
				class="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
			>
				🗑️ ล้าง
			</button>
		</div>

		<!-- Progress indicator -->
		{#if unselectedCount > 0}
			<div class="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between">
				<span>⚠️ ยังเหลืออีก {unselectedCount} จาก {totalItems} รายการที่ยังไม่ได้เลือก</span>
				<span class="text-xs text-amber-600">{Math.round(((totalItems - unselectedCount) / totalItems) * 100)}%</span>
			</div>
		{/if}

		<!-- Inspection Items -->
		{#each Object.keys(groupedItems) as category}
			<div class="mb-6 bg-white rounded-xl shadow-md p-6">
				<h2 class="text-lg font-semibold text-slate-700 mb-4">{category}</h2>

				{#each groupedItems[category] as item}
					<div id="item-{item.itemCode}" class="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0 transition-all duration-300
						{formData.items[item.itemCode] && !formData.items[item.itemCode].status ? 'bg-amber-50/50 -mx-3 px-3 rounded-lg' : ''}">
						<div class="flex items-start gap-2 mb-3">
							<span class="text-sm font-medium text-slate-500 font-mono shrink-0">{item.itemCode}</span>
							<span class="text-gray-700">{item.description}</span>
							{#if item.isDisposalCriteria}
								<span class="ml-auto px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full shrink-0">
									เกณฑ์รอจำหน่าย
								</span>
							{/if}
						</div>

						{#if formData.items[item.itemCode]}
							<div class="flex items-center gap-4 ml-6">
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="item_{item.itemCode}"
										checked={formData.items[item.itemCode].status === 'ปกติ'}
										onchange={() => setItemStatus(item.itemCode, 'ปกติ')}
										class="w-5 h-5 text-green-600 focus:ring-green-500"
									/>
									<span class="text-sm text-green-700">ปกติ</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="item_{item.itemCode}"
										checked={formData.items[item.itemCode].status === 'ไม่ปกติ'}
										onchange={() => setItemStatus(item.itemCode, 'ไม่ปกติ')}
										class="w-5 h-5 text-red-600 focus:ring-red-500"
									/>
									<span class="text-sm text-red-700">ไม่ปกติ</span>
								</label>
								{#if !formData.items[item.itemCode].status}
									<span class="text-xs text-amber-500 ml-2">← ยังไม่ได้เลือก</span>
								{/if}
							</div>

							{#if formData.items[item.itemCode].status === 'ไม่ปกติ'}
								<div class="mt-2 ml-6">
									<label for="remark_{item.itemCode}" class="block text-sm font-medium text-gray-700 mb-1">
										หมายเหตุ <span class="text-red-500">*</span>
									</label>
									<textarea
										id="remark_{item.itemCode}"
										bind:value={formData.items[item.itemCode].remark}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
										rows="2"
										placeholder="ระบุหมายเหตุ..."
									></textarea>
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		{/each}

		<!-- Summary & Overall Remark -->
		<div class="mb-6 bg-white rounded-xl shadow-md p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">สรุปและหมายเหตุรวม</h2>
			<div class="grid grid-cols-3 gap-4 mb-4">
				<div class="text-center p-4 bg-green-50 rounded-lg border border-green-100">
					<p class="text-2xl font-bold text-green-700">{normalCount}</p>
					<p class="text-sm text-gray-600">ปกติ</p>
				</div>
				<div class="text-center p-4 bg-red-50 rounded-lg border border-red-100">
					<p class="text-2xl font-bold text-red-700">{abnormalCount}</p>
					<p class="text-sm text-gray-600">ไม่ปกติ</p>
				</div>
				<div class="text-center p-4 rounded-lg border {unselectedCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}">
					<p class="text-2xl font-bold {unselectedCount > 0 ? 'text-amber-600' : 'text-gray-400'}">{unselectedCount}</p>
					<p class="text-sm text-gray-600">ยังไม่เลือก</p>
				</div>
			</div>

			<div>
				<label for="overallRemark" class="block text-sm font-medium text-gray-700 mb-2">
					หมายเหตุรวม (ถ้ามี)
				</label>
				<textarea
					id="overallRemark"
					bind:value={formData.overallRemark}
					class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
					rows="3"
					placeholder="ระบุหมายเหตุเพิ่มเติม..."
				></textarea>
			</div>
		</div>

		<!-- Submit Buttons -->
		<div class="flex gap-4">
			<Button
				type="button"
				size="lg"
				class="flex-1"
				loading={isSubmitting}
				onclick={handleSubmit}
			>
				{isSubmitting ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
			</Button>
			<a
				href="/department/{generator.department.id}/month/{year}/{month}"
				class="flex-1 px-6 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
			>
				ยกเลิก
			</a>
		</div>
	</main>
</div>

<!-- Toast Notification -->
{#if toastVisible}
	<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
		<div class="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg backdrop-blur-sm text-sm font-medium
			{toastType === 'success' ? 'bg-green-600 text-white' : ''}
			{toastType === 'error' ? 'bg-red-600 text-white' : ''}
			{toastType === 'warning' ? 'bg-amber-500 text-white' : ''}"
		>
			<span class="text-lg">
				{#if toastType === 'success'}✅{:else if toastType === 'error'}❌{:else}⚠️{/if}
			</span>
			<span>{toastMessage}</span>
			<button onclick={() => toastVisible = false} class="ml-2 opacity-70 hover:opacity-100 transition-opacity">✕</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translate(-50%, -100%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
	.animate-slide-down {
		animation: slide-down 0.3s ease-out;
	}
</style>
