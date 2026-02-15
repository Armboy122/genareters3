# Refactor Plan: API Routes → Form Actions + Load Functions

## Context

โปรเจคปัจจุบันใช้ **Hybrid Pattern** ที่มีปัญหา:
- มี API Routes (`/api/admin/*`) ที่ทำ CRUD
- มี `+page.server.ts` ที่โหลดข้อมูลเริ่มต้น
- `+page.svelte` ใช้ client-side `fetch()` เรียก API สำหรับ mutations
- **ผลลัพธ์**: Code duplication, ดูแลยาก, GET logic ซ้ำกัน 2 ที่

**เป้าหมาย**: เนื่องจากไม่ต้องการ Public API, จะ refactor เป็น:
- ✅ ใช้ **Form Actions** สำหรับ mutations (POST/PUT/DELETE)
- ✅ ใช้ **Load Functions** สำหรับ data fetching (GET)
- ✅ ลบ API Routes ทั้งหมดออก
- ✅ ใช้ Progressive Enhancement (ทำงานได้โดยไม่ใช้ JS)

**Admin Pages ที่ต้อง Refactor (6 หน้า)**:
1. Departments
2. Form Templates
3. Form Templates Edit
4. Generators
5. Inspections (Read-only)
6. Users

---

## Implementation Plan (TODO List)

### 📋 Phase 1: Setup & Preparation

- [ ] **1.1** สำรองโค้ดเดิม (git commit ก่อน refactor)
- [ ] **1.2** อ่าน SvelteKit Form Actions docs อีกครั้งเพื่อทำความเข้าใจ
- [ ] **1.3** ทดสอบหน้าเดิมทั้งหมดว่าทำงานได้ปกติก่อน refactor

---

### 🔧 Phase 2: Refactor Departments (หน้าง่ายที่สุด - ทดสอบ pattern)

**ไฟล์ที่เกี่ยวข้อง**:
- `src/routes/admin/departments/+page.server.ts`
- `src/routes/admin/departments/+page.svelte`
- `src/routes/api/admin/departments/+server.ts` (จะลบ)

#### 2.1 Refactor +page.server.ts
- [ ] **2.1.1** เพิ่ม Form Actions: `create`, `update`, `delete`
- [ ] **2.1.2** ย้าย POST logic จาก API → `create` action
- [ ] **2.1.3** ย้าย PUT logic จาก API → `update` action
- [ ] **2.1.4** ย้าย DELETE logic จาก API → `delete` action (รวมถึงการตรวจสอบ FK)
- [ ] **2.1.5** ปรับ load function ให้รองรับ search query จาก URL

#### 2.2 Refactor +page.svelte
- [ ] **2.2.1** เปลี่ยน `handleSave()` จาก fetch → ใช้ `<form method="POST">`
- [ ] **2.2.2** เพิ่ม `enhance` จาก `$app/forms` สำหรับ progressive enhancement
- [ ] **2.2.3** เปลี่ยน `handleDelete()` จาก fetch → ใช้ form action
- [ ] **2.2.4** ลบ `invalidateAll()` - SvelteKit จัดการให้อัตโนมัติ
- [ ] **2.2.5** ปรับ error handling ให้ใช้ `form?.error` จาก action result
- [ ] **2.2.6** ทดสอบ create/update/delete ว่าทำงานได้

#### 2.3 Cleanup
- [ ] **2.3.1** ลบไฟล์ `src/routes/api/admin/departments/+server.ts`
- [ ] **2.3.2** ทดสอบหน้า departments อีกครั้งว่าทำงานปกติ

---

### 📝 Phase 3: Refactor Form Templates

**ไฟล์ที่เกี่ยวข้อง**:
- `src/routes/admin/form-templates/+page.server.ts`
- `src/routes/admin/form-templates/+page.svelte`
- `src/routes/api/admin/form-templates/+server.ts` (จะลบ)

#### 3.1 Refactor +page.server.ts
- [ ] **3.1.1** เพิ่ม Form Actions: `create`, `update`, `delete`
- [ ] **3.1.2** ย้าย logic จาก API → actions (รวมถึงการตรวจสอบ FK)
- [ ] **3.1.3** ปรับ load function รองรับ pagination + search

#### 3.2 Refactor +page.svelte
- [ ] **3.2.1** เปลี่ยน modal form จาก fetch → form actions
- [ ] **3.2.2** ใช้ `enhance` สำหรับ progressive enhancement
- [ ] **3.2.3** ปรับ pagination ให้ใช้ URL query params
- [ ] **3.2.4** ทดสอบ CRUD operations

#### 3.3 Cleanup
- [ ] **3.3.1** ลบ API route
- [ ] **3.3.2** ทดสอบหน้า form-templates

---

### 📄 Phase 4: Refactor Form Templates Edit ([id]/edit)

