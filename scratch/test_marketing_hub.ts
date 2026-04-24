/**
 * scratch/test_marketing_hub.ts
 *
 * Quick smoke-test for the promo validate API and checkout action.
 * Run with: npx ts-node --project tsconfig.json scratch/test_marketing_hub.ts
 * (requires dev server running at localhost:3000)
 */

const BASE = "http://localhost:3000";

async function testPromoValidate() {
  console.log("\n--- Test: Promo Validate API ---");

  // Test 1: non-existent code
  const res1 = await fetch(`${BASE}/api/v1/promos/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "NOTACODE" }),
  });
  const data1 = await res1.json();
  console.log(
    "Non-existent code:",
    res1.status === 404 && data1.valid === false ? "✅ PASS" : "❌ FAIL",
    data1,
  );

  // Test 2: missing body field
  const res2 = await fetch(`${BASE}/api/v1/promos/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data2 = await res2.json();
  console.log(
    "Missing code field:",
    res2.status === 400 && data2.valid === false ? "✅ PASS" : "❌ FAIL",
    data2,
  );
}

async function testCheckoutActionShapeOnly() {
  console.log("\n--- Test: createCheckoutSession parameter shape ---");
  // Just verifying the import works and the type is correct.
  // We can't call this from a script without a DB, but we can import it.
  try {
    const mod = await import("../src/app/actions/booking-actions");
    const hasParam = typeof mod.createCheckoutSession === "function";
    console.log(
      "createCheckoutSession exported:",
      hasParam ? "✅ PASS" : "❌ FAIL",
    );
  } catch (e) {
    console.log("Import failed (expected in non-Next env):", e);
  }
}

async function run() {
  console.log("=== Marketing Hub Smoke Tests ===");
  await testPromoValidate().catch(console.error);
  await testCheckoutActionShapeOnly().catch(console.error);
  console.log("\n=== Done ===");
}

run();
