# Svelte 5 Migration Plan

> ตรวจสอบเมื่อ: 15 ก.พ. 2569  
> Svelte version: ^5.49.2 (runes mode เปิดอัตโนมัติ)  
> ไฟล์ทั้งหมด: 21 Svelte components  
> ✅ ผ่าน: 4 ไฟล์ | ❌ ต้องแก้: 17 ไฟล์

---

## สรุปปัญหาที่พบ

| ปัญหา | จำนวนไฟล์ | ความรุนแรง |
|---|---|---|
| `$:` reactive statement (ต้องเปลี่ยนเป็น `$derived` / `$effect`) | 12 | 🔴 Error |
| `export let` props (ต้องเปลี่ยนเป็น `$props()`) | 6 | 🔴 Error |
| `on:click` / `on:submit` event syntax (ต้องเปลี่ยนเป็น `onclick` / `onsubmit`) | 10 | 🔴 Error |
| `<slot />` (ต้องเปลี่ยนเป็น `{@render children()}`) | 1 | 🔴 Error |
| `{#each}` ไม่มี key | 1 | 🟡 Warning |

---

## ไฟล์ที่ผ่านแล้ว ✅

| # | ไฟล์ | หมายเหตุ |
|---|---|---|
| 1 | `src/routes/+layout.svelte` | ใช้ `$props()`, `{@render children()}` ถูกต้อง |
| 2 | `src/lib/components/Button.svelte` | ไม่มีปัญหา |
| 3 | `src/lib/components/LoadingSpinner.svelte` | ไม่มีปัญหา |
| 4 | `src/lib/components/PageLoadingIndicator.svelte` | ไม่มีปัญหา |

---

## แผนแก้ไขรายไฟล์

### Phase 1: Components ที่ใช้ร่วมกัน (ความเสี่ยงสูง — แก้ก่อน)

#### 1.1 `src/lib/components/Navbar.svelte` 🟡
- **สถานะ**: ใช้ `$state()` และ `$derived()` ถูกต้องแล้ว
- **แก้ไข**: เพิ่ม key ให้ `{#each}` blocks (line 34, 69)
- **ตัวอย่าง**:
  ```svelte
  <!-- ก่อน -->
  {#each navItems as item}
  <!-- หลัง -->
  {#each navItems as item (item.href)}
  ```

---

### Phase 2: Layout files

#### 2.1 `src/routes/admin/+layout.svelte` 🔴
- **ปัญหา 1**: `$: currentPath = $page.url.pathname;` (line 19)
- **ปัญหา 2**: `on:click`, `on:keydown` (line 34, 38, 69, 87, 101)
- **ปัญหา 3**: `<slot />` (line 113)
- **แก้ไข**:
  ```svelte
  <!-- ก่อน -->
  $: currentPath = $page.url.pathname;
  <!-- หลัง -->
  let currentPath = $derived($page.url.pathname);

  <!-- ก่อน -->
  on:click={() => (sidebarOpen = false)}
  <!-- หลัง -->
  onclick={() => (sidebarOpen = false)}

  <!-- ก่อน -->
  on:keydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
  <!-- หลัง -->
  onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}

  <!-- ก่อน -->
  <slot />
  <!-- หลัง -->
  let { children } = $props();
  ...
  {@render children()}
  ```

---

### Phase 3: Public pages (ใช้ `$page.data` ผ่าน `$:`)

> **Pattern ที่ต้องแก้ซ้ำ**: ไฟล์เหล่านี้ใช้ `$: ({ ... } = $page.data)` ต้องเปลี่ยนเป็น `$derived`

