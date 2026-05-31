// PeteMart Product Data Module - Simplified for POC
// Full product JSON data is in /data/products-*.json files

export interface Product {
  id: string;
  store_id: string;
  merchant_slug: string;
  name: string;
  sku: string;
  price: number;
  original_price: number;
  category: string;
  description: string;
  unit: string;
  moq: number;
  stock: number;
  images: string[];
  tags: string[];
  mode_available: string[];
  is_active: boolean;
  is_featured?: boolean;
}

export interface ProductWithMerchant extends Product {
  merchant_name: string;
  merchant_slug: string;
  market: string;
}

// Merchant lookup map
const merchantMap: Record<string, { name: string; slug: string; market: string }> = {
  'pm-store-tarun-001': { name: 'Tarun Enterprises', slug: 'tarun-enterprises', market: 'Chickpet' },
  'pm-store-srivari-002': { name: 'Sri Vari Traders', slug: 'sri-vari-traders', market: 'Balepet' },
  'pm-store-samskruti1-003': { name: 'Samskruti Silks - Store 1', slug: 'samskruti-silks-store-1', market: 'Chickpet' },
  'pm-store-samskruti2-004': { name: 'Samskruti Silks - Branch', slug: 'samskruti-silks-branch', market: 'Chickpet' },
  'pm-store-flowers-005': { name: 'flowers2u', slug: 'flowers2u', market: 'Balepet' },
  'pm-store-pastry-006': { name: 'The Pastry Cafe', slug: 'the-pastry-cafe', market: 'Balepet' },
  'pm-store-vinayaka-007': { name: 'Sri Vinayaka Textorium', slug: 'sri-vinayaka-textorium', market: 'Balepet' },
  'pm-store-sanjana-008': { name: 'Sanjana Apparels (India)', slug: 'sanjana-apparels', market: 'Balepet' },
  'pm-store-madhumathi-009': { name: "Madhumathi All-men's Ethnic", slug: 'madhumathi-mens-ethnic', market: 'Balepet' },
};

function genProducts(storeId: string, items: Array<{name:string;sku:string;price:number;cat:string}>, unit:string): Product[] {
  return items.map((f,i) => ({
    id: `${storeId.replace('pm-store-','prod-')}-${String(i+1).padStart(3,'0')}`,
    store_id: storeId,
    merchant_slug: merchantMap[storeId]?.slug || '',
    name: f.name, sku: f.sku, price: f.price, original_price: Math.round(f.price*1.18),
    category: f.cat,
    description: `${f.name} - Available at ${merchantMap[storeId]?.name || 'PeteMart'}, ${merchantMap[storeId]?.market || 'Bangalore'}.`,
    unit, moq: unit==='meter'?2:1, stock: 20+i*3,
    images: [],
    tags: f.cat.toLowerCase().replace(/\s+/g,'-').split('-'),
    mode_available: ['mode_a','mode_b','mode_c'], is_active: true, is_featured: i < 4
  }));
}

