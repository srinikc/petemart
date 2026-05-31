// =============================================================================
// PeteMart — Data Generation Script
// =============================================================================
// Reads the 406-store merchant dataset (store_inventory_datasets.json) and
// generates lib/generated-data.ts with all merchants, products, markets, etc.
// =============================================================================

const fs = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const DATASET_PATH = path.resolve(
  __dirname, '..', '..', '..', '..', '..',
  'agents', '01_front_office', '01_ideation_agent', 'store_inventory_datasets.json'
);
const OUTPUT_PATH = path.resolve(__dirname, '..', 'lib', 'generated-data.ts');

// ── Product templates by category ─────────────────────────────────────────────
const PRODUCT_TEMPLATES = {
  'Textiles & Apparel': [
    { name: 'Traditional Silk Saree', price: 12500, mrp: 15000 },
    { name: 'Cotton Printed Saree', price: 1800, mrp: 2200 },
    { name: 'Designer Blouse Piece', price: 850, mrp: 1200 },
    { name: 'Men Kurta Pyjama Set', price: 1499, mrp: 1999 },
    { name: 'Children Ethnic Wear Set', price: 999, mrp: 1499 },
    { name: 'Handloom Stole', price: 650, mrp: 899 },
    { name: 'Embroidered Dupatta', price: 450, mrp: 699 },
    { name: 'Fabric (Per Meter)', price: 350, mrp: 450 },
    { name: 'Ready Made Blouse', price: 1200, mrp: 1600 },
    { name: 'Wedding Lehenga Choli', price: 25000, mrp: 35000 },
  ],
  'Plastics & Household': [
    { name: 'Plastic Storage Box (Large)', price: 499, mrp: 699 },
    { name: 'Kitchen Container Set (5 pcs)', price: 349, mrp: 499 },
    { name: 'Stainless Steel Tiffin Box', price: 299, mrp: 399 },
    { name: 'Plastic Bucket (15L)', price: 179, mrp: 249 },
    { name: 'Steel Water Bottle (1L)', price: 399, mrp: 549 },
    { name: 'Food Grade Plastic Jar', price: 249, mrp: 349 },
    { name: 'Plastic Basin (Medium)', price: 149, mrp: 199 },
    { name: 'Kitchen Rack (Wall Mount)', price: 599, mrp: 799 },
    { name: 'Steel Lunch Box (3-tier)', price: 699, mrp: 949 },
    { name: 'Plastic Dustbin (Small)', price: 129, mrp: 179 },
  ],
  'Provisions & Grocery': [
    { name: 'Premium Basmati Rice (1kg)', price: 120, mrp: 150 },
    { name: 'Toor Dal (1kg)', price: 145, mrp: 175 },
    { name: 'Sugar (1kg)', price: 48, mrp: 55 },
    { name: 'Cooking Oil (1L)', price: 195, mrp: 220 },
    { name: 'Wheat Flour Atta (5kg)', price: 225, mrp: 275 },
    { name: 'Mixed Spices Pack', price: 85, mrp: 110 },
    { name: 'Sunflower Oil (1L)', price: 180, mrp: 210 },
    { name: 'Tea Powder (500g)', price: 150, mrp: 185 },
    { name: 'Salt (1kg)', price: 18, mrp: 25 },
    { name: 'Dry Fruits Mix (500g)', price: 450, mrp: 550 },
  ],
  'Grocery, FMCG & Provisions': [
    { name: 'Grocery Combo Pack', price: 599, mrp: 750 },
    { name: 'Breakfast Cereal (500g)', price: 220, mrp: 280 },
    { name: 'Biscuit Family Pack', price: 120, mrp: 150 },
    { name: 'Instant Noodles (12 pk)', price: 180, mrp: 220 },
    { name: 'Cooking Oil (5L)', price: 885, mrp: 990 },
    { name: 'Masala Pack (6 types)', price: 240, mrp: 300 },
    { name: 'Rice (25kg bag)', price: 1450, mrp: 1700 },
    { name: 'Detergent Powder (5kg)', price: 425, mrp: 500 },
    { name: 'Soap Multipack (6)', price: 180, mrp: 220 },
    { name: 'Floor Cleaner (5L)', price: 320, mrp: 390 },
  ],
  'Books & Stationery': [
    { name: 'Academic Notebook (200 pgs)', price: 85, mrp: 120 },
    { name: 'Ball Pen Pack (10)', price: 100, mrp: 150 },
    { name: 'Color Pencil Set (24)', price: 180, mrp: 250 },
    { name: 'Children Story Book', price: 250, mrp: 350 },
    { name: 'Sketch Book (A4)', price: 120, mrp: 175 },
    { name: 'Water Color Set', price: 95, mrp: 140 },
    { name: 'College Ruled Pad', price: 65, mrp: 95 },
    { name: 'Exam Board (Small)', price: 45, mrp: 70 },
    { name: 'Geometry Box', price: 150, mrp: 210 },
    { name: 'Gift Wrap Set', price: 75, mrp: 110 },
  ],
  'Jewellery & Accessories': [
    { name: 'Traditional Gold Necklace', price: 45000, mrp: 55000 },
    { name: 'Silver Anklet (Pair)', price: 2800, mrp: 3500 },
    { name: 'Designer Earrings', price: 1200, mrp: 1800 },
    { name: 'Pearl Mala (Long)', price: 3500, mrp: 4500 },
    { name: 'Gold Plated Bangles (Set)', price: 2500, mrp: 3200 },
    { name: 'Silver Ring (Traditional)', price: 1800, mrp: 2400 },
    { name: 'Fashion Necklace Set', price: 650, mrp: 999 },
    { name: 'Pendants & Chains (Set)', price: 3200, mrp: 4200 },
    { name: 'Bridal Jewellery Set', price: 15000, mrp: 20000 },
    { name: 'Kids Silver Anklet', price: 1200, mrp: 1600 },
  ],
  'Gifts & Return Gifts': [
    { name: 'Decorative Showpiece', price: 450, mrp: 650 },
    { name: 'Gift Hamper (Premium)', price: 1200, mrp: 1600 },
    { name: 'Photo Frame (Set of 4)', price: 350, mrp: 499 },
    { name: 'Wall Hanging Decor', price: 280, mrp: 399 },
    { name: 'Pooja Gift Set', price: 550, mrp: 750 },
    { name: 'Crystal Paper Weight', price: 250, mrp: 399 },
    { name: 'Scented Candle Set', price: 320, mrp: 450 },
    { name: 'Keychain Gift Set (12)', price: 180, mrp: 250 },
    { name: 'Miniature Figurine', price: 220, mrp: 320 },
    { name: 'Corporate Gift Mug Set', price: 450, mrp: 599 },
  ],
  'Electronics & Electricals': [
    { name: 'LED Bulb (9W)', price: 120, mrp: 180 },
    { name: 'Extension Cord (6-way)', price: 350, mrp: 499 },
    { name: 'USB Wall Charger (2A)', price: 250, mrp: 350 },
    { name: 'DC Fan Regulator', price: 280, mrp: 399 },
    { name: 'Switch Board (4-module)', price: 180, mrp: 260 },
    { name: 'Emergency LED Light', price: 420, mrp: 599 },
    { name: 'Wire (PVC, 1mm, 10m)', price: 350, mrp: 450 },
    { name: 'Doorbell (Wireless)', price: 320, mrp: 450 },
    { name: 'MCB (16A Single Pole)', price: 150, mrp: 220 },
    { name: 'Ceiling Fan (1200mm)', price: 2200, mrp: 2900 },
  ],
  'Hardware & Construction': [
    { name: 'PVC Pipe (1 inch, 6m)', price: 320, mrp: 420 },
    { name: 'Ball Valve (1 inch)', price: 180, mrp: 250 },
    { name: 'Screw Set (100 pcs)', price: 120, mrp: 175 },
    { name: 'Wall Putty (5kg)', price: 280, mrp: 360 },
    { name: 'Door Lock (Premium)', price: 450, mrp: 599 },
    { name: 'Hinges Set (4 pcs)', price: 95, mrp: 140 },
    { name: 'Paint Brush (2 inch)', price: 65, mrp: 99 },
    { name: 'PVC Cement (100ml)', price: 85, mrp: 130 },
    { name: 'Sandpaper Assorted (10)', price: 50, mrp: 80 },
    { name: 'Tape Measure (5m)', price: 110, mrp: 160 },
  ],
  'Pharmaceuticals & Medical': [
    { name: 'First Aid Kit (Small)', price: 180, mrp: 250 },
    { name: 'Digital Thermometer', price: 320, mrp: 450 },
    { name: 'BP Monitor (Arm)', price: 2200, mrp: 2800 },
    { name: 'Surgical Masks (50 pk)', price: 150, mrp: 200 },
    { name: 'Glucose Powder (500g)', price: 85, mrp: 120 },
    { name: 'Multivitamin Tablets (30)', price: 280, mrp: 360 },
    { name: 'Elastic Bandage', price: 65, mrp: 95 },
    { name: 'Cotton Wool (100g)', price: 45, mrp: 70 },
    { name: 'Hand Sanitizer (500ml)', price: 120, mrp: 175 },
    { name: 'Medicine Organizer Box', price: 220, mrp: 300 },
  ],
  'Beauty & Cosmetics': [
    { name: 'Face Cream (50g)', price: 220, mrp: 299 },
    { name: 'Herbal Shampoo (200ml)', price: 180, mrp: 250 },
    { name: 'Body Lotion (400ml)', price: 199, mrp: 280 },
    { name: 'Lipstick (Matte)', price: 350, mrp: 480 },
    { name: 'Hair Oil (Cold Pressed, 200ml)', price: 280, mrp: 380 },
    { name: 'Sunscreen SPF 50', price: 320, mrp: 420 },
    { name: 'Face Wash (100g)', price: 149, mrp: 210 },
    { name: 'Soap (Herbal, 3 pk)', price: 120, mrp: 170 },
    { name: 'Nail Paint Set (12)', price: 250, mrp: 340 },
    { name: 'Perfume Body Spray (150ml)', price: 399, mrp: 550 },
  ],
  'Florist & Fresh Flowers': [
    { name: 'Mixed Roses Bouquet (24)', price: 850, mrp: 1200 },
    { name: 'Marigold Garland (Long)', price: 250, mrp: 350 },
    { name: 'Wedding Floral Arch (Set)', price: 3500, mrp: 5000 },
    { name: 'Lily Bouquet (Premium)', price: 1200, mrp: 1600 },
    { name: 'Temple Flower Pack', price: 150, mrp: 200 },
    { name: 'Orchid Pot (Small)', price: 650, mrp: 899 },
    { name: 'Festival Marigold (1kg)', price: 350, mrp: 450 },
    { name: 'Floral Centerpiece', price: 1800, mrp: 2400 },
    { name: 'Jasmine Garland', price: 120, mrp: 180 },
    { name: 'Bridal Bouquet (Custom)', price: 2500, mrp: 3500 },
  ],
  'Bakery & Cafe': [
    { name: 'Belgian Choco Truffle Pastry', price: 180, mrp: 220 },
    { name: 'Red Velvet Cake (1kg)', price: 1200, mrp: 1500 },
    { name: 'Mixed Fruit Croissant', price: 150, mrp: 200 },
    { name: 'Garlic Bread (8 pcs)', price: 180, mrp: 240 },
    { name: 'Pineapple Pastry (Box of 6)', price: 480, mrp: 600 },
    { name: 'Mango Mousse (Glass)', price: 220, mrp: 280 },
    { name: 'Brownie with Ice Cream', price: 250, mrp: 320 },
    { name: 'Blueberry Muffin (4 pcs)', price: 260, mrp: 340 },
    { name: 'Custom Celebration Cake (2kg)', price: 2000, mrp: 2800 },
    { name: 'Cold Coffee (Premium)', price: 180, mrp: 220 },
  ],
  'Outdoor Clothing & Equipment': [
    { name: 'Camping Tent (4 person)', price: 4500, mrp: 5999 },
    { name: 'Hiking Backpack (60L)', price: 2800, mrp: 3600 },
    { name: 'Sleeping Bag (Winter)', price: 2200, mrp: 2900 },
    { name: 'Waterproof Jacket', price: 1800, mrp: 2400 },
    { name: 'Hiking Shoes (Pair)', price: 3200, mrp: 4200 },
    { name: 'LED Camping Lantern', price: 650, mrp: 899 },
    { name: 'Trekking Pole (Pair)', price: 1200, mrp: 1600 },
    { name: 'Insulated Water Bottle', price: 450, mrp: 599 },
    { name: 'Mosquito Net (Camping)', price: 380, mrp: 500 },
    { name: 'Compass + Whistle Set', price: 180, mrp: 250 },
  ],
  'Food & Beverage': [
    { name: 'Chicken Biryani (Family Pack)', price: 450, mrp: 550 },
    { name: 'Veg Thali Meal', price: 180, mrp: 220 },
    { name: 'Fresh Juice (Mixed Fruit)', price: 80, mrp: 110 },
    { name: 'Gobi Manchurian (Full)', price: 150, mrp: 190 },
    { name: 'Butter Masala Dosa', price: 120, mrp: 160 },
    { name: 'Sweets Box (Assorted 1kg)', price: 650, mrp: 800 },
    { name: 'Soft Drink Can (330ml)', price: 40, mrp: 50 },
    { name: 'Ice Cream (Vanilla 1L)', price: 280, mrp: 350 },
    { name: 'Samosa (Pack of 10)', price: 150, mrp: 190 },
    { name: 'Mango Lassi (Large)', price: 100, mrp: 140 },
  ],
};

