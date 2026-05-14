import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = join(process.cwd(), "prisma", "dev.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS "Store" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "brandColor" TEXT NOT NULL DEFAULT '#0f766e',
  "lpDesignPreset" TEXT NOT NULL DEFAULT 'simple',
  "ctaLabel" TEXT NOT NULL DEFAULT '問い合わせる',
  "businessOpenTime" TEXT NOT NULL DEFAULT '10:00',
  "businessCloseTime" TEXT NOT NULL DEFAULT '18:00',
  "closedWeekdays" TEXT NOT NULL DEFAULT '0',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "bookingCount" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT NOT NULL DEFAULT '',
  "memo" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Service_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Booking" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookingNumber" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "startAt" DATETIME NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "requestNote" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Booking_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "inquiryNumber" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "responseNote" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inquiry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Inquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "total" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNPAID',
  "method" TEXT NOT NULL DEFAULT 'NONE',
  "amount" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "paidAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PaymentProviderSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "provider" TEXT NOT NULL DEFAULT 'NONE',
  "displayName" TEXT NOT NULL DEFAULT '',
  "mode" TEXT NOT NULL DEFAULT 'TEST',
  "publicKey" TEXT NOT NULL DEFAULT '',
  "secretRef" TEXT NOT NULL DEFAULT '',
  "checkoutUrl" TEXT NOT NULL DEFAULT '',
  "instructions" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentProviderSetting_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PageSection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "buttonLabel" TEXT NOT NULL DEFAULT '',
  "buttonHref" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageSection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ModuleSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModuleSetting_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "NotificationSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "smtpHost" TEXT NOT NULL DEFAULT '',
  "smtpPort" INTEGER NOT NULL DEFAULT 587,
  "smtpUser" TEXT NOT NULL DEFAULT '',
  "smtpPass" TEXT NOT NULL DEFAULT '',
  "mailFrom" TEXT NOT NULL DEFAULT '',
  "notificationEmail" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationSetting_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReplyTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReplyTemplate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "StockMovement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InternalNote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "author" TEXT NOT NULL DEFAULT '管理者',
  "body" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalNote_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'staff',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "actor" TEXT NOT NULL DEFAULT 'system',
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Customer_storeId_idx" ON "Customer"("storeId");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS "Product_storeId_idx" ON "Product"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE INDEX IF NOT EXISTS "Service_storeId_idx" ON "Service"("storeId");
CREATE INDEX IF NOT EXISTS "Booking_storeId_idx" ON "Booking"("storeId");
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX IF NOT EXISTS "Booking_serviceId_idx" ON "Booking"("serviceId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Inquiry_inquiryNumber_key" ON "Inquiry"("inquiryNumber");
CREATE INDEX IF NOT EXISTS "Inquiry_storeId_idx" ON "Inquiry"("storeId");
CREATE INDEX IF NOT EXISTS "Inquiry_customerId_idx" ON "Inquiry"("customerId");
CREATE INDEX IF NOT EXISTS "Inquiry_status_idx" ON "Inquiry"("status");
CREATE INDEX IF NOT EXISTS "Order_storeId_idx" ON "Order"("storeId");
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_orderId_key" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "Payment_storeId_idx" ON "Payment"("storeId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentProviderSetting_storeId_key" ON "PaymentProviderSetting"("storeId");
CREATE INDEX IF NOT EXISTS "PaymentProviderSetting_provider_idx" ON "PaymentProviderSetting"("provider");
CREATE INDEX IF NOT EXISTS "PaymentProviderSetting_enabled_idx" ON "PaymentProviderSetting"("enabled");
CREATE INDEX IF NOT EXISTS "PageSection_storeId_idx" ON "PageSection"("storeId");
CREATE INDEX IF NOT EXISTS "PageSection_type_idx" ON "PageSection"("type");
CREATE INDEX IF NOT EXISTS "PageSection_enabled_idx" ON "PageSection"("enabled");
CREATE INDEX IF NOT EXISTS "PageSection_sortOrder_idx" ON "PageSection"("sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "ModuleSetting_storeId_key_key" ON "ModuleSetting"("storeId", "key");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSetting_storeId_key" ON "NotificationSetting"("storeId");
CREATE INDEX IF NOT EXISTS "ReplyTemplate_storeId_idx" ON "ReplyTemplate"("storeId");
CREATE INDEX IF NOT EXISTS "StockMovement_storeId_idx" ON "StockMovement"("storeId");
CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX IF NOT EXISTS "InternalNote_storeId_idx" ON "InternalNote"("storeId");
CREATE INDEX IF NOT EXISTS "InternalNote_targetType_targetId_idx" ON "InternalNote"("targetType", "targetId");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_storeId_email_key" ON "AdminUser"("storeId", "email");
CREATE INDEX IF NOT EXISTS "AdminUser_storeId_idx" ON "AdminUser"("storeId");
CREATE INDEX IF NOT EXISTS "AdminUser_role_idx" ON "AdminUser"("role");
CREATE INDEX IF NOT EXISTS "AuditLog_storeId_idx" ON "AuditLog"("storeId");
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
`);

const storeColumns = db
  .prepare('PRAGMA table_info("Store")')
  .all()
  .map((column) => String((column as { name: unknown }).name));

if (!storeColumns.includes("businessOpenTime")) {
  db.exec('ALTER TABLE "Store" ADD COLUMN "businessOpenTime" TEXT NOT NULL DEFAULT \'10:00\';');
}
if (!storeColumns.includes("businessCloseTime")) {
  db.exec('ALTER TABLE "Store" ADD COLUMN "businessCloseTime" TEXT NOT NULL DEFAULT \'18:00\';');
}
if (!storeColumns.includes("closedWeekdays")) {
  db.exec('ALTER TABLE "Store" ADD COLUMN "closedWeekdays" TEXT NOT NULL DEFAULT \'0\';');
}
if (!storeColumns.includes("lpDesignPreset")) {
  db.exec('ALTER TABLE "Store" ADD COLUMN "lpDesignPreset" TEXT NOT NULL DEFAULT \'simple\';');
}

const customerColumns = db
  .prepare('PRAGMA table_info("Customer")')
  .all()
  .map((column) => String((column as { name: unknown }).name));

if (!customerColumns.includes("bookingCount")) {
  db.exec('ALTER TABLE "Customer" ADD COLUMN "bookingCount" INTEGER NOT NULL DEFAULT 0;');
}

db.close();
console.log(`SQLite database initialized at ${dbPath}`);
