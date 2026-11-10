import { NextRequest, NextResponse } from "next/server";
import { getDatabasePool } from "@/lib/supabase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId = "org-default-001",
      businessProfiles = [],
      customers = [],
      products = [],
      receipts = [],
      payments = [],
      users = [],
    } = body;

    const pool = getDatabasePool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Ensure Organization exists
      await client.query(
        `INSERT INTO organizations (id, name, slug, owner_id, workspace_type, default_currency, timezone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           workspace_type = EXCLUDED.workspace_type`,
        [
          organizationId,
          "Primary Organization",
          `org-${organizationId.slice(0, 8)}`,
          "00000000-0000-0000-0000-000000000000",
          "business",
          "INR",
          "Asia/Kolkata",
        ]
      );

      // 2. Sync Business Profiles
      for (const biz of businessProfiles) {
        if (!biz.id) continue;
        await client.query(
          `INSERT INTO business_profiles (id, organization_id, business_name, logo_url, email, phone, address, tax_identifier, website)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             business_name = EXCLUDED.business_name,
             logo_url = EXCLUDED.logo_url,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             address = EXCLUDED.address,
             tax_identifier = EXCLUDED.tax_identifier,
             website = EXCLUDED.website`,
          [
            biz.id,
            biz.organizationId || organizationId,
            biz.businessName || "My Business",
            biz.logoUrl || null,
            biz.email || null,
            biz.phone || null,
            JSON.stringify(biz.address || {}),
            biz.taxIdentifier || null,
            biz.website || null,
          ]
        );
      }

      // 3. Sync Customers
      for (const cust of customers) {
        if (!cust.id) continue;
        await client.query(
          `INSERT INTO customers (id, organization_id, name, email, phone, billing_address, tax_identifier, notes, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             billing_address = EXCLUDED.billing_address,
             tax_identifier = EXCLUDED.tax_identifier,
             notes = EXCLUDED.notes,
             updated_at = NOW()`,
          [
            cust.id,
            cust.organizationId || organizationId,
            cust.name || "Customer",
            cust.email || null,
            cust.phone || null,
            JSON.stringify(cust.billingAddress || {}),
            cust.taxIdentifier || null,
            cust.notes || null,
          ]
        );
      }

      // 4. Sync Products
      for (const prod of products) {
        if (!prod.id) continue;
        await client.query(
          `INSERT INTO products (id, organization_id, name, description, sku, unit_price_minor, currency, default_tax_rate, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             sku = EXCLUDED.sku,
             unit_price_minor = EXCLUDED.unit_price_minor,
             currency = EXCLUDED.currency,
             default_tax_rate = EXCLUDED.default_tax_rate,
             is_active = EXCLUDED.is_active`,
          [
            prod.id,
            prod.organizationId || organizationId,
            prod.name || "Product",
            prod.description || null,
            prod.sku || null,
            prod.unitPriceMinor || 0,
            prod.currency || "INR",
            prod.defaultTaxRate || 0,
            prod.isActive !== false,
          ]
        );
      }

      // 5. Sync Receipts
      for (const rec of receipts) {
        if (!rec.id) continue;
        const bizId = rec.businessProfileId || (businessProfiles[0]?.id) || "biz-001";

        // Ensure parent business profile exists
        await client.query(
          `INSERT INTO business_profiles (id, organization_id, business_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING`,
          [bizId, organizationId, rec.businessSnapshot?.name || "Business Profile"]
        );

        await client.query(
          `INSERT INTO receipts (
            id, organization_id, business_profile_id, customer_id, receipt_number,
            receipt_type, status, currency, issue_date, transaction_date,
            subtotal_minor, discount_minor, tax_minor, total_minor,
            amount_paid_minor, balance_due_minor, customer_snapshot, business_snapshot,
            notes, terms, footer_message, template_key, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            total_minor = EXCLUDED.total_minor,
            amount_paid_minor = EXCLUDED.amount_paid_minor,
            balance_due_minor = EXCLUDED.balance_due_minor,
            customer_snapshot = EXCLUDED.customer_snapshot,
            business_snapshot = EXCLUDED.business_snapshot,
            notes = EXCLUDED.notes,
            terms = EXCLUDED.terms,
            footer_message = EXCLUDED.footer_message,
            template_key = EXCLUDED.template_key,
            updated_at = NOW()`,
          [
            rec.id,
            rec.organizationId || organizationId,
            bizId,
            rec.customerId || null,
            rec.receiptNumber,
            rec.receiptType || "sales",
            rec.status || "issued",
            rec.currency || "INR",
            rec.issueDate || new Date().toISOString().slice(0, 10),
            rec.transactionDate || new Date().toISOString().slice(0, 10),
            rec.subtotalMinor || 0,
            rec.discountMinor || 0,
            rec.taxMinor || 0,
            rec.totalMinor || 0,
            rec.amountPaidMinor || 0,
            rec.balanceDueMinor || 0,
            JSON.stringify(rec.customerSnapshot || {}),
            JSON.stringify(rec.businessSnapshot || {}),
            rec.notes || null,
            rec.terms || null,
            rec.footerMessage || null,
            rec.templateKey || "retail",
          ]
        );

        // Sync receipt items
        if (Array.isArray(rec.items)) {
          await client.query(`DELETE FROM receipt_items WHERE receipt_id = $1`, [rec.id]);
          for (let i = 0; i < rec.items.length; i++) {
            const item = rec.items[i];
            await client.query(
              `INSERT INTO receipt_items (
                id, receipt_id, product_id, description, sku_snapshot,
                quantity, unit_price_minor, discount_minor, tax_rate, tax_minor,
                line_total_minor, sort_order
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                item.id || `${rec.id}-item-${i}`,
                rec.id,
                item.productId || null,
                item.description || "Item",
                item.skuSnapshot || null,
                item.quantity || 1,
                item.unitPriceMinor || 0,
                item.discountMinor || 0,
                item.taxRate || 0,
                item.taxMinor || 0,
                item.lineTotalMinor || 0,
                item.sortOrder || i,
              ]
            );
          }
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Successfully synchronized with Supabase PostgreSQL cloud",
        synced: {
          businessProfiles: businessProfiles.length,
          customers: customers.length,
          products: products.length,
          receipts: receipts.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (txErr: any) {
      await client.query("ROLLBACK");
      console.error("Database sync transaction failed:", txErr);
      return NextResponse.json(
        { success: false, error: txErr.message || "Database transaction error" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Sync API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process sync request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId") || "org-default-001";

    const pool = getDatabasePool();

    const [bizProfiles, customers, products, receipts] = await Promise.all([
      pool.query(`SELECT * FROM business_profiles WHERE organization_id = $1`, [orgId]),
      pool.query(`SELECT * FROM customers WHERE organization_id = $1 ORDER BY name ASC`, [orgId]),
      pool.query(`SELECT * FROM products WHERE organization_id = $1 ORDER BY name ASC`, [orgId]),
      pool.query(`SELECT * FROM receipts WHERE organization_id = $1 ORDER BY issue_date DESC LIMIT 50`, [orgId]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        businessProfiles: bizProfiles.rows,
        customers: customers.rows,
        products: products.rows,
        receipts: receipts.rows,
      },
      count: {
        businessProfiles: bizProfiles.rowCount,
        customers: customers.rowCount,
        products: products.rowCount,
        receipts: receipts.rowCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Sync GET API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch from cloud" },
      { status: 500 }
    );
  }
}