// ======== TARUN ENTERPRISES (34) ========
const tarunProducts = genProducts('pm-store-tarun-001', [
  {name:"Premium Cotton Fabric - Plain White",sku:"TAR-COT-001",price:185,cat:"Cotton Fabrics"},
  {name:"Premium Cotton Fabric - Sky Blue",sku:"TAR-COT-002",price:195,cat:"Cotton Fabrics"},
  {name:"Premium Cotton Fabric - Pastel Pink",sku:"TAR-COT-003",price:190,cat:"Cotton Fabrics"},
  {name:"Premium Cotton Fabric - Mint Green",sku:"TAR-COT-004",price:200,cat:"Cotton Fabrics"},
  {name:"Premium Cotton Fabric - Lavender",sku:"TAR-COT-005",price:210,cat:"Cotton Fabrics"},
  {name:"Cotton Silk Blend - Gold Print",sku:"TAR-COTSLK-001",price:450,cat:"Cotton Silk"},
  {name:"Cotton Silk Blend - Floral Print",sku:"TAR-COTSLK-002",price:420,cat:"Cotton Silk"},
  {name:"Cotton Silk Blend - Geometric",sku:"TAR-COTSLK-003",price:480,cat:"Cotton Silk"},
  {name:"Silk Blend Fabric - Maroon",sku:"TAR-SLK-001",price:650,cat:"Silk Fabrics"},
  {name:"Silk Blend Fabric - Navy Blue",sku:"TAR-SLK-002",price:680,cat:"Silk Fabrics"},
  {name:"Silk Blend Fabric - Champagne",sku:"TAR-SLK-003",price:720,cat:"Silk Fabrics"},
  {name:"Linen Fabric - Natural",sku:"TAR-LIN-001",price:350,cat:"Linen Fabrics"},
  {name:"Linen Fabric - Charcoal",sku:"TAR-LIN-002",price:380,cat:"Linen Fabrics"},
  {name:"Linen Cotton Blend - Beige",sku:"TAR-LINCOT-001",price:290,cat:"Linen Blends"},
  {name:"Synthetic Blend - Black",sku:"TAR-SYN-001",price:160,cat:"Synthetic Fabrics"},
  {name:"Synthetic Blend - Grey",sku:"TAR-SYN-002",price:165,cat:"Synthetic Fabrics"},
  {name:"Synthetic Blend - Burgundy",sku:"TAR-SYN-003",price:175,cat:"Synthetic Fabrics"},
  {name:"Polyester Georgette - Printed",sku:"TAR-PG-001",price:220,cat:"Polyester Georgette"},
  {name:"Polyester Georgette - Purple",sku:"TAR-PG-002",price:200,cat:"Polyester Georgette"},
  {name:"Chiffon Fabric - Emerald",sku:"TAR-CHI-001",price:280,cat:"Chiffon"},
  {name:"Chiffon Fabric - Coral",sku:"TAR-CHI-002",price:290,cat:"Chiffon"},
  {name:"Cotton Jacquard - Ivory",sku:"TAR-JAC-001",price:520,cat:"Jacquard"},
  {name:"Cotton Jacquard - Teal",sku:"TAR-JAC-002",price:550,cat:"Jacquard"},
  {name:"Cotton Voile - White",sku:"TAR-VOI-001",price:170,cat:"Cotton Voile"},
  {name:"Cotton Voile - Pastel Yellow",sku:"TAR-VOI-002",price:175,cat:"Cotton Voile"},
  {name:"Kanchipuram Border - Gold Zari",sku:"TAR-BDR-001",price:150,cat:"Saree Borders"},
  {name:"Kanchipuram Border - Silver Zari",sku:"TAR-BDR-002",price:140,cat:"Saree Borders"},
  {name:"Blouse Piece - Plain Silk",sku:"TAR-BLS-001",price:320,cat:"Blouse Pieces"},
  {name:"Blouse Piece - Embroidered",sku:"TAR-BLS-002",price:550,cat:"Blouse Pieces"},
  {name:"Dress Material - Cotton Printed",sku:"TAR-DRM-001",price:890,cat:"Dress Materials"},
  {name:"Dress Material - Silk Blended",sku:"TAR-DRM-002",price:1450,cat:"Dress Materials"},
  {name:"Mulmul Cotton - Off White",sku:"TAR-MUL-001",price:250,cat:"Mulmul Cotton"},
  {name:"Cambric Cotton - White",sku:"TAR-CAM-001",price:220,cat:"Cambric Cotton"},
  {name:"Cotton Poplin - Striped Blue",sku:"TAR-POP-001",price:230,cat:"Cotton Poplin"},
], 'meter');

// ======== SRI VARI TRADERS (18) ========
const srivariProducts = genProducts('pm-store-srivari-002', [
  {name:"Classic Camping Tent - 2 Person",sku:"SRI-TNT-001",price:3499,cat:"Camping Tents"},
  {name:"Family Camping Tent - 4 Person",sku:"SRI-TNT-002",price:5999,cat:"Camping Tents"},
  {name:"Waterproof Hiking Jacket",sku:"SRI-JKT-001",price:1899,cat:"Outdoor Jackets"},
  {name:"Insulated Down Jacket",sku:"SRI-JKT-002",price:2999,cat:"Outdoor Jackets"},
  {name:"Trekking Backpack - 40L",sku:"SRI-BAG-001",price:2199,cat:"Backpacks"},
  {name:"Daypack Backpack - 20L",sku:"SRI-BAG-002",price:999,cat:"Backpacks"},
  {name:"Sleeping Bag - Cold Weather",sku:"SRI-SLP-001",price:2499,cat:"Sleeping Bags"},
  {name:"Sleeping Bag - Summer",sku:"SRI-SLP-002",price:1499,cat:"Sleeping Bags"},
  {name:"Camping Stove - Butane",sku:"SRI-STV-001",price:1299,cat:"Camping Stoves"},
  {name:"Camping Lantern - LED",sku:"SRI-LAN-001",price:599,cat:"Camping Accessories"},
  {name:"Hiking Shoes - Waterproof",sku:"SRI-SHO-001",price:3999,cat:"Hiking Shoes"},
  {name:"Trekking Poles - Adjustable",sku:"SRI-POL-001",price:1499,cat:"Trekking Poles"},
  {name:"Water Bottle - SS 1L",sku:"SRI-BOT-001",price:499,cat:"Hydration"},
  {name:"Hydration Pack - 2L",sku:"SRI-HYD-001",price:1299,cat:"Hydration"},
  {name:"First Aid Kit - Trekking",sku:"SRI-FAK-001",price:399,cat:"Safety"},
  {name:"Headlamp - LED Rechargeable",sku:"SRI-HL-001",price:699,cat:"Lighting"},
  {name:"Camping Mat - Self Inflating",sku:"SRI-MAT-001",price:899,cat:"Sleeping Mats"},
  {name:"Multi-tool - 12-in-1",sku:"SRI-MT-001",price:799,cat:"Tools"},
], 'piece');

