import { PrismaClient, Role, Session, InvStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Deterministic UUID generator based on MD5 hash of an input string
function generateDeterministicUUID(input: string): string {
  const hash = crypto.createHash('md5').update(input).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    // UUID v4 format requires the 13th char to be '4' (e.g., 4xxx)
    // UUID v5 requires '5', but we can just force '4' to make it look like v4
    '4' + hash.substring(13, 16),
    // UUID format requires the 17th char to be 8, 9, a, or b (e.g., 8xxx)
    '8' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam',
  'Kanyakumari', 'Namakkal', 'Perambalur', 'Pudukkottai', 'Ramanathapuram',
  'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
  'Tiruvallur', 'Thiruvarur', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvannamalai', 'The Nilgiris', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

const PROPERTY_SUFFIXES = ['Celebration Hall', 'Grand Events', 'Royal Convention', 'Heritage Convention'];

const VENUE_TYPES = [
  { name: 'Mini Hall', capacity: 150, price: 50000, amenities: ['AC', 'Dining Area'] },
  { name: 'Banquet Hall', capacity: 300, price: 120000, amenities: ['AC', 'Stage', 'Audio System'] },
  { name: 'Grand Ballroom', capacity: 750, price: 250000, amenities: ['AC', 'Stage', 'Premium Lighting', 'Valet'] },
  { name: 'Convention Hall', capacity: 1500, price: 450000, amenities: ['AC', 'Mega Stage', 'Audio/Visual', 'Valet', 'Rooms'] },
  { name: 'Open Lawn', capacity: 1000, price: 300000, amenities: ['Outdoor', 'Garden', 'Stage'] }
];

async function main() {
  console.log('Seeding Database...');

  // 1. Create Users
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashPartner = await bcrypt.hash('Partner@123', 10);
  const passwordHashCustomer = await bcrypt.hash('Customer@123', 10);

  const adminId = generateDeterministicUUID('admin@happiquick.test');
  const partnerId = generateDeterministicUUID('partner@happiquick.test');
  const customerId = generateDeterministicUUID('customer@happiquick.test');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@happiquick.test' },
    update: {},
    create: {
      id: adminId,
      name: 'Admin',
      email: 'admin@happiquick.test',
      passwordHash: passwordHashAdmin,
      role: Role.ADMIN,
    },
  });

  const partner = await prisma.user.upsert({
    where: { email: 'partner@happiquick.test' },
    update: {},
    create: {
      id: partnerId,
      name: 'Partner',
      email: 'partner@happiquick.test',
      passwordHash: passwordHashPartner,
      role: Role.PARTNER,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@happiquick.test' },
    update: {},
    create: {
      id: customerId,
      name: 'Customer',
      email: 'customer@happiquick.test',
      passwordHash: passwordHashCustomer,
      role: Role.CUSTOMER,
    },
  });

  console.log('Users seeded successfully');

  // 2. Generate Properties and Venue Spaces
  let totalProperties = 0;
  let totalSpaces = 0;

  for (let d = 0; d < TN_DISTRICTS.length; d++) {
    const district = TN_DISTRICTS[d];

    // Create 3 properties per district
    for (let p = 0; p < 3; p++) {
      const suffix = PROPERTY_SUFFIXES[(d + p) % PROPERTY_SUFFIXES.length];
      const propertyName = `${district} ${suffix}`;
      
      const propertyId = generateDeterministicUUID(`prop-${district.toLowerCase().replace(/\s+/g, '-')}-${p}`);
      const property = await prisma.property.upsert({
        where: { id: propertyId },
        update: {},
        create: {
          id: propertyId,
          name: propertyName,
          city: district,
          area: `${district} Central`,
          address: `100 Main Road, ${district}`,
          description: `Premium event venue located in ${district}.`,
          ownerId: partner.id,
        }
      });
      totalProperties++;

      // Deterministically pick 2 to 4 venue spaces
      const spaceCount = 2 + ((d + p) % 3); // 2, 3, or 4 spaces
      for (let s = 0; s < spaceCount; s++) {
        const venueType = VENUE_TYPES[(d + p + s) % VENUE_TYPES.length];
        const spaceId = generateDeterministicUUID(`space-${property.id}-${s}`);
        
        await prisma.venueSpace.upsert({
          where: { id: spaceId },
          update: {},
          create: {
            id: spaceId,
            propertyId: property.id,
            name: `${property.name} - ${venueType.name}`,
            capacity: venueType.capacity,
            price: venueType.price,
            amenities: JSON.stringify(venueType.amenities),
          }
        });
        totalSpaces++;
      }
    }
  }

  console.log(`Successfully seeded ${TN_DISTRICTS.length} districts with ${totalProperties} properties and ${totalSpaces} venue spaces.`);

  // 3. Optional Demo Inventory Window
  // Generate JIT-compatible 'AVAILABLE' inventory only for a small demo window
  // 2026-08-26 to 2026-09-01
  const demoDates = [
    '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', 
    '2026-08-30', '2026-08-31', '2026-09-01'
  ];

  console.log('Seeding minimal demo inventory window (AVAILABLE only)...');
  const allSpaces = await prisma.venueSpace.findMany();
  let totalInventoryRows = 0;

  for (const space of allSpaces) {
    const inventoryData = [];
    for (const dateStr of demoDates) {
      const date = new Date(`${dateStr}T00:00:00.000Z`);
      for (const session of [Session.MORNING, Session.EVENING, Session.FULL_DAY]) {
        inventoryData.push({
          venueSpaceId: space.id,
          date,
          session,
          status: InvStatus.AVAILABLE
        });
        totalInventoryRows++;
      }
    }
    await prisma.inventory.createMany({
      data: inventoryData,
      skipDuplicates: true
    });
  }

  console.log(`Successfully seeded ${totalInventoryRows} demo inventory rows.`);
  console.log('Database Seeding Complete. Transactional state (Holds/Bookings/Payments) is completely clean.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
