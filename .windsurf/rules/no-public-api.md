---
description: Rule for handling data mutations — use SvelteKit form actions, not public API routes
---

# No Public API Routes for Data Mutations

## Rule

**ห้ามใช้ API routes (`/api/*`) สำหรับ data mutations (create/update/delete) ที่ไม่ต้องการเปิดเป็น public**

ใช้ SvelteKit form actions (`+page.server.ts` with `export const actions`) แทน เพื่อให้ endpoint ถูก protect โดย route middleware ใน `hooks.server.ts` โดยอัตโนมัติ

## Pattern ที่ถูกต้อง

```typescript
// +page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'กรุณาเข้าสู่ระบบ' });
    // ... business logic
    return { success: true };
  },
  update: async ({ request, locals }) => {
    // ...
  }
};
```

```svelte
<!-- +page.svelte — call action via fetch -->
const response = await fetch(`?/${actionName}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
const result = await response.json();
if (result.type === 'success') { /* redirect */ }
else if (result.type === 'failure') { /* show result.data.error */ }
```

## เมื่อไหร่ที่ใช้ API routes ได้

- `/api/auth/*` — Login/logout (ต้องเป็น public endpoint)
- API ที่ต้องการเปิดให้ external service เรียกจริงๆ

## เหตุผล

- Form actions ถูก protect โดย `hooks.server.ts` middleware อัตโนมัติ (ตาม route path)
- API routes (`/api/*`) เป็น public endpoint ที่ใครก็เรียกได้จากภายนอก
- ทำให้ consistent กับ pattern ที่ใช้ทั้ง project (เช่น admin routes ทั้งหมดใช้ form actions)

## Auth Rules

- **เฉพาะ `/admin/*` เท่านั้นที่ต้อง login** (role === 'admin')
- Route อื่นๆ ทั้งหมด (`/dashboard`, `/department`, `/inspection`) เป็น public — ไม่ต้อง login
- **ห้ามเพิ่ม auth check ใน form actions ของ route ที่ไม่ใช่ admin** — ใครก็สามารถกรอกข้อมูลการตรวจได้โดยไม่ต้อง login