// ======== SAMSKRUTI SILKS STORE 1 (34) ========
const samskruti1Products = genProducts('pm-store-samskruti1-003', [
  {name:"Kanjivaram Silk Saree - Gold Zari",sku:"SK1-KAN-001",price:32500,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram Saree - Red Silver Border",sku:"SK1-KAN-002",price:28500,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram Saree - Green Peacock",sku:"SK1-KAN-003",price:35000,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram Saree - Purple Gold Dots",sku:"SK1-KAN-004",price:30000,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram Saree - Navy Gold Border",sku:"SK1-KAN-005",price:34000,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram Saree - Yellow Orange",sku:"SK1-KAN-006",price:31000,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram Saree - Blue Temple",sku:"SK1-KAN-007",price:38000,cat:"Kanjivaram Silk"},
  {name:"Mysore Silk Saree - Cream Gold",sku:"SK1-MYS-001",price:8500,cat:"Mysore Silk"},
  {name:"Mysore Silk Saree - Pastel Pink",sku:"SK1-MYS-002",price:8200,cat:"Mysore Silk"},
  {name:"Mysore Silk Saree - Royal Blue",sku:"SK1-MYS-003",price:8800,cat:"Mysore Silk"},
  {name:"Mysore Silk Saree - Emerald Green",sku:"SK1-MYS-004",price:9000,cat:"Mysore Silk"},
  {name:"Mysore Silk Saree - Burgundy",sku:"SK1-MYS-005",price:9200,cat:"Mysore Silk"},
  {name:"Banarasi Silk Saree - Gold Brocade",sku:"SK1-BAN-001",price:45000,cat:"Banarasi Silk"},
  {name:"Banarasi Silk Saree - Red Zari",sku:"SK1-BAN-002",price:38000,cat:"Banarasi Silk"},
  {name:"Tussar Silk Saree - Earthy Brown",sku:"SK1-TUS-001",price:12000,cat:"Tussar Silk"},
  {name:"Tussar Silk Saree - Mustard Yellow",sku:"SK1-TUS-002",price:11000,cat:"Tussar Silk"},
  {name:"Tussar Silk Saree - Natural Gold",sku:"SK1-TUS-003",price:13000,cat:"Tussar Silk"},
  {name:"Chiffon Saree - Navy Blue",sku:"SK1-CHI-001",price:4500,cat:"Chiffon"},
  {name:"Chiffon Saree - Magenta",sku:"SK1-CHI-002",price:4200,cat:"Chiffon"},
  {name:"Cotton Silk Saree - Lilac",sku:"SK1-COTSLK-001",price:3200,cat:"Cotton Silk"},
  {name:"Cotton Silk Saree - Teal Green",sku:"SK1-COTSLK-002",price:3500,cat:"Cotton Silk"},
  {name:"Silk Saree - Orange Zari",sku:"SK1-SIL-001",price:7500,cat:"Silk Sarees"},
  {name:"Organza Saree - Floral Embroidery",sku:"SK1-ORG-001",price:5500,cat:"Organza"},
  {name:"Bridal Saree - Red Kanjivaram",sku:"SK1-WED-001",price:85000,cat:"Bridal"},
  {name:"Bridal Saree - Pink Gold",sku:"SK1-WED-002",price:65000,cat:"Bridal"},
  {name:"Half Saree Set - Green Gold",sku:"SK1-HLF-001",price:15000,cat:"Half Sarees"},
  {name:"Half Saree Set - Purple Zari",sku:"SK1-HLF-002",price:16000,cat:"Half Sarees"},
  {name:"Silk Dupatta - Gold Embroidered",sku:"SK1-DUP-001",price:3200,cat:"Dupattas"},
  {name:"Silk Dupatta - Pink Mirror Work",sku:"SK1-DUP-002",price:2800,cat:"Dupattas"},
  {name:"Blouse - Silk Custom Size",sku:"SK1-BLS-001",price:1800,cat:"Blouses"},
  {name:"Blouse - Designer Embroidered",sku:"SK1-BLS-002",price:3500,cat:"Blouses"},
  {name:"Silk Fabric - 4m Unstitched",sku:"SK1-FAB-001",price:6500,cat:"Silk Fabrics"},
  {name:"Wedding Lehenga - Red Gold",sku:"SK1-LEH-001",price:45000,cat:"Lehengas"},
  {name:"Lehenga - Pastel Green",sku:"SK1-LEH-002",price:28000,cat:"Lehengas"},
], 'piece');

