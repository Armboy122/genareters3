import { pgTable, text, timestamp, boolean, integer, decimal, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Departments Table
export const departments = pgTable(
	'departments',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		nameIdx: index('departments_name_idx').on(table.name)
	})
);

// Form Templates Table
export const formTemplates = pgTable(
	'form_templates',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		nameIdx: index('form_templates_name_idx').on(table.name)
	})
);

// Form Template Items Table
export const formTemplateItems = pgTable(
	'form_template_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		formTemplateId: uuid('form_template_id')
			.notNull()
			.references(() => formTemplates.id, { onDelete: 'cascade' }),
		itemCode: text('item_code').notNull(),
		category: text('category').notNull(),
		description: text('description').notNull(),
		isDisposalCriteria: boolean('is_disposal_criteria').default(false).notNull(),
		sortOrder: integer('sort_order').default(0).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		formTemplateIdx: index('form_template_items_template_idx').on(table.formTemplateId),
		itemCodeIdx: index('form_template_items_code_idx').on(table.itemCode)
	})
);

// Generators Table
export const generators = pgTable(
	'generators',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		assetId: text('asset_id').notNull().unique(),
		type: text('type').notNull(),
		sizeKw: decimal('size_kw', { precision: 10, scale: 2 }).notNull(),
		product: text('product'),
		location: text('location').notNull(),
		departmentId: uuid('department_id')
			.notNull()
			.references(() => departments.id, { onDelete: 'restrict' }),
		formTemplateId: uuid('form_template_id').references(() => formTemplates.id, {
			onDelete: 'set null'
		}),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		assetIdIdx: index('generators_asset_id_idx').on(table.assetId),
		departmentIdx: index('generators_department_idx').on(table.departmentId),
		formTemplateIdx: index('generators_form_template_idx').on(table.formTemplateId)
	})
);

// Inspections Table
export const inspections = pgTable(
	'inspections',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		inspectionCode: text('inspection_code').notNull().unique(),
		generatorId: uuid('generator_id')
			.notNull()
			.references(() => generators.id, { onDelete: 'cascade' }),
		month: integer('month').notNull(),
		year: integer('year').notNull(),
		inspectionDate: timestamp('inspection_date').notNull(),
		formTemplateId: uuid('form_template_id')
			.notNull()
			.references(() => formTemplates.id, { onDelete: 'restrict' }),
		inspectorName: text('inspector_name').notNull(),
		overallStatus: text('overall_status', { enum: ['ปกติ', 'ไม่ปกติ'] }).notNull(),
		machineStatus: text('machine_status', {
			enum: ['ใช้งานได้', 'ซ่อมแซม', 'รอจำหน่าย']
		}).notNull(),
		overallRemark: text('overall_remark'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		inspectionCodeIdx: index('inspections_code_idx').on(table.inspectionCode),
		generatorIdx: index('inspections_generator_idx').on(table.generatorId),
		generatorMonthYearIdx: index('inspections_generator_month_year_idx').on(
			table.generatorId,
			table.month,
			table.year
		)
	})
);

// Inspection Details Table
export const inspectionDetails = pgTable(
	'inspection_details',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		inspectionId: uuid('inspection_id')
			.notNull()
			.references(() => inspections.id, { onDelete: 'cascade' }),
		itemCode: text('item_code').notNull(),
		description: text('description').notNull(),
		status: text('status', { enum: ['ปกติ', 'ไม่ปกติ'] }).notNull(),
		remark: text('remark'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		inspectionIdx: index('inspection_details_inspection_idx').on(table.inspectionId),
		itemCodeIdx: index('inspection_details_item_code_idx').on(table.itemCode)
	})
);

// Users Table
export const users = pgTable(
	'users',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		username: text('username').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		displayName: text('display_name').notNull(),
		role: text('role', { enum: ['admin', 'inspector', 'viewer'] }).notNull(),
		departmentId: uuid('department_id').references(() => departments.id, {
			onDelete: 'set null'
		}),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		usernameIdx: index('users_username_idx').on(table.username),
		roleIdx: index('users_role_idx').on(table.role),
		departmentIdx: index('users_department_idx').on(table.departmentId)
	})
);

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
	generators: many(generators),
	users: many(users)
}));

export const formTemplatesRelations = relations(formTemplates, ({ many }) => ({
	items: many(formTemplateItems),
	generators: many(generators),
	inspections: many(inspections)
}));

export const formTemplateItemsRelations = relations(formTemplateItems, ({ one }) => ({
	formTemplate: one(formTemplates, {
		fields: [formTemplateItems.formTemplateId],
		references: [formTemplates.id]
	})
}));

export const generatorsRelations = relations(generators, ({ one, many }) => ({
	department: one(departments, {
		fields: [generators.departmentId],
		references: [departments.id]
	}),
	formTemplate: one(formTemplates, {
		fields: [generators.formTemplateId],
		references: [formTemplates.id]
	}),
	inspections: many(inspections)
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
	generator: one(generators, {
		fields: [inspections.generatorId],
		references: [generators.id]
	}),
	formTemplate: one(formTemplates, {
		fields: [inspections.formTemplateId],
		references: [formTemplates.id]
	}),
	details: many(inspectionDetails)
}));

export const inspectionDetailsRelations = relations(inspectionDetails, ({ one }) => ({
	inspection: one(inspections, {
		fields: [inspectionDetails.inspectionId],
		references: [inspections.id]
	})
}));

export const usersRelations = relations(users, ({ one }) => ({
	department: one(departments, {
		fields: [users.departmentId],
		references: [departments.id]
	})
}));

// Types
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type FormTemplate = typeof formTemplates.$inferSelect;
export type NewFormTemplate = typeof formTemplates.$inferInsert;

export type FormTemplateItem = typeof formTemplateItems.$inferSelect;
export type NewFormTemplateItem = typeof formTemplateItems.$inferInsert;

export type Generator = typeof generators.$inferSelect;
export type NewGenerator = typeof generators.$inferInsert;

export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;

export type InspectionDetail = typeof inspectionDetails.$inferSelect;
export type NewInspectionDetail = typeof inspectionDetails.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserRole = User['role'];
export type MachineStatus = Inspection['machineStatus'];
export type OverallStatus = Inspection['overallStatus'];
