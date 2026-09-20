import {
  expandNicheQuery,
  generateQueryHash,
  partitionBoundsIntoGrid,
  GeoBounds,
} from "../packages/shared/src/discovery/niche-expansion";
import { DeduplicationService } from "../apps/api/src/discovery/deduplication.service";

async function runEngineTests() {
  console.log("=== LEADENGINE PRO VERIFICATION SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Niche Expansion Tests
  console.log("\n--- Testing Niche Expansion Engine ---");
  const dentalExpanded = expandNicheQuery("Dentist", "India");
  assert(dentalExpanded.canonical === "Dentist", "Canonical niche is Dentist");
  assert(dentalExpanded.variants.includes("Dental Clinic"), "Variants include 'Dental Clinic'");
  assert(dentalExpanded.variants.includes("Orthodontist"), "Variants include 'Orthodontist'");
  assert(dentalExpanded.variants.length <= 8, "Variants are bounded (<= 8)");

  const hvacExpanded = expandNicheQuery("HVAC", "United States");
  assert(hvacExpanded.canonical === "HVAC Contractor", "Canonical niche is HVAC Contractor");
  assert(hvacExpanded.variants.includes("Air Conditioning Service"), "Variants include 'Air Conditioning Service'");

  // 2. Query Hash Tests
  console.log("\n--- Testing Query Hash Determinism ---");
  const hash1 = generateQueryHash("Dentist", "Ahmedabad", "OVERPASS_OSM", "cell_0_0");
  const hash2 = generateQueryHash("Dentist", "Ahmedabad", "OVERPASS_OSM", "cell_0_0");
  const hash3 = generateQueryHash("Dental Clinic", "Ahmedabad", "OVERPASS_OSM", "cell_0_0");
  assert(hash1 === hash2, "Identical queries yield identical hash");
  assert(hash1 !== hash3, "Different queries yield distinct hashes");

  // 3. Geographic Grid Partitioning Tests
  console.log("\n--- Testing Geographic Grid Partitioning ---");
  const mumbaiBounds: GeoBounds = { minLat: 18.9, maxLat: 19.3, minLon: 72.7, maxLon: 73.1 };
  const cells = partitionBoundsIntoGrid(mumbaiBounds, 2);
  assert(cells.length === 4, "2x2 grid produces exactly 4 micro-cells");
  assert(Boolean(cells[0].geoCellId), "Each cell has a stable geoCellId");
  assert(cells[0].bounds.maxLat <= mumbaiBounds.maxLat, "Cell bounds within parent bounding box");

  // 4. Normalization & Multi-Signal Deduplication Tests
  console.log("\n--- Testing Normalization & Deduplication Service ---");
  const dedup = new DeduplicationService();

  // Phone Normalization
  const phone1 = dedup.normalizePhone("+91 22 2657 0941");
  const phone2 = dedup.normalizePhone("022-2657-0941");
  assert(phone1.digits.endsWith("2226570941"), "Phone normalized to digits");
  assert(phone1.hash === dedup.normalizePhone("+91 22-2657-0941").hash, "Phone hash is format-invariant");

  // Name Normalization
  const name1 = dedup.normalizeBusinessName("Dr. Smile Invent Dental Clinic Pvt. Ltd.");
  const name2 = dedup.normalizeBusinessName("Smile Invent Dental Center");
  assert(name1.normalized === "smile invent", "Legal suffixes and doctor titles stripped");
  assert(name2.normalized === "smile invent", "Center/Clinic suffixes stripped to canonical base");

  // Domain Extraction
  const dom1 = dedup.extractDomain("https://www.smileinventdental.com/contact-us?ref=google");
  const dom2 = dedup.extractDomain("http://smileinventdental.com");
  assert(dom1.domain === "smileinventdental.com", "Clean root domain extracted");
  assert(dom1.hash === dom2.hash, "Domain hashes match regardless of protocol/path/subdomain");

  // Fuzzy Similarity Matcher
  const simExact = dedup.calculateSimilarity("smile invent", "smile invent");
  const simHigh = dedup.calculateSimilarity("smile invent dental", "smile invent clinic");
  const simDifferent = dedup.calculateSimilarity("smile invent", "metro hvac solutions");

  assert(simExact === 1.0, "Exact similarity is 1.0");
  assert(simHigh >= 0.65, "High token overlap similarity >= 0.65");
  assert(simDifferent < 0.3, "Different businesses similarity < 0.3");

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runEngineTests().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