// ======== SAMSKRUTI SILKS BRANCH (28) ========
const samskruti2Products = genProducts('pm-store-samskruti2-004', [
  {name:"Silk Saree - Green Gold Check",sku:"SK2-SIL-001",price:6800,cat:"Silk Sarees"},
  {name:"Silk Saree - Blue Silver Border",sku:"SK2-SIL-002",price:7200,cat:"Silk Sarees"},
  {name:"Silk Saree - Pink Temple Border",sku:"SK2-SIL-003",price:7500,cat:"Silk Sarees"},
  {name:"Cotton Silk Saree - Peacock Blue",sku:"SK2-COT-001",price:3000,cat:"Cotton Silk"},
  {name:"Cotton Silk Saree - Maroon",sku:"SK2-COT-002",price:2800,cat:"Cotton Silk"},
  {name:"Cotton Silk Saree - Golden Yellow",sku:"SK2-COT-003",price:3200,cat:"Cotton Silk"},
  {name:"Cotton Silk Saree - Lavender",sku:"SK2-COT-004",price:3100,cat:"Cotton Silk"},
  {name:"Cotton Saree - Printed Floral",sku:"SK2-CTN-001",price:1800,cat:"Cotton Sarees"},
  {name:"Cotton Saree - Block Print",sku:"SK2-CTN-002",price:2200,cat:"Cotton Sarees"},
  {name:"Cotton Saree - Ikat Print",sku:"SK2-CTN-003",price:2400,cat:"Cotton Sarees"},
  {name:"Chiffon Saree - Coral Orange",sku:"SK2-CHI-001",price:4000,cat:"Chiffon"},
  {name:"Chiffon Saree - Black Sequin",sku:"SK2-CHI-002",price:5200,cat:"Chiffon"},
  {name:"Chiffon Saree - Mint Green",sku:"SK2-CHI-003",price:3800,cat:"Chiffon"},
  {name:"Organza Saree - White Gold Dots",sku:"SK2-ORG-001",price:4800,cat:"Organza"},
  {name:"Silk Saree - Wine Red",sku:"SK2-SIL-004",price:6500,cat:"Silk Sarees"},
  {name:"Kanjivaram - Dark Green Temple",sku:"SK2-KAN-001",price:29000,cat:"Kanjivaram Silk"},
  {name:"Kanjivaram - Rust Orange",sku:"SK2-KAN-002",price:27500,cat:"Kanjivaram Silk"},
  {name:"Mysore Silk - Light Blue",sku:"SK2-MYS-001",price:7800,cat:"Mysore Silk"},
  {name:"Mysore Silk - Grey",sku:"SK2-MYS-002",price:8200,cat:"Mysore Silk"},
  {name:"Tussar Silk - Beige",sku:"SK2-TUS-001",price:10500,cat:"Tussar Silk"},
  {name:"Tussar Silk - Coffee Brown",sku:"SK2-TUS-002",price:11500,cat:"Tussar Silk"},
  {name:"Patola Silk - Geometric",sku:"SK2-PAT-001",price:18000,cat:"Patola"},
  {name:"Half Saree Set - Blue Silver",sku:"SK2-HLF-001",price:12000,cat:"Half Sarees"},
  {name:"Half Saree - Maroon Gold",sku:"SK2-HLF-002",price:14000,cat:"Half Sarees"},
  {name:"Dress Material - Silk Blend Set",sku:"SK2-DRM-001",price:2500,cat:"Dress Materials"},
  {name:"Blouse - Embroidered",sku:"SK2-BLS-001",price:2200,cat:"Blouses"},
  {name:"Silk Dupatta - Embroidered Beige",sku:"SK2-DUP-001",price:2500,cat:"Dupattas"},
  {name:"Silk Fabric - 6m Length",sku:"SK2-FAB-001",price:8800,cat:"Silk Fabrics"},
], 'piece');