**ไฟล์ที่เกี่ยวข้อง**:
- `src/routes/admin/form-templates/[id]/edit/+page.server.ts`
- `src/routes/admin/form-templates/[id]/edit/+page.svelte`
- `src/routes/api/admin/form-templates/items/+server.ts` (จะลบ)

#### 4.1 Refactor +page.server.ts
- [ ] **4.1.1** เพิ่ม actions สำหรับ update items (bulk reorder)
- [ ] **4.1.2** ย้าย logic จาก `/api/admin/form-templates/items` → actions
- [ ] **4.1.3** รองรับ optimistic UI updates

#### 4.2 Refactor +page.svelte
- [ ] **4.2.1** เปลี่ยน drag-and-drop reorder จาก fetch → form action
- [ ] **4.2.2** เพิ่ม action สำหรับ add/delete items
- [ ] **4.2.3** ทดสอบ reordering และ item management

#### 4.3 Cleanup
- [ ] **4.3.1** ลบ API route `/api/admin/form-templates/items`
- [ ] **4.3.2** ทดสอบหน้า edit

---

### ⚙️ Phase 5: Refactor Generators (มี Pagination)

**ไฟล์ที่เกี่ยวข้อง**:
- `src/routes/admin/generators/+page.server.ts`
- `src/routes/admin/generators/+page.svelte`
- `src/routes/api/admin/generators/+server.ts` (จะลบ)

#### 5.1 Refactor +page.server.ts
- [ ] **5.1.1** เพิ่ม Form Actions: `create`, `update`, `delete` (soft delete)
- [ ] **5.1.2** ย้าย logic จาก API → actions
- [ ] **5.1.3** ปรับ load function รองรับ pagination + filters (search, departmentId)
- [ ] **5.1.4** ใช้ URL searchParams สำหรับ pagination และ filters

#### 5.2 Refactor +page.svelte
- [ ] **5.2.1** เปลี่ยนจาก fetch → form actions
- [ ] **5.2.2** ใช้ `goto()` สำหรับ pagination links แทน direct fetch
- [ ] **5.2.3** ทดสอบ pagination + filtering

#### 5.3 Cleanup
- [ ] **5.3.1** ลบ API route
- [ ] **5.3.2** ทดสอบหน้า generators

---

### 🔍 Phase 6: Refactor Inspections (Read-only)

**ไฟล์ที่เกี่ยวข้อง**:
- `src/routes/admin/inspections/+page.server.ts`
- `src/routes/admin/inspections/+page.svelte`
- `src/routes/api/admin/inspections/+server.ts` (จะลบ)

#### 6.1 Refactor +page.server.ts
- [ ] **6.1.1** ย้าย GET logic จาก API → load function
- [ ] **6.1.2** รองรับ filters (search, month, year, status, departmentId)
- [ ] **6.1.3** ใช้ URL searchParams

#### 6.2 Refactor +page.svelte
- [ ] **6.2.1** ลบ `loadInspections()` ออก - ใช้ data จาก load function
- [ ] **6.2.2** ใช้ `goto()` สำหรับ filter changes
- [ ] **6.2.3** ทดสอบ filtering

#### 6.3 Cleanup
- [ ] **6.3.1** ลบ API route
- [ ] **6.3.2** ทดสอบหน้า inspections

---

### 👥 Phase 7: Refactor Users (มี Password Hashing)

**ไฟล์ที่เกี่ยวข้อง**:
- `src/routes/admin/users/+page.server.ts`
- `src/routes/admin/users/+page.svelte`
- `src/routes/api/admin/users/+server.ts` (จะลบ)

#### 7.1 Refactor +page.server.ts
- [ ] **7.1.1** เพิ่ม Form Actions: `create`, `update`, `delete` (soft delete)
- [ ] **7.1.2** ย้าย password hashing logic จาก API → action
- [ ] **7.1.3** ใช้ `bcrypt` ใน server-only context
- [ ] **7.1.4** รองรับ search + filters

#### 7.2 Refactor +page.svelte
- [ ] **7.2.1** เปลี่ยนจาก fetch → form actions
- [ ] **7.2.2** ทดสอบ user creation + password
- [ ] **7.2.3** ทดสอบ update (ไม่ต้อง hash ถ้าไม่เปลี่ยน password)

#### 7.3 Cleanup
- [ ] **7.3.1** ลบ API route
- [ ] **7.3.2** ทดสอบหน้า users

---

### 🧪 Phase 8: Testing & Cleanup

- [ ] **8.1** ทดสอบทุกหน้าอีกครั้งทั้งหมด (E2E manual testing)
- [ ] **8.2** ทดสอบว่าทำงานได้โดยไม่เปิด JavaScript (Progressive Enhancement)
- [ ] **8.3** ตรวจสอบว่าไม่มี API routes เหลืออยู่ใน `/api/admin/`
- [ ] **8.4** ลบโฟลเดอร์ `/src/routes/api/admin/` ทั้งหมด
- [ ] **8.5** ตรวจสอบว่าไม่มี import ที่อ้างถึง API routes เหลืออยู่
- [ ] **8.6** ตรวจสอบ error handling ว่าทำงานถูกต้อง
- [ ] **8.7** Commit changes

