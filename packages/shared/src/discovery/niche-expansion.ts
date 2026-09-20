import crypto from "crypto";

export interface NicheDefinition {
  canonical: string;
  category: string;
  aliases: string[];
  subSpecialties: string[];
  localized: Record<string, string[]>;
  searchTags: string[];
}

export const NICHE_TAXONOMY: Record<string, NicheDefinition> = {
  dentist: {
    canonical: "Dentist",
    category: "Healthcare",
    aliases: [
      "Dentist",
      "Dental Clinic",
      "Dental Hospital",
      "Dental Care",
      "Dental Centre",
      "Dental Center",
      "Dental Surgery",
      "Family Dentistry",
      "Oral Health Care",
      "Dental Studio",
    ],
    subSpecialties: [
      "Orthodontist",
      "Cosmetic Dentist",
      "Pediatric Dentist",
      "Endodontist",
      "Periodontist",
      "Oral Surgeon",
      "Implant Dentist",
      "Prosthodontist",
      "Teeth Whitening Clinic",
    ],
    localized: {
      hi: ["दांतों का डॉक्टर", "दंत चिकित्सालय", "डेंटल क्लिनिक"],
      gu: ["દાંતના ડોક્ટર", "ડેન્ટલ ક્લિનિક"],
      mr: ["दातांचे डॉक्टर", "डेंटल क्लिनिक"],
      ar: ["طبيب أسنان", "عيادة أسنان", "مركز طب الأسنان"],
      fr: ["Dentiste", "Cabinet Dentaire", "Clinique Dentaire"],
      es: ["Dentista", "Clínica Dental", "Odontólogo"],
      de: ["Zahnarzt", "Zahnklinik", "Zahnpraxis"],
    },
    searchTags: ["healthcare", "dentist", "dental", "orthodontics", "clinic"],
  },
  dermatologist: {
    canonical: "Dermatologist",
    category: "Healthcare",
    aliases: [
      "Dermatologist",
      "Skin Clinic",
      "Skin Care Centre",
      "Dermatology Center",
      "Skin Specialist",
      "Aesthetic Skin Clinic",
    ],
    subSpecialties: [
      "Cosmetic Dermatologist",
      "Trichologist",
      "Hair Transplant Clinic",
      "Laser Skin Center",
      "Pediatric Dermatologist",
    ],
    localized: {
      hi: ["त्वचा रोग विशेषज्ञ", "स्किन क्लिनिक"],
      gu: ["ચામડીના નિષ્ણાત", "સ્કીન ક્લિનિક"],
      mr: ["त्वचारोग तज्ज्ञ", "સ્કિન ક્લિનિક"],
      ar: ["طبيب جلدية", "عيادة الجلدية والتجميل"],
      fr: ["Dermatologue", "Clinique Dermatologique"],
      es: ["Dermatólogo", "Clínica Dermatológica"],
      de: ["Hautarzt", "Dermatologie Praxis"],
    },
    searchTags: ["healthcare", "dermatology", "skin", "cosmetic", "clinic"],
  },
  lawyer: {
    canonical: "Lawyer",
    category: "Legal Services",
    aliases: [
      "Law Firm",
      "Legal Associates",
      "Advocate",
      "Attorneys at Law",
      "Legal Practice",
      "Solicitors",
      "Barrister Chambers",
    ],
    subSpecialties: [
      "Corporate Lawyer",
      "Criminal Defense Attorney",
      "Family Law Advocate",
      "Real Estate Lawyer",
      "Immigration Lawyer",
      "Tax Attorney",
      "Intellectual Property Lawyer",
    ],
    localized: {
      hi: ["वकील", "विधि सलाहकार", "लॉ फर्म"],
      gu: ["વકીલ", "લીગલ એડવાઈઝર"],
      mr: ["वकील", "कायदेतज्ज्ञ"],
      ar: ["محامي", "مكتب محاماة", "مستشار قانوني"],
      fr: ["Avocat", "Cabinet d'Avocats"],
      es: ["Abogado", "Bufete de Abogados"],
      de: ["Rechtsanwalt", "Anwaltskanzlei"],
    },
    searchTags: ["legal", "lawyer", "attorney", "law_firm", "advocate"],
  },
  accountant: {
    canonical: "Accountant",
    category: "Financial Services",
    aliases: [
      "Chartered Accountant",
      "Accounting Firm",
      "CPA",
      "Tax Consultant",
      "Auditor",
      "Bookkeeping Services",
      "Financial Advisors",
    ],
    subSpecialties: [
      "Corporate Auditor",
      "GST Consultant",
      "Forensic Accountant",
      "Payroll Services",
      "Wealth Advisory",
    ],
    localized: {
      hi: ["चार्टर्ड एकाउंटेंट", "टैक्स कंसलटेंट", "लेखाकार"],
      gu: ["ચાર્ટર્ડ એકાઉન્ટન્ટ", "ટેક્સ કન્સલ્ટન્ટ"],
      mr: ["चार्टर्ड अकाउंटंट", "कर सल्लागार"],
      ar: ["محاسب قانوني", "مكتب تدقيق حسابات", "مستشار ضرائب"],
      fr: ["Expert-comptable", "Cabinet d'expertise comptable"],
      es: ["Contador Público", "Asesor Fiscal"],
      de: ["Steuerberater", "Wirtschaftsprüfer"],
    },
    searchTags: ["finance", "accountant", "cpa", "tax", "accounting"],
  },
  hvac: {
    canonical: "HVAC Contractor",
    category: "Home Services",
    aliases: [
      "Air Conditioning Service",
      "HVAC Repair",
      "Heating and Cooling",
      "AC Maintenance",
      "Refrigeration Contractor",
    ],
    subSpecialties: [
      "Commercial HVAC",
      "AC Duct Cleaning",
      "Heat Pump Installation",
      "Chiller Repair",
    ],
    localized: {
      hi: ["एसी रिपेयर सर्विस", "एयर कंडीशनिंग कांट्रैक्टर"],
      gu: ["એસી સર્વિસ", "એર કન્ડીશનીંગ"],
      mr: ["एसी दुरुस्ती सेवा"],
      ar: ["صيانة تكييف", "فني تكييف وتبريد"],
      fr: ["Climatisation et Chauffage", "Frigoriste"],
      es: ["Aire Acondicionado", "Servicio Técnico Climatización"],
      de: ["Klimatechnik", "Kälteanlagenbauer"],
    },
    searchTags: ["home_services", "hvac", "air_conditioning", "contractor"],
  },
  plumber: {
    canonical: "Plumber",
    category: "Home Services",
    aliases: [
      "Plumbing Services",
      "Drain Cleaning Contractor",
      "Master Plumber",
      "Emergency Plumbing",
    ],
    subSpecialties: [
      "Commercial Plumbing",
      "Water Heater Repair",
      "Pipe Relining",
      "Sewer Line Inspection",
    ],
    localized: {
      hi: ["प्लम्बर", "नलसाज"],
      gu: ["પ્લમ્બર"],
      mr: ["प्लंबर"],
      ar: ["سباك", "أعمال سباكة"],
      fr: ["Plombier", "Entreprise de Plomberie"],
      es: ["Fontanero", "Servicio de Plomería"],
      de: ["Klempner", "Sanitärtechnik"],
    },
    searchTags: ["home_services", "plumber", "plumbing"],
  },
  electrician: {
    canonical: "Electrician",
    category: "Home Services",
    aliases: [
      "Electrical Contractor",
      "Electrical Repair Services",
      "Licensed Electrician",
    ],
    subSpecialties: [
      "Solar Panel Installer",
      "EV Charger Installer",
      "Industrial Electrician",
      "Lighting Specialist",
    ],
    localized: {
      hi: ["इलेक्ट्रीशियन", "बिजली मिस्त्री"],
      gu: ["ઇલેક્ટ્રિશિયન"],
      mr: ["इलेक्ट्रिशियन"],
      ar: ["كهربائي", "فني كهرباء منازل"],
      fr: ["Électricien"],
      es: ["Electricista"],
      de: ["Elektriker", "Elektroinstallation"],
    },
    searchTags: ["home_services", "electrician", "electrical"],
  },
  restaurant: {
    canonical: "Restaurant",
    category: "Hospitality & Dining",
    aliases: [
      "Dining Restaurant",
      "Bistro",
      "Café",
      "Eatery",
      "Lounge Bar",
      "Fine Dining Restaurant",
    ],
    subSpecialties: [
      "Italian Restaurant",
      "Indian Restaurant",
      "Pizzeria",
      "Steakhouse",
      "Vegetarian Restaurant",
      "Seafood Restaurant",
    ],
    localized: {
      hi: ["रेस्टोरेंट", "भोजनालय", "कैफे"],
      gu: ["રેસ્ટોરન્ટ", "હોટેલ"],
      mr: ["रेस्टॉरंट", "हॉटेल"],
      ar: ["مطعم", "كافيه", "مقهى"],
      fr: ["Restaurant", "Brasserie"],
      es: ["Restaurante"],
      de: ["Restaurant", "Gaststätte"],
    },
    searchTags: ["dining", "restaurant", "food", "cafe"],
  },
  real_estate: {
    canonical: "Real Estate Agency",
    category: "Real Estate",
    aliases: [
      "Property Consultant",
      "Real Estate Brokers",
      "Realtor Office",
      "Realty Group",
      "Property Management",
    ],
    subSpecialties: [
      "Commercial Real Estate",
      "Luxury Real Estate",
      "Rental Property Agent",
      "Land Developer",
    ],
    localized: {
      hi: ["प्रॉपर्टी डीलर", "रियल एस्टेट एजेंट"],
      gu: ["પ્રોપર્ટી કન્સલ્ટન્ટ", "રિયલ એસ્ટેટ"],
      mr: ["પ્રૉપર્ટી બ્રોકર"],
      ar: ["وسيط عقاري", "مكتب عقارات", "وكالة عقارية"],
      fr: ["Agence Immobilière"],
      es: ["Inmobiliaria", "Agencia de Bienes Raíces"],
      de: ["Immobilienmakler"],
    },
    searchTags: ["real_estate", "realtor", "property", "broker"],
  },
};