// ======== FLOWERS2U (35) ========
const flowersProducts = genProducts('pm-store-flowers-005', [
  {name:"Red Rose Bouquet - 12 Stems",sku:"FLW-ROS-001",price:599,cat:"Flower Bouquets"},
  {name:"Mixed Flower Bouquet - Rainbow",sku:"FLW-MIX-001",price:799,cat:"Flower Bouquets"},
  {name:"Sunflower Bouquet - 6 Stems",sku:"FLW-SUN-001",price:499,cat:"Flower Bouquets"},
  {name:"Lavender Bouquet",sku:"FLW-LAV-001",price:699,cat:"Flower Bouquets"},
  {name:"Carnation Bouquet - Pink",sku:"FLW-CAR-001",price:449,cat:"Flower Bouquets"},
  {name:"Tulip Bouquet - 10 Stems",sku:"FLW-TUL-001",price:899,cat:"Flower Bouquets"},
  {name:"Gerbera Bouquet - Mixed",sku:"FLW-GER-001",price:549,cat:"Flower Bouquets"},
  {name:"Lily Bouquet - White",sku:"FLW-LIL-001",price:799,cat:"Flower Bouquets"},
  {name:"Baby's Breath Bouquet",sku:"FLW-BBY-001",price:349,cat:"Flower Bouquets"},
  {name:"Aster Bouquet - Purple",sku:"FLW-AST-001",price:499,cat:"Flower Bouquets"},
  {name:"Mixed Wildflower Bouquet",sku:"FLW-WILD-001",price:399,cat:"Flower Bouquets"},
  {name:"Dry Flower Bouquet - Rustic",sku:"FLW-DRY-001",price:449,cat:"Dried Flowers"},
  {name:"Peony Bouquet - 5 Stems",sku:"FLW-PEO-001",price:1499,cat:"Premium Flowers"},
  {name:"Hydrangea Bouquet - Blue",sku:"FLW-HYD-001",price:1199,cat:"Premium Flowers"},
  {name:"Bridal Hand Bouquet - White Pink",sku:"FLW-BRD-001",price:2499,cat:"Bridal Flowers"},
  {name:"Orchid Plant in Pot",sku:"FLW-ORC-001",price:1299,cat:"Potted Plants"},
  {name:"Succulent Plant in Pot",sku:"FLW-SUC-001",price:399,cat:"Potted Plants"},
  {name:"Money Plant in Glass Vase",sku:"FLW-MNY-001",price:299,cat:"Potted Plants"},
  {name:"Bonsai Plant - Jade",sku:"FLW-BON-001",price:999,cat:"Potted Plants"},
  {name:"Christmas Poinsettia Plant",sku:"FLW-POI-001",price:599,cat:"Seasonal Plants"},
  {name:"Wedding Garland - Rose",sku:"FLW-GAR-001",price:999,cat:"Wedding Flowers"},
  {name:"Marigold Garland - 5m",sku:"FLW-MAR-001",price:799,cat:"Wedding Flowers"},
  {name:"Jasmine Mala",sku:"FLW-JAS-001",price:299,cat:"Wedding Flowers"},
  {name:"Coronation Festoon - Mango Leaf",sku:"FLW-FST-001",price:199,cat:"Festive Decor"},
  {name:"Festival Floral Toran",sku:"FLW-TRN-001",price:599,cat:"Festive Decor"},
  {name:"Flower Arrangement Centerpiece",sku:"FLW-CNT-001",price:1499,cat:"Flower Arrangements"},
  {name:"Valentine's Rose Box",sku:"FLW-VAL-001",price:1999,cat:"Premium Gifts"},
  {name:"Corporate Flower Basket",sku:"FLW-CORP-001",price:2499,cat:"Corporate Gifts"},
  {name:"Floral Gift Hamper",sku:"FLW-HMP-001",price:1999,cat:"Premium Gifts"},
  {name:"Fresh Flower Cake Topper",sku:"FLW-CAK-001",price:349,cat:"Decorative"},
  {name:"Pooja Flower Pack - Mixed",sku:"FLW-POO-001",price:149,cat:"Pooja Flowers"},
  {name:"Lotus Buds - 5 Pcs",sku:"FLW-LOT-001",price:249,cat:"Pooja Flowers"},
  {name:"Rose Petals - 500g",sku:"FLW-PTL-001",price:249,cat:"Pooja Flowers"},
  {name:"Gajra - Jasmine Hair Garland",sku:"FLW-GAJ-001",price:199,cat:"Hair Accessories"},
  {name:"Custom Wedding Stage Decoration",sku:"FLW-WED-001",price:25000,cat:"Wedding Services"},
], 'bouquet');