---

### 🎨 Phase 9: Code Quality Improvements (Optional)

- [ ] **9.1** สร้าง reusable Modal component เพื่อลด duplication
- [ ] **9.2** สร้าง shared validation utilities
- [ ] **9.3** สร้าง common error handling utilities
- [ ] **9.4** ปรับปรุง type safety สำหรับ form data
- [ ] **9.5** เพิ่ม loading states และ optimistic UI

---

## Critical Files to Modify

### Pages (Frontend)
```
src/routes/admin/departments/+page.svelte
src/routes/admin/form-templates/+page.svelte
src/routes/admin/form-templates/[id]/edit/+page.svelte
src/routes/admin/generators/+page.svelte
src/routes/admin/inspections/+page.svelte
src/routes/admin/users/+page.svelte
```

### Server Load + Actions (Backend)
```
src/routes/admin/departments/+page.server.ts
src/routes/admin/form-templates/+page.server.ts
src/routes/admin/form-templates/[id]/edit/+page.server.ts
src/routes/admin/generators/+page.server.ts
src/routes/admin/inspections/+page.server.ts
src/routes/admin/users/+page.server.ts
```

### API Routes (ลบทั้งหมด)
```
src/routes/api/admin/departments/+server.ts (DELETE)
src/routes/api/admin/form-templates/+server.ts (DELETE)
src/routes/api/admin/form-templates/items/+server.ts (DELETE)
src/routes/api/admin/generators/+server.ts (DELETE)
src/routes/api/admin/inspections/+server.ts (DELETE)
src/routes/api/admin/users/+server.ts (DELETE)
```

**รวมทั้งหมด**: 18 ไฟล์

---

## Key Implementation Notes

### Form Actions Pattern
```typescript
// +page.server.ts
export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');

    try {
      await db.insert(table).values({ name });
      return { success: true };
    } catch (error) {
      return fail(400, { error: 'เกิดข้อผิดพลาด' });
    }
  },

  update: async ({ request }) => {
    const data = await request.formData();
    // ... similar pattern
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    // ... similar pattern
  }
};
```

### Progressive Enhancement Pattern
```svelte
<script>
  import { enhance } from '$app/forms';
  export let form; // ได้จาก action result
</script>

<form method="POST" action="?/create" use:enhance>
  <input name="name" />
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <button type="submit">Save</button>
</form>
```

### URL-based Filtering Pattern
```typescript
// +page.server.ts
export const load = async ({ url }) => {
  const search = url.searchParams.get('search') || '';
  const page = Number(url.searchParams.get('page')) || 1;

  const results = await db.select(...)
    .where(search ? ilike(table.name, `%${search}%`) : undefined)
    .limit(25)
    .offset((page - 1) * 25);

  return { results, page, search };
};
```

---

## Verification Steps

1. **Test CRUD Operations** - สร้าง/แก้ไข/ลบข้อมูลในแต่ละหน้า
2. **Test Progressive Enhancement** - ปิด JavaScript แล้วทดสอบว่าฟอร์มยังทำงานได้
3. **Test Filtering & Pagination** - ทดสอบ search, filters, และ pagination
4. **Test Error Handling** - ทดสอบกรณี validation error และ server error
5. **Check Network Tab** - ตรวจสอบว่าไม่มี fetch ไปที่ `/api/admin/*` แล้ว
6. **Performance Check** - หน้าควรโหลดเร็วขึ้นเพราะไม่ต้อง client-side fetch

---

## Expected Benefits

✅ **ไม่มี Code Duplication** - GET logic อยู่ใน load function ที่เดียว
✅ **Progressive Enhancement** - ทำงานได้โดยไม่ใช้ JavaScript
✅ **น้อย API Endpoints** - ลบ 6 API routes ออก
✅ **Type-Safe** - ใช้ SvelteKit's built-in type safety
✅ **Simpler State Management** - SvelteKit จัดการ revalidation ให้
✅ **Better UX** - Fast server-side rendering
✅ **Easier Maintenance** - เหลือแค่ 12 ไฟล์แทน 18 ไฟล์

---

## Timeline Estimate

- Phase 1: 15 นาที
- Phase 2-7 (6 หน้า): 2-3 ชั่วโมงต่อหน้า = **12-18 ชั่วโมง**
- Phase 8: 1 ชั่วโมง
- Phase 9 (Optional): 2-4 ชั่วโมง

**รวมทั้งหมด**: 13-23 ชั่วโมง

---

## Notes

- ทำทีละหน้า เพื่อให้ test ได้ง่าย
- Commit หลังจากแต่ละหน้าเสร็จ
- ถ้าเจอปัญหาในหน้าใดหน้าหนึ่ง สามารถ rollback ได้ง่าย
- เริ่มจากหน้าง่ายที่สุด (Departments) เพื่อทดสอบ pattern ก่อน