export const COUNTRY_LANGUAGE_MAP: Record<string, string[]> = {
  IN: ["en", "hi", "gu", "mr"],
  India: ["en", "hi", "gu", "mr"],
  AE: ["en", "ar"],
  UAE: ["en", "ar"],
  "United Arab Emirates": ["en", "ar"],
  US: ["en", "es"],
  "United States": ["en", "es"],
  GB: ["en"],
  UK: ["en"],
  "United Kingdom": ["en"],
  FR: ["fr", "en"],
  France: ["fr", "en"],
  DE: ["de", "en"],
  Germany: ["de", "en"],
  ES: ["es", "en"],
  Spain: ["es", "en"],
  CA: ["en", "fr"],
  Canada: ["en", "fr"],
  AU: ["en"],
  Australia: ["en"],
};

/**
 * Niche Expansion Engine
 * Expands a simple search term (e.g. "Dentist") into a controlled, non-explosive set of high-yield variants.
 */
export function expandNicheQuery(
  rawNiche: string,
  country?: string,
  includeSubSpecialties = true,
  maxVariants = 8
): {
  canonical: string;
  category: string;
  variants: string[];
  searchTags: string[];
} {
  const normalized = rawNiche.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  let matchedKey: string | undefined;
  for (const [key, def] of Object.entries(NICHE_TAXONOMY)) {
    if (
      key === normalized ||
      def.canonical.toLowerCase().includes(rawNiche.toLowerCase()) ||
      def.aliases.some((a) => a.toLowerCase().includes(rawNiche.toLowerCase()))
    ) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    const titleCase = rawNiche
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      canonical: titleCase,
      category: "General Business",
      variants: [
        titleCase,
        `${titleCase} Services`,
        `${titleCase} Center`,
        `${titleCase} Clinic`,
      ].slice(0, maxVariants),
      searchTags: [rawNiche.toLowerCase()],
    };
  }

  const def = NICHE_TAXONOMY[matchedKey];
  const variantsSet = new Set<string>();

  variantsSet.add(def.canonical);
  if (includeSubSpecialties) {
    for (const sub of def.subSpecialties.slice(0, 3)) {
      variantsSet.add(sub);
    }
  }

  for (const alias of def.aliases) {
    variantsSet.add(alias);
  }

  if (country) {
    const langCodes = COUNTRY_LANGUAGE_MAP[country] || ["en"];
    for (const lang of langCodes) {
      if (lang !== "en" && def.localized[lang]) {
        for (const locTerm of def.localized[lang].slice(0, 2)) {
          variantsSet.add(locTerm);
        }
      }
    }
  }

  return {
    canonical: def.canonical,
    category: def.category,
    variants: Array.from(variantsSet).slice(0, maxVariants),
    searchTags: def.searchTags,
  };
}