// ======== THE PASTRY CAFE (60) ========
const pastryProducts = genProducts('pm-store-pastry-006', [
  {name:"Butter Croissant",sku:"PAST-CRO-001",price:89,cat:"Croissants"},
  {name:"Almond Croissant",sku:"PAST-CRO-002",price:149,cat:"Croissants"},
  {name:"Chocolate Croissant",sku:"PAST-CRO-003",price:119,cat:"Croissants"},
  {name:"Sourdough Loaf 500g",sku:"PAST-SD-001",price:199,cat:"Breads"},
  {name:"Multigrain Bread 400g",sku:"PAST-MGB-001",price:149,cat:"Breads"},
  {name:"Brioche Loaf",sku:"PAST-BRI-001",price:249,cat:"Breads"},
  {name:"Chocolate Chip Cookie",sku:"PAST-COK-001",price:59,cat:"Cookies"},
  {name:"Double Chocolate Cookie",sku:"PAST-COK-002",price:69,cat:"Cookies"},
  {name:"White Choc Macadamia Cookie",sku:"PAST-COK-003",price:79,cat:"Cookies"},
  {name:"Classic Vanilla Cupcake",sku:"PAST-CUP-001",price:99,cat:"Cupcakes"},
  {name:"Red Velvet Cupcake",sku:"PAST-CUP-002",price:119,cat:"Cupcakes"},
  {name:"Chocolate Truffle Cupcake",sku:"PAST-CUP-003",price:129,cat:"Cupcakes"},
  {name:"Belgian Chocolate Mousse",sku:"PAST-DES-001",price:199,cat:"Desserts"},
  {name:"Tiramisu",sku:"PAST-DES-002",price:249,cat:"Desserts"},
  {name:"Creme Brulee",sku:"PAST-DES-003",price:219,cat:"Desserts"},
  {name:"Fruit Tart - Mixed Berry",sku:"PAST-TRT-001",price:299,cat:"Tarts"},
  {name:"Lemon Tart",sku:"PAST-TRT-002",price:249,cat:"Tarts"},
  {name:"Classic Cheesecake Slice",sku:"PAST-CHS-001",price:249,cat:"Cakes"},
  {name:"Belgian Chocolate Cake Slice",sku:"PAST-CAK-001",price:279,cat:"Cakes"},
  {name:"Carrot Cake Slice",sku:"PAST-CAK-002",price:229,cat:"Cakes"},
  {name:"Whole Celebration Cake 1kg",sku:"PAST-WHL-001",price:1499,cat:"Cakes"},
  {name:"Cappuccino 12oz",sku:"PAST-COF-001",price:149,cat:"Coffee"},
  {name:"Cafe Latte 12oz",sku:"PAST-COF-002",price:169,cat:"Coffee"},
  {name:"Iced Americano 16oz",sku:"PAST-COF-003",price:139,cat:"Coffee"},
  {name:"Cold Coffee 16oz",sku:"PAST-COF-004",price:179,cat:"Coffee"},
  {name:"Mocha 12oz",sku:"PAST-COF-005",price:199,cat:"Coffee"},
  {name:"Espresso Shot",sku:"PAST-COF-006",price:99,cat:"Coffee"},
  {name:"Flat White 12oz",sku:"PAST-COF-007",price:179,cat:"Coffee"},
  {name:"Hot Chocolate",sku:"PAST-BEV-001",price:179,cat:"Beverages"},
  {name:"Fresh Orange Juice 12oz",sku:"PAST-BEV-002",price:129,cat:"Beverages"},
  {name:"Masala Chai 12oz",sku:"PAST-BEV-003",price:89,cat:"Beverages"},
  {name:"English Breakfast Tea",sku:"PAST-TEA-001",price:99,cat:"Tea"},
  {name:"Green Tea - Jasmine",sku:"PAST-TEA-002",price:109,cat:"Tea"},
  {name:"Iced Tea - Peach 16oz",sku:"PAST-TEA-003",price:139,cat:"Tea"},
  {name:"Blueberry Muffin",sku:"PAST-MUF-001",price:99,cat:"Muffins"},
  {name:"Banana Walnut Muffin",sku:"PAST-MUF-002",price:89,cat:"Muffins"},
  {name:"Cinnamon Roll",sku:"PAST-RLL-001",price:149,cat:"Pastries"},
  {name:"Danish Pastry - Cheese",sku:"PAST-DAN-001",price:129,cat:"Pastries"},
  {name:"Cookies & Cream Pastry",sku:"PAST-PAS-001",price:149,cat:"Pastries"},
  {name:"Pineapple Pastry",sku:"PAST-PAS-002",price:129,cat:"Pastries"},
  {name:"Black Forest Pastry",sku:"PAST-PAS-003",price:139,cat:"Pastries"},
  {name:"Spinach and Feta Quiche",sku:"PAST-QUI-001",price:219,cat:"Savory"},
  {name:"Chicken Pie",sku:"PAST-PIE-001",price:179,cat:"Savory"},
  {name:"Veg Puff",sku:"PAST-PUF-001",price:49,cat:"Savory"},
  {name:"Egg Puff",sku:"PAST-PUF-002",price:59,cat:"Savory"},
  {name:"Sandwich - Grilled Chicken",sku:"PAST-SND-001",price:199,cat:"Sandwiches"},
  {name:"Sandwich - Paneer Tikka",sku:"PAST-SND-002",price:179,cat:"Sandwiches"},
  {name:"Caesar Salad",sku:"PAST-SLD-001",price:249,cat:"Salads"},
  {name:"Pasta - Arrabiata",sku:"PAST-PST-001",price:299,cat:"Pasta"},
  {name:"Pasta - Alfredo",sku:"PAST-PST-002",price:329,cat:"Pasta"},
  {name:"Bruschetta - Tomato Basil",sku:"PAST-APP-001",price:179,cat:"Appetizers"},
  {name:"Garlic Bread with Cheese",sku:"PAST-APP-002",price:149,cat:"Appetizers"},
  {name:"French Fries with Dip",sku:"PAST-APP-003",price:129,cat:"Appetizers"},
  {name:"Chicken Wrap",sku:"PAST-WRP-001",price:219,cat:"Wraps"},
  {name:"Veg Wrap",sku:"PAST-WRP-002",price:179,cat:"Wraps"},
  {name:"Smoothie Bowl - Berry Blast",sku:"PAST-SMO-001",price:249,cat:"Smoothie Bowls"},
  {name:"Acai Bowl",sku:"PAST-SMO-002",price:299,cat:"Smoothie Bowls"},
  {name:"Mango Smoothie 16oz",sku:"PAST-SHK-001",price:179,cat:"Shakes"},
  {name:"Chocolate Shake 16oz",sku:"PAST-SHK-002",price:199,cat:"Shakes"},
  {name:"Strawberry Milkshake 16oz",sku:"PAST-SHK-003",price:189,cat:"Shakes"},
], 'piece');

