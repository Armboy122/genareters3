<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	$: ({ generator, formTemplate, groupedItems, existingInspection, previousMonthInspection, year, month } = $page.data);

	let formData = {
		inspectorName: '',
		items: {} as Record<string, { status: 'ปกติ' | 'ไม่ปกติ'; remark: string }>,
		overallRemark: ''
	};

	let errorMessage = '';
	let isSubmitting = false;
	let initialized = false;
	let usedPreviousMonth = false;

	// Initialize form data once from existing inspection, previous month, or default to "ปกติ"
	$: if (!initialized && (existingInspection || groupedItems)) {
		initialized = true;
		if (existingInspection) {
			formData.inspectorName = existingInspection.inspectorName;
			formData.overallRemark = existingInspection.overallRemark || '';
			// First set defaults for all template items
			for (const category in groupedItems) {
				for (const item of groupedItems[category]) {
					formData.items[item.itemCode] = {
						status: 'ปกติ',
						remark: ''
					};
				}
			}
			// Then override with existing inspection data
			for (const detail of existingInspection.details) {
				formData.items[detail.itemCode] = {
					status: detail.status,
					remark: detail.remark || ''
				};
			}
		} else if (groupedItems) {
			// First set defaults for all template items
			for (const category in groupedItems) {
				for (const item of groupedItems[category]) {
					formData.items[item.itemCode] = {
						status: 'ปกติ',
						remark: ''
					};
				}
			}
			// If previous month inspection exists, pre-fill from it
			if (previousMonthInspection) {
				usedPreviousMonth = true;
				formData.inspectorName = previousMonthInspection.inspectorName;
				for (const detail of previousMonthInspection.details) {
					if (formData.items[detail.itemCode]) {
						formData.items[detail.itemCode] = {
							status: detail.status,
							remark: detail.remark || ''
						};
					}
				}
			}
		}
		formData = formData; // trigger reactivity
	}

	// Calculate summary
	$: normalCount = Object.values(formData.items).filter((i) => i.status === 'ปกติ').length;
	$: abnormalCount = Object.values(formData.items).filter((i) => i.status === 'ไม่ปกติ').length;

	function selectAllNormal() {
		for (const key in formData.items) {
			formData.items[key].status = 'ปกติ';
		}
		formData = formData; // trigger reactivity
	}

	function selectAllAbnormal() {
		for (const key in formData.items) {
			formData.items[key].status = 'ไม่ปกติ';
		}
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
			return;
		}

		// Validate abnormal items have remarks
		for (const [itemCode, item] of Object.entries(formData.items)) {
			if (item.status === 'ไม่ปกติ' && !item.remark?.trim()) {
				errorMessage = `กรุณาระบุหมายเหตุสำหรับรายการ "${itemCode}" ที่มีสถานะไม่ปกติ`;
				return;
			}
		}

		const confirmMessage = `ยืนยันบันทึกการตรวจ?\n\nปกติ: ${normalCount} รายการ\nไม่ปกติ: ${abnormalCount} รายการ`;
		if (!confirm(confirmMessage)) return;

		isSubmitting = true;

		try {
			const url = existingInspection ? '/api/inspections' : '/api/inspections';
			const method = existingInspection ? 'PUT' : 'POST';

			const payload = existingInspection
				? {
						inspectionId: existingInspection.id,
						inspectorName: formData.inspectorName,
						items: formData.items,
						overallRemark: formData.overallRemark
					}
				: {
						generatorId: generator.id,
						month,
						year,
						inspectorName: formData.inspectorName,
						items: formData.items,
						overallRemark: formData.overallRemark
					};

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await response.json();

			if (result.success) {
				goto(`/department/${generator.department.id}/month/${year}/${month}`);
			} else {
				errorMessage = result.message || 'บันทึกข้อมูลไม่สำเร็จ';
			}
		} catch (e) {
			errorMessage = 'เกิดข้อผิดพลาดในการบันทึก';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold tracking-tight">
						{existingInspection ? 'แก้ไขข้อมูลการตรวจ' : 'บันทึกข้อมูลการตรวจ'}
					</h1>
					<p class="text-blue-200/70 text-sm">
						{generator.assetId} | {generator.type} | {generator.sizeKw} kW | {generator.product || '-'}
					</p>
				</div>
				<a
					href="/department/{generator.department.id}/month/{year}/{month}"
					class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
				>
					← กลับรายการเครื่อง
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Previous Month Pre-fill Notice -->
		{#if usedPreviousMonth}
			<div class="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-3">
				<span class="text-xl">📋</span>
				<div>
					<p class="font-semibold">ดึงข้อมูลจากเดือนที่แล้วมาแล้ว</p>
					<p class="text-sm">ข้อมูลการตรวจถูกดึงมาจากประวัติเดือนก่อนหน้า กรุณาตรวจสอบและแก้ไขก่อนบันทึก</p>
				</div>
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
		<div class="mb-6 flex gap-2">
			<button
				type="button"
				on:click={selectAllNormal}
				class="flex-1 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
			>
				✅ เลือกปกติทั้งหมด
			</button>
			<button
				type="button"
				on:click={selectAllAbnormal}
				class="flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
			>
				❌ เลือกไม่ปกติทั้งหมด
			</button>
		</div>

		<!-- Inspection Items -->
		{#each Object.keys(groupedItems) as category}
			<div class="mb-6 bg-white rounded-xl shadow-md p-6">
				<h2 class="text-lg font-semibold text-slate-700 mb-4">{category}</h2>

				{#each groupedItems[category] as item}
					<div class="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
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
										on:change={() => setItemStatus(item.itemCode, 'ปกติ')}
										class="w-5 h-5 text-green-600 focus:ring-green-500"
									/>
									<span class="text-sm text-green-700">ปกติ</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="item_{item.itemCode}"
										checked={formData.items[item.itemCode].status === 'ไม่ปกติ'}
										on:change={() => setItemStatus(item.itemCode, 'ไม่ปกติ')}
										class="w-5 h-5 text-red-600 focus:ring-red-500"
									/>
									<span class="text-sm text-red-700">ไม่ปกติ</span>
								</label>
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
			<div class="grid grid-cols-2 gap-4 mb-4">
				<div class="text-center p-4 bg-green-50 rounded-lg">
					<p class="text-2xl font-bold text-green-700">{normalCount}</p>
					<p class="text-sm text-gray-600">ปกติ</p>
				</div>
				<div class="text-center p-4 bg-red-50 rounded-lg">
					<p class="text-2xl font-bold text-red-700">{abnormalCount}</p>
					<p class="text-sm text-gray-600">ไม่ปกติ</p>
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
			<button
				type="button"
				on:click={handleSubmit}
				disabled={isSubmitting}
				class="flex-1 px-6 py-4 gradient-bg text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
			>
				{isSubmitting ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
			</button>
			<a
				href="/department/{generator.department.id}/month/{year}/{month}"
				class="flex-1 px-6 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
			>
				ยกเลิก
			</a>
		</div>
	</main>
</div>