/**
 * Deterministic Query Hash Generator to avoid repeating queries
 */
export function generateQueryHash(
  niche: string,
  location: string,
  provider: string,
  cellId?: string
): string {
  const norm = `${niche.trim().toLowerCase()}|${location.trim().toLowerCase()}|${provider.trim().toLowerCase()}|${cellId || ""}`;
  return crypto.createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

/**
 * Geographic Bounding Box and Grid Partitioning Utilities
 */
export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export function partitionBoundsIntoGrid(
  bounds: GeoBounds,
  gridSize = 2
): Array<{ geoCellId: string; bounds: GeoBounds }> {
  const latStep = (bounds.maxLat - bounds.minLat) / gridSize;
  const lonStep = (bounds.maxLon - bounds.minLon) / gridSize;
  const cells: Array<{ geoCellId: string; bounds: GeoBounds }> = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const minLat = bounds.minLat + r * latStep;
      const maxLat = minLat + latStep;
      const minLon = bounds.minLon + c * lonStep;
      const maxLon = minLon + lonStep;
      const cellHash = crypto
        .createHash("md5")
        .update(`${minLat.toFixed(4)},${minLon.toFixed(4)}`)
        .digest("hex")
        .slice(0, 8);

      cells.push({
        geoCellId: `cell_${r}_${c}_${cellHash}`,
        bounds: { minLat, maxLat, minLon, maxLon },
      });
    }
  }

  return cells;
}