// ── Market IDs (21 Pete markets mapped to IDs) ────────────────────────────────
const MARKET_IDS = {
  'Chickpet': 'market-1',
  'Balepet': 'market-2',
  'Raja Market': 'market-3',
  'Mamulpet': 'market-4',
  'Cubbonpet': 'market-5',
  'Tharagpet': 'market-6',
  'Avenue Road': 'market-7',
  'Sultanpet': 'market-8',
  'KR Market': 'market-9',
  'Kumbarpete': 'market-10',
  'SP Road': 'market-11',
  'SJP Road': 'market-12',
  'Huriopet': 'market-13',
  'Basettyetpet': 'market-14',
  'BVK Iyengar Road': 'market-15',
  'Akkipete': 'market-16',
  'RT Street': 'market-17',
  'Kilari Road': 'market-18',
  'Santhusapet': 'market-19',
  'Cottonpet': 'market-20',
  'Sowrastra Pet': 'market-21',
};

// ── Market metadata ───────────────────────────────────────────────────────────
const MARKET_METADATA = {
  'Chickpet': {
    name: 'Chickpet', slug: 'chickpet',
    description: 'The Textile Heart of Bangalore',
    specialization: 'Textiles, Silk, Sarees',
    historical_summary: "One of Bangalore's oldest markets, Chickpet has been the textile hub for over a century. Known for its narrow lanes lined with shops selling everything from Kanjivaram silk to cotton fabrics.",
    image_url: '/images/markets/chickpet.jpg',
  },
  'Balepet': {
    name: 'Balepet', slug: 'balepet',
    description: 'Household & Everyday Essentials',
    specialization: 'Household, Florists, Bakery, Textiles',
    historical_summary: 'Balepet market dates back to the early 1900s and serves as the neighborhood hub for daily essentials, fresh flowers, and traditional textiles.',
    image_url: '/images/markets/balepet.jpg',
  },
  'Raja Market': {
    name: 'Raja Market', slug: 'raja-market',
    description: 'Jewellery & Traditional Crafts',
    specialization: 'Jewellery, Gold, Silver, Crafts',
    historical_summary: 'Raja Market is synonymous with fine jewellery and traditional crafts. Established in the 1940s, it houses generations of master jewellers and craftsmen.',
    image_url: '/images/markets/raja-market.jpg',
  },
  'Mamulpet': {
    name: 'Mamulpet', slug: 'mamulpet',
    description: 'Wholesale & Bulk Goods',
    specialization: 'Wholesale, Spices, Dry Fruits',
    historical_summary: 'Mamulpet has been the wholesale backbone of Bangalore for generations, supplying spices, dry fruits, and bulk provisions across the city.',
    image_url: '/images/markets/mamulpet.jpg',
  },
  'Cubbonpet': {
    name: 'Cubbonpet', slug: 'cubbonpet',
    description: 'Electronics & Hardware',
    specialization: 'Electronics, Hardware, Tools',
    historical_summary: 'Named after Sir Mark Cubbon, this market district has evolved from a general trading hub to a specialized electronics and hardware market.',
    image_url: '/images/markets/cubbonpet.jpg',
  },
  'Tharagpet': {
    name: 'Tharagpet', slug: 'tharagpet',
    description: 'Grains & Spices Market',
    specialization: 'Grains, Pulses, Spices, Heavy Groceries',
    historical_summary: 'Tharagpet is the historic grain and spice market of Bangalore, supplying premium quality pulses and spices to the entire city since the 1800s.',
    image_url: '/images/markets/tharagpet.jpg',
  },
  'Avenue Road': {
    name: 'Avenue Road', slug: 'avenue-road',
    description: 'Books & Stationery Hub',
    specialization: 'Academic Books, Stationery, Toys',
    historical_summary: 'Avenue Road is Bangalore premier destination for academic books, stationery supplies, and educational materials, serving students and professionals.',
    image_url: '/images/markets/avenue-road.jpg',
  },
  'Sultanpet': {
    name: 'Sultanpet', slug: 'sultanpet',
    description: 'Paper & Stationery Wholesale',
    specialization: 'Wholesale Paper, Wedding Cards, Stationery',
    historical_summary: 'Sultanpet is the wholesale hub for paper products, wedding invitation cards, and bulk stationery supplies, serving retailers across Karnataka.',
    image_url: '/images/markets/sultanpet.jpg',
  },
  'KR Market': {
    name: 'KR Market', slug: 'kr-market',
    description: 'Flowers & Fresh Produce',
    specialization: 'Wholesale Flowers, Fresh Produce, Spices',
    historical_summary: 'KR Market (Krishna Rajendra Market) is Bangalore oldest and largest wholesale market for flowers, fresh produce, and puja goods, operating since 1920.',
    image_url: '/images/markets/kr-market.jpg',
  },
  'Kumbarpete': {
    name: 'Kumbarpete', slug: 'kumbarpete',
    description: 'Clay & Metal Utensils',
    specialization: 'Clay Pots, Steel/Metalware, Toys',
    historical_summary: 'Kumbarpete is the traditional market for clay pots and steel utensils, housing artisans and craftsmen who have served Bangalore kitchens for generations.',
    image_url: '/images/markets/kumbarpete.jpg',
  },
  'SP Road': {
    name: 'SP Road', slug: 'sp-road',
    description: 'Electronics Components',
    specialization: 'Electronic Components, IT Spares, Testing Equipment',
    historical_summary: "SP Road is Bangalore's go-to destination for electronic components, ICs, and IT spares, serving hobbyists and professionals since the 1990s.",
    image_url: '/images/markets/sp-road.jpg',
  },
  'SJP Road': {
    name: 'SJP Road', slug: 'sjp-road',
    description: 'Sanitaryware & Plumbing',
    specialization: 'Sanitaryware, Plumbing Fittings, Hardware',
    historical_summary: 'SJP Road specializes in sanitaryware, plumbing fittings, and construction hardware, supplying builders and contractors across Bangalore.',
    image_url: '/images/markets/sjp-road.jpg',
  },
  'Huriopet': {
    name: 'Huriopet', slug: 'huriopet',
    description: 'Cords & Packaging Hub',
    specialization: 'Cords, Ropes, Twines, Packaging Materials',
    historical_summary: 'Huriopet is the specialized market for cords, ropes, and packaging materials, catering to industrial and retail packaging needs across Karnataka.',
    image_url: '/images/markets/huriopet.jpg',
  },
  'Basettyetpet': {
    name: 'Basettyetpet', slug: 'basettyetpet',
    description: 'Decorative Lighting',
    specialization: 'Decorative Lighting, Chandeliers, Electrical Fittings',
    historical_summary: 'Basettyetpet is renowned for decorative lighting solutions, chandeliers, and electrical fittings, illuminating homes and businesses since the 1950s.',
    image_url: '/images/markets/basettyetpet.jpg',
  },
  'BVK Iyengar Road': {
    name: 'BVK Iyengar Road', slug: 'bvk-iyengar-road',
    description: 'Electrical Accessories',
    specialization: 'Electrical Accessories, Wires, Switchgears',
    historical_summary: 'BVK Iyengar Road is the primary market for electrical accessories and wiring solutions, serving electricians and contractors across Bangalore.',
    image_url: '/images/markets/bvk-iyengar.jpg',
  },
  'Akkipete': {
    name: 'Akkipete', slug: 'akkipete',
    description: 'Pharmaceuticals & Rice Trading',
    specialization: 'Pharmaceuticals, Medical Equipment, Rice Trading',
    historical_summary: 'Akkipete serves as a key hub for pharmaceutical distribution and rice trading, combining healthcare access with wholesale grain commerce.',
    image_url: '/images/markets/akkipete.jpg',
  },
  'RT Street': {
    name: 'RT Street', slug: 'rt-street',
    description: 'Readymade Garments',
    specialization: 'Readymade Garments, Hosiery, Fancy Novelties',
    historical_summary: 'RT Street is the vibrant hub for readymade garments and hosiery, offering fashion apparel at wholesale prices to retailers across the region.',
    image_url: '/images/markets/rt-street.jpg',
  },
  'Kilari Road': {
    name: 'Kilari Road', slug: 'kilari-road',
    description: 'Printing & Stationery',
    specialization: 'Printing Presses, Stationery, Gold Refining',
    historical_summary: 'Kilari Road hosts traditional printing presses and stationery shops, alongside historic gold and silver refining businesses dating back a century.',
    image_url: '/images/markets/kilari-road.jpg',
  },
  'Santhusapet': {
    name: 'Santhusapet', slug: 'santhusapet',
    description: 'Furniture & Woodworks',
    specialization: 'Furniture, Woodworks, Home Decor',
    historical_summary: 'Santhusapet is the traditional furniture market of Bangalore, known for custom woodworks and home decor items crafted by skilled artisans.',
    image_url: '/images/markets/santhusapet.jpg',
  },
  'Cottonpet': {
    name: 'Cottonpet', slug: 'cottonpet',
    description: 'Cotton & Textile Market',
    specialization: 'Cotton, Textiles, Bedding, Towels',
    historical_summary: 'Cottonpet lives up to its name as the cotton market of Bangalore, specializing in bed linens, towels, and cotton textiles for over a century.',
    image_url: '/images/markets/cottonpet.jpg',
  },
  'Sowrastra Pet': {
    name: 'Sowrastra Pet', slug: 'sowrastra-pet',
    description: 'Handicrafts & Traditional Wares',
    specialization: 'Handicrafts, Traditional Wares, Antiques',
    historical_summary: 'Sowrastra Pet is home to artisans specializing in traditional crafts, handcrafted wares, and antique collectibles, preserving centuries-old art forms.',
    image_url: '/images/markets/sowrastra-pet.jpg',
  },
};

