import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
	departments,
	formTemplates,
	formTemplateItems,
	generators,
	users
} from '$lib/db/schema';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create database connection for seed
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

// Seed Data

// 35 Departments
const departmentsData = [
	'กฟจ.ยะลา',
	'กฟส.บันนังสตา',
	'กฟส.รามัน',
	'กฟส.ระแงะ',
	'กฟจ.นราธิวาส',
	'กฟจ.ปัตตานี',
	'กฟส.รือเสาะ',
	'กฟส.โคกโพธิ์',
	'กฟส.ตากใบ',
	'กฟส.หนองจิก',
	'กฟส.จะนะ',
	'กฟส.นาทวี',
	'กฟส.เทพา',
	'กฟส.สะบ้าย้อย',
	'กฟส.สิงหนคร',
	'กฟส.ละงู',
	'กฟส.ตะโหมด',
	'กฟส.หาดใหญ่',
	'กฟส.ปากพะยูน',
	'กฟส.ควนขนุน',
	'กฟส.รัตภูมิ',
	'กฟส.นาหม่อม',
	'กฟส.สทิงพระ',
	'กฟส.พังลา',
	'กฟส.สะเดา',
	'กฟส.ระโนด',
	'กฟส.มายอ',
	'กฟส.สุไหงโก-ลก',
	'กฟส.เบตง',
	'กฟส.สายบุรี',
	'กฟจ.สงขลา',
	'กฟจ.สตูล',
	'กฟจ.พัทลุง',
	'กสฟ.(ต3)'
];

// Form Templates
const formTemplatesData = [
	{
		name: 'แบบฟอร์ม 1',
		description: 'แบบฟอร์มสำหรับเครื่องกำเนิดไฟฟ้าขนาดเล็ก (≤10 kW)'
	},
	{
		name: 'แบบฟอร์ม 2',
		description: 'แบบฟอร์มสำหรับเครื่องกำเนิดไฟฟ้าขนาดใหญ่ (>10 kW)'
	}
];

