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
  // -------------------------------------------------------------
  // 1. CONTRACTORS & COMMERCIAL TRADE SERVICES (High Outreach Value)
  // -------------------------------------------------------------
  hvac: {
    canonical: "HVAC Contractor",
    category: "Home & Commercial Services",
    aliases: [
      "Commercial HVAC",
      "Air Conditioning Service",
      "HVAC Repair",
      "Heating and Cooling",
      "AC Maintenance",
      "Commercial Refrigeration Contractor",
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
    searchTags: ["home_services", "hvac", "air_conditioning", "contractor", "cooling"],
  },
  roofing: {
    canonical: "Roofing Contractor",
    category: "Home & Commercial Services",
    aliases: [
      "Roofing Company",
      "Commercial Roofing",
      "Roof Repair Specialist",
      "Metal Roofing Contractor",
      "Gutter and Roofing",
    ],
    subSpecialties: [
      "Commercial Flat Roofing",
      "Tile Roofing",
      "Emergency Roof Repair",
      "Solar Roofing",
    ],
    localized: {
      hi: ["छत मरम्मत ठेकेदार"],
      ar: ["مقاول أسقف", "تركيب عوازل أسطح"],
      fr: ["Couvreur", "Entreprise de Toiture"],
      es: ["Techador", "Reparación de Techos"],
      de: ["Dachdecker", "Dachsanierung"],
    },
    searchTags: ["roofing", "contractor", "construction", "roof_repair"],
  },
  solar: {
    canonical: "Solar Energy Installer",
    category: "Home & Commercial Services",
    aliases: [
      "Solar Panel Company",
      "Commercial Solar Contractor",
      "Solar Energy Solutions",
      "Rooftop Solar Installer",
      "Clean Energy Contractors",
    ],
    subSpecialties: [
      "Commercial Solar Power",
      "Residential Solar Panels",
      "Battery Storage Backup",
      "Solar Inverter Maintenance",
    ],
    localized: {
      hi: ["सोलर पैनल इंस्टॉलर"],
      ar: ["تركيب طاقة شمسية", "ألواح شمسية"],
      fr: ["Installateur Panneaux Solaires"],
      es: ["Instalador de Paneles Solares"],
      de: ["Photovoltaik", "Solarteur"],
    },
    searchTags: ["solar", "energy", "renewable", "electrician"],
  },
  plumber: {
    canonical: "Commercial Plumbing",
    category: "Home & Commercial Services",
    aliases: [
      "Plumber",
      "Plumbing Services",
      "Commercial Plumber",
      "Drain Cleaning Contractor",
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
    canonical: "Commercial Electrician",
    category: "Home & Commercial Services",
    aliases: [
      "Electrician",
      "Electrical Contractor",
      "Licensed Electrician",
      "Commercial Electrical Services",
      "Emergency Electrician",
    ],
    subSpecialties: [
      "EV Charger Installer",
      "Industrial Electrician",
      "Lighting Specialist",
      "Panel Upgrade Contractor",
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
  general_contractor: {
    canonical: "General Contractor",
    category: "Construction & Remodeling",
    aliases: [
      "Construction Company",
      "Commercial Builder",
      "Remodeling Contractor",
      "Home Renovation Company",
      "Building Contractor",
    ],
    subSpecialties: [
      "Commercial Remodeling",
      "Office Fit-Out Contractor",
      "Kitchen and Bath Remodel",
      "Custom Home Builder",
    ],
    localized: {
      hi: ["भवन निर्माण ठेकेदार"],
      ar: ["شركة مقاولات عامة", "بناء وتشطيب"],
      fr: ["Entreprise Générale de Bâtiment"],
      es: ["Contratista General", "Empresa de Construcción"],
      de: ["Bauunternehmen", "Generalunternehmer"],
    },
    searchTags: ["contractor", "construction", "builder", "remodeling"],
  },
  landscaping: {
    canonical: "Commercial Landscaping",
    category: "Home & Commercial Services",
    aliases: [
      "Landscaping Company",
      "Tree Service Contractor",
      "Lawn Care Services",
      "Hardscape Contractor",
      "Landscape Architecture",
    ],
    subSpecialties: [
      "Commercial Grounds Maintenance",
      "Irrigation and Sprinkler Systems",
      "Tree Removal Service",
      "Paver and Hardscape Installation",
    ],
    localized: {
      ar: ["تنسيق حدائق", "أعمال لاندسكيب"],
      fr: ["Paysagiste", "Entretien d'Espaces Verts"],
      es: ["Jardinería y Paisajismo"],
      de: ["Garten- und Landschaftsbau"],
    },
    searchTags: ["landscaping", "gardener", "lawn_care", "outdoor"],
  },
  painting: {
    canonical: "Painting Contractor",
    category: "Home & Commercial Services",
    aliases: [
      "Commercial Painting",
      "House Painting Company",
      "Exterior Painting Contractor",
      "Epoxy Flooring Installer",
    ],
    subSpecialties: [
      "Commercial Interior Painting",
      "Industrial Coating",
      "Cabinet Refinishing",
    ],
    localized: {
      hi: ["पेंटर ठेकेदार"],
      ar: ["دهانات وديكورات"],
      fr: ["Peintre en Bâtiment"],
      es: ["Pintores Profesionales"],
      de: ["Malerbetrieb", "Lackierer"],
    },
    searchTags: ["painting", "painter", "contractor"],
  },
  pest_control: {
    canonical: "Pest Control Services",
    category: "Home & Commercial Services",
    aliases: [
      "Commercial Exterminator",
      "Termite Control Specialist",
      "Bed Bug Extermination",
      "Rodent Control Services",
    ],
    subSpecialties: [
      "Commercial Pest Management",
      "Termite Inspection",
      "Wildlife Removal",
    ],
    localized: {
      ar: ["مكافحة حشرات وقوارض"],
      fr: ["Dératisation et Désinsectisation"],
      es: ["Control de Plagas", "Fumigación"],
      de: ["Schädlingsbekämpfung"],
    },
    searchTags: ["pest_control", "exterminator"],
  },

  // -------------------------------------------------------------
  // 2. LEGAL & FINANCIAL SERVICES (High Retainer Value)
  // -------------------------------------------------------------
  lawyer: {
    canonical: "Law Firm",
    category: "Legal Services",
    aliases: [
      "Lawyer",
      "Attorneys at Law",
      "Legal Practice",
      "Advocate",
      "Solicitors",
      "Barrister Chambers",
    ],
    subSpecialties: [
      "Corporate Lawyer",
      "Personal Injury Attorney",
      "Criminal Defense Attorney",
      "Family Law Advocate",
      "Real Estate Lawyer",
      "Immigration Lawyer",
      "Tax Attorney",
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
    canonical: "CPA & Accounting Firm",
    category: "Financial Services",
    aliases: [
      "Accountant",
      "Chartered Accountant",
      "Tax Consultant",
      "Auditing Firm",
      "Bookkeeping Services",
      "Corporate Financial Advisor",
    ],
    subSpecialties: [
      "Corporate Auditor",
      "Tax Planning & Preparation",
      "GST & VAT Consultant",
      "Payroll Management",
      "Forensic Accountant",
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
  wealth_advisor: {
    canonical: "Wealth Management Firm",
    category: "Financial Services",
    aliases: [
      "Financial Planner",
      "Investment Advisory",
      "Asset Management Company",
      "Retirement Planning Advisory",
    ],
    subSpecialties: [
      "Certified Financial Planner (CFP)",
      "High Net Worth Wealth Advisory",
      "Estate Planning Consultant",
    ],
    localized: {
      ar: ["مستشار مالي", "إدارة ثروات"],
      fr: ["Gestion de Patrimoine", "Conseiller Financier"],
      es: ["Asesor Financiero", "Gestión de Patrimonios"],
      de: ["Vermögensberater", "Finanzberater"],
    },
    searchTags: ["finance", "wealth", "investment", "advisor"],
  },

  // -------------------------------------------------------------
  // 3. REAL ESTATE & ARCHITECTURE
  // -------------------------------------------------------------
  real_estate: {
    canonical: "Real Estate Agency",
    category: "Real Estate & Property",
    aliases: [
      "Commercial Real Estate Broker",
      "Realtor Office",
      "Property Management Company",
      "Real Estate Consultants",
      "Realty Group",
    ],
    subSpecialties: [
      "Commercial Real Estate Brokerage",
      "Luxury Residential Realtor",
      "Property Asset Management",
      "Land Acquisition Broker",
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
  architect: {
    canonical: "Architecture Firm",
    category: "Real Estate & Property",
    aliases: [
      "Architectural Studio",
      "Commercial Architect",
      "Structural Engineering Firm",
      "Building Design Consultants",
    ],
    subSpecialties: [
      "Commercial Architecture",
      "Modern Residential Architect",
      "Sustainable Green Building Design",
      "Urban Planning Studio",
    ],
    localized: {
      ar: ["مكتب هندسي معماري", "تصميم معماري"],
      fr: ["Cabinet d'Architecture"],
      es: ["Estudio de Arquitectura"],
      de: ["Architekturbüro"],
    },
    searchTags: ["architect", "design", "building_design"],
  },
  interior_design: {
    canonical: "Interior Design Studio",
    category: "Real Estate & Property",
    aliases: [
      "Commercial Interior Designer",
      "Residential Interior Decorator",
      "Space Planning Studio",
      "Luxury Home Staging",
    ],
    subSpecialties: [
      "Office Interior Fit-Out",
      "Hospitality Interior Design",
      "Modular Kitchen & Wardrobe Design",
    ],
    localized: {
      ar: ["تصميم داخلي وديكور"],
      fr: ["Architecte d'Intérieur"],
      es: ["Diseñador de Interiores"],
      de: ["Innenarchitekt"],
    },
    searchTags: ["interior_design", "decorator", "design"],
  },

  // -------------------------------------------------------------
  // 4. DIGITAL, TECH & B2B SERVICES
  // -------------------------------------------------------------
  marketing_agency: {
    canonical: "Digital Marketing Agency",
    category: "Professional & B2B Services",
    aliases: [
      "SEO Company",
      "Web Design Agency",
      "Social Media Marketing Agency",
      "Advertising Firm",
      "Creative Digital Studio",
    ],
    subSpecialties: [
      "B2B Lead Generation Agency",
      "Local SEO Specialist",
      "Performance PPC Agency",
      "E-commerce Growth Agency",
    ],
    localized: {
      ar: ["وكالة تسويق رقمي", "شركة تصميم مواقع"],
      fr: ["Agence de Marketing Digital", "Agence Web"],
      es: ["Agencia de Marketing Digital"],
      de: ["Digitalagentur", "Marketingagentur"],
    },
    searchTags: ["marketing", "agency", "seo", "web_design"],
  },
  it_services: {
    canonical: "Managed IT Services (MSP)",
    category: "Professional & B2B Services",
    aliases: [
      "IT Support Company",
      "Cybersecurity Consultants",
      "Cloud Solutions Provider",
      "Computer Network Support",
    ],
    subSpecialties: [
      "Managed Service Provider (MSP)",
      "Enterprise Cybersecurity",
      "Office IT Infrastructure",
    ],
    localized: {
      ar: ["حلول تقنية المعلومات", "صيانة شبكات"],
      fr: ["Entreprise de Services Informatiques"],
      es: ["Servicios Informáticos", "Soporte TI"],
      de: ["IT-Dienstleister", "Systemhaus"],
    },
    searchTags: ["it_services", "msp", "tech_support"],
  },
  commercial_cleaning: {
    canonical: "Commercial Cleaning Services",
    category: "Professional & B2B Services",
    aliases: [
      "Janitorial Services",
      "Office Cleaning Company",
      "Facility Maintenance Services",
      "Commercial Carpet Cleaning",
    ],
    subSpecialties: [
      "Post-Construction Cleaning",
      "Medical Facility Cleaning",
      "Disinfection & Sanitization",
    ],
    localized: {
      ar: ["شركة تنظيف مكاتب وشركات"],
      fr: ["Entreprise de Nettoyage Professionnel"],
      es: ["Empresa de Limpieza Comercial"],
      de: ["Gebäudereinigung"],
    },
    searchTags: ["cleaning", "janitorial", "commercial"],
  },

  // -------------------------------------------------------------
  // 5. AUTOMOTIVE & COLLISION REPAIR
  // -------------------------------------------------------------
  auto_repair: {
    canonical: "Auto Repair Shop",
    category: "Automotive Services",
    aliases: [
      "Mechanic Shop",
      "Car Repair & Diagnostic Center",
      "Transmission Specialist",
      "Brake and Tire Service",
    ],
    subSpecialties: [
      "European Auto Specialist",
      "Diesel Engine Repair",
      "Auto Electrical Repair",
    ],
    localized: {
      ar: ["ورشة صيانة سيارات", "ميكانيكي سيارات"],
      fr: ["Garage Automobile", "Mécanicien"],
      es: ["Taller Mecánico", "Reparación de Autos"],
      de: ["Autowerkstatt", "Kfz-Meisterbetrieb"],
    },
    searchTags: ["auto_repair", "mechanic", "car_service"],
  },

  // -------------------------------------------------------------
  // 6. HEALTHCARE & WELLNESS (Curated, not monopolizing)
  // -------------------------------------------------------------
  dentist: {
    canonical: "Dental Practice",
    category: "Healthcare & Wellness",
    aliases: [
      "Dentist",
      "Dental Clinic",
      "Cosmetic Dentistry",
      "Family Dental Practice",
      "Oral Health Care",
      "Dental Studio",
    ],
    subSpecialties: [
      "Orthodontist",
      "Cosmetic Dentist",
      "Pediatric Dentist",
      "Oral Surgeon",
      "Dental Implant Specialist",
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
    canonical: "Dermatology & Skin Clinic",
    category: "Healthcare & Wellness",
    aliases: [
      "Dermatologist",
      "Medical Spa",
      "Skin Care Centre",
      "Aesthetic Skin Clinic",
      "Skin Specialist",
    ],
    subSpecialties: [
      "Cosmetic Dermatologist",
      "Laser Skin Center",
      "Hair Transplant Clinic",
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
  chiropractor: {
    canonical: "Physical Therapy & Chiropractic",
    category: "Healthcare & Wellness",
    aliases: [
      "Chiropractor",
      "Chiropractic Clinic",
      "Physical Therapy Clinic",
      "Sports Injury Rehabilitation",
    ],
    subSpecialties: [
      "Sports Chiropractor",
      "Spine & Joint Rehabilitation",
      "Pediatric Chiropractic",
    ],
    localized: {
      ar: ["علاج طبيعي وتقويم العمود الفقري"],
      fr: ["Chiropraticien", "Kinésithérapeute"],
      es: ["Quiropráctico", "Fisioterapia"],
      de: ["Chiropraktiker", "Physiotherapie"],
    },
    searchTags: ["chiropractor", "physical_therapy", "rehabilitation"],
  },
  veterinarian: {
    canonical: "Veterinary Clinic",
    category: "Healthcare & Wellness",
    aliases: [
      "Animal Hospital",
      "Veterinarian Office",
      "Pet Health Clinic",
      "Emergency Vet Clinic",
    ],
    subSpecialties: [
      "Small Animal Care",
      "Pet Surgery Specialist",
      "Equine Veterinarian",
    ],
    localized: {
      ar: ["عيادة بيطرية", "طبيب بيطري"],
      fr: ["Clinique Vétérinaire"],
      es: ["Clínica Veterinaria"],
      de: ["Tierarztpraxis", "Tierklinik"],
    },
    searchTags: ["veterinary", "animal_hospital", "pet_care"],
  },

  // -------------------------------------------------------------
  // 7. HOSPITALITY & DINING
  // -------------------------------------------------------------
  catering: {
    canonical: "Catering & Banquet Service",
    category: "Hospitality & Events",
    aliases: [
      "Event Catering Company",
      "Corporate Catering Services",
      "Wedding Caterer",
      "Banquet Hall Services",
    ],
    subSpecialties: [
      "Corporate Lunch Catering",
      "Luxury Wedding Catering",
      "Private Chef Services",
    ],
    localized: {
      ar: ["خدمات ضيافة وحفلات", "تموين غذائي"],
      fr: ["Traiteur", "Service Traiteur Événementiel"],
      es: ["Servicio de Catering", "Banquetes"],
      de: ["Catering-Service", "Partyservice"],
    },
    searchTags: ["catering", "events", "food_service"],
  },
  restaurant: {
    canonical: "Fine Dining Restaurant",
    category: "Hospitality & Events",
    aliases: [
      "Restaurant",
      "Bistro",
      "Fine Dining Eatery",
      "Lounge Restaurant",
    ],
    subSpecialties: [
      "Italian Restaurant",
      "Steakhouse",
      "Seafood Restaurant",
    ],
    localized: {
      hi: ["रेस्टोरेंट", "भोजनालय"],
      ar: ["مطعم فاخر", "مطعم راقي"],
      fr: ["Restaurant Gastronomique"],
      es: ["Restaurante"],
      de: ["Restaurant"],
    },
    searchTags: ["dining", "restaurant", "food"],
  },
};

export const DEFAULT_PROFESSIONAL_NICHES: string[] = [
  "Commercial HVAC",
  "Roofing Contractor",
  "Solar Installer",
  "Law Firm",
  "CPA & Accountant",
  "Commercial Real Estate",
  "General Contractor",
  "Commercial Electrician",
  "Digital Marketing Agency",
  "Architecture Firm",
  "Commercial Plumbing",
  "Dental Practice",
];

export const NICHE_CATEGORY_PRESETS: Record<
  string,
  { label: string; description: string; niches: string[] }
> = {
  all_b2b: {
    label: "All High-Value B2B (Recommended)",
    description: "Evenly rotates through top commercial, legal, contracting, and professional services",
    niches: DEFAULT_PROFESSIONAL_NICHES,
  },
  contractors: {
    label: "Contractors & Trade Services",
    description: "HVAC, Roofing, Solar, Electrical, Plumbing, and Construction contractors",
    niches: [
      "Commercial HVAC",
      "Roofing Contractor",
      "Solar Installer",
      "Commercial Electrician",
      "Commercial Plumbing",
      "General Contractor",
      "Commercial Landscaping",
      "Painting Contractor",
      "Pest Control Services",
    ],
  },
  legal_finance: {
    label: "Legal & Financial Services",
    description: "Law firms, CPAs, Tax consultants, and Wealth management firms",
    niches: [
      "Law Firm",
      "Corporate Attorney",
      "Personal Injury Lawyer",
      "CPA & Accounting Firm",
      "Tax Consultant",
      "Wealth Management Firm",
    ],
  },
  real_estate: {
    label: "Real Estate & Architecture",
    description: "Commercial brokerages, Property managers, and Architecture firms",
    niches: [
      "Commercial Real Estate",
      "Property Management",
      "Architecture Firm",
      "Interior Design Studio",
      "General Contractor",
    ],
  },
  digital_tech: {
    label: "Digital & Tech Services",
    description: "Digital agencies, Managed IT MSPs, and Commercial facility services",
    niches: [
      "Digital Marketing Agency",
      "SEO Company",
      "Managed IT Services (MSP)",
      "Commercial Cleaning Services",
    ],
  },
  healthcare: {
    label: "Healthcare & Wellness",
    description: "Private dental practices, Dermatology, Physical therapy, and Vet clinics",
    niches: [
      "Dental Practice",
      "Cosmetic Dentistry",
      "Dermatology & Skin Clinic",
      "Physical Therapy & Chiropractic",
      "Veterinary Clinic",
    ],
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
 * Expands a simple search term into a controlled, high-yield set of variants without turning everything into a clinic.
 */
export function expandNicheQuery(
  rawNiche: string,
  country?: string,
  includeSubSpecialties = true,
  maxVariants = 6
): {
  canonical: string;
  category: string;
  variants: string[];
  searchTags: string[];
} {
  const cleanRaw = (rawNiche || "").trim();
  if (!cleanRaw) {
    return {
      canonical: "Commercial Services",
      category: "Professional Services",
      variants: ["Commercial Services", "Business Services"],
      searchTags: ["business"],
    };
  }

  const normalized = cleanRaw.toLowerCase().replace(/[^a-z0-9]/g, "");

  let matchedKey: string | undefined;
  const rawLower = cleanRaw.toLowerCase();

  for (const [key, def] of Object.entries(NICHE_TAXONOMY)) {
    if (
      key === normalized ||
      def.canonical.toLowerCase() === rawLower ||
      rawLower.includes(def.canonical.toLowerCase()) ||
      def.canonical.toLowerCase().includes(rawLower) ||
      def.aliases.some((a) => a.toLowerCase() === rawLower || rawLower.includes(a.toLowerCase()) || a.toLowerCase().includes(rawLower)) ||
      def.subSpecialties.some((s) => s.toLowerCase() === rawLower || rawLower.includes(s.toLowerCase()))
    ) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    const titleCase = cleanRaw
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    return {
      canonical: titleCase,
      category: "Commercial Services",
      variants: [
        titleCase,
        `${titleCase} Services`,
        `${titleCase} Company`,
        `${titleCase} Contractor`,
        `${titleCase} Agency`,
      ].slice(0, maxVariants),
      searchTags: [cleanRaw.toLowerCase()],
    };
  }

  const def = NICHE_TAXONOMY[matchedKey];
  const variantsSet = new Set<string>();

  const titleCaseNiche = cleanRaw
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  variantsSet.add(titleCaseNiche);
  variantsSet.add(def.canonical);

  for (const alias of def.aliases) {
    variantsSet.add(alias);
  }

  if (includeSubSpecialties) {
    for (const sub of def.subSpecialties.slice(0, 3)) {
      variantsSet.add(sub);
    }
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