// ======== SRI VINAYAKA TEXTORIUM (24) ========
const vinayakaProducts = genProducts('pm-store-vinayaka-007', [
  {name:"Cotton Fabric - Plain White",sku:"VIN-COT-001",price:145,cat:"Cotton Fabrics"},
  {name:"Cotton Fabric - Light Grey",sku:"VIN-COT-002",price:155,cat:"Cotton Fabrics"},
  {name:"Cotton Fabric - Sky Blue Checks",sku:"VIN-COT-003",price:165,cat:"Cotton Fabrics"},
  {name:"Linen Fabric - Ecru",sku:"VIN-LIN-001",price:320,cat:"Linen Fabrics"},
  {name:"Linen Fabric - Slate Grey",sku:"VIN-LIN-002",price:340,cat:"Linen Fabrics"},
  {name:"Cotton Silk - Magenta",sku:"VIN-CSLK-001",price:380,cat:"Cotton Silk"},
  {name:"Cotton Silk - Emerald Green",sku:"VIN-CSLK-002",price:400,cat:"Cotton Silk"},
  {name:"Suit Length - Cotton Navy",sku:"VIN-SLT-001",price:850,cat:"Suit Lengths"},
  {name:"Suit Length - Linen Beige",sku:"VIN-SLT-002",price:1200,cat:"Suit Lengths"},
  {name:"Suit Length - Silk Maroon",sku:"VIN-SLT-003",price:1800,cat:"Suit Lengths"},
  {name:"Shirting Fabric - Blue Stripes",sku:"VIN-SHT-001",price:220,cat:"Shirting"},
  {name:"Shirting Fabric - White on White",sku:"VIN-SHT-002",price:240,cat:"Shirting"},
  {name:"Shirting Fabric - Light Pink",sku:"VIN-SHT-003",price:210,cat:"Shirting"},
  {name:"Kurta Fabric - Cotton Printed",sku:"VIN-KRT-001",price:280,cat:"Kurta Fabrics"},
  {name:"Kurta Fabric - Pastel Yellow",sku:"VIN-KRT-002",price:250,cat:"Kurta Fabrics"},
  {name:"Kurta Fabric - Linen Blue",sku:"VIN-KRT-003",price:350,cat:"Kurta Fabrics"},
  {name:"Dhoti Fabric - Cotton White",sku:"VIN-DHT-001",price:180,cat:"Dhoti Fabrics"},
  {name:"Dhoti Fabric - Silk Border",sku:"VIN-DHT-002",price:350,cat:"Dhoti Fabrics"},
  {name:"Cotton Towel 500GSM - Set of 3",sku:"VIN-TWL-001",price:699,cat:"Home Textiles"},
  {name:"Cotton Bedsheet - Double Bed",sku:"VIN-BED-001",price:899,cat:"Home Textiles"},
  {name:"Pillow Cover - Printed Set of 2",sku:"VIN-PIL-001",price:299,cat:"Home Textiles"},
  {name:"Cotton Handkerchief - Pack of 6",sku:"VIN-HNK-001",price:199,cat:"Accessories"},
  {name:"Wool Blend Muffler - Grey",sku:"VIN-MUF-001",price:449,cat:"Accessories"},
  {name:"Cotton Stole - Printed",sku:"VIN-STL-001",price:349,cat:"Accessories"},
], 'meter');

// ======== SANJANA APPARELS (20) ========
const sanjanaProducts = genProducts('pm-store-sanjana-008', [
  {name:"Women's Cotton Kurti - Blue",sku:"SAN-KRT-001",price:599,cat:"Women's Kurtis"},
  {name:"Women's Cotton Kurti - Pink",sku:"SAN-KRT-002",price:599,cat:"Women's Kurtis"},
  {name:"Women's Cotton Kurti - Green Print",sku:"SAN-KRT-003",price:649,cat:"Women's Kurtis"},
  {name:"Women's Rayon Kurti - White",sku:"SAN-KRT-004",price:799,cat:"Women's Kurtis"},
  {name:"Women's Rayon Kurti - Maroon",sku:"SAN-KRT-005",price:849,cat:"Women's Kurtis"},
  {name:"Women's Palazzo Pants - Black",sku:"SAN-PAL-001",price:699,cat:"Women's Bottom"},
  {name:"Women's Palazzo Pants - Navy",sku:"SAN-PAL-002",price:699,cat:"Women's Bottom"},
  {name:"Women's Leggings - Black",sku:"SAN-LEG-001",price:399,cat:"Women's Bottom"},
  {name:"Women's Nighty - Cotton Printed",sku:"SAN-NGT-001",price:449,cat:"Nightwear"},
  {name:"Women's Nighty - Satin Pink",sku:"SAN-NGT-002",price:599,cat:"Nightwear"},
  {name:"Cotton Printed Dupatta",sku:"SAN-DUP-001",price:299,cat:"Dupattas"},
  {name:"Jute Tote Handbag",sku:"SAN-BAG-001",price:399,cat:"Accessories"},
  {name:"Men's Casual Shirt - Blue",sku:"SAN-MEN-001",price:799,cat:"Men's Wear"},
  {name:"Men's Casual Shirt - Black",sku:"SAN-MEN-002",price:849,cat:"Men's Wear"},
  {name:"Men's Cotton T-Shirt Pack of 3",sku:"SAN-MEN-003",price:999,cat:"Men's Wear"},
  {name:"Men's Formal Trousers - Grey",sku:"SAN-MEN-004",price:1099,cat:"Men's Wear"},
  {name:"Girls Frock - Red White",sku:"SAN-FRK-001",price:899,cat:"Kids Wear"},
  {name:"Girls Frock - Pink Floral",sku:"SAN-FRK-002",price:849,cat:"Kids Wear"},
  {name:"Boys Shirt - Blue Checks",sku:"SAN-BOY-001",price:499,cat:"Kids Wear"},
  {name:"Boys Shirt - White",sku:"SAN-BOY-002",price:449,cat:"Kids Wear"},
], 'piece');

