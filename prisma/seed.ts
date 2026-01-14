import { PrismaClient, Role, DeliveryStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Créer Platform Owner
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const platformOwner = await prisma.platformOwner.upsert({
    where: { email: 'owner@platform.com' },
    update: {},
    create: {
      email: 'owner@platform.com',
      password: ownerPassword,
      name: 'Platform Owner',
      twoFactorEnabled: false,
    },
  });
  console.log('✅ Platform Owner created:', platformOwner.email);

  // 2. Créer 2 entreprises
  const companies = [];
  for (let i = 1; i <= 2; i++) {
    const company = await prisma.company.upsert({
      where: { email: `company${i}@example.com` },
      update: {},
      create: {
        name: `Entreprise ${i}`,
        email: `company${i}@example.com`,
        address: `${i * 100} Rue de la Logistique, Paris`,
        phone: `+33 1 23 45 67 ${i}${i}`,
        isActive: true,
      },
    });
    companies.push(company);
    console.log(`✅ Company ${i} created:`, company.name);
  }

  // 3. Créer utilisateurs pour chaque entreprise
  const users = [];
  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex];
    // Admin entreprise
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminEmail = `admin@company${companyIndex + 1}.example.com`;
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: company.name,
        role: Role.COMPANY_ADMIN,
        companyId: company.id,
        isActive: true,
      },
    });
    users.push(admin);
    console.log(`✅ Admin created for ${company.name}:`, admin.email);

    // Agent entrepôt
    const agentPassword = await bcrypt.hash('agent123', 10);
    const agentEmail = `agent@company${companyIndex + 1}.example.com`;
    const agent = await prisma.user.upsert({
      where: { email: agentEmail },
      update: {},
      create: {
        email: agentEmail,
        password: agentPassword,
        firstName: 'Agent',
        lastName: 'Entrepôt',
        role: Role.WAREHOUSE_AGENT,
        companyId: company.id,
        isActive: true,
      },
    });
    users.push(agent);
    console.log(`✅ Warehouse Agent created for ${company.name}:`, agent.email);
  }

  // 4. Créer 2 entrepôts par entreprise
  const warehouses = [];
  for (const company of companies) {
    for (let i = 1; i <= 2; i++) {
      const warehouse = await prisma.warehouse.create({
        data: {
          name: `Entrepôt ${i} - ${company.name}`,
          address: `${i * 50} Avenue des Entrepôts`,
          city: 'Paris',
          postalCode: `7500${i}`,
          latitude: 48.8566 + (i * 0.01),
          longitude: 2.3522 + (i * 0.01),
          companyId: company.id,
          isActive: true,
        },
      });
      warehouses.push(warehouse);
      console.log(`✅ Warehouse created:`, warehouse.name);
    }
  }

  // 5. Créer produits dans chaque entrepôt
  const products = [];
  const productNames = [
    'Produit A - Électronique',
    'Produit B - Vêtements',
    'Produit C - Alimentaire',
    'Produit D - Mobilier',
    'Produit E - Outils',
  ];

  for (const warehouse of warehouses) {
    for (let i = 0; i < 5; i++) {
      const product = await prisma.product.create({
        data: {
          sku: `SKU-${warehouse.id.substring(0, 4)}-${String(i + 1).padStart(3, '0')}`,
          name: productNames[i],
          description: `Description du ${productNames[i]}`,
          unitPrice: Math.round((Math.random() * 100 + 10) * 100) / 100,
          weight: Math.random() * 10 + 0.5,
          dimensions: `${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 50 + 10)}`,
          warehouseId: warehouse.id,
          isActive: true,
        },
      });

      // Créer stock initial
      const initialStock = Math.floor(Math.random() * 100 + 20);
      await prisma.stock.create({
        data: {
          productId: product.id,
          quantity: initialStock,
          reserved: 0,
          minLevel: 10,
        },
      });

      products.push(product);
      console.log(`✅ Product created:`, product.name, `(Stock: ${initialStock})`);
    }
  }

  // 6. Créer livreurs
  const drivers = [];
  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex];
    for (let i = 1; i <= 3; i++) {
      const driverPassword = await bcrypt.hash('driver123', 10);
      // Créer un email unique en incluant l'index de l'entreprise
      const driverEmail = `driver${i}@company${companyIndex + 1}.example.com`;
      const driverUser = await prisma.user.upsert({
        where: { email: driverEmail },
        update: {},
        create: {
          email: driverEmail,
          password: driverPassword,
          firstName: `Livreur`,
          lastName: `${i}`,
          role: Role.DRIVER,
          companyId: company.id,
          isActive: true,
        },
      });

      // Créer un numéro de licence unique en incluant l'index de l'entreprise
      const licenseNumber = `LIC-C${companyIndex + 1}-${String(i).padStart(3, '0')}`;
      const driver = await prisma.driver.upsert({
        where: { licenseNumber },
        update: {},
        create: {
          licenseNumber,
          vehicleType: ['car', 'truck', 'motorcycle'][i % 3],
          vehiclePlate: `${String.fromCharCode(65 + i)}B-${Math.floor(Math.random() * 999)}-${String.fromCharCode(65 + i)}${String.fromCharCode(65 + i)}`,
          isAvailable: Math.random() > 0.3, // 70% disponibles
          currentZone: `Zone ${i}`,
          userId: driverUser.id,
          companyId: company.id,
        },
      });
      drivers.push(driver);
      console.log(`✅ Driver created:`, driver.licenseNumber);
    }
  }

  // 7. Créer livraisons fictives
  const statuses: DeliveryStatus[] = [
    'CREATED',
    'PREPARED',
    'ASSIGNED',
    'IN_TRANSIT',
    'DELIVERED',
    'DELIVERED',
    'DELIVERED', // Plus de livraisons livrées pour stats
  ];

  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex];
    const companyWarehouses = warehouses.filter(w => w.companyId === company.id);
    const companyDrivers = drivers.filter(d => d.companyId === company.id);
    const companyProducts = products.filter(p =>
      companyWarehouses.some(w => w.id === p.warehouseId)
    );

    // Créer 10-15 livraisons par entreprise
    const numDeliveries = Math.floor(Math.random() * 6 + 10);
    for (let i = 0; i < numDeliveries; i++) {
      const warehouse = companyWarehouses[Math.floor(Math.random() * companyWarehouses.length)];
      const warehouseProducts = companyProducts.filter(p => p.warehouseId === warehouse.id);
      const selectedProducts = warehouseProducts.slice(0, Math.floor(Math.random() * 3 + 1));
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const admin = users.find(u => u.companyId === company.id && u.role === Role.COMPANY_ADMIN)!;
      const driver = status !== 'CREATED' && status !== 'PREPARED'
        ? companyDrivers[Math.floor(Math.random() * companyDrivers.length)]
        : null;

      // Calculer coût total
      let totalCost = 0;
      const items = [];
      for (const product of selectedProducts) {
        const quantity = Math.floor(Math.random() * 5 + 1);
        const unitPrice = Number(product.unitPrice);
        const totalPrice = unitPrice * quantity;
        totalCost += totalPrice;
        items.push({
          productId: product.id,
          quantity,
          unitPrice,
          totalPrice,
        });
      }

      // Générer référence unique en incluant l'index de l'entreprise et un compteur par entreprise
      const companyDeliveriesCount = await prisma.delivery.count({
        where: { companyId: company.id },
      });
      const reference = `DEL-${new Date().getFullYear()}-C${companyIndex + 1}-${String(companyDeliveriesCount + 1).padStart(6, '0')}`;

      const delivery = await prisma.delivery.create({
        data: {
          reference,
          companyId: company.id,
          warehouseId: warehouse.id,
          createdById: admin.id,
          driverId: driver?.id || null,
          deliveryAddress: `${Math.floor(Math.random() * 200 + 1)} Rue de la Livraison`,
          deliveryCity: 'Paris',
          deliveryPostalCode: `7500${Math.floor(Math.random() * 20)}`,
          deliveryLatitude: 48.8566 + (Math.random() * 0.1 - 0.05),
          deliveryLongitude: 2.3522 + (Math.random() * 0.1 - 0.05),
          status,
          totalCost,
          estimatedDeliveryDate: status === 'IN_TRANSIT' || status === 'DELIVERED'
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          actualDeliveryDate: status === 'DELIVERED'
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            : null,
          items: {
            create: items,
          },
          statusHistory: {
            create: [
              {
                status: 'CREATED',
                notes: 'Livraison créée',
              },
              ...(status !== 'CREATED' ? [{
                status: status as DeliveryStatus,
                notes: `Statut: ${status}`,
              }] : []),
            ],
          },
        },
      });

      console.log(`✅ Delivery created:`, delivery.reference, `(${status})`);
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- 1 Platform Owner`);
  console.log(`- ${companies.length} Companies`);
  console.log(`- ${users.length} Users`);
  console.log(`- ${warehouses.length} Warehouses`);
  console.log(`- ${products.length} Products`);
  console.log(`- ${drivers.length} Drivers`);
  const deliveryCount = await prisma.delivery.count();
  console.log(`- ${deliveryCount} Deliveries`);
  console.log('\n🔑 Credentials:');
  console.log('Platform Owner: owner@platform.com / owner123');
  console.log('Company 1 Admin: admin@company1.example.com / admin123');
  console.log('Company 1 Warehouse Agent: agent@company1.example.com / agent123');
  console.log('Company 1 Drivers: driver1@company1.example.com / driver123');
  console.log('Company 2 Admin: admin@company2.example.com / admin123');
  console.log('Company 2 Warehouse Agent: agent@company2.example.com / agent123');
  console.log('Company 2 Drivers: driver1@company2.example.com / driver123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