// Form Template Items - Form 1
const formTemplateItems1 = [
	// หมวด 1: ตรวจสอบก่อนใช้งาน (Visual Inspection)
	{ code: '1.1', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ความสะอาด: ไส้กรองอากาศ, เครื่องยนต์, ห้องเครื่อง', disposal: false },
	{ code: '1.2', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'การรั่วซึม: น้ำมันเครื่อง, น้ำมันเชื้อเพลิง, น้ำหล่อเย็น และท่อยาง', disposal: false },
	{ code: '1.3', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ระดับของเหลว: น้ำมันเครื่อง, น้ำกลั่นแบตเตอรี่ และน้ำหม้อน้ำ ไม่ให้ต่ำกว่าเกณฑ์', disposal: false },
	{ code: '1.4', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'สายพานและข้อต่อ: ตรวจสอบความตึงสายพาน, รอยแตก และข้อต่อต่างๆ', disposal: false },
	{ code: '1.5', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'จุดเชื่อมต่อสายไฟ: ตรวจเช็คสายไฟที่เชื่อมต่อกับมอเตอร์สตาร์ทและแผงควบคุม', disposal: false },
	{ code: '1.6', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'แบตเตอรี่: การเชื่อมต่อแน่นหนา ไม่มีคราบเกลือ และระดับแรงดันไฟฟ้าอยู่ในระดับที่เหมาะสม', disposal: false },
	// หมวด 2: การทดสอบขณะทำงาน (Operational Test)
	{ code: '2.1', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การสตาร์ท: เครื่องยนต์ควรติดภายใน 10-15 วินาที', disposal: true },
	{ code: '2.2', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การฟังเสียง และแรงสั่น: เสียงที่ผิดปกติ เช่น เสียงเคาะหรือการสั่นที่รุนแรงเกินไป', disposal: true },
	{ code: '2.3', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การตรวจสอบแรงดันไฟฟ้า: แรงดันเหมาะสมอยู่ที่ 220-230 โวลต์', disposal: true },
	{ code: '2.4', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การตรวจสอบความถี่: ความถี่ 50 เฮิรตซ์ (1500 rpm)', disposal: true },
	{ code: '2.5', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'ตรวจสอบการรั่วซึม: น้ำมันเครื่อง, น้ำมันเชื้อเพลิง, น้ำหล่อเย็น และท่อยาง', disposal: false },
	{ code: '2.6', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การทดสอบเดือนละ 2 ครั้ง: เดินเครื่องเปล่า (ไม่มีโหลด) 10-30 นาที เพื่อกระตุ้นระบบ', disposal: false },
	// หมวด 3: การทดสอบโหลด (Load Test)
	{ code: '3.1', category: '3. การทดสอบโหลด (Load Test)', description: 'การจ่ายโหลด: ทดสอบการทำงานพร้อมจ่ายโหลด 30-50% ของพิกัด เป็นเวลา 30-60 นาที', disposal: false },
	{ code: '3.2', category: '3. การทดสอบโหลด (Load Test)', description: 'การตรวจสอบแรงดันไฟฟ้า: แรงดันเหมาะสมอยู่ที่ 220-230 โวลต์', disposal: false },
	{ code: '3.3', category: '3. การทดสอบโหลด (Load Test)', description: 'การตรวจสอบความถี่: ความถี่ 50 เฮิรตซ์', disposal: false },
	// หมวด 4: การบำรุงรักษาหลังใช้งาน
	{ code: '4.1', category: '4. การบำรุงรักษาหลังใช้งาน', description: 'ถ่ายน้ำทิ้ง: ไล่ความชื้นที่กรองน้ำมันเชื้อเพลิง', disposal: false },
	{ code: '4.2', category: '4. การบำรุงรักษาหลังใช้งาน', description: 'ทำความสะอาด: ทำความสะอาดบริเวณโดยรอบเครื่องและตู้ควบคุม', disposal: false }
];

// Form Template Items - Form 2
const formTemplateItems2 = [
	// หมวด 1: ตรวจสอบก่อนใช้งาน (Visual Inspection)
	{ code: '1.1', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คระดับน้ำหล่อเย็นและรอยรั่ว', disposal: false },
	{ code: '1.2', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คระดับน้ำมันหล่อลื่นและรอยรั่ว', disposal: false },
	{ code: '1.3', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คระดับน้ำกลั่นแบตเตอรี่', disposal: false },
	{ code: '1.4', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คกรองดักน้ำ', disposal: false },
	{ code: '1.5', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คสภาพสายพานพัดลม', disposal: false },
	{ code: '1.6', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คสภาพกรองอากาศ', disposal: false },
	{ code: '1.7', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็ค Mains Breaker', disposal: false },
	{ code: '1.8', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คสภาพอุปกรณ์ประจำแผงสวิตช์', disposal: false },
	{ code: '1.9', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คสภาพสายไฟเครื่องกำเนิดไฟฟ้า', disposal: false },
	{ code: '1.10', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็ค Battery Charger (12V=13-16V, 24V=25-28V)', disposal: false },
	{ code: '1.11', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็ค Busbar', disposal: false },
	{ code: '1.12', category: '1. ตรวจสอบก่อนใช้งาน (Visual Inspection)', description: 'ตรวจเช็คสภาพทั่วไป', disposal: false },
	// หมวด 2: การทดสอบขณะทำงาน (Operational Test)
	{ code: '2.1', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การสตาร์ท: เครื่องยนต์ควรติดภายใน 10-15 วินาที', disposal: true },
	{ code: '2.2', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การฟังเสียง และแรงสั่นสะเทือน: เสียงที่ผิดปกติ เช่น เสียงเคาะหรือการสั่นที่รุนแรงเกินไป', disposal: true },
	{ code: '2.3', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การตรวจสอบแรงดันไฟฟ้า: แรงดันเหมาะสมอยู่ที่ 220-230 โวลต์', disposal: true },
	{ code: '2.4', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การตรวจสอบความถี่: ความถี่ 50 เฮิรตซ์', disposal: true },
	{ code: '2.5', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'ตรวจเช็คแรงดันน้ำมันหล่อลื่น (30-70 psi, 207-483 kPa, 1.18-4.83 bar)', disposal: false },
	{ code: '2.6', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'ตรวจเช็คอุณหภูมิน้ำมันหล่อลื่น (≤121ºC, ≤250ºF)', disposal: false },
	{ code: '2.7', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'ตรวจเช็คอุณหภูมิน้ำหล่อเย็น (≤100ºC, ≤212ºF)', disposal: false },
	{ code: '2.8', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'ตรวจเช็ค Speed (1500 rpm)', disposal: true },
	{ code: '2.9', category: '2. การทดสอบขณะทำงาน (Operational Test)', description: 'การทดสอบเดือนละ 2 ครั้ง: เดินเครื่องเปล่า (ไม่มีโหลด) 10-30 นาที เพื่อกระตุ้นระบบ', disposal: false },
	// หมวด 3: การทดสอบโหลด (Load Test)
	{ code: '3.1', category: '3. การทดสอบโหลด (Load Test)', description: 'การจ่ายโหลด: ทดสอบการทำงานพร้อมจ่ายโหลด 30-50% ของพิกัด เป็นเวลา 30-60 นาที', disposal: false },
	{ code: '3.2', category: '3. การทดสอบโหลด (Load Test)', description: 'การจ่ายโหลด: ตรวจสอบความร้อน, ฟังเสียงผิดปกติ, การสั่น, การรั่วซึม', disposal: false },
	// หมวด 4: การบำรุงรักษาหลังใช้งาน
	{ code: '4.1', category: '4. การบำรุงรักษาหลังใช้งาน', description: 'ถ่ายน้ำทิ้ง: ไล่ความชื้นที่กรองน้ำมันเชื้อเพลิง', disposal: false },
	{ code: '4.2', category: '4. การบำรุงรักษาหลังใช้งาน', description: 'ทำความสะอาด: ทำความสะอาดบริเวณโดยรอบเครื่องและตู้ควบคุม', disposal: false }
];

// Generators Data (200+ items)
const generatorsData = [
	// กฟจ.ยะลา
	{ assetId: '311000772', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311000952', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.กรงปินัง', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311000954', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '160', product: 'JOHN DEERE', location: 'สนง.ยะลา', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311001843', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟจ.ยล.', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002001', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ยะลา', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002002', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002003', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.กรงปินัง', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002004', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002005', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002006', type: 'รถโมบายล์', sizeKw: '160', product: 'JOHN DEERE', location: 'ผปบ.กฟจ.ยล.', dept: 'กฟจ.ยะลา', form: 'แบบฟอร์ม 2' },
	// กฟส.บันนังสตา
	{ assetId: '311002101', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.บันนังสตา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002102', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.บันนังสตา', dept: 'กฟส.บันนังสตา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002103', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.บันนังสตา', dept: 'กฟส.บันนังสตา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002104', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.บันนังสตา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002105', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.บันนังสตา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002106', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.บันนังสตา', dept: 'กฟส.บันนังสตา', form: 'แบบฟอร์ม 2' },
	// กฟส.รามัน
	{ assetId: '311002201', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.รามัน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002202', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.รามัน', dept: 'กฟส.รามัน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002203', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.รามัน', dept: 'กฟส.รามัน', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002204', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.รามัน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002205', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.รามัน', dept: 'กฟส.รามัน', form: 'แบบฟอร์ม 2' },
	// กฟส.ระแงะ
	{ assetId: '311002301', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ระแงะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002302', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ระแงะ', dept: 'กฟส.ระแงะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002303', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ระแงะ', dept: 'กฟส.ระแงะ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002304', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ระแงะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002305', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ระแงะ', dept: 'กฟส.ระแงะ', form: 'แบบฟอร์ม 2' },
	// กฟจ.นราธิวาส
	{ assetId: '311000225', type: 'พระตำหนักฯ', sizeKw: '820', product: 'CUMMINS', location: 'ทักษิณราชนิเวศน์', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002401', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002402', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.นราธิวาส', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002403', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.นราธิวาส', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002404', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟจ.นธ.', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002405', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002406', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.นราธิวาส', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002407', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟจ.นราธิวาส', form: 'แบบฟอร์ม 2' },
	// กฟจ.ปัตตานี
	{ assetId: '311002501', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002502', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ปัตตานี', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002503', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ปัตตานี', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002504', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟจ.ปต.', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002505', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002506', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ปัตตานี', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002507', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟจ.ปัตตานี', form: 'แบบฟอร์ม 2' },
	// กฟส.รือเสาะ
	{ assetId: '311002601', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.รือเสาะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002602', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.รือเสาะ', dept: 'กฟส.รือเสาะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002603', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.รือเสาะ', dept: 'กฟส.รือเสาะ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002604', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.รือเสาะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002605', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.รือเสาะ', dept: 'กฟส.รือเสาะ', form: 'แบบฟอร์ม 2' },
	// กฟส.โคกโพธิ์
	{ assetId: '311002701', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.โคกโพธิ์', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002702', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.โคกโพธิ์', dept: 'กฟส.โคกโพธิ์', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002703', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.โคกโพธิ์', dept: 'กฟส.โคกโพธิ์', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002704', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.โคกโพธิ์', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002705', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.โคกโพธิ์', dept: 'กฟส.โคกโพธิ์', form: 'แบบฟอร์ม 2' },
	// กฟส.ตากใบ
	{ assetId: '311002801', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ตากใบ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002802', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ตากใบ', dept: 'กฟส.ตากใบ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002803', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ตากใบ', dept: 'กฟส.ตากใบ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002804', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ตากใบ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002805', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ตากใบ', dept: 'กฟส.ตากใบ', form: 'แบบฟอร์ม 2' },
	// กฟส.หนองจิก
	{ assetId: '311002901', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.หนองจิก', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002902', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.หนองจิก', dept: 'กฟส.หนองจิก', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002903', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.หนองจิก', dept: 'กฟส.หนองจิก', form: 'แบบฟอร์ม 2' },
	{ assetId: '311002904', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.หนองจิก', form: 'แบบฟอร์ม 1' },
	{ assetId: '311002905', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.หนองจิก', dept: 'กฟส.หนองจิก', form: 'แบบฟอร์ม 2' },
	// กฟส.จะนะ
	{ assetId: '311003001', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.จะนะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003002', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.จะนะ', dept: 'กฟส.จะนะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003003', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.จะนะ', dept: 'กฟส.จะนะ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003004', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.จะนะ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003005', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.จะนะ', dept: 'กฟส.จะนะ', form: 'แบบฟอร์ม 2' },
	// กฟส.นาทวี
	{ assetId: '311003101', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.นาทวี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003102', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.นาทวี', dept: 'กฟส.นาทวี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003103', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.นาทวี', dept: 'กฟส.นาทวี', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003104', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.นาทวี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003105', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.นาทวี', dept: 'กฟส.นาทวี', form: 'แบบฟอร์ม 2' },
	// กฟส.เทพา
	{ assetId: '311003201', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.เทพา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003202', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.เทพา', dept: 'กฟส.เทพา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003203', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.เทพา', dept: 'กฟส.เทพา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003204', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.เทพา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003205', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.เทพา', dept: 'กฟส.เทพา', form: 'แบบฟอร์ม 2' },
	// กฟส.สะบ้าย้อย
	{ assetId: '311003301', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สะบ้าย้อย', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003302', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สะบ้าย้อย', dept: 'กฟส.สะบ้าย้อย', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003303', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สะบ้าย้อย', dept: 'กฟส.สะบ้าย้อย', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003304', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สะบ้าย้อย', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003305', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สะบ้าย้อย', dept: 'กฟส.สะบ้าย้อย', form: 'แบบฟอร์ม 2' },
	// กฟส.สิงหนคร
	{ assetId: '311003401', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สิงหนคร', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003402', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สิงหนคร', dept: 'กฟส.สิงหนคร', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003403', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สิงหนคร', dept: 'กฟส.สิงหนคร', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003404', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สิงหนคร', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003405', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สิงหนคร', dept: 'กฟส.สิงหนคร', form: 'แบบฟอร์ม 2' },
	// กฟส.ละงู
	{ assetId: '311003501', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ละงู', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003502', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ละงู', dept: 'กฟส.ละงู', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003503', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ละงู', dept: 'กฟส.ละงู', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003504', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ละงู', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003505', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ละงู', dept: 'กฟส.ละงู', form: 'แบบฟอร์ม 2' },
	// กฟส.ตะโหมด
	{ assetId: '311003601', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ตะโหมด', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003602', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ตะโหมด', dept: 'กฟส.ตะโหมด', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003603', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ตะโหมด', dept: 'กฟส.ตะโหมด', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003604', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ตะโหมด', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003605', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ตะโหมด', dept: 'กฟส.ตะโหมด', form: 'แบบฟอร์ม 2' },
	// กฟส.หาดใหญ่
	{ assetId: '311003701', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.หาดใหญ่', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003702', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.หาดใหญ่', dept: 'กฟส.หาดใหญ่', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003703', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.หาดใหญ่', dept: 'กฟส.หาดใหญ่', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003704', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.หาดใหญ่', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003705', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.หาดใหญ่', dept: 'กฟส.หาดใหญ่', form: 'แบบฟอร์ม 2' },
	// กฟส.ปากพะยูน
	{ assetId: '311003801', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ปากพะยูน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003802', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ปากพะยูน', dept: 'กฟส.ปากพะยูน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003803', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ปากพะยูน', dept: 'กฟส.ปากพะยูน', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003804', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ปากพะยูน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003805', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ปากพะยูน', dept: 'กฟส.ปากพะยูน', form: 'แบบฟอร์ม 2' },
	// กฟส.ควนขนุน
	{ assetId: '311003901', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ควนขนุน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003902', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ควนขนุน', dept: 'กฟส.ควนขนุน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003903', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ควนขนุน', dept: 'กฟส.ควนขนุน', form: 'แบบฟอร์ม 2' },
	{ assetId: '311003904', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ควนขนุน', form: 'แบบฟอร์ม 1' },
	{ assetId: '311003905', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ควนขนุน', dept: 'กฟส.ควนขนุน', form: 'แบบฟอร์ม 2' },
	// กฟส.รัตภูมิ
	{ assetId: '311004001', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.รัตภูมิ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004002', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.รัตภูมิ', dept: 'กฟส.รัตภูมิ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004003', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.รัตภูมิ', dept: 'กฟส.รัตภูมิ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004004', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.รัตภูมิ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004005', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.รัตภูมิ', dept: 'กฟส.รัตภูมิ', form: 'แบบฟอร์ม 2' },
	// กฟส.นาหม่อม
	{ assetId: '311004101', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.นาหม่อม', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004102', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.นาหม่อม', dept: 'กฟส.นาหม่อม', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004103', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.นาหม่อม', dept: 'กฟส.นาหม่อม', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004104', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.นาหม่อม', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004105', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.นาหม่อม', dept: 'กฟส.นาหม่อม', form: 'แบบฟอร์ม 2' },
	// กฟส.สทิงพระ
	{ assetId: '311004201', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สทิงพระ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004202', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สทิงพระ', dept: 'กฟส.สทิงพระ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004203', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สทิงพระ', dept: 'กฟส.สทิงพระ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004204', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สทิงพระ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004205', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สทิงพระ', dept: 'กฟส.สทิงพระ', form: 'แบบฟอร์ม 2' },
	// กฟส.พังลา
	{ assetId: '311004301', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.พังลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004302', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.พังลา', dept: 'กฟส.พังลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004303', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.พังลา', dept: 'กฟส.พังลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004304', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.พังลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004305', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.พังลา', dept: 'กฟส.พังลา', form: 'แบบฟอร์ม 2' },
	// กฟส.สะเดา
	{ assetId: '311004401', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สะเดา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004402', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สะเดา', dept: 'กฟส.สะเดา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004403', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สะเดา', dept: 'กฟส.สะเดา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004404', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สะเดา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004405', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สะเดา', dept: 'กฟส.สะเดา', form: 'แบบฟอร์ม 2' },
	// กฟส.ระโนด
	{ assetId: '311004501', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ระโนด', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004502', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.ระโนด', dept: 'กฟส.ระโนด', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004503', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.ระโนด', dept: 'กฟส.ระโนด', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004504', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.ระโนด', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004505', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.ระโนด', dept: 'กฟส.ระโนด', form: 'แบบฟอร์ม 2' },
	// กฟส.มายอ
	{ assetId: '311004601', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.มายอ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004602', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.มายอ', dept: 'กฟส.มายอ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004603', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.มายอ', dept: 'กฟส.มายอ', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004604', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.มายอ', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004605', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.มายอ', dept: 'กฟส.มายอ', form: 'แบบฟอร์ม 2' },
	// กฟส.สุไหงโก-ลก
	{ assetId: '311004701', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สุไหงโก-ลก', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004702', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สุไหงโก-ลก', dept: 'กฟส.สุไหงโก-ลก', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004703', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สุไหงโก-ลก', dept: 'กฟส.สุไหงโก-ลก', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004704', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สุไหงโก-ลก', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004705', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สุไหงโก-ลก', dept: 'กฟส.สุไหงโก-ลก', form: 'แบบฟอร์ม 2' },
	// กฟส.เบตง
	{ assetId: '311001413', type: 'โรงจักร', sizeKw: '1000', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004801', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004802', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.เบตง', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004803', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.เบตง', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004804', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟส.เบตง', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004805', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004806', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.เบตง', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004807', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟส.เบตง', form: 'แบบฟอร์ม 2' },
	// กฟส.สายบุรี
	{ assetId: '311004901', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สายบุรี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004902', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สายบุรี', dept: 'กฟส.สายบุรี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004903', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สายบุรี', dept: 'กฟส.สายบุรี', form: 'แบบฟอร์ม 2' },
	{ assetId: '311004904', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟส.สายบุรี', form: 'แบบฟอร์ม 1' },
	{ assetId: '311004905', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สายบุรี', dept: 'กฟส.สายบุรี', form: 'แบบฟอร์ม 2' },
	// กฟจ.สงขลา
	{ assetId: '311005001', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005002', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สงขลา', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005003', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สงขลา', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005004', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟจ.สก.', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005005', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005006', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สงขลา', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005007', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟจ.สงขลา', form: 'แบบฟอร์ม 2' },
	// กฟจ.สตูล
	{ assetId: '311005101', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005102', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.สตูล', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005103', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.สตูล', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005104', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟจ.สต.', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005105', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005106', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.สตูล', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005107', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟจ.สตูล', form: 'แบบฟอร์ม 2' },
	// กฟจ.พัทลุง
	{ assetId: '311005201', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005202', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.พัทลุง', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005203', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.พัทลุง', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005204', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กฟจ.พท.', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005205', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005206', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.พัทลุง', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005207', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กฟจ.พัทลุง', form: 'แบบฟอร์ม 2' },
	// กสฟ.(ต3)
	{ assetId: '311005301', type: 'สำนักงาน', sizeKw: '5', product: 'KIPOR', location: 'ผปบ.', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005302', type: 'สำนักงาน', sizeKw: '8', product: 'ฮอนด้า', location: 'สนง.กสฟ.(ต3)', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005303', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '100', product: 'VOLVO PENTA', location: 'สภต.กสฟ.(ต3)', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005304', type: 'รถโมบายล์', sizeKw: '500', product: 'Perkins', location: 'ผปบ.กสฟ.(ต3)', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005305', type: 'สำนักงาน', sizeKw: '10', product: 'KIPOR', location: 'ผปบ.', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 1' },
	{ assetId: '311005306', type: 'ฉุกเฉิน 3 จ. 4 อ.', sizeKw: '60', product: 'CUMMINS', location: 'สภต.กสฟ.(ต3)', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 2' },
	{ assetId: '311005307', type: 'โรงจักร', sizeKw: '300', product: 'CUMMINS', location: 'คลังพัสดุ', dept: 'กสฟ.(ต3)', form: 'แบบฟอร์ม 2' }
];

// Seed function
export async function seedDatabase() {
	console.log('🌱 Seeding database...');

	try {
		// Insert Departments
		console.log('📁 Inserting departments...');
		const insertedDepartments = await db
			.insert(departments)
			.values(departmentsData.map((name) => ({ name })))
			.returning();
		console.log(`✅ Inserted ${insertedDepartments.length} departments`);

		// Create department map for reference
		const departmentMap = new Map(
			insertedDepartments.map((dept) => [dept.name, dept.id])
		);

		// Insert Form Templates
		console.log('📋 Inserting form templates...');
		const insertedTemplates = await db.insert(formTemplates).values(formTemplatesData).returning();
		console.log(`✅ Inserted ${insertedTemplates.length} form templates`);

		// Create template map for reference
		const templateMap = new Map(
			insertedTemplates.map((tpl) => [tpl.name, tpl.id])
		);

		// Insert Form Template Items
		console.log('📝 Inserting form template items...');
		const template1Id = templateMap.get('แบบฟอร์ม 1');
		const template2Id = templateMap.get('แบบฟอร์ม 2');

		if (template1Id) {
			await db.insert(formTemplateItems).values(
				formTemplateItems1.map((item, index) => ({
					formTemplateId: template1Id,
					itemCode: item.code,
					category: item.category,
					description: item.description,
					isDisposalCriteria: item.disposal,
					sortOrder: index
				}))
			);
			console.log(`✅ Inserted ${formTemplateItems1.length} items for Form 1`);
		}

		if (template2Id) {
			await db.insert(formTemplateItems).values(
				formTemplateItems2.map((item, index) => ({
					formTemplateId: template2Id,
					itemCode: item.code,
					category: item.category,
					description: item.description,
					isDisposalCriteria: item.disposal,
					sortOrder: index
				}))
			);
			console.log(`✅ Inserted ${formTemplateItems2.length} items for Form 2`);
		}

		// Insert Generators
		console.log('⚡ Inserting generators...');
		const validGenerators = generatorsData
			.map((gen) => ({
				...gen,
				departmentId: departmentMap.get(gen.dept),
				formTemplateId: templateMap.get(gen.form)
			}))
			.filter((gen): gen is typeof gen & { departmentId: string; formTemplateId: string } =>
				!!gen.departmentId && !!gen.formTemplateId
			);

		const insertedGenerators = await db
			.insert(generators)
			.values(
				validGenerators.map((gen) => ({
					assetId: gen.assetId,
					type: gen.type,
					sizeKw: gen.sizeKw,
					product: gen.product,
					location: gen.location,
					departmentId: gen.departmentId,
					formTemplateId: gen.formTemplateId
				}))
			)
			.returning();
		console.log(`✅ Inserted ${insertedGenerators.length} generators`);

		// Insert Default Users
		console.log('👤 Inserting default users...');
		const passwordHash = await bcrypt.hash('admin123', 10);
		
		await db.insert(users).values([
			{
				username: 'admin',
				passwordHash,
				displayName: 'ผู้ดูแลระบบ',
				role: 'admin',
				isActive: true
			}
		]);
		console.log('✅ Inserted default admin user (username: admin, password: admin123)');

		console.log('🎉 Database seeded successfully!');
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	seedDatabase()
		.then(() => {
			console.log('✨ Seed completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Seed failed:', error);
			process.exit(1);
		});
}