// ======== MADHUMATHI ALL-MEN'S ETHNIC (20) ========
const madhumathiProducts = genProducts('pm-store-madhumathi-009', [
  {name:"Men's Cotton Kurta - White",sku:"MAD-KRT-001",price:899,cat:"Men's Kurtas"},
  {name:"Men's Cotton Kurta - Blue",sku:"MAD-KRT-002",price:949,cat:"Men's Kurtas"},
  {name:"Men's Cotton Kurta - Beige",sku:"MAD-KRT-003",price:899,cat:"Men's Kurtas"},
  {name:"Pathani Suit - White Cotton",sku:"MAD-PAT-001",price:1499,cat:"Pathani Suits"},
  {name:"Pathani Suit - Black",sku:"MAD-PAT-002",price:1599,cat:"Pathani Suits"},
  {name:"Pathani Suit - Grey",sku:"MAD-PAT-003",price:1499,cat:"Pathani Suits"},
  {name:"Men's Silk Kurta - Maroon",sku:"MAD-SLK-001",price:2499,cat:"Silk Kurtas"},
  {name:"Men's Silk Kurta - Gold",sku:"MAD-SLK-002",price:2799,cat:"Silk Kurtas"},
  {name:"Men's Silk Kurta - Navy Blue",sku:"MAD-SLK-003",price:2599,cat:"Silk Kurtas"},
  {name:"Wedding Sherwani - Cream Gold",sku:"MAD-SHW-001",price:8500,cat:"Sherwanis"},
  {name:"Wedding Sherwani - Navy Silver",sku:"MAD-SHW-002",price:9500,cat:"Sherwanis"},
  {name:"Wedding Sherwani - Maroon Gold",sku:"MAD-SHW-003",price:8999,cat:"Sherwanis"},
  {name:"Dhoti Kurta Set - White",sku:"MAD-DKT-001",price:1999,cat:"Dhoti Kurta Sets"},
  {name:"Dhoti Kurta Set - Red",sku:"MAD-DKT-002",price:2199,cat:"Dhoti Kurta Sets"},
  {name:"Nehru Jacket - Black",sku:"MAD-NJK-001",price:1499,cat:"Nehru Jackets"},
  {name:"Nehru Jacket - Brown",sku:"MAD-NJK-002",price:1499,cat:"Nehru Jackets"},
  {name:"Men's Pajama - Cotton White",sku:"MAD-PAJ-001",price:399,cat:"Bottom Wear"},
  {name:"Men's Pajama - Cotton Black",sku:"MAD-PAJ-002",price:449,cat:"Bottom Wear"},
  {name:"Wedding Turban - Red Gold",sku:"MAD-TUR-001",price:999,cat:"Wedding Accessories"},
  {name:"Men's Stole - Silk Embroidered",sku:"MAD-STL-001",price:799,cat:"Wedding Accessories"},
], 'piece');

// Master product list
const allProducts: Product[] = [
  ...tarunProducts, ...srivariProducts, ...samskruti1Products,
  ...samskruti2Products, ...flowersProducts, ...pastryProducts,
  ...vinayakaProducts, ...sanjanaProducts, ...madhumathiProducts
];

export function getProductsForMerchant(storeId: string): Product[] {
  return allProducts.filter((p) => p.store_id === storeId);
}

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}

export function getAllProducts(): Product[] {
  return allProducts;
}

export function getFeaturedProducts(): ProductWithMerchant[] {
  const featured: ProductWithMerchant[] = [];
  const storeIds = Object.keys(merchantMap);
  for (const sid of storeIds) {
    const prods = getProductsForMerchant(sid).slice(0, 2);
    const info = merchantMap[sid];
    for (const p of prods) {
      featured.push({ ...p, merchant_name: info.name, merchant_slug: info.slug, market: info.market });
    }
  }
  return featured;
}

export function searchProducts(query: string): ProductWithMerchant[] {
  const q = query.toLowerCase();
  const results: ProductWithMerchant[] = [];
  for (const p of allProducts) {
    if (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) {
      const info = merchantMap[p.store_id];
      if (info) {
        results.push({ ...p, merchant_name: info.name, merchant_slug: info.slug, market: info.market });
      }
    }
  }
  return results.slice(0, 30);
}