#### 3.1 `src/routes/+page.svelte` 🔴 (635 บรรทัด — ไฟล์ใหญ่สุด)
- **ปัญหา 1**: `$:` reactive statements (line 5, 10, 15–20)
- **ปัญหา 2**: `on:click` (line 199, 206, 213, 239, 241)
- **แก้ไข**:
  ```svelte
  <!-- ก่อน -->
  $: ({ departments, overall, ... } = $page.data);
  $: filteredDepartments = departments.filter(...)
  $: trendMax = Math.max(...)
  <!-- หลัง -->
  let pageData = $derived($page.data);
  let departments = $derived(pageData.departments);
  let overall = $derived(pageData.overall);
  let currentMonth = $derived(pageData.currentMonth);
  let currentYear = $derived(pageData.currentYear);
  let formStats = $derived(pageData.formStats);
  let topAbnormalByForm = $derived(pageData.topAbnormalByForm);
  let heatmap = $derived(pageData.heatmap);
  let kpiTrend = $derived(pageData.kpiTrend);
  let repeatRepair = $derived(pageData.repeatRepair);

  let filteredDepartments = $derived(departments.filter((dept: any) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  ));
  let trendMax = $derived(Math.max(...(kpiTrend?.map((t: any) => t.kpiPercent) || [100]), 100));
  let heatmapCompleteCells = $derived(heatmap?.reduce(...) || 0);
  let heatmapPartialCells = $derived(heatmap?.reduce(...) || 0);
  let heatmapNoneCells = $derived(heatmap?.reduce(...) || 0);
  ```
- **หมายเหตุ**: `searchQuery` และ `activeTab` เป็น mutable state → เปลี่ยนเป็น `$state()`
  ```svelte
  let searchQuery = $state('');
  let activeTab = $state<'overview' | 'analysis' | 'heatmap'>('overview');
  ```
- **Event handlers**: เปลี่ยน `on:click` → `onclick` ทั้งหมด

#### 3.2 `src/routes/+error.svelte` 🔴
- **ปัญหา**: `$: status = $page.status;` / `$: message = ...` (line 4–5)
- **แก้ไข**:
  ```svelte
  let status = $derived($page.status);
  let message = $derived($page.error?.message || 'เกิดข้อผิดพลาด');
  ```

#### 3.3 `src/routes/dashboard/+page.svelte` 🔴
- **ปัญหา**: `$:` destructure (line 4), `$:` filter (line 8)
- **แก้ไข**:
  ```svelte
  let pageData = $derived($page.data);
  let summary = $derived(pageData.summary);
  let departments = $derived(pageData.departments);
  let machineStats = $derived(pageData.machineStats);
  let month = $derived(pageData.month);
  let year = $derived(pageData.year);
  let monthName = $derived(pageData.monthName);

  let searchQuery = $state('');
  let filteredDepartments = $derived(departments.filter((dept: any) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  ));
  ```

#### 3.4 `src/routes/department/[id]/calendar/+page.svelte` 🔴
- **ปัญหา**: `$:` destructure (line 4), `$:` computed (line 6–8)
- **แก้ไข**:
  ```svelte
  let pageData = $derived($page.data);
  let department = $derived(pageData.department);
  let year = $derived(pageData.year);
  let calendar = $derived(pageData.calendar);

  let totalInspected = $derived(calendar.reduce((s: number, m: any) => s + Number(m.inspected), 0));
  let totalAll = $derived(calendar.reduce((s: number, m: any) => s + Number(m.total), 0));
  let completedMonths = $derived(calendar.filter((m: any) => Number(m.inspected) >= Number(m.total) && Number(m.total) > 0).length);
  ```

#### 3.5 `src/routes/department/[id]/month/[year]/[month]/+page.svelte` 🔴
- **ปัญหา**: `$:` destructure (line 5), `$:` filter (line 10), `on:click` (line 74, 81, 85, 89)
- **แก้ไข**:
  ```svelte
  let pageData = $derived($page.data);
  let department = $derived(pageData.department);
  let generators = $derived(pageData.generators);
  let inspectedCount = $derived(pageData.inspectedCount);
  let uninspectedCount = $derived(pageData.uninspectedCount);
  let monthName = $derived(pageData.monthName);
  let year = $derived(pageData.year);

  let searchQuery = $state('');
  let filterStatus = $state('all');

  let filteredGenerators = $derived(generators
    .filter((g: any) => { ... })
    .filter((g: any) => ...)
  );
  ```
- **Event handlers**: `on:click` → `onclick`

#### 3.6 `src/routes/inspection/[id]/+page.svelte` 🔴
- **ปัญหา**: `$: ({ inspection } = $page.data);` (line 5)
- **แก้ไข**:
  ```svelte
  let inspection = $derived($page.data.inspection);
  ```

