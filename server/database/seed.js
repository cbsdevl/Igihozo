const bcrypt = require('bcrypt');
const { getDB } = require('../config/db');
const { generateId } = require('../utils/helpers');

async function seed() {
  console.log('🌱 Seeding database...');
  const db = getDB();

  // --- Roles ---
  db.prepare(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (?,?,?)`).run(1, 'admin', 'Full system access');
  db.prepare(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (?,?,?)`).run(2, 'worker', 'Limited access - sales and inventory');
  console.log('✅ Roles seeded');

  // --- Admin User ---
  const adminExists = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get();
  if (!adminExists) {
    const hash = await bcrypt.hash('Admin@123', 12);
    db.prepare(`
      INSERT INTO users (id, role_id, username, full_name, email, phone, password_hash)
      VALUES (?, 1, 'admin', 'System Administrator', 'admin@gihozo.rw', '+250788000001', ?)
    `).run(generateId(), hash);
    console.log('✅ Admin user created (username: admin, password: Admin@123)');
  }

  // --- Worker User ---
  const workerExists = db.prepare(`SELECT id FROM users WHERE username = 'worker1'`).get();
  if (!workerExists) {
    const hash = await bcrypt.hash('Worker@123', 12);
    db.prepare(`
      INSERT INTO users (id, role_id, username, full_name, email, phone, password_hash)
      VALUES (?, 2, 'worker1', 'Jean Pierre Habimana', 'jean@gihozo.rw', '+250788000002', ?)
    `).run(generateId(), hash);
    console.log('✅ Worker user created (username: worker1, password: Worker@123)');
  }

  // --- Categories ---
  const categories = [
    { name: 'Antibiotics', description: 'Medicines that fight bacterial infections' },
    { name: 'Analgesics', description: 'Pain relievers and fever reducers' },
    { name: 'Antifungals', description: 'Medicines for fungal infections' },
    { name: 'Antivirals', description: 'Medicines for viral infections' },
    { name: 'Vitamins & Supplements', description: 'Vitamins, minerals and health supplements' },
    { name: 'Antihypertensives', description: 'Blood pressure medications' },
    { name: 'Antidiabetics', description: 'Diabetes management medicines' },
    { name: 'Antiparasitics', description: 'Medicines against parasites' },
    { name: 'Gastrointestinal', description: 'Digestive system medicines' },
    { name: 'Dermatological', description: 'Skin care medicines' },
    { name: 'Respiratory', description: 'Breathing and lung medicines' },
    { name: 'Surgical Supplies', description: 'Bandages, gloves, syringes etc.' },
  ];

  const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, description) VALUES (?,?)`);
  const insertManyCats = db.transaction(() => {
    categories.forEach(c => insertCat.run(c.name, c.description));
  });
  insertManyCats();
  console.log('✅ Categories seeded');

  // --- Suppliers ---
  const suppliers = [
    { id: generateId(), name: 'Rwanda Medical Supplies Ltd', contact_person: 'Alice Mutoni', phone: '+250788111001', email: 'info@rms.rw', address: 'KG 15 Ave, Kigali', city: 'Kigali' },
    { id: generateId(), name: 'PharmAfrique Distribution', contact_person: 'Bob Nkurunziza', phone: '+250788111002', email: 'sales@pharmafrique.rw', address: 'KN 3 Rd, Kigali', city: 'Kigali' },
    { id: generateId(), name: 'East Africa Health Products', contact_person: 'Carol Uwimana', phone: '+250788111003', email: 'eahp@health.rw', address: 'KK 27 St, Kigali', city: 'Kigali' },
  ];

  const insertSupplier = db.prepare(`
    INSERT OR IGNORE INTO suppliers (id, name, contact_person, phone, email, address, city)
    VALUES (@id, @name, @contact_person, @phone, @email, @address, @city)
  `);
  const insertManySuppliers = db.transaction(() => {
    suppliers.forEach(s => insertSupplier.run(s));
  });
  insertManySuppliers();
  console.log('✅ Suppliers seeded');

  // Reload supplier IDs
  const sup = db.prepare(`SELECT id FROM suppliers LIMIT 1`).get();
  const cat = db.prepare(`SELECT id FROM categories WHERE name='Antibiotics'`).get();
  const cat2 = db.prepare(`SELECT id FROM categories WHERE name='Analgesics'`).get();
  const cat3 = db.prepare(`SELECT id FROM categories WHERE name='Vitamins & Supplements'`).get();
  const cat4 = db.prepare(`SELECT id FROM categories WHERE name='Antihypertensives'`).get();

  // --- Medicines ---
  const medicines = [
    { id: generateId(), name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', brand: 'Amoxil', category_id: cat?.id, supplier_id: sup?.id, purchase_price: 800, selling_price: 1200, quantity: 250, min_stock: 30, batch_number: 'AMX-2024-001', manufacturing_date: '2023-06-01', expiry_date: '2026-06-01', prescription_required: 1, barcode: '1000000001' },
    { id: generateId(), name: 'Paracetamol 500mg', generic_name: 'Paracetamol', brand: 'Panadol', category_id: cat2?.id, supplier_id: sup?.id, purchase_price: 200, selling_price: 400, quantity: 500, min_stock: 50, batch_number: 'PAR-2024-001', manufacturing_date: '2023-08-01', expiry_date: '2026-08-01', prescription_required: 0, barcode: '1000000002' },
    { id: generateId(), name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', brand: 'Brufen', category_id: cat2?.id, supplier_id: sup?.id, purchase_price: 300, selling_price: 600, quantity: 320, min_stock: 40, batch_number: 'IBU-2024-001', manufacturing_date: '2023-07-01', expiry_date: '2026-07-01', prescription_required: 0, barcode: '1000000003' },
    { id: generateId(), name: 'Vitamin C 1000mg', generic_name: 'Ascorbic Acid', brand: 'Redoxon', category_id: cat3?.id, supplier_id: sup?.id, purchase_price: 500, selling_price: 900, quantity: 180, min_stock: 20, batch_number: 'VTC-2024-001', manufacturing_date: '2023-09-01', expiry_date: '2025-09-01', prescription_required: 0, barcode: '1000000004' },
    { id: generateId(), name: 'Amlodipine 5mg', generic_name: 'Amlodipine', brand: 'Norvasc', category_id: cat4?.id, supplier_id: sup?.id, purchase_price: 1200, selling_price: 2000, quantity: 8, min_stock: 20, batch_number: 'AML-2024-001', manufacturing_date: '2023-05-01', expiry_date: '2026-05-01', prescription_required: 1, barcode: '1000000005' },
    { id: generateId(), name: 'Metformin 500mg', generic_name: 'Metformin', brand: 'Glucophage', category_id: null, supplier_id: sup?.id, purchase_price: 600, selling_price: 1000, quantity: 150, min_stock: 30, batch_number: 'MET-2024-001', manufacturing_date: '2023-10-01', expiry_date: '2026-10-01', prescription_required: 1, barcode: '1000000006' },
    { id: generateId(), name: 'ORS Sachet', generic_name: 'Oral Rehydration Salts', brand: 'WHO-ORS', category_id: null, supplier_id: sup?.id, purchase_price: 100, selling_price: 200, quantity: 400, min_stock: 50, batch_number: 'ORS-2024-001', manufacturing_date: '2023-11-01', expiry_date: '2026-11-01', prescription_required: 0, barcode: '1000000007' },
    { id: generateId(), name: 'Fluconazole 150mg', generic_name: 'Fluconazole', brand: 'Diflucan', category_id: null, supplier_id: sup?.id, purchase_price: 900, selling_price: 1500, quantity: 12, min_stock: 15, batch_number: 'FLU-2024-001', manufacturing_date: '2022-12-01', expiry_date: '2024-12-01', prescription_required: 1, barcode: '1000000008' },
  ];

  const adminUser = db.prepare(`SELECT id FROM users WHERE username='admin'`).get();

  const insertMed = db.prepare(`
    INSERT OR IGNORE INTO medicines
    (id, barcode, name, generic_name, brand, category_id, supplier_id, purchase_price, selling_price,
     quantity, min_stock, batch_number, manufacturing_date, expiry_date, prescription_required, created_by)
    VALUES (@id, @barcode, @name, @generic_name, @brand, @category_id, @supplier_id, @purchase_price, @selling_price,
     @quantity, @min_stock, @batch_number, @manufacturing_date, @expiry_date, @prescription_required, @created_by)
  `);
  const insertManyMeds = db.transaction(() => {
    medicines.forEach(m => insertMed.run({ ...m, created_by: adminUser?.id }));
  });
  insertManyMeds();
  console.log('✅ Medicines seeded');

  // --- Settings ---
  const settings = [
    { key: 'pharmacy_name', value: 'Gihozo Pharmacy', label: 'Pharmacy Name' },
    { key: 'pharmacy_address', value: 'KG 100 Ave, Kimironko, Kigali, Rwanda', label: 'Address' },
    { key: 'pharmacy_phone', value: '+250788000000', label: 'Phone' },
    { key: 'pharmacy_email', value: 'info@gihozo.rw', label: 'Email' },
    { key: 'currency', value: 'RWF', label: 'Currency' },
    { key: 'currency_symbol', value: 'RWF', label: 'Currency Symbol' },
    { key: 'tax_rate', value: '0', label: 'Tax Rate (%)' },
    { key: 'low_stock_threshold', value: '10', label: 'Low Stock Threshold' },
    { key: 'receipt_footer', value: 'Thank you for choosing Gihozo Pharmacy! Your health is our priority.', label: 'Receipt Footer' },
    { key: 'approval_mode', value: 'false', label: 'Require Admin Approval for Edits' },
    { key: 'theme', value: 'light', label: 'Default Theme' },
  ];

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value, label) VALUES (?,?,?)`);
  const insertManySettings = db.transaction(() => {
    settings.forEach(s => insertSetting.run(s.key, s.value, s.label));
  });
  insertManySettings();
  console.log('✅ Settings seeded');

  console.log('\n🎉 Database seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Default Credentials:');
  console.log('   Admin:   admin / Admin@123');
  console.log('   Worker:  worker1 / Worker@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(console.error);