// ── Main Generation ───────────────────────────────────────────────────────────
function generate() {
  // Read dataset
  let content = fs.readFileSync(DATASET_PATH, 'utf8');
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  const dataset = JSON.parse(content);
  const rawStores = dataset.store_inventory_datasets;

  console.log(`Found ${rawStores.length} stores in dataset`);

  // ── Generate Markets ──────────────────────────────────────────────────────
  const marketEntries = [];
  const marketOrder = Object.keys(MARKET_METADATA);
  for (const marketName of marketOrder) {
    const meta = MARKET_METADATA[marketName];
    const storesInMarket = rawStores.filter(s => s.market === marketName);
    marketEntries.push({
      id: MARKET_IDS[marketName],
      name: meta.name,
      slug: meta.slug,
      description: meta.description,
      specialization: meta.specialization,
      historical_summary: meta.historical_summary,
      image_url: meta.image_url,
      merchant_count: storesInMarket.length,
    });
  }

  // ── Generate Merchants ────────────────────────────────────────────────────
  const digitalReadinessLevels = ['Low', 'Medium', 'High'];
  const merchantEntries = [];
  const merchantUserIds = {};

  for (let i = 0; i < rawStores.length; i++) {
    const store = rawStores[i];
    const marketId = MARKET_IDS[store.market] || 'market-1';
    const slug = store.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60) || `store-${i + 1}`;

    // Unique suffix to avoid duplicate slugs
    const uniqueSlug = rawStores.some((s, j) => j !== i && 
      s.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 60) === slug)
      ? `${slug}-${store.store_id.replace('pm-store-', '')}`
      : slug;

    const readiness = digitalReadinessLevels[
      store.has_store_photos ? (store.has_video ? 2 : 1) : 0
    ];

    const userId = `merch-${String(i + 1).padStart(3, '0')}`;
    merchantUserIds[store.store_id] = userId;

    merchantEntries.push({
      id: `merchant-${String(i + 1).padStart(3, '0')}`,
      user_id: userId,
      store_name: store.name,
      slug: uniqueSlug,
      market_id: marketId,
      category: store.category,
      description: `${store.subcategory || store.category} — ${store.address || ''}`.trim(),
      logo_url: store.has_store_photos ? `/images/merchants/merchant-${i + 1}-logo.jpg` : null,
      banner_url: null,
      business_hours: store.business_hours || { 'Mon-Sat': '10:00 AM - 7:00 PM', 'Sun': 'Closed' },
      modes_enabled: ['A', 'B', 'C'],
      status: store.subscription_tier === 'premium' ? 'active' : (store.rating >= 4 ? 'active' : 'pending'),
      rating: store.rating || 4.0,
      digital_readiness: readiness,
      // Extra data from dataset
      phone: store.phone || '',
      address: store.address || '',
      years_in_business: store.years_in_business || 0,
      gst_registered: store.gst_registered || false,
      delivery_radius_km: store.delivery_radius_km || 5,
      product_catalog_count: store.product_catalog_count || 0,
    });
  }

  // ── Generate Products ─────────────────────────────────────────────────────
  const productEntries = [];
  let prodCounter = 0;

  for (let i = 0; i < merchantEntries.length; i++) {
    const merchant = merchantEntries[i];
    const templates = PRODUCT_TEMPLATES[merchant.category] || PRODUCT_TEMPLATES['Textiles & Apparel'];
    const numProducts = Math.min(
      templates.length,
      Math.max(5, Math.ceil((merchant.product_catalog_count || 100) / 50))
    );

    // Pick a varied subset
    const selectedTemplates = [];
    const indices = Array.from({ length: templates.length }, (_, k) => k);
    for (let p = 0; p < numProducts; p++) {
      const idx = (i * 7 + p * 13) % indices.length;
      if (!selectedTemplates.includes(idx)) selectedTemplates.push(idx);
    }

    for (const idx of selectedTemplates) {
      if (idx >= templates.length) continue;
      prodCounter++;
      const tpl = templates[idx];
      const productName = `${tpl.name} - ${merchant.store_name.substring(0, 20)}`.trim();
      productEntries.push({
        id: `prod-${String(prodCounter).padStart(5, '0')}`,
        merchant_id: merchant.id,
        merchant_name: merchant.store_name,
        name: productName,
        description: `High-quality ${tpl.name.toLowerCase()} available at ${merchant.store_name}. ${merchant.description}`,
        price: tpl.price + (i % 3) * 50, // slight variation
        mrp: tpl.mrp,
        stock_count: 10 + (i * 7 + idx * 13) % 90,
        images: [`/images/products/category-${merchant.category.substring(0, 3).toLowerCase()}-${idx}.jpg`],
        category: merchant.category,
        mode_badges: ['A', 'B', 'C'],
        sku: `PM-${String(i + 1).padStart(3, '0')}-${String(idx + 1).padStart(3, '0')}`,
        rating: Math.round((merchant.rating + (idx % 5) * 0.1) * 10) / 10 || 4.0,
        review_count: Math.floor(Math.random() * 50 + 5),
        is_active: merchant.status === 'active',
      });
    }
  }

  console.log(`Generated ${marketEntries.length} markets`);
  console.log(`Generated ${merchantEntries.length} merchants`);
  console.log(`Generated ${productEntries.length} products`);

  // ── Generate Orders (keep existing plus some) ──────────────────────────────
  const orderEntries = [
    {
      id: 'order-1', order_id: 'PM-20260530-001', user_id: 'cust-001',
      status: 'in_transit', total: 12550, delivery_fee: 30, subtotal: 12500,
      items: [
        { id: 'item-1', product_name: 'Traditional Silk Saree - Kuberan Sili', quantity: 1, unit_price: 12500, total_price: 12500 },
      ],
      created_at: '2026-05-30T10:30:00Z',
      delivery_address: {
        id: 'addr-1', name: 'Priya Sharma', phone: '9999999999',
        line1: '42, Jayanagar 4th Block', line2: 'Near Jain Temple',
        city: 'Bangalore', pincode: '560011', is_default: true,
      },
      merchant_name: merchantEntries[0]?.store_name || 'Store',
    },
    {
      id: 'order-2', order_id: 'PM-20260529-002', user_id: 'cust-001',
      status: 'delivered', total: 3500, delivery_fee: 70, subtotal: 3430,
      items: [
        { id: 'item-4', product_name: 'Mixed Roses Bouquet (24)', quantity: 1, unit_price: 850, total_price: 850 },
        { id: 'item-5', product_name: 'Belgian Choco Truffle Pastry', quantity: 2, unit_price: 180, total_price: 360 },
      ],
      created_at: '2026-05-29T14:00:00Z',
      delivery_address: {
        id: 'addr-1', name: 'Priya Sharma', phone: '9999999999',
        line1: '42, Jayanagar 4th Block', line2: 'Near Jain Temple',
        city: 'Bangalore', pincode: '560011', is_default: true,
      },
      merchant_name: merchantEntries[2]?.store_name || 'Store',
    },
    {
      id: 'order-3', order_id: 'PM-20260528-003', user_id: 'cust-001',
      status: 'cancelled', total: 2400, delivery_fee: 30, subtotal: 2400,
      items: [
        { id: 'item-8', product_name: 'Designer Blouse Piece', quantity: 1, unit_price: 850, total_price: 850 },
      ],
      created_at: '2026-05-28T09:15:00Z',
      delivery_address: {
        id: 'addr-1', name: 'Priya Sharma', phone: '9999999999',
        line1: '42, Jayanagar 4th Block', line2: 'Near Jain Temple',
        city: 'Bangalore', pincode: '560011', is_default: true,
      },
      merchant_name: merchantEntries[0]?.store_name || 'Store',
    },
  ];

  // ── Write TypeScript File ─────────────────────────────────────────────────
  const lines = [
    '// =============================================================================',
    '// PeteMart — GENERATED DATA LAYER',
    '// =============================================================================',
    '// This file is AUTO-GENERATED by scripts/generate-data.js',
    '// DO NOT EDIT MANUALLY. Run `node scripts/generate-data.js` to regenerate.',
    '// =============================================================================',
    '',
    'import type { Market, Merchant, Product, Order, CartItem, Address } from \'@/types\';',
    '',
    '// =============================================================================',
    '// MARKETS (21 Pete Market areas)',
    '// =============================================================================',
    '',
    'export const MARKETS: Market[] = ' + JSON.stringify(marketEntries, null, 2) + ';',
    '',
    '// =============================================================================',
    '// MERCHANTS (406 stores across 21 markets)',
    '// =============================================================================',
    '',
    'export const MERCHANTS: Merchant[] = ' + JSON.stringify(merchantEntries, null, 2) + ';',
    '',
    '// =============================================================================',
    '// PRODUCTS',
    '// =============================================================================',
    '',
    'export const PRODUCTS: Product[] = ' + JSON.stringify(productEntries, null, 2) + ';',
    '',
    '// =============================================================================',
    '// ORDERS',
    '// =============================================================================',
    '',
    'export const ORDERS: Order[] = ' + JSON.stringify(orderEntries, null, 2) + ';',
    '',
    '// =============================================================================',
    '// CART ITEMS',
    '// =============================================================================',
    '',
    'export const CART_ITEMS: CartItem[] = ' + JSON.stringify([
      {
        id: 'cart-1', product_id: productEntries[0]?.id || 'prod-00001',
        merchant_id: merchantEntries[0]?.id || 'merchant-001',
        merchant_name: merchantEntries[0]?.store_name || 'Store',
        product_name: productEntries[0]?.name || 'Product',
        price: productEntries[0]?.price || 100,
        quantity: 1, image: '/images/products/default.jpg', mode: 'A',
      },
      {
        id: 'cart-2', product_id: productEntries[1]?.id || 'prod-00002',
        merchant_id: merchantEntries[0]?.id || 'merchant-001',
        merchant_name: merchantEntries[0]?.store_name || 'Store',
        product_name: productEntries[1]?.name || 'Product 2',
        price: productEntries[1]?.price || 200,
        quantity: 2, image: '/images/products/default.jpg', mode: 'A',
      },
    ], null, 2) + ';',
    '',
    '// =============================================================================',
    '// ADDRESSES',
    '// =============================================================================',
    '',
    'export const ADDRESSES: Address[] = ' + JSON.stringify([
      {
        id: 'addr-1', name: 'Home', phone: '9999999999',
        line1: '42, Jayanagar 4th Block', line2: 'Near Jain Temple, 2nd Main Road',
        city: 'Bangalore', pincode: '560011', landmark: 'Near Jain Temple', is_default: true,
      },
      {
        id: 'addr-2', name: 'Office', phone: '9999999999',
        line1: 'MG Road, Unity Building', line2: '5th Floor, Suite 502',
        city: 'Bangalore', pincode: '560001', landmark: 'Opposite MG Road Metro', is_default: false,
      },
    ], null, 2) + ';',
    '',
    'export const ORDER_STATUSES = ' + JSON.stringify([
      { key: 'confirmed', label: 'Order Confirmed', date: '2026-05-30T10:35:00Z' },
      { key: 'picked_up', label: 'Picked Up', date: '2026-05-30T11:20:00Z' },
      { key: 'consolidated', label: 'Consolidated', date: '2026-05-30T12:00:00Z' },
      { key: 'in_transit', label: 'In Transit', date: '2026-05-30T12:45:00Z' },
    ], null, 2) + ';',
    '',
    '// =============================================================================',
    '// HELPER FUNCTIONS',
    '// =============================================================================',
    '',
    'export function getMerchantsByMarket(marketSlug: string): Merchant[] {',
    '  const market = MARKETS.find(m => m.slug === marketSlug);',
    '  if (!market) return [];',
    '  return MERCHANTS.filter(m => m.market_id === market.id);',
    '}',
    '',
    'export function getProductsByMerchant(merchantId: string): Product[] {',
    '  return PRODUCTS.filter(p => p.merchant_id === merchantId);',
    '}',
    '',
    'export function getMerchant(id: string): Merchant | undefined {',
    '  return MERCHANTS.find(m => m.id === id);',
    '}',
    '',
    'export function getProduct(id: string): Product | undefined {',
    '  return PRODUCTS.find(p => p.id === id);',
    '}',
    '',
    'export function getMerchantBySlug(slug: string): Merchant | undefined {',
    '  return MERCHANTS.find(m => m.slug === slug);',
    '}',
    '',
    'export function getProductById(id: string): Product | undefined {',
    '  return PRODUCTS.find(p => p.id === id);',
    '}',
    '',
    '// =============================================================================',
    '// SUMMARY STATS',
    '// =============================================================================',
    '',
    'export const DATA_SUMMARY = {',
    '  totalMarkets: MARKETS.length,',
    '  totalMerchants: MERCHANTS.length,',
    '  totalProducts: PRODUCTS.length,',
    '  totalOrders: ORDERS.length,',
    '};',
  ];

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');
  console.log(`\nGenerated data written to: ${OUTPUT_PATH}`);
}

generate();