#### 3.7 `src/routes/inspection/new/[generator_id]/[year]/[month]/+page.svelte` 🔴 (472 บรรทัด)
- **ปัญหา 1**: `$:` destructure (line 6), `$:` computed (line 46, 75–79)
- **ปัญหา 2**: `on:click` / `on:change` (line 237, 260, 293, 299, 307, 347, 357, 452)
- **แก้ไข**:
  ```svelte
  let pageData = $derived($page.data);
  let generator = $derived(pageData.generator);
  let formTemplate = $derived(pageData.formTemplate);
  let groupedItems = $derived(pageData.groupedItems);
  let existingInspection = $derived(pageData.existingInspection);
  let previousMonthInspection = $derived(pageData.previousMonthInspection);
  let year = $derived(pageData.year);
  let month = $derived(pageData.month);
  ```
- **Mutable state**: ใช้ `$state()` สำหรับ `formData`, `errorMessage`, `isSubmitting`, `initialized`, ฯลฯ
- **`$: if (!initialized && ...)` block** (line 46–72): เปลี่ยนเป็น `$effect()`
  ```svelte
  $effect(() => {
    if (!initialized && (existingInspection || groupedItems)) {
      initialized = true;
      // ... initialization logic
    }
  });
  ```
- **Computed values**:
  ```svelte
  let normalCount = $derived(Object.values(formData.items).filter((i) => i.status === 'ปกติ').length);
  let abnormalCount = $derived(Object.values(formData.items).filter((i) => i.status === 'ไม่ปกติ').length);
  let unselectedCount = $derived(Object.values(formData.items).filter((i) => !i.status).length);
  let totalItems = $derived(Object.keys(formData.items).length);
  let hasPreviousData = $derived(!!previousMonthInspection);
  ```
- **Event handlers**: `on:click` → `onclick`, `on:change` → `onchange`

---

### Phase 4: Admin pages (ใช้ `export let data`)

> **Pattern ที่ต้องแก้ซ้ำ**: เปลี่ยน `export let data` → `let { data } = $props()` และ `$:` → `$derived`

#### 4.1 `src/routes/admin/+page.svelte` 🔴
- **ปัญหา**: `$: ({ stats, recentInspections } = $page.data);` (line 5)
- **แก้ไข**:
  ```svelte
  let pageData = $derived($page.data);
  let stats = $derived(pageData.stats);
  let recentInspections = $derived(pageData.recentInspections);
  ```

#### 4.2 `src/routes/admin/departments/+page.svelte` 🔴
- **ปัญหา 1**: `export let data: PageData;` (line 9)
- **ปัญหา 2**: `$: departments = data.departments` (line 20), `$: filteredDepts` (line 23)
- **ปัญหา 3**: `on:click` (line 49, 68, 111)
- **แก้ไข**:
  ```svelte
  let { data } = $props();

  let departments = $derived(data.departments as DepartmentWithCount[]);
  let filteredDepts = $derived(departments.filter((dept) =>
    dept.name.toLowerCase().includes(search.toLowerCase())
  ));
  ```
- **Mutable state**: `search`, `showModal`, `editingDept`, `formName`, `saving`, `errorMessage`, `deleting`, `toggling` → `$state()`
- **Event handlers**: `on:click` → `onclick`

#### 4.3 `src/routes/admin/form-templates/+page.svelte` 🔴
- **ปัญหา 1**: `export let data: PageData;` (line 6)
- **ปัญหา 2**: `$: templates = data.templates` (line 27)
- **ปัญหา 3**: `on:click` (line 53, 98)
- **แก้ไข**:
  ```svelte
  let { data } = $props();

  let templates = $derived(data.templates as FormTemplateWithStats[]);
  ```
- **Mutable state**: `showModal`, `editingTemplate`, `saving`, `errorMessage`, `formName`, `formDescription`, `duplicatingId`, `togglingId` → `$state()`
- **Event handlers**: `on:click` → `onclick`

#### 4.4 `src/routes/admin/form-templates/[id]/edit/+page.svelte` 🔴
- **ปัญหา 1**: `export let data;` (line 22) — ไม่มี type
- **ปัญหา 2**: `$: templateId = $page.params.id;` (line 6)
- **ปัญหา 3**: `$: visibleItems`, `$: categories`, `$: itemsJson` (line 83–85)
- **ปัญหา 4**: `on:click` (line 156, 163, 183, 189, 229)
- **แก้ไข**:
  ```svelte
  let { data } = $props();

  let templateId = $derived($page.params.id);
  let visibleItems = $derived(items.filter((i) => !i._deleted));
  let categories = $derived([...new Set(visibleItems.map((i) => i.category).filter(Boolean))]);
  let itemsJson = $derived(JSON.stringify(items));
  ```
- **หมายเหตุ**: `items` เป็น mutable array → ใช้ `$state()` แต่ต้องระวังเรื่อง deep reactivity
  ```svelte
  let items: (EditableItem | NewItem)[] = $state(data.items);
  ```
- **Event handlers**: `on:click` → `onclick`

#### 4.5 `src/routes/admin/generators/+page.svelte` 🔴
- **ปัญหา 1**: `export let data: PageData;` (line 8)
- **ปัญหา 2**: ตรวจสอบ `$:` reactive statements เพิ่มเติมในไฟล์
- **แก้ไข**:
  ```svelte
  let { data } = $props();
  ```
- **Mutable state**: ตรวจสอบตัวแปรที่ต้องเปลี่ยนเป็น `$state()`
- **Event handlers**: `on:click` → `onclick`

#### 4.6 `src/routes/admin/inspections/+page.svelte` 🔴
- **ปัญหา 1**: `export let data: PageData;` (line 7)
- **ปัญหา 2**: `$: inspectionList`, `$: departmentsList`, `$: pagination` (line 9–11)
- **แก้ไข**:
  ```svelte
  let { data } = $props();

  let inspectionList = $derived(data.inspections);
  let departmentsList = $derived(data.departments as Department[]);
  let pagination = $derived(data.pagination);
  ```
- **Mutable state**: `search`, `filterDept`, `filterMonth`, `filterYear`, `filterStatus` → `$state()`

#### 4.7 `src/routes/admin/users/+page.svelte` 🔴
- **ปัญหา 1**: `export let data: PageData;` (line 7)
- **ปัญหา 2**: `$: userList = data.users` (line 20)
- **แก้ไข**:
  ```svelte
  let { data } = $props();

  let userList = $derived(data.users as UserWithDepartment[]);
  ```
- **Mutable state**: ตรวจสอบตัวแปรที่ต้องเปลี่ยนเป็น `$state()`

---

### Phase 5: Login page

#### 5.1 `src/routes/login/+page.svelte` 🔴
- **ปัญหา 1**: `$: redirectTo = $page.url.searchParams.get('redirect') || '/admin';` (line 11)
- **ปัญหา 2**: `on:submit|preventDefault` (line 64)
- **แก้ไข**:
  ```svelte
  let redirectTo = $derived($page.url.searchParams.get('redirect') || '/admin');
  ```
- **Mutable state**: `username`, `password`, `loading`, `errorMessage` → `$state()`
- **Event handler**:
  ```svelte
  <!-- ก่อน -->
  <form on:submit|preventDefault={handleLogin}>
  <!-- หลัง -->
  <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
  ```

---

## Quick Reference: Svelte 4 → 5 Syntax

| Svelte 4 (Legacy) | Svelte 5 (Runes) |
|---|---|
| `export let data` | `let { data } = $props()` |
| `$: x = expr` | `let x = $derived(expr)` |
| `$: { sideEffect }` | `$effect(() => { sideEffect })` |
| `let x = value` (mutable) | `let x = $state(value)` |
| `on:click={handler}` | `onclick={handler}` |
| `on:submit\|preventDefault` | `onsubmit={(e) => { e.preventDefault(); ... }}` |
| `on:change` | `onchange` |
| `on:keydown` | `onkeydown` |
| `<slot />` | `let { children } = $props(); {@render children()}` |

---

## ลำดับการทำงานแนะนำ

1. **Phase 1** — แก้ shared components (Navbar) → ทดสอบ
2. **Phase 2** — แก้ layout files (admin/+layout.svelte) → ทดสอบ
3. **Phase 3** — แก้ public pages ทีละไฟล์ → ทดสอบแต่ละหน้า
4. **Phase 4** — แก้ admin pages ทีละไฟล์ → ทดสอบแต่ละหน้า
5. **Phase 5** — แก้ login page → ทดสอบ
6. **สุดท้าย** — รัน `npm run check` เพื่อตรวจ type errors ทั้งโปรเจค

## คำสั่งตรวจสอบ

```bash
# Type check ทั้งโปรเจค
npm run check

# ตรวจไฟล์เดี่ยวด้วย svelte-autofixer
npx @sveltejs/mcp svelte-autofixer <path-to-file>

# Dev server
npm run dev
```
