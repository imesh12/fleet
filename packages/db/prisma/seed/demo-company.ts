import { hashPassword } from '@trackigniter8/auth';

import type { PrismaClient } from '../../src/index.js';
import {
  DEMO_ORG_CODE,
  DEMO_PASSWORD,
  addDays,
  addMinutes,
  code,
  createManyChunked,
  decimal,
  demoMeta,
  getDemoReferenceDate,
  money,
  pick,
  routePoint,
  upsertByUnique,
} from './helpers.js';

type Prisma = PrismaClient;

const jpCustomers = [
  'Marunouchi Office Transit',
  'Kanda Medical Shuttle',
  'Ueno Museum Logistics',
  'Asakusa Tourism Services',
  'Shinjuku Hotel Loop',
  'Nakano Ward Mobility',
  'Shinagawa Port Services',
  'Haneda Airport Support',
  'Ikebukuro Retail Distribution',
  'Akabane Community Transport',
];

const routeNames = [
  'Tokyo Station -> Akihabara -> Ueno -> Asakusa',
  'Shinjuku -> Nakano -> Koenji -> Ogikubo',
  'Shinagawa -> Ota -> Haneda Airport',
  'Ikebukuro -> Itabashi -> Akabane',
  'Roppongi -> Ginza -> Tokyo Station',
];

async function seedOrganizations(prisma: Prisma) {
  const orgs = [
    ['Tokyo Metro Fleet Services', DEMO_ORG_CODE, 'Tokyo'],
    ['Osaka Regional Transport', 'DEMO-OSAKA', 'Osaka'],
    ['Yokohama Service Logistics', 'DEMO-YOKOHAMA', 'Yokohama'],
  ];

  const records = [];
  for (const [name, orgCode, city] of orgs) {
    records.push(
      await prisma.organization.upsert({
        where: { code: orgCode },
        create: {
          name,
          code: orgCode,
          legalName: `${name} K.K.`,
          email: `${orgCode.toLowerCase()}@trackigniter8.local`,
          phone: '+81-3-0000-0000',
          taxIdentifier: `${orgCode}-TAX-DEMO`,
          status: 'ACTIVE',
        },
        update: {
          name,
          legalName: `${name} K.K.`,
          email: `${orgCode.toLowerCase()}@trackigniter8.local`,
          phone: '+81-3-0000-0000',
          status: 'ACTIVE',
        },
      }),
    );
  }

  for (const org of records) {
    await prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId: org.id, key: 'demo.seed.enabled' } },
      create: {
        organizationId: org.id,
        key: 'demo.seed.enabled',
        value: 'true',
        valueType: 'BOOLEAN',
        category: 'demo',
        description: 'Marks this tenant as a development demo tenant.',
      },
      update: { value: 'true', valueType: 'BOOLEAN', category: 'demo' },
    });
  }

  return records;
}

async function seedUsers(prisma: Prisma, organizationIds: string[]) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const roleByCode = Object.fromEntries((await prisma.role.findMany()).map((role) => [role.code, role]));
  const specs = [
    ['admin.demo@trackigniter8.local', 'demo-admin', 'Aiko', 'Tanaka', 'ADMIN', 'ADMIN'],
    ['manager01.demo@trackigniter8.local', 'demo-manager01', 'Ren', 'Sato', 'MANAGER', 'ADMIN'],
    ['manager02.demo@trackigniter8.local', 'demo-manager02', 'Mika', 'Kobayashi', 'MANAGER', 'ADMIN'],
    ['staff01.demo@trackigniter8.local', 'demo-staff01', 'Haru', 'Suzuki', 'STAFF', 'MEMBER'],
    ['staff02.demo@trackigniter8.local', 'demo-staff02', 'Yui', 'Watanabe', 'STAFF', 'MEMBER'],
    ['staff03.demo@trackigniter8.local', 'demo-staff03', 'Sora', 'Ito', 'STAFF', 'MEMBER'],
    ['staff04.demo@trackigniter8.local', 'demo-staff04', 'Nao', 'Yamamoto', 'STAFF', 'MEMBER'],
    ['staff05.demo@trackigniter8.local', 'demo-staff05', 'Kai', 'Nakamura', 'STAFF', 'MEMBER'],
    ['viewer01.demo@trackigniter8.local', 'demo-viewer01', 'Emi', 'Hayashi', 'VIEWER', 'VIEWER'],
    ['viewer02.demo@trackigniter8.local', 'demo-viewer02', 'Riku', 'Mori', 'VIEWER', 'VIEWER'],
    ['viewer03.demo@trackigniter8.local', 'demo-viewer03', 'Nana', 'Abe', 'VIEWER', 'VIEWER'],
  ];

  const users = [];
  for (const [email, username, firstName, lastName, roleCode, orgRole] of specs) {
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, username, firstName, lastName, passwordHash, status: 'ACTIVE' },
      update: { username, firstName, lastName, passwordHash, status: 'ACTIVE' },
    });
    users.push(user);

    const role = roleByCode[roleCode];
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });
    }

    for (const organizationId of organizationIds) {
      await prisma.organizationUser.upsert({
        where: { organizationId_userId: { organizationId, userId: user.id } },
        create: { organizationId, userId: user.id, role: orgRole as never, status: 'ACTIVE' },
        update: { role: orgRole as never, status: 'ACTIVE' },
      });
    }
  }
  return users;
}

async function seedMasterData(prisma: Prisma, organizationId: string, ref: Date) {
  const departments = [
    'Fleet Operations',
    'Dispatch Control',
    'Vehicle Maintenance',
    'Driver Management',
    'Safety and Compliance',
    'Customer Services',
    'Finance Operations',
    'IT and Tracking',
  ];
  const businessUnits = ['Central Tokyo', 'Airport Services', 'Northern Corridor', 'Event Mobility', 'Night Operations'];
  const vendorCategories = ['Maintenance', 'Fuel', 'Telematics', 'Cleaning', 'Parts', 'Emergency Support'];

  for (const [index, name] of departments.entries()) {
    await upsertByUnique(prisma.department, { organizationId_code: { organizationId, code: code('DEPT', index + 1) } }, {
      organizationId,
      name,
      code: code('DEPT', index + 1),
      description: `${name} demo department`,
      status: 'ACTIVE',
    });
  }
  for (const [index, name] of businessUnits.entries()) {
    await upsertByUnique(prisma.businessUnit, { organizationId_code: { organizationId, code: code('BU', index + 1) } }, {
      organizationId,
      name,
      code: code('BU', index + 1),
      description: `${name} business unit`,
      status: 'ACTIVE',
    });
  }
  for (const [index, name] of vendorCategories.entries()) {
    await upsertByUnique(prisma.vendorCategory, { organizationId_code: { organizationId, code: code('VCAT', index + 1) } }, {
      organizationId,
      name,
      code: code('VCAT', index + 1),
      description: `${name} vendor category`,
      status: 'ACTIVE',
    });
  }

  for (const [index, name] of jpCustomers.entries()) {
    const customer = await upsertByUnique(prisma.customerAccount, { organizationId_code: { organizationId, code: code('CUST', index + 1) } }, {
      organizationId,
      name,
      code: code('CUST', index + 1),
      email: `customer${index + 1}@demo.trackigniter8.local`,
      phone: `+81-3-5555-${String(index + 1).padStart(4, '0')}`,
      billingAddress: `${1 + index}-1 Chiyoda, Tokyo`,
      notes: 'DEMO-SEED customer account',
      status: 'ACTIVE',
    });
    await prisma.customerContact.deleteMany({ where: { customerAccountId: customer.id } });
    await prisma.customerLocation.deleteMany({ where: { customerAccountId: customer.id } });
    await prisma.customerContact.createMany({
      data: [0, 1].slice(0, index < 5 ? 2 : 1).map((offset) => ({
        customerAccountId: customer.id,
        firstName: pick(['Keiko', 'Daichi', 'Yuna', 'Toma', 'Mei'], index + offset),
        lastName: pick(['Ishida', 'Fujita', 'Kato', 'Okada', 'Maeda'], index + offset),
        email: `contact${index + 1}${offset}@demo.trackigniter8.local`,
        phone: `+81-90-1000-${String(index * 2 + offset).padStart(4, '0')}`,
        title: offset === 0 ? 'Operations Lead' : 'Site Coordinator',
        isPrimary: offset === 0,
      })),
    });
    await prisma.customerLocation.createMany({
      data: [0, 1].slice(0, index < 5 ? 2 : 1).map((offset) => {
        const point = routePoint(index, offset);
        return {
          customerAccountId: customer.id,
          name: `${name} ${offset === 0 ? 'Main Site' : 'Depot'}`,
          code: code(`LOC${index + 1}`, offset + 1, 2),
          addressLine1: `${index + 2}-${offset + 1} Demo Street`,
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: `10${index}${offset}-000${offset}`,
          country: 'JP',
          latitude: point.latitude,
          longitude: point.longitude,
          isPrimary: offset === 0,
        };
      }),
    });
  }

  const categories = await prisma.vendorCategory.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  for (let index = 0; index < 10; index += 1) {
    const vendor = await upsertByUnique(prisma.vendor, { organizationId_code: { organizationId, code: code('VEND', index + 1) } }, {
      organizationId,
      vendorCategoryId: pick(categories, index).id,
      name: pick(['Tokyo Fleet Garage', 'Nippon Fuel Network', 'Kanto Telematics', 'Shiba Cleaning Works', 'Metro Parts Supply'], index) + ` ${index + 1}`,
      code: code('VEND', index + 1),
      email: `vendor${index + 1}@demo.trackigniter8.local`,
      phone: `+81-3-7777-${String(index + 1).padStart(4, '0')}`,
      address: `${index + 1}-2 Minato, Tokyo`,
      notes: 'DEMO-SEED vendor',
      status: 'ACTIVE',
    });
    await prisma.vendorContact.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.vendorContact.create({
      data: {
        vendorId: vendor.id,
        firstName: pick(['Ryo', 'Hana', 'Kenta', 'Mao'], index),
        lastName: pick(['Goto', 'Endo', 'Arai', 'Miura'], index),
        email: `vendor-contact${index + 1}@demo.trackigniter8.local`,
        phone: `+81-80-2000-${String(index + 1).padStart(4, '0')}`,
        title: 'Account Manager',
        isPrimary: true,
      },
    });
    if (index < 8) {
      await prisma.vendorContract.upsert({
        where: { vendorId_contractNumber: { vendorId: vendor.id, contractNumber: code('DEMO-CONTRACT', index + 1) } },
        create: {
          vendorId: vendor.id,
          contractNumber: code('DEMO-CONTRACT', index + 1),
          title: `Demo service agreement ${index + 1}`,
          description: 'Development demo contract metadata',
          startDate: addDays(ref, -120),
          endDate: addDays(ref, 365 + index * 10),
          status: index % 5 === 0 ? 'EXPIRED' : 'ACTIVE',
          notes: 'DEMO-SEED',
        },
        update: {
          title: `Demo service agreement ${index + 1}`,
          endDate: addDays(ref, 365 + index * 10),
          status: index % 5 === 0 ? 'EXPIRED' : 'ACTIVE',
        },
      });
    }
  }

  const customerLocations = await prisma.customerLocation.findMany({
    where: { customerAccount: { organizationId } },
    orderBy: { name: 'asc' },
  });
  for (let index = 0; index < 8; index += 1) {
    const area = await upsertByUnique(prisma.serviceArea, { organizationId_code: { organizationId, code: code('AREA', index + 1) } }, {
      organizationId,
      name: pick(['Tokyo Station Depot', 'Shinjuku Operations Zone', 'Haneda Airport Service Area', 'Ueno Maintenance Yard'], index),
      code: code('AREA', index + 1),
      description: 'DEMO-SEED service area',
      status: 'ACTIVE',
    });
    const location = pick(customerLocations, index);
    await prisma.serviceAreaLocation.upsert({
      where: { serviceAreaId_customerLocationId: { serviceAreaId: area.id, customerLocationId: location.id } },
      create: { serviceAreaId: area.id, customerLocationId: location.id },
      update: {},
    });
  }

  for (let index = 0; index < 5; index += 1) {
    await upsertByUnique(prisma.serviceRouteGroup, { organizationId_code: { organizationId, code: code('RG', index + 1) } }, {
      organizationId,
      name: pick(['Central Loop', 'Airport Corridor', 'North Line', 'West Express', 'Night Shuttle'], index),
      code: code('RG', index + 1),
      description: 'DEMO-SEED route group',
      status: 'ACTIVE',
    });
  }
  const routeGroups = await prisma.serviceRouteGroup.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  for (let index = 0; index < 15; index += 1) {
    const template = await upsertByUnique(prisma.serviceRouteTemplate, { organizationId_code: { organizationId, code: code('RTPL', index + 1) } }, {
      organizationId,
      serviceRouteGroupId: pick(routeGroups, index).id,
      name: `${pick(routeNames, index)} Template ${index + 1}`,
      code: code('RTPL', index + 1),
      description: 'DEMO-SEED route template',
      status: 'ACTIVE',
    });
    await prisma.serviceRouteTemplateStop.deleteMany({ where: { serviceRouteTemplateId: template.id } });
    await prisma.serviceRouteTemplateStop.createMany({
      data: Array.from({ length: 5 }, (_, stopIndex) => {
        const point = routePoint(index, stopIndex);
        return {
          serviceRouteTemplateId: template.id,
          name: `Template Stop ${stopIndex + 1}`,
          code: code(`RTPL${index + 1}-STOP`, stopIndex + 1),
          sequence: stopIndex + 1,
          addressLine1: `${stopIndex + 1} Demo Route Avenue`,
          city: 'Tokyo',
          country: 'JP',
          latitude: point.latitude,
          longitude: point.longitude,
        };
      }),
    });
  }
}

async function seedFleetAndDrivers(prisma: Prisma, organizationId: string, ref: Date) {
  const vehicleTypes = ['Minibus', 'Coach', 'Van', 'Light Truck', 'Service Vehicle', 'EV Shuttle'];
  const vehicleGroups = ['Airport Fleet', 'Central Shuttle', 'Maintenance Support', 'Customer Dedicated', 'Night Operations'];
  const makes = ['Toyota', 'Hino', 'Isuzu', 'Nissan', 'Mitsubishi Fuso', 'BYD', 'Mercedes-Benz', 'Honda'];
  const models = ['Coaster', 'Sora', 'Rosa', 'Civilian', 'Elf', 'Canter', 'eBus K9', 'Sprinter', 'HiAce', 'Aero Midi', 'Dutro', 'NV350', 'Acty', 'Journey', 'Poncho'];
  for (const [index, name] of vehicleTypes.entries()) {
    await upsertByUnique(prisma.vehicleType, { organizationId_code: { organizationId, code: code('VTYPE', index + 1) } }, { organizationId, name, code: code('VTYPE', index + 1), status: 'ACTIVE' });
  }
  for (const [index, name] of vehicleGroups.entries()) {
    await upsertByUnique(prisma.vehicleGroup, { organizationId_code: { organizationId, code: code('VGROUP', index + 1) } }, { organizationId, name, code: code('VGROUP', index + 1), status: 'ACTIVE' });
  }
  for (const [index, name] of makes.entries()) {
    await upsertByUnique(prisma.vehicleMake, { organizationId_code: { organizationId, code: code('MAKE', index + 1) } }, { organizationId, name, code: code('MAKE', index + 1), status: 'ACTIVE' });
  }
  const makeRows = await prisma.vehicleMake.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  for (const [index, name] of models.entries()) {
    await upsertByUnique(prisma.vehicleModel, { organizationId_code: { organizationId, code: code('MODEL', index + 1) } }, {
      organizationId,
      vehicleMakeId: pick(makeRows, index).id,
      name,
      code: code('MODEL', index + 1),
      status: 'ACTIVE',
    });
  }

  const [customers, departments, businessUnits, types, groups, vehicleModels, routeTemplates] = await Promise.all([
    prisma.customerAccount.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.department.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.businessUnit.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.vehicleType.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.vehicleGroup.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.vehicleModel.findMany({ where: { organizationId }, include: { vehicleMake: true }, orderBy: { code: 'asc' } }),
    prisma.serviceRouteTemplate.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
  ]);

  for (let index = 0; index < 20; index += 1) {
    const model = pick(vehicleModels, index);
    await prisma.vehicle.upsert({
      where: { organizationId_registrationNumber: { organizationId, registrationNumber: code('DEMO-VEH', index + 1) } },
      create: {
        organizationId,
        customerAccountId: pick(customers, index).id,
        departmentId: pick(departments, index).id,
        businessUnitId: pick(businessUnits, index).id,
        vehicleTypeId: pick(types, index).id,
        vehicleGroupId: pick(groups, index).id,
        makeId: model.vehicleMakeId,
        modelId: model.id,
        serviceRouteTemplateId: pick(routeTemplates, index).id,
        registrationNumber: code('DEMO-VEH', index + 1),
        plateNumber: pick(['品川 300 あ', '練馬 500 か', '足立 400 さ', '多摩 300 す'], index) + ` ${1001 + index}`,
        vin: `DEMOJPNVIN${String(index + 1).padStart(8, '0')}`,
        chassisNumber: `DEMO-CHASSIS-${String(index + 1).padStart(4, '0')}`,
        engineNumber: `DEMO-ENGINE-${String(index + 1).padStart(4, '0')}`,
        year: 2018 + (index % 7),
        color: pick(['White', 'Silver', 'Blue', 'Green'], index),
        fuelType: pick(['DIESEL', 'PETROL', 'HYBRID', 'ELECTRIC'], index) as never,
        ownershipType: pick(['OWNED', 'LEASED', 'CONTRACTED'], index) as never,
        status: index === 18 ? 'INACTIVE' : 'ACTIVE',
        odometer: 20000 + index * 3250,
        notes: 'DEMO-SEED vehicle',
      },
      update: {
        customerAccountId: pick(customers, index).id,
        departmentId: pick(departments, index).id,
        businessUnitId: pick(businessUnits, index).id,
        status: index === 18 ? 'INACTIVE' : 'ACTIVE',
        odometer: 20000 + index * 3250,
        notes: 'DEMO-SEED vehicle',
      },
    });
  }

  const vehicles = await prisma.vehicle.findMany({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } }, orderBy: { registrationNumber: 'asc' } });
  await prisma.vehicleDocument.deleteMany({ where: { vehicleId: { in: vehicles.map((vehicle) => vehicle.id) } } });
  await prisma.vehicleDevice.deleteMany({ where: { vehicleId: { in: vehicles.map((vehicle) => vehicle.id) } } });
  await prisma.vehicleDocument.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      vehicleId: pick(vehicles, index).id,
      documentType: pick(['registration', 'insurance', 'inspection'], index),
      documentNumber: code('VDOC', index + 1),
      issueDate: addDays(ref, -240 + index),
      expiryDate: addDays(ref, index % 6 === 0 ? -5 : 30 + index * 3),
      fileName: `${code('VDOC', index + 1)}.pdf`,
      fileUrl: `/demo/files/${code('VDOC', index + 1)}.pdf`,
      fileMimeType: 'application/pdf',
      fileSizeBytes: 120000 + index,
      status: 'ACTIVE',
      notes: 'DEMO-SEED vehicle document',
    })),
  });
  await prisma.vehicleDevice.createMany({
    data: vehicles.map((vehicle, index) => ({
      vehicleId: vehicle.id,
      provider: 'DEMO_TRACCAR',
      externalDeviceId: code('DEMO-GPS', index + 1),
      imei: `3590000000${String(index + 1).padStart(5, '0')}`,
      serialNumber: code('GPS-SN', index + 1),
      status: index === 19 ? 'INACTIVE' : 'ACTIVE',
      installedAt: addDays(ref, -180 + index),
      metadata: demoMeta({ deviceSlot: index + 1 }),
    })),
  });

  const vehicleComplianceNames = ['Registration', 'Insurance', 'Roadworthiness', 'Emission', 'Inspection'];
  for (const [index, name] of vehicleComplianceNames.entries()) {
    await upsertByUnique(prisma.vehicleComplianceType, { organizationId_code: { organizationId, code: code('VCOMP', index + 1) } }, { organizationId, name, code: code('VCOMP', index + 1), status: 'ACTIVE' });
  }
  const vcomp = await prisma.vehicleComplianceType.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  await prisma.vehicleComplianceRecord.deleteMany({ where: { vehicleId: { in: vehicles.map((vehicle) => vehicle.id) } } });
  await prisma.vehicleComplianceRecord.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      vehicleId: pick(vehicles, index).id,
      vehicleComplianceTypeId: pick(vcomp, index).id,
      referenceNumber: code('VCREC', index + 1),
      issueDate: addDays(ref, -180 + index),
      expiryDate: addDays(ref, index % 7 === 0 ? -3 : 45 + index),
      status: index % 7 === 0 ? 'EXPIRED' : 'ACTIVE',
      notes: 'DEMO-SEED vehicle compliance',
    })),
  });

  const driverGroups = ['Full-Time Drivers', 'Airport Certified', 'Relief Drivers', 'Night Shift', 'Contract Crew'];
  const driverSkills = ['Airport Permit', 'EV Operation', 'Defensive Driving', 'English Support', 'First Aid', 'Wheelchair Lift', 'Large Bus', 'Hazmat Awareness', 'Snow Route', 'Customer VIP', 'Night Dispatch', 'Telematics Check'];
  for (const [index, name] of driverGroups.entries()) {
    await upsertByUnique(prisma.driverGroup, { organizationId_code: { organizationId, code: code('DGRP', index + 1) } }, { organizationId, name, code: code('DGRP', index + 1), status: 'ACTIVE' });
  }
  for (const [index, name] of driverSkills.entries()) {
    await upsertByUnique(prisma.driverSkill, { organizationId_code: { organizationId, code: code('DSKILL', index + 1) } }, { organizationId, name, code: code('DSKILL', index + 1), status: 'ACTIVE' });
  }
  const [driverGroupRows, skillRows] = await Promise.all([
    prisma.driverGroup.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.driverSkill.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
  ]);
  const firstNames = ['Haruto', 'Yuto', 'Sota', 'Yuki', 'Hayato', 'Mei', 'Aoi', 'Hina', 'Rin', 'Sakura'];
  const lastNames = ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'];
  for (let index = 0; index < 20; index += 1) {
    const firstName = pick(firstNames, index);
    const lastName = pick(lastNames, index);
    await prisma.driver.upsert({
      where: { organizationId_employeeNumber: { organizationId, employeeNumber: code('DEMO-DRV', index + 1) } },
      create: {
        organizationId,
        customerAccountId: pick(customers, index).id,
        departmentId: pick(departments, index).id,
        businessUnitId: pick(businessUnits, index).id,
        driverGroupId: pick(driverGroupRows, index).id,
        employeeNumber: code('DEMO-DRV', index + 1),
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        email: `driver${String(index + 1).padStart(2, '0')}@demo.trackigniter8.local`,
        phone: `+81-90-3000-${String(index + 1).padStart(4, '0')}`,
        gender: pick(['MALE', 'FEMALE', 'UNSPECIFIED'], index) as never,
        addressLine1: `${index + 1}-3 Driver Street`,
        city: 'Tokyo',
        country: 'JP',
        emergencyContactName: `${pick(firstNames, index + 2)} ${lastName}`,
        emergencyContactPhone: `+81-90-3999-${String(index + 1).padStart(4, '0')}`,
        emergencyContactRelationship: 'Family',
        hireDate: addDays(ref, -900 + index * 10),
        employmentType: pick(['FULL_TIME', 'PART_TIME', 'CONTRACT'], index) as never,
        status: index === 19 ? 'INACTIVE' : 'ACTIVE',
        notes: 'DEMO-SEED driver',
      },
      update: {
        displayName: `${firstName} ${lastName}`,
        status: index === 19 ? 'INACTIVE' : 'ACTIVE',
        notes: 'DEMO-SEED driver',
      },
    });
  }

  const drivers = await prisma.driver.findMany({ where: { organizationId, employeeNumber: { startsWith: 'DEMO-DRV-' } }, orderBy: { employeeNumber: 'asc' } });
  await prisma.driverSkillAssignment.deleteMany({ where: { driverId: { in: drivers.map((driver) => driver.id) } } });
  await prisma.driverLicense.deleteMany({ where: { driverId: { in: drivers.map((driver) => driver.id) } } });
  await prisma.driverDocument.deleteMany({ where: { driverId: { in: drivers.map((driver) => driver.id) } } });
  await prisma.driverVehicleAssignment.deleteMany({ where: { organizationId, driverId: { in: drivers.map((driver) => driver.id) } } });
  await prisma.driverComplianceRecord.deleteMany({ where: { driverId: { in: drivers.map((driver) => driver.id) } } });

  await prisma.driverSkillAssignment.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      driverId: pick(drivers, index).id,
      driverSkillId: pick(skillRows, index).id,
      assignedAt: addDays(ref, -120 + index),
      notes: 'DEMO-SEED skill assignment',
    })),
    skipDuplicates: true,
  });
  await prisma.driverLicense.createMany({
    data: Array.from({ length: 25 }, (_, index) => ({
      driverId: pick(drivers, index).id,
      licenseNumber: code('DL-TYO', index + 1),
      licenseType: pick(['Class 2 Bus', 'Medium Vehicle', 'Large Vehicle'], index),
      issuingCountry: 'JP',
      issueDate: addDays(ref, -900 + index),
      expiryDate: addDays(ref, index % 8 === 0 ? -10 : 90 + index * 2),
      status: index % 8 === 0 ? 'EXPIRED' : 'ACTIVE',
      notes: 'DEMO-SEED license',
    })),
  });
  await prisma.driverDocument.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      driverId: pick(drivers, index).id,
      documentType: pick(['identity', 'medical', 'training'], index),
      documentNumber: code('DDOC', index + 1),
      issueDate: addDays(ref, -360 + index),
      expiryDate: addDays(ref, index % 9 === 0 ? -4 : 60 + index),
      fileName: `${code('DDOC', index + 1)}.pdf`,
      fileUrl: `/demo/files/${code('DDOC', index + 1)}.pdf`,
      fileMimeType: 'application/pdf',
      fileSizeBytes: 90000 + index,
      status: index % 9 === 0 ? 'ARCHIVED' : 'ACTIVE',
      notes: 'DEMO-SEED driver document',
    })),
  });
  for (const name of ['Medical Check', 'Background Check', 'Safety Course', 'Customer Service Training']) {
    const index = ['Medical Check', 'Background Check', 'Safety Course', 'Customer Service Training'].indexOf(name);
    await upsertByUnique(prisma.driverComplianceType, { organizationId_code: { organizationId, code: code('DCOMP', index + 1) } }, { organizationId, name, code: code('DCOMP', index + 1), status: 'ACTIVE' });
  }
  const dcomp = await prisma.driverComplianceType.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  await prisma.driverComplianceRecord.createMany({
    data: Array.from({ length: 25 }, (_, index) => ({
      driverId: pick(drivers, index).id,
      driverComplianceTypeId: pick(dcomp, index).id,
      referenceNumber: code('DCREC', index + 1),
      issueDate: addDays(ref, -240 + index),
      expiryDate: addDays(ref, index % 6 === 0 ? -2 : 75 + index),
      status: index % 6 === 0 ? 'EXPIRED' : 'ACTIVE',
      notes: 'DEMO-SEED driver compliance',
    })),
  });
  await prisma.driverVehicleAssignment.createMany({
    data: Array.from({ length: 25 }, (_, index) => ({
      organizationId,
      driverId: pick(drivers, index).id,
      vehicleId: pick(vehicles, index).id,
      assignmentType: index < 20 ? 'PRIMARY' : 'RELIEF',
      startDate: addDays(ref, -45 + index),
      endDate: index >= 20 ? addDays(ref, -5 + index) : null,
      status: index >= 20 ? 'ENDED' : 'ACTIVE',
      notes: 'DEMO-SEED assignment',
    })),
  });

  return { vehicles, drivers };
}

async function seedRoutesTripsAndTracking(prisma: Prisma, organizationId: string, ref: Date) {
  const [customers, vehicles, drivers, assignments, routeTemplates] = await Promise.all([
    prisma.customerAccount.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.vehicle.findMany({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } }, orderBy: { registrationNumber: 'asc' } }),
    prisma.driver.findMany({ where: { organizationId, employeeNumber: { startsWith: 'DEMO-DRV-' } }, orderBy: { employeeNumber: 'asc' } }),
    prisma.driverVehicleAssignment.findMany({ where: { organizationId }, orderBy: { startDate: 'asc' } }),
    prisma.serviceRouteTemplate.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
  ]);

  for (let index = 0; index < 30; index += 1) {
    const route = await upsertByUnique(prisma.serviceRoute, { organizationId_code: { organizationId, code: code('ROUTE', index + 1) } }, {
      organizationId,
      name: `${pick(routeNames, index)} ${index + 1}`,
      code: code('ROUTE', index + 1),
      description: 'DEMO-SEED service route',
      status: 'ACTIVE',
    });
    await prisma.serviceStop.deleteMany({ where: { serviceRouteId: route.id } });
    await prisma.serviceStop.createMany({
      data: Array.from({ length: 5 }, (_, stopIndex) => {
        const point = routePoint(index, stopIndex);
        return {
          serviceRouteId: route.id,
          name: `Route ${index + 1} Stop ${stopIndex + 1}`,
          code: code(`R${index + 1}-STOP`, stopIndex + 1),
          sequence: stopIndex + 1,
          addressLine1: `${stopIndex + 1} Demo Route Street`,
          city: 'Tokyo',
          country: 'JP',
          latitude: point.latitude,
          longitude: point.longitude,
        };
      }),
    });
  }
  const routes = await prisma.serviceRoute.findMany({ where: { organizationId }, include: { stops: { orderBy: { sequence: 'asc' } } }, orderBy: { code: 'asc' } });

  for (let index = 0; index < 15; index += 1) {
    const template = await upsertByUnique(prisma.tripTemplate, { organizationId_code: { organizationId, code: code('TRIPTPL', index + 1) } }, {
      organizationId,
      serviceRouteId: pick(routes, index).id,
      serviceRouteTemplateId: pick(routeTemplates, index).id,
      name: `Demo Trip Template ${index + 1}`,
      code: code('TRIPTPL', index + 1),
      description: 'DEMO-SEED trip template',
      status: 'ACTIVE',
    });
    await prisma.tripTemplateStop.deleteMany({ where: { tripTemplateId: template.id } });
    await prisma.tripTemplateStop.createMany({
      data: pick(routes, index).stops.map((stop) => ({
        tripTemplateId: template.id,
        serviceStopId: stop.id,
        name: stop.name,
        code: stop.code,
        sequence: stop.sequence,
        addressLine1: stop.addressLine1,
        city: stop.city,
        country: stop.country,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    });
  }
  const tripTemplates = await prisma.tripTemplate.findMany({ where: { organizationId }, include: { stops: { orderBy: { sequence: 'asc' } } }, orderBy: { code: 'asc' } });

  for (let index = 0; index < 60; index += 1) {
    const plannedDate = addDays(ref, -30 + index);
    const planned = await prisma.plannedTrip.upsert({
      where: { organizationId_referenceCode: { organizationId, referenceCode: code('PTRIP', index + 1) } },
      create: {
        organizationId,
        customerAccountId: pick(customers, index).id,
        serviceRouteId: pick(routes, index).id,
        serviceRouteTemplateId: pick(routeTemplates, index).id,
        tripTemplateId: pick(tripTemplates, index).id,
        vehicleId: pick(vehicles, index).id,
        driverId: pick(drivers, index).id,
        assignmentId: pick(assignments, index).id,
        title: `Demo Planned Trip ${index + 1}`,
        referenceCode: code('PTRIP', index + 1),
        plannedStartAt: addMinutes(plannedDate, 8 * 60 + (index % 6) * 30),
        plannedEndAt: addMinutes(plannedDate, 11 * 60 + (index % 6) * 30),
        status: pick(['DRAFT', 'PLANNED', 'READY', 'BLOCKED', 'CANCELED', 'DISPATCHED_PLACEHOLDER'], index) as never,
        priority: pick(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'], index) as never,
        notes: 'DEMO-SEED planned trip',
      },
      update: {
        status: pick(['DRAFT', 'PLANNED', 'READY', 'BLOCKED', 'CANCELED', 'DISPATCHED_PLACEHOLDER'], index) as never,
        priority: pick(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'], index) as never,
        notes: 'DEMO-SEED planned trip',
      },
    });
    await prisma.plannedTripStop.deleteMany({ where: { plannedTripId: planned.id } });
    await prisma.plannedTripStop.createMany({
      data: pick(tripTemplates, index).stops.slice(0, index < 20 ? 4 : 3).map((stop, stopIndex) => ({
        plannedTripId: planned.id,
        tripTemplateStopId: stop.id,
        serviceStopId: stop.serviceStopId,
        name: stop.name,
        code: stop.code,
        sequence: stopIndex + 1,
        plannedArrivalAt: addMinutes(planned.plannedStartAt, stopIndex * 25),
        plannedDepartureAt: addMinutes(planned.plannedStartAt, stopIndex * 25 + 5),
        addressLine1: stop.addressLine1,
        city: stop.city,
        country: stop.country,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    });
  }
  const plannedTrips = await prisma.plannedTrip.findMany({ where: { organizationId, referenceCode: { startsWith: 'PTRIP-' } }, include: { stops: { orderBy: { sequence: 'asc' } } }, orderBy: { referenceCode: 'asc' } });

  for (let index = 0; index < 5; index += 1) {
    const queue = await upsertByUnique(prisma.dispatchQueue, { organizationId_code: { organizationId, code: code('DQ', index + 1) } }, {
      organizationId,
      name: `Demo Dispatch Queue ${index + 1}`,
      code: code('DQ', index + 1),
      description: 'DEMO-SEED dispatch queue',
      status: 'ACTIVE',
    });
    await prisma.dispatchQueueItem.deleteMany({ where: { dispatchQueueId: queue.id } });
    await prisma.dispatchQueueItem.createMany({
      data: Array.from({ length: 8 }, (_, itemIndex) => ({
        dispatchQueueId: queue.id,
        plannedTripId: plannedTrips[index * 8 + itemIndex]!.id,
        sequence: itemIndex + 1,
        status: pick(['PLANNED', 'READY', 'BLOCKED', 'HELD'], itemIndex) as never,
        notes: 'DEMO-SEED dispatch item',
        holdReason: itemIndex % 4 === 2 ? 'Awaiting compliance confirmation' : null,
      })),
    });
  }
  const queueItems = await prisma.dispatchQueueItem.findMany({ where: { dispatchQueue: { organizationId } }, orderBy: [{ dispatchQueueId: 'asc' }, { sequence: 'asc' }] });

  for (let index = 0; index < 30; index += 1) {
    const planned = plannedTrips[index]!;
    const status = pick(['SCHEDULED', 'READY', 'DISPATCHED', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'FAILED'], index) as never;
    const startedAt = addMinutes(planned.plannedStartAt, 15);
    const trip = await prisma.trip.upsert({
      where: { organizationId_referenceCode: { organizationId, referenceCode: code('TRIP', index + 1) } },
      create: {
        organizationId,
        plannedTripId: planned.id,
        dispatchQueueItemId: index < queueItems.length ? queueItems[index]!.id : null,
        customerAccountId: planned.customerAccountId,
        serviceRouteId: planned.serviceRouteId,
        serviceRouteTemplateId: planned.serviceRouteTemplateId,
        tripTemplateId: planned.tripTemplateId,
        vehicleId: planned.vehicleId,
        driverId: planned.driverId,
        assignmentId: planned.assignmentId,
        title: `Demo Executed Trip ${index + 1}`,
        referenceCode: code('TRIP', index + 1),
        scheduledStartAt: planned.plannedStartAt,
        scheduledEndAt: planned.plannedEndAt,
        dispatchedAt: addMinutes(planned.plannedStartAt, -10),
        startedAt: ['STARTED', 'ON_HOLD', 'COMPLETED', 'FAILED'].includes(status) ? startedAt : null,
        completedAt: status === 'COMPLETED' ? addMinutes(startedAt, 150) : null,
        cancelledAt: status === 'CANCELLED' ? addMinutes(planned.plannedStartAt, -20) : null,
        failedAt: status === 'FAILED' ? addMinutes(startedAt, 80) : null,
        holdStartedAt: status === 'ON_HOLD' ? addMinutes(startedAt, 45) : null,
        status,
        notes: 'DEMO-SEED executed trip',
      },
      update: {
        status,
        completedAt: status === 'COMPLETED' ? addMinutes(startedAt, 150) : null,
        cancelledAt: status === 'CANCELLED' ? addMinutes(planned.plannedStartAt, -20) : null,
        failedAt: status === 'FAILED' ? addMinutes(startedAt, 80) : null,
        notes: 'DEMO-SEED executed trip',
      },
    });
    await prisma.tripStop.deleteMany({ where: { tripId: trip.id } });
    await prisma.tripEvent.deleteMany({ where: { tripId: trip.id } });
    await prisma.tripStop.createMany({
      data: planned.stops.map((stop, stopIndex) => ({
        tripId: trip.id,
        plannedTripStopId: stop.id,
        serviceStopId: stop.serviceStopId,
        tripTemplateStopId: stop.tripTemplateStopId,
        name: stop.name,
        code: stop.code,
        sequence: stop.sequence,
        scheduledArrivalAt: stop.plannedArrivalAt,
        scheduledDepartureAt: stop.plannedDepartureAt,
        actualArrivalAt: ['COMPLETED', 'STARTED'].includes(status) ? addMinutes(startedAt, stopIndex * 24) : null,
        actualDepartureAt: status === 'COMPLETED' ? addMinutes(startedAt, stopIndex * 24 + 6) : null,
        status: status === 'COMPLETED' ? 'COMPLETED' : stopIndex === 0 && status === 'STARTED' ? 'ARRIVED' : 'PENDING',
        addressLine1: stop.addressLine1,
        city: stop.city,
        country: stop.country,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    });
    await prisma.tripEvent.createMany({
      data: [
        { tripId: trip.id, eventType: 'CREATED', statusTo: 'SCHEDULED', note: 'Demo trip created', happenedAt: addMinutes(planned.plannedStartAt, -60), metadata: demoMeta() },
        { tripId: trip.id, eventType: 'DISPATCHED', statusFrom: 'READY', statusTo: 'DISPATCHED', note: 'Demo dispatch', happenedAt: addMinutes(planned.plannedStartAt, -10), metadata: demoMeta() },
        ...(trip.startedAt ? [{ tripId: trip.id, eventType: 'STARTED' as const, statusFrom: 'DISPATCHED' as const, statusTo: 'STARTED' as const, note: 'Demo trip started', happenedAt: trip.startedAt, metadata: demoMeta() }] : []),
        ...(trip.completedAt ? [{ tripId: trip.id, eventType: 'COMPLETED' as const, statusFrom: 'STARTED' as const, statusTo: 'COMPLETED' as const, note: 'Demo trip completed', happenedAt: trip.completedAt, metadata: demoMeta() }] : []),
        ...(trip.cancelledAt ? [{ tripId: trip.id, eventType: 'CANCELLED' as const, statusFrom: 'SCHEDULED' as const, statusTo: 'CANCELLED' as const, note: 'Demo trip cancelled', happenedAt: trip.cancelledAt, metadata: demoMeta() }] : []),
        ...(trip.failedAt ? [{ tripId: trip.id, eventType: 'FAILED' as const, statusFrom: 'STARTED' as const, statusTo: 'FAILED' as const, note: 'Demo trip failed', happenedAt: trip.failedAt, metadata: demoMeta() }] : []),
        { tripId: trip.id, eventType: 'TELEMETRY_RECEIVED', note: 'Demo telemetry linked', happenedAt: addMinutes(planned.plannedStartAt, 30), metadata: demoMeta() },
      ],
    });
    await prisma.dispatchAction.deleteMany({ where: { organizationId, tripId: trip.id } });
    await prisma.dispatchAction.createMany({
      data: ['VALIDATED', 'ASSIGNED', 'DISPATCHED'].map((actionType, actionIndex) => ({
        organizationId,
        tripId: trip.id,
        plannedTripId: planned.id,
        dispatchQueueItemId: index < queueItems.length ? queueItems[index]!.id : null,
        actionType: actionType as never,
        note: `DEMO-SEED ${actionType.toLowerCase()}`,
        metadata: demoMeta(),
        happenedAt: addMinutes(planned.plannedStartAt, -30 + actionIndex * 10),
      })),
    });
  }

  await seedTracking(prisma, organizationId, ref);
}

async function seedTracking(prisma: Prisma, organizationId: string, ref: Date) {
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } }, include: { devices: true }, orderBy: { registrationNumber: 'asc' } });
  const trips = await prisma.trip.findMany({ where: { organizationId, referenceCode: { startsWith: 'TRIP-' } }, orderBy: { referenceCode: 'asc' } });
  for (const spec of [
    ['Demo Traccar Provider', 'DEMO-TRACCAR', 'traccar'],
    ['Demo Partner GPS', 'DEMO-PARTNER-GPS', 'partner'],
  ]) {
    const provider = await upsertByUnique(prisma.trackingProvider, { organizationId_code: { organizationId, code: spec[1] } }, {
      organizationId,
      name: spec[0],
      code: spec[1],
      providerType: spec[2],
      baseUrl: 'https://tracking-provider.example.invalid',
      description: 'DEMO-SEED provider shell',
      status: 'ACTIVE',
      metadata: demoMeta(),
    });
    await prisma.trackingProviderCredential.upsert({
      where: { trackingProviderId_keyId: { trackingProviderId: provider.id, keyId: 'DEMO_API_KEY_NOT_REAL' } },
      create: {
        trackingProviderId: provider.id,
        name: 'Demo API key placeholder',
        keyId: 'DEMO_API_KEY_NOT_REAL',
        authType: 'API_KEY',
        secretHash: 'DEMO_SECRET_HASH_NOT_REAL',
        secretHint: 'DEMO...REAL',
        status: 'ACTIVE',
        metadata: demoMeta(),
      },
      update: { secretHash: 'DEMO_SECRET_HASH_NOT_REAL', secretHint: 'DEMO...REAL', status: 'ACTIVE' },
    });
    await prisma.trackingProviderHealth.upsert({
      where: { trackingProviderId: provider.id },
      create: {
        trackingProviderId: provider.id,
        status: spec[1] === 'DEMO-TRACCAR' ? 'ONLINE' : 'DEGRADED',
        message: 'Demo provider health',
        lastCheckedAt: ref,
        lastSuccessAt: ref,
        lastIngestAt: ref,
        metadata: demoMeta(),
      },
      update: { status: spec[1] === 'DEMO-TRACCAR' ? 'ONLINE' : 'DEGRADED', lastCheckedAt: ref, lastIngestAt: ref },
    });
  }
  const providers = await prisma.trackingProvider.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  const provider = providers.find((item) => item.code === 'DEMO-TRACCAR') ?? providers[0]!;
  await prisma.trackingProviderSyncRun.deleteMany({
    where: { organizationId, trackingProviderId: provider.id, runType: 'manual_demo_sync', metadata: { equals: demoMeta() } },
  });
  for (const [index, vehicle] of vehicles.entries()) {
    const external = await prisma.externalTrackingDevice.upsert({
      where: { trackingProviderId_externalDeviceId: { trackingProviderId: provider.id, externalDeviceId: code('EXTGPS', index + 1) } },
      create: {
        organizationId,
        trackingProviderId: provider.id,
        externalDeviceId: code('EXTGPS', index + 1),
        providerUniqueId: code('TRACCAR-ID', index + 1),
        name: `External GPS ${index + 1}`,
        imei: vehicle.devices[0]?.imei,
        model: 'Demo GPS X1',
        status: 'MAPPED',
        discoveredAt: addDays(ref, -60),
        lastSeenAt: addMinutes(ref, -index * 8),
        lastPayload: demoMeta({ externalDeviceId: code('EXTGPS', index + 1) }),
        metadata: demoMeta(),
      },
      update: { status: 'MAPPED', lastSeenAt: addMinutes(ref, -index * 8), metadata: demoMeta() },
    });
    await prisma.vehicleDeviceMapping.upsert({
      where: { externalTrackingDeviceId: external.id },
      create: {
        organizationId,
        trackingProviderId: provider.id,
        externalTrackingDeviceId: external.id,
        vehicleId: vehicle.id,
        vehicleDeviceId: vehicle.devices[0]?.id,
        status: index === 19 ? 'INACTIVE' : 'ACTIVE',
        notes: 'DEMO-SEED mapping',
      },
      update: { vehicleId: vehicle.id, vehicleDeviceId: vehicle.devices[0]?.id, status: index === 19 ? 'INACTIVE' : 'ACTIVE' },
    });
  }

  const syncRun = await prisma.trackingProviderSyncRun.create({
    data: {
      organizationId,
      trackingProviderId: provider.id,
      runType: 'manual_demo_sync',
      status: 'COMPLETED',
      startedAt: addMinutes(ref, -20),
      finishedAt: addMinutes(ref, -18),
      summary: demoMeta({ devicesProcessed: vehicles.length }),
      metadata: demoMeta(),
    },
  });
  await prisma.trackingProviderSyncItem.createMany({
    data: vehicles.map((vehicle) => ({
      trackingProviderSyncRunId: syncRun.id,
      externalEntityType: 'device',
      externalEntityId: vehicle.registrationNumber ?? vehicle.id,
      status: 'PROCESSED',
      message: 'Demo sync item processed',
      payload: demoMeta(),
    })),
  });

  const alertTypes = ['DEVICE_OFFLINE', 'SPEED_THRESHOLD', 'IGNITION_ON', 'IGNITION_OFF', 'STALE_POSITION', 'TRIP_STARTED', 'TRIP_COMPLETED'];
  for (let index = 0; index < 20; index += 1) {
    await upsertByUnique(prisma.trackingAlertRule, { organizationId_code: { organizationId, code: code('TAR', index + 1) } }, {
      organizationId,
      trackingProviderId: provider.id,
      vehicleId: index < vehicles.length ? vehicles[index]!.id : null,
      name: `Demo Tracking Rule ${index + 1}`,
      code: code('TAR', index + 1),
      ruleType: pick(alertTypes, index) as never,
      severity: pick(['info', 'warning', 'critical'], index),
      condition: demoMeta({ threshold: index % 2 === 0 ? 80 : 30 }),
      status: 'ACTIVE',
    });
  }
  const rules = await prisma.trackingAlertRule.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });

  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  await prisma.geofenceEvent.deleteMany({ where: { organizationId, vehicleId: { in: vehicleIds } } });
  await prisma.vehiclePosition.deleteMany({ where: { organizationId, vehicleId: { in: vehicleIds } } });
  await prisma.vehicleTelemetryEvent.deleteMany({ where: { organizationId, vehicleId: { in: vehicleIds } } });
  await prisma.trackingAlertEvent.deleteMany({ where: { organizationId, vehicleId: { in: vehicleIds } } });

  const telemetry = Array.from({ length: 8000 }, (_, index) => {
    const vehicle = pick(vehicles, index);
    const trip = pick(trips, index);
    const point = routePoint(index % 30, Math.floor(index / 20) % 5);
    const timestamp = addMinutes(addDays(ref, -14), index * 3);
    return {
      organizationId,
      vehicleId: vehicle.id,
      vehicleDeviceId: vehicle.devices[0]?.id,
      trackingProviderId: provider.id,
      tripId: index % 3 === 0 ? trip?.id : null,
      providerEventId: code('DEMO-EVT', index + 1, 5),
      latitude: point.latitude,
      longitude: point.longitude,
      speed: money(index % 12 === 0 ? 0 : 28 + (index % 65)),
      heading: money((index * 17) % 360),
      altitude: money(5 + (index % 35)),
      accuracy: money(4 + (index % 9)),
      ignition: index % 12 !== 0,
      battery: money(70 + (index % 28)),
      odometer: (vehicle.odometer ?? 20000) + index,
      eventType: pick(['position', 'movement_started', 'movement_stopped', 'ignition_on', 'ignition_off'], index),
      providerTimestamp: timestamp,
      receivedAt: addMinutes(timestamp, 1),
      rawPayload: demoMeta({ source: 'deterministic-interpolation' }),
    };
  });
  await createManyChunked(prisma.vehicleTelemetryEvent, telemetry, 1000);
  await prisma.vehiclePosition.createMany({
    data: vehicles.map((vehicle, index) => {
      const point = routePoint(index, 4);
      return {
        organizationId,
        vehicleId: vehicle.id,
        vehicleDeviceId: vehicle.devices[0]?.id,
        trackingProviderId: provider.id,
        tripId: trips[index % trips.length]?.id,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: money(index % 5 === 0 ? 0 : 35 + index),
        heading: money((index * 19) % 360),
        altitude: money(10 + index),
        accuracy: money(5),
        ignition: index % 5 !== 0,
        battery: money(88 - index),
        odometer: (vehicle.odometer ?? 20000) + 300,
        eventType: index % 5 === 0 ? 'stopped' : 'position',
        providerTimestamp: addMinutes(ref, -index * 7),
        receivedAt: addMinutes(ref, -index * 7 + 1),
        rawPayload: demoMeta({ latest: true }),
      };
    }),
  });
  const latestPositions = await prisma.vehiclePosition.findMany({ where: { organizationId, vehicleId: { in: vehicleIds } }, orderBy: { providerTimestamp: 'desc' } });

  for (const [index, name] of ['Tokyo Station Depot', 'Shinjuku Operations Zone', 'Haneda Airport Service Area', 'Ueno Maintenance Yard', 'Yokohama Transfer Hub', 'Ginza Hotel Zone', 'Ikebukuro North Yard', 'Ota Service Zone', 'Asakusa Tourism Area', 'Roppongi Event Zone', 'Kanda Medical Zone', 'Nakano Relief Area', 'Akabane Transfer Point', 'Shiba Garage', 'Marunouchi Loop'].entries()) {
    const point = routePoint(index, 0);
    const geofence = await upsertByUnique(prisma.geofence, { organizationId_code: { organizationId, code: code('GEO', index + 1) } }, {
      organizationId,
      name,
      code: code('GEO', index + 1),
      description: 'DEMO-SEED geofence definition',
      geofenceType: 'POLYGON',
      status: 'ACTIVE',
    });
    await prisma.geofencePoint.deleteMany({ where: { geofenceId: geofence.id } });
    await prisma.geofencePoint.createMany({
      data: [
        { geofenceId: geofence.id, sequence: 1, latitude: decimal(Number(point.latitude) - 0.006), longitude: decimal(Number(point.longitude) - 0.006) },
        { geofenceId: geofence.id, sequence: 2, latitude: decimal(Number(point.latitude) - 0.006), longitude: decimal(Number(point.longitude) + 0.006) },
        { geofenceId: geofence.id, sequence: 3, latitude: decimal(Number(point.latitude) + 0.006), longitude: decimal(Number(point.longitude) + 0.006) },
        { geofenceId: geofence.id, sequence: 4, latitude: decimal(Number(point.latitude) + 0.006), longitude: decimal(Number(point.longitude) - 0.006) },
      ],
    });
  }
  const geofences = await prisma.geofence.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  await prisma.geofenceEvaluationRun.deleteMany({
    where: { organizationId, metadata: { equals: demoMeta() } },
  });
  const evalRun = await prisma.geofenceEvaluationRun.create({
    data: { organizationId, status: 'COMPLETED', startedAt: addMinutes(ref, -30), finishedAt: addMinutes(ref, -28), summary: demoMeta({ evaluated: vehicles.length }), metadata: demoMeta() },
  });
  await prisma.geofenceEvent.createMany({
    data: Array.from({ length: 45 }, (_, index) => {
      const pos = pick(latestPositions, index);
      return {
        organizationId,
        geofenceId: pick(geofences, index).id,
        vehicleId: pos.vehicleId,
        vehiclePositionId: pos.id,
        geofenceEvaluationRunId: evalRun.id,
        tripId: pos.tripId,
        eventType: pick(['ENTER', 'EXIT', 'INSIDE', 'OUTSIDE'], index) as never,
        latitude: pos.latitude,
        longitude: pos.longitude,
        happenedAt: addMinutes(ref, -120 + index),
        metadata: demoMeta(),
      };
    }),
  });

  await prisma.trackingAlertEvent.createMany({
    data: Array.from({ length: 60 }, (_, index) => ({
      organizationId,
      trackingAlertRuleId: pick(rules, index).id,
      vehicleId: pick(vehicles, index).id,
      tripId: index < trips.length ? trips[index]!.id : null,
      vehiclePositionId: pick(latestPositions, index).id,
      status: pick(['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], index) as never,
      title: `Demo tracking alert ${index + 1}`,
      message: pick(['Device offline', 'Stale position', 'Speed threshold exceeded', 'Ignition changed'], index),
      triggeredAt: addMinutes(ref, -240 + index * 4),
      acknowledgedAt: index % 3 === 1 ? addMinutes(ref, -120 + index) : null,
      resolvedAt: index % 3 === 2 ? addMinutes(ref, -60 + index) : null,
      metadata: demoMeta(),
    })),
  });
}

async function seedMaintenanceFuelReportsAdmin(prisma: Prisma, organizationId: string, ref: Date) {
  const [vehicles, drivers, vendors, customerLocations, users] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } }, orderBy: { registrationNumber: 'asc' } }),
    prisma.driver.findMany({ where: { organizationId, employeeNumber: { startsWith: 'DEMO-DRV-' } }, orderBy: { employeeNumber: 'asc' } }),
    prisma.vendor.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.customerLocation.findMany({ where: { customerAccount: { organizationId } }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { email: { endsWith: '.demo@trackigniter8.local' } }, orderBy: { email: 'asc' } }),
  ]);

  const maintenanceCategories = ['Preventive Maintenance', 'Inspection', 'Repair', 'Cleaning', 'Tires Placeholder', 'Safety', 'Electrical', 'Bodywork'];
  for (const [index, name] of maintenanceCategories.entries()) {
    await upsertByUnique(prisma.maintenanceCategory, { organizationId_code: { organizationId, code: code('MCAT', index + 1) } }, { organizationId, name, code: code('MCAT', index + 1), status: 'ACTIVE' });
  }
  const categories = await prisma.maintenanceCategory.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  for (let index = 0; index < 25; index += 1) {
    await upsertByUnique(prisma.maintenanceServiceTask, { organizationId_code: { organizationId, code: code('MTASK', index + 1) } }, {
      organizationId,
      categoryId: pick(categories, index).id,
      name: `Demo Service Task ${index + 1}`,
      code: code('MTASK', index + 1),
      description: 'DEMO-SEED maintenance service task',
      defaultIntervalKm: 5000 + index * 250,
      defaultIntervalDays: 30 + index,
      estimatedDurationMinutes: 30 + index * 5,
      estimatedCost: money(8000 + index * 1200),
      status: 'ACTIVE',
    });
  }
  const tasks = await prisma.maintenanceServiceTask.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  await prisma.vehicleMaintenancePlan.deleteMany({
    where: { organizationId, name: { startsWith: 'DEMO-PLAN-' } },
  });
  for (let index = 0; index < 10; index += 1) {
    const checklist = await upsertByUnique(prisma.inspectionChecklistTemplate, { organizationId_code: { organizationId, code: code('CHK', index + 1) } }, {
      organizationId,
      name: `Demo Inspection Checklist ${index + 1}`,
      code: code('CHK', index + 1),
      description: 'DEMO-SEED checklist',
      status: 'ACTIVE',
    });
    await prisma.inspectionChecklistItem.deleteMany({ where: { checklistTemplateId: checklist.id } });
    await prisma.inspectionChecklistItem.createMany({
      data: Array.from({ length: 8 }, (_, itemIndex) => ({
        checklistTemplateId: checklist.id,
        label: `Checklist item ${itemIndex + 1}`,
        description: 'DEMO-SEED inspection item',
        itemType: pick(['BOOLEAN', 'PASS_FAIL', 'TEXT', 'NUMBER'], itemIndex) as never,
        isRequired: itemIndex < 5,
        sequence: itemIndex + 1,
        metadata: demoMeta(),
      })),
    });
  }
  for (const [index, vehicle] of vehicles.entries()) {
    const plan = await prisma.vehicleMaintenancePlan.create({
      data: {
        organizationId,
        vehicleId: vehicle.id,
        name: `DEMO-PLAN-${index + 1} ${vehicle.registrationNumber}`,
        description: 'DEMO-SEED maintenance plan',
        status: 'ACTIVE',
        startDate: addDays(ref, -120),
        lastCompletedAt: addDays(ref, -45 + index),
        nextDueAt: addDays(ref, index % 5 === 0 ? -2 : index),
        nextDueOdometer: (vehicle.odometer ?? 20000) + 1500,
      },
    });
    await prisma.vehicleMaintenancePlanTask.createMany({
      data: Array.from({ length: index < 10 ? 3 : 2 }, (_, taskIndex) => ({
        vehicleMaintenancePlanId: plan.id,
        maintenanceServiceTaskId: pick(tasks, index + taskIndex).id,
        name: pick(tasks, index + taskIndex).name,
        intervalKm: 5000,
        intervalDays: 90,
        estimatedDurationMinutes: 45,
        estimatedCost: money(12000 + taskIndex * 3000),
        lastCompletedAt: addDays(ref, -40),
        nextDueAt: addDays(ref, taskIndex === 0 && index % 5 === 0 ? -1 : 20 + taskIndex),
        nextDueOdometer: (vehicle.odometer ?? 20000) + 1000 + taskIndex * 500,
        sequence: taskIndex + 1,
        status: 'ACTIVE',
      })),
    });
  }

  await prisma.maintenanceRequest.deleteMany({ where: { organizationId, title: { startsWith: 'DEMO-MR-' } } });
  await prisma.maintenanceWorkOrder.deleteMany({ where: { organizationId, workOrderNumber: { startsWith: 'DEMO-WO-' } } });
  for (let index = 0; index < 40; index += 1) {
    await prisma.maintenanceRequest.create({
      data: {
        organizationId,
        vehicleId: pick(vehicles, index).id,
        driverId: pick(drivers, index).id,
        title: `${code('DEMO-MR', index + 1)} Service request`,
        description: 'DEMO-SEED maintenance request',
        priority: pick(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'], index) as never,
        status: pick(['DRAFT', 'REQUESTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS_PLACEHOLDER', 'COMPLETED_PLACEHOLDER', 'CANCELLED'], index) as never,
        requestedAt: addDays(ref, -45 + index),
        scheduledAt: addDays(ref, -20 + index),
        metadata: demoMeta(),
      },
    });
  }
  const requests = await prisma.maintenanceRequest.findMany({ where: { organizationId, title: { startsWith: 'DEMO-MR-' } }, orderBy: { requestedAt: 'asc' } });
  const checklists = await prisma.inspectionChecklistTemplate.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  for (let index = 0; index < 35; index += 1) {
    const workOrder = await prisma.maintenanceWorkOrder.create({
      data: {
        organizationId,
        vehicleId: pick(vehicles, index).id,
        driverId: pick(drivers, index).id,
        vendorId: pick(vendors, index).id,
        maintenanceRequestId: pick(requests, index).id,
        inspectionChecklistTemplateId: pick(checklists, index).id,
        workOrderNumber: code('DEMO-WO', index + 1),
        title: `Demo work order ${index + 1}`,
        description: 'DEMO-SEED work order',
        priority: pick(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'], index) as never,
        status: pick(['DRAFT', 'REQUESTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS_PLACEHOLDER', 'COMPLETED_PLACEHOLDER', 'CANCELLED'], index) as never,
        scheduledStartAt: addDays(ref, -15 + index),
        scheduledEndAt: addDays(ref, -14 + index),
        metadata: demoMeta(),
      },
    });
    await prisma.maintenanceWorkOrderTask.createMany({
      data: Array.from({ length: index < 10 ? 3 : 2 }, (_, taskIndex) => ({
        maintenanceWorkOrderId: workOrder.id,
        maintenanceServiceTaskId: pick(tasks, index + taskIndex).id,
        name: pick(tasks, index + taskIndex).name,
        estimatedDurationMinutes: 45,
        estimatedCost: money(10000 + taskIndex * 1500),
        sequence: taskIndex + 1,
        status: 'ACTIVE',
        metadata: demoMeta(),
      })),
    });
  }

  for (const [index, name] of ['Petrol', 'Diesel', 'Hybrid', 'Electric'].entries()) {
    await upsertByUnique(prisma.fuelType, { organizationId_code: { organizationId, code: code('FUEL', index + 1) } }, { organizationId, name, code: code('FUEL', index + 1), status: 'ACTIVE' });
  }
  const fuelTypes = await prisma.fuelType.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  for (let index = 0; index < 8; index += 1) {
    await prisma.fuelVendorProfile.upsert({
      where: { organizationId_vendorId_stationName: { organizationId, vendorId: pick(vendors, index).id, stationName: `Demo Fuel Station ${index + 1}` } },
      create: {
        organizationId,
        vendorId: pick(vendors, index).id,
        stationName: `Demo Fuel Station ${index + 1}`,
        stationCode: code('FST', index + 1),
        address: `${index + 1}-9 Fuel Avenue, Tokyo`,
        contactName: 'Demo Fuel Desk',
        contactPhone: `+81-3-8888-${String(index + 1).padStart(4, '0')}`,
        contactEmail: `fuel${index + 1}@demo.trackigniter8.local`,
        metadata: demoMeta(),
        status: 'ACTIVE',
      },
      update: { stationCode: code('FST', index + 1), metadata: demoMeta(), status: 'ACTIVE' },
    });
  }
  const profiles = await prisma.fuelVendorProfile.findMany({ where: { organizationId }, orderBy: { stationName: 'asc' } });
  await prisma.fuelCard.deleteMany({ where: { organizationId, notes: { startsWith: 'DEMO-SEED' } } });
  await prisma.fuelCard.createMany({
    data: vehicles.map((vehicle, index) => ({
      organizationId,
      vehicleId: vehicle.id,
      driverId: pick(drivers, index).id,
      cardNumberMasked: `****-****-****-${String(4200 + index)}`,
      providerName: pick(['ENEOS Fleet', 'Idemitsu Business', 'Shell Demo'], index),
      status: index % 10 === 0 ? 'BLOCKED' : 'ACTIVE',
      issueDate: addDays(ref, -220),
      expiryDate: addDays(ref, index % 8 === 0 ? 10 : 180 + index),
      limitAmount: money(80000 + index * 1000),
      notes: 'DEMO-SEED fuel card',
    })),
  });
  await prisma.fuelTank.deleteMany({ where: { organizationId, name: { startsWith: 'Demo Fuel Tank' } } });
  await prisma.fuelTank.createMany({
    data: Array.from({ length: 5 }, (_, index) => ({
      organizationId,
      customerLocationId: pick(customerLocations, index).id,
      fuelTypeId: pick(fuelTypes, index).id,
      name: `Demo Fuel Tank ${index + 1}`,
      capacity: money(5000 + index * 500),
      currentLevel: money(index === 0 ? 300 : 2500 + index * 300),
      unit: pick(['LITER', 'KWH'], index) as never,
      status: 'ACTIVE',
    })),
  });
  for (let index = 0; index < 8; index += 1) {
    const policy = await upsertByUnique(prisma.fuelPolicy, { organizationId_code: { organizationId, code: code('FPOL', index + 1) } }, {
      organizationId,
      name: `Demo Fuel Policy ${index + 1}`,
      code: code('FPOL', index + 1),
      description: 'DEMO-SEED fuel policy',
      status: 'ACTIVE',
    });
    await prisma.fuelPolicyRule.deleteMany({ where: { fuelPolicyId: policy.id } });
    await prisma.fuelPolicyRule.createMany({
      data: Array.from({ length: index === 0 ? 4 : 3 }, (_, ruleIndex) => ({
        fuelPolicyId: policy.id,
        fuelTypeId: pick(fuelTypes, ruleIndex).id,
        ruleCode: pick(['max_liters_per_day', 'max_amount_per_transaction', 'odometer_required', 'receipt_required'], ruleIndex),
        description: 'DEMO-SEED fuel policy rule',
        value: demoMeta({ limit: ruleIndex === 0 ? 120 : 30000 }),
        sequence: ruleIndex + 1,
        status: 'ACTIVE',
      })),
    });
  }
  const cards = await prisma.fuelCard.findMany({ where: { organizationId }, orderBy: { createdAt: 'asc' } });
  const tanks = await prisma.fuelTank.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  await prisma.fuelRequest.deleteMany({ where: { organizationId, notes: { startsWith: 'DEMO-SEED' } } });
  await prisma.fuelEntry.deleteMany({ where: { organizationId, notes: { startsWith: 'DEMO-SEED' } } });
  await prisma.fuelRequest.createMany({
    data: Array.from({ length: 40 }, (_, index) => ({
      organizationId,
      vehicleId: pick(vehicles, index).id,
      driverId: pick(drivers, index).id,
      fuelTypeId: pick(fuelTypes, index).id,
      fuelVendorProfileId: pick(profiles, index).id,
      fuelCardId: pick(cards, index).id,
      requestedQuantity: money(30 + (index % 20)),
      unit: pick(['LITER', 'KWH'], index) as never,
      estimatedAmount: money(6000 + index * 180),
      requestedAt: addDays(ref, -30 + index),
      status: pick(['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED_PLACEHOLDER'], index) as never,
      notes: 'DEMO-SEED fuel request',
      metadata: demoMeta(),
    })),
  });
  const requestsFuel = await prisma.fuelRequest.findMany({ where: { organizationId, notes: { startsWith: 'DEMO-SEED' } }, orderBy: { requestedAt: 'asc' } });
  await prisma.fuelEntry.createMany({
    data: Array.from({ length: 120 }, (_, index) => ({
      organizationId,
      vehicleId: pick(vehicles, index).id,
      driverId: pick(drivers, index).id,
      fuelTypeId: pick(fuelTypes, index).id,
      fuelVendorProfileId: pick(profiles, index).id,
      fuelCardId: pick(cards, index).id,
      fuelTankId: pick(tanks, index).id,
      fuelRequestId: index < requestsFuel.length ? requestsFuel[index]!.id : null,
      quantity: money(25 + (index % 45)),
      unit: pick(['LITER', 'KWH'], index) as never,
      unitPrice: (165 + (index % 25)).toFixed(4),
      totalAmount: money((25 + (index % 45)) * (165 + (index % 25))),
      odometer: (pick(vehicles, index).odometer ?? 20000) + index * 40,
      filledAt: addDays(ref, -60 + Math.floor(index / 2)),
      receiptFileName: code('FUEL-RECEIPT', index + 1) + '.pdf',
      receiptFileUrl: `/demo/files/${code('FUEL-RECEIPT', index + 1)}.pdf`,
      receiptMimeType: 'application/pdf',
      receiptSizeBytes: 50000 + index,
      status: pick(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'], index) as never,
      notes: 'DEMO-SEED fuel entry',
      metadata: demoMeta(),
    })),
  });

  const reportCategories = ['Vehicle Operations', 'Driver Compliance', 'Trip Operations', 'Maintenance', 'Fuel', 'Tracking', 'Alerts', 'Customer Activity'];
  for (const [index, name] of reportCategories.entries()) {
    await upsertByUnique(prisma.reportCategory, { organizationId_code: { organizationId, code: code('RCAT', index + 1) } }, { organizationId, name, code: code('RCAT', index + 1), status: 'ACTIVE' });
  }
  const rcat = await prisma.reportCategory.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  const reportTypes = ['VEHICLE_SUMMARY', 'DRIVER_SUMMARY', 'TRIP_SUMMARY', 'MAINTENANCE_SUMMARY', 'FUEL_SUMMARY', 'TRACKING_HEALTH_SUMMARY', 'ALERT_SUMMARY', 'CUSTOM'];
  for (let index = 0; index < 20; index += 1) {
    await upsertByUnique(prisma.reportDefinition, { organizationId_code: { organizationId, code: code('RDEF', index + 1) } }, {
      organizationId,
      categoryId: pick(rcat, index).id,
      name: `Demo Report Definition ${index + 1}`,
      code: code('RDEF', index + 1),
      reportType: pick(reportTypes, index) as never,
      description: 'DEMO-SEED report definition',
      queryConfig: demoMeta({ source: 'demo' }),
      defaultFilters: demoMeta({ dateRange: 'last_30_days' }),
      columns: demoMeta({ columns: ['name', 'status', 'updatedAt'] }),
      status: 'ACTIVE',
    });
  }
  const defs = await prisma.reportDefinition.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  await prisma.reportFilterPreset.deleteMany({ where: { organizationId, code: { startsWith: 'RPRESET-' } } });
  await prisma.reportRun.deleteMany({ where: { organizationId, reportDefinitionId: { in: defs.map((def) => def.id) } } });
  await prisma.reportExportJob.deleteMany({ where: { organizationId, reportDefinitionId: { in: defs.map((def) => def.id) } } });
  await prisma.reportFilterPreset.createMany({
    data: Array.from({ length: 15 }, (_, index) => ({
      organizationId,
      reportDefinitionId: pick(defs, index).id,
      name: `Demo Filter Preset ${index + 1}`,
      code: code('RPRESET', index + 1),
      filters: demoMeta({ period: pick(['today', 'last_7_days', 'last_30_days'], index) }),
      isDefault: index % 5 === 0,
      status: 'ACTIVE',
    })),
  });
  const runs = [];
  for (let index = 0; index < 30; index += 1) {
    runs.push(await prisma.reportRun.create({
      data: {
        organizationId,
        reportDefinitionId: pick(defs, index).id,
        status: pick(['COMPLETED', 'FAILED', 'PENDING'], index) as never,
        filters: demoMeta({ period: 'last_30_days' }),
        resultSummary: demoMeta({ total: 25 + index }),
        rowCount: 25 + index,
        startedAt: addMinutes(ref, -300 + index * 3),
        finishedAt: index % 3 === 1 ? null : addMinutes(ref, -298 + index * 3),
        triggeredByUserId: pick(users, index)?.id,
        errorMessage: index % 3 === 1 ? 'Demo placeholder failure' : null,
        metadata: demoMeta(),
      },
    }));
  }
  await prisma.reportExportJob.createMany({
    data: Array.from({ length: 15 }, (_, index) => ({
      organizationId,
      reportDefinitionId: pick(defs, index).id,
      reportRunId: pick(runs, index).id,
      format: pick(['CSV', 'JSON', 'PDF_PLACEHOLDER'], index) as never,
      status: pick(['QUEUED', 'COMPLETED_PLACEHOLDER', 'FAILED'], index) as never,
      fileName: `demo-export-${index + 1}.csv`,
      fileUrl: `/demo/exports/demo-export-${index + 1}.csv`,
      requestedByUserId: pick(users, index)?.id,
      requestedAt: addMinutes(ref, -180 + index),
      completedAt: index % 3 === 1 ? null : addMinutes(ref, -170 + index),
      metadata: demoMeta(),
    })),
  });
  for (let index = 0; index < 12; index += 1) {
    await upsertByUnique(prisma.dashboardWidgetDefinition, { organizationId_code: { organizationId, code: code('DWIDGET', index + 1) } }, {
      organizationId,
      reportDefinitionId: pick(defs, index).id,
      name: `Demo Dashboard Widget ${index + 1}`,
      code: code('DWIDGET', index + 1),
      widgetType: pick(['VEHICLE_SUMMARY', 'DRIVER_SUMMARY', 'TRIP_SUMMARY', 'MAINTENANCE_SUMMARY', 'FUEL_SUMMARY', 'TRACKING_HEALTH_SUMMARY', 'ALERT_SUMMARY', 'CUSTOM'], index) as never,
      config: demoMeta({ size: index % 3 === 0 ? 'wide' : 'card' }),
      position: index + 1,
      status: 'ACTIVE',
    });
  }
  await prisma.dashboardSnapshot.deleteMany({
    where: { organizationId, metadata: { equals: demoMeta() } },
  });
  await prisma.dashboardSnapshot.create({
    data: {
      organizationId,
      snapshotAt: ref,
      summary: demoMeta({ vehicles: vehicles.length, drivers: drivers.length, trips: 30, alerts: 60, fuelEntries: 120 }),
      metadata: demoMeta(),
    },
  });

  await seedAdminSupport(prisma, organizationId, ref, users);
}

async function seedAdminSupport(prisma: Prisma, organizationId: string, ref: Date, users: Array<{ id: string }>) {
  const jobTypes = ['TRACKING_PROVIDER_SYNC', 'TRACKING_EVALUATION', 'GEOFENCE_EVALUATION', 'NOTIFICATION_DELIVERY', 'CLEANUP_EXPIRED_INVITATIONS', 'MAINTENANCE_DUE_EVALUATION', 'FUEL_ALERT_EVALUATION', 'REPORT_EXPORT_PLACEHOLDER', 'DOCUMENT_RETENTION_EVALUATION'];
  for (const [index, jobType] of jobTypes.entries()) {
    const def = await prisma.backgroundJobDefinition.upsert({
      where: { organizationId_code: { organizationId, code: code('DEMO-JOB', index + 1) } },
      create: {
        organizationId,
        name: `Demo ${jobType.toLowerCase().replaceAll('_', ' ')}`,
        code: code('DEMO-JOB', index + 1),
        jobType: jobType as never,
        description: 'DEMO-SEED background job definition',
        status: 'ACTIVE',
        scheduleType: index % 2 === 0 ? 'INTERVAL' : 'MANUAL',
        intervalSeconds: index % 2 === 0 ? 900 + index * 60 : null,
        maxRetries: 3,
        backoffStrategy: 'EXPONENTIAL',
        nextRunAt: addMinutes(ref, 30 + index),
        config: demoMeta(),
      },
      update: { status: 'ACTIVE', nextRunAt: addMinutes(ref, 30 + index), config: demoMeta() },
    });
    await prisma.backgroundJobRun.deleteMany({ where: { backgroundJobDefinitionId: def.id } });
    const run = await prisma.backgroundJobRun.create({
      data: {
        backgroundJobDefinitionId: def.id,
        organizationId,
        status: 'COMPLETED',
        idempotencyKey: code('DEMO-RUN', index + 1),
        startedAt: addMinutes(ref, -60 + index),
        finishedAt: addMinutes(ref, -58 + index),
        triggeredByUserId: users[0]?.id,
        summary: demoMeta({ processed: 10 + index }),
        metadata: demoMeta(),
      },
    });
    await prisma.backgroundJobRunLog.createMany({
      data: [
        { backgroundJobRunId: run.id, level: 'info', message: 'Demo job started', metadata: demoMeta() },
        { backgroundJobRunId: run.id, level: 'info', message: 'Demo job completed', metadata: demoMeta() },
      ],
    });
  }

  for (const [index, channel] of ['EMAIL', 'WEBHOOK', 'IN_APP'].entries()) {
    const provider = await prisma.notificationProvider.upsert({
      where: { organizationId_code: { organizationId, code: code('NPROV', index + 1) } },
      create: {
        organizationId,
        name: `Demo ${channel} Provider`,
        code: code('NPROV', index + 1),
        providerType: channel === 'EMAIL' ? 'CONSOLE' : channel,
        channel: channel as never,
        description: 'DEMO-SEED notification provider',
        status: 'ACTIVE',
        config: demoMeta({ secret: '[REDACTED_SECRET]' }),
      },
      update: { status: 'ACTIVE', config: demoMeta({ secret: '[REDACTED_SECRET]' }) },
    });
    await prisma.notificationTemplate.upsert({
      where: { organizationId_code: { organizationId, code: code('NTPL', index + 1) } },
      create: {
        organizationId,
        notificationProviderId: provider.id,
        name: `Demo ${channel} Template`,
        code: code('NTPL', index + 1),
        channel: channel as never,
        subjectTemplate: 'Demo Trackigniter8 alert',
        bodyTemplate: 'A demo alert was generated for {{vehicle}}.',
        description: 'DEMO-SEED notification template',
        status: 'ACTIVE',
        metadata: demoMeta(),
      },
      update: { notificationProviderId: provider.id, status: 'ACTIVE', metadata: demoMeta() },
    });
  }
  const [providers, templates, alertEvents] = await Promise.all([
    prisma.notificationProvider.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.notificationTemplate.findMany({ where: { organizationId }, orderBy: { code: 'asc' } }),
    prisma.trackingAlertEvent.findMany({ where: { organizationId }, orderBy: { triggeredAt: 'desc' }, take: 20 }),
  ]);
  await prisma.notificationDelivery.deleteMany({ where: { organizationId, body: { startsWith: 'DEMO-SEED' } } });
  await prisma.notificationDelivery.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      organizationId,
      trackingAlertEventId: pick(alertEvents, index)?.id,
      notificationProviderId: pick(providers, index).id,
      notificationTemplateId: pick(templates, index).id,
      channel: pick(['EMAIL', 'WEBHOOK', 'IN_APP'], index) as never,
      status: pick(['PENDING', 'SENT', 'FAILED'], index) as never,
      recipient: `recipient${index + 1}@demo.trackigniter8.local`,
      subject: `Demo notification ${index + 1}`,
      body: `DEMO-SEED notification delivery ${index + 1}`,
      attemptCount: index % 3,
      maxAttempts: 3,
      nextAttemptAt: index % 3 === 2 ? addMinutes(ref, 30 + index) : null,
      lastAttemptAt: addMinutes(ref, -30 + index),
      sentAt: index % 3 === 1 ? addMinutes(ref, -20 + index) : null,
      failedAt: index % 3 === 2 ? addMinutes(ref, -20 + index) : null,
      failureReason: index % 3 === 2 ? 'Demo placeholder failure' : null,
      providerResponse: demoMeta({ status: 'placeholder' }),
      metadata: demoMeta(),
    })),
  });

  const policy = await prisma.escalationPolicy.upsert({
    where: { organizationId_code: { organizationId, code: 'DEMO-ESCALATION' } },
    create: { organizationId, name: 'Demo Operations Escalation', code: 'DEMO-ESCALATION', description: 'DEMO-SEED escalation policy', status: 'ACTIVE', metadata: demoMeta() },
    update: { status: 'ACTIVE', metadata: demoMeta() },
  });
  await prisma.escalationPolicyStep.deleteMany({ where: { escalationPolicyId: policy.id } });
  await prisma.escalationPolicyStep.createMany({
    data: [
      { escalationPolicyId: policy.id, sequence: 1, channel: 'IN_APP', delayMinutes: 0, recipientMetadata: demoMeta({ group: 'dispatch' }) },
      { escalationPolicyId: policy.id, sequence: 2, channel: 'EMAIL', delayMinutes: 15, recipientMetadata: demoMeta({ group: 'managers' }) },
      { escalationPolicyId: policy.id, sequence: 3, channel: 'WEBHOOK', delayMinutes: 30, recipientMetadata: demoMeta({ endpoint: 'DEMO_WEBHOOK_NOT_REAL' }) },
    ],
  });
  await prisma.escalationEvent.deleteMany({ where: { organizationId, title: { startsWith: 'DEMO-ESC-' } } });
  await prisma.escalationEvent.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      organizationId,
      trackingAlertEventId: pick(alertEvents, index)?.id,
      escalationPolicyId: policy.id,
      actorUserId: users[0]?.id,
      status: pick(['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], index) as never,
      escalationLevel: (index % 3) + 1,
      title: `${code('DEMO-ESC', index + 1)} escalation`,
      message: 'DEMO-SEED escalation event',
      acknowledgedAt: index % 3 === 1 ? addMinutes(ref, -20 + index) : null,
      resolvedAt: index % 3 === 2 ? addMinutes(ref, -10 + index) : null,
      metadata: demoMeta(),
    })),
  });

  const storage = await prisma.storageProvider.upsert({
    where: { organizationId_code: { organizationId, code: 'DEMO-LOCAL-STORAGE' } },
    create: { organizationId, name: 'Demo Local Storage', code: 'DEMO-LOCAL-STORAGE', providerType: 'LOCAL', description: 'DEMO-SEED storage provider', status: 'ACTIVE', config: demoMeta(), metadata: demoMeta() },
    update: { status: 'ACTIVE', config: demoMeta(), metadata: demoMeta() },
  });
  const bucket = await prisma.storageBucket.upsert({
    where: { organizationId_code: { organizationId, code: 'DEMO-DOCUMENTS' } },
    create: { organizationId, storageProviderId: storage.id, name: 'Demo Documents', code: 'DEMO-DOCUMENTS', description: 'DEMO-SEED document bucket', status: 'ACTIVE', config: demoMeta(), metadata: demoMeta() },
    update: { storageProviderId: storage.id, status: 'ACTIVE', config: demoMeta(), metadata: demoMeta() },
  });
  await prisma.fileAttachment.deleteMany({ where: { organizationId, description: { startsWith: 'DEMO-SEED' } } });
  await prisma.fileObject.deleteMany({ where: { organizationId, originalFileName: { startsWith: 'demo-' } } });
  const files = [];
  for (let index = 0; index < 20; index += 1) {
    const file = await prisma.fileObject.create({
      data: {
        organizationId,
        bucketId: bucket.id,
        originalFileName: `demo-document-${index + 1}.pdf`,
        storedFileName: `demo-document-${index + 1}.pdf`,
        storagePath: `/demo/documents/demo-document-${index + 1}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 75000 + index,
        checksum: `demo-checksum-${index + 1}`,
        status: 'ACTIVE',
        visibility: 'PRIVATE',
        createdByUserId: users[0]?.id,
        metadata: demoMeta(),
      },
    });
    files.push(file);
    await prisma.fileVersion.create({ data: { fileObjectId: file.id, versionNumber: 1, storedFileName: file.storedFileName, storagePath: file.storagePath, mimeType: file.mimeType, sizeBytes: file.sizeBytes, checksum: file.checksum, metadata: demoMeta() } });
    await prisma.fileAccessLog.create({ data: { fileObjectId: file.id, userId: users[0]?.id, action: 'demo_seed_created', metadata: demoMeta() } });
  }
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } }, take: 10 });
  await prisma.fileAttachment.createMany({
    data: files.map((file, index) => ({
      organizationId,
      fileObjectId: file.id,
      entityType: index < 10 ? 'vehicle' : 'organization',
      entityId: index < 10 ? vehicles[index]!.id : organizationId,
      attachmentType: 'demo_metadata',
      description: `DEMO-SEED attachment ${index + 1}`,
      status: 'ACTIVE',
    })),
  });
  for (const [index, entityType] of ['vehicle', 'driver', 'maintenance_work_order', 'fuel_entry', 'report_run'].entries()) {
    await upsertByUnique(prisma.documentRetentionPolicy, { organizationId_code: { organizationId, code: code('RET', index + 1) } }, {
      organizationId,
      name: `Demo ${entityType} retention`,
      code: code('RET', index + 1),
      entityType,
      retentionDays: 365 + index * 30,
      archiveAfterDays: 180,
      description: 'DEMO-SEED retention policy',
      status: 'ACTIVE',
      metadata: demoMeta(),
    });
  }

  for (const [index, key] of ['demo.dashboard.rich-data', 'demo.tracking.replay', 'demo.maintenance.alerts', 'demo.fuel.policy-preview'].entries()) {
    await prisma.featureFlag.upsert({
      where: { organizationId_key: { organizationId, key } },
      create: { organizationId, key, name: `Demo ${key}`, description: 'DEMO-SEED feature flag', enabled: true, rolloutStatus: 'ENABLED', metadata: demoMeta({ order: index + 1 }) },
      update: { enabled: true, rolloutStatus: 'ENABLED', metadata: demoMeta({ order: index + 1 }) },
    });
  }
}

async function buildSummary(prisma: Prisma, organizationId: string) {
  const [
    vehicles,
    drivers,
    serviceRoutes,
    plannedTrips,
    trips,
    latestPositions,
    telemetryEvents,
    maintenanceRequests,
    workOrders,
    fuelEntries,
    reportDefinitions,
    widgets,
    alertEvents,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } } }),
    prisma.driver.count({ where: { organizationId, employeeNumber: { startsWith: 'DEMO-DRV-' } } }),
    prisma.serviceRoute.count({ where: { organizationId, code: { startsWith: 'ROUTE-' } } }),
    prisma.plannedTrip.count({ where: { organizationId, referenceCode: { startsWith: 'PTRIP-' } } }),
    prisma.trip.count({ where: { organizationId, referenceCode: { startsWith: 'TRIP-' } } }),
    prisma.vehiclePosition.count({ where: { organizationId } }),
    prisma.vehicleTelemetryEvent.count({ where: { organizationId } }),
    prisma.maintenanceRequest.count({ where: { organizationId, title: { startsWith: 'DEMO-MR-' } } }),
    prisma.maintenanceWorkOrder.count({ where: { organizationId, workOrderNumber: { startsWith: 'DEMO-WO-' } } }),
    prisma.fuelEntry.count({ where: { organizationId, notes: { startsWith: 'DEMO-SEED' } } }),
    prisma.reportDefinition.count({ where: { organizationId, code: { startsWith: 'RDEF-' } } }),
    prisma.dashboardWidgetDefinition.count({ where: { organizationId, code: { startsWith: 'DWIDGET-' } } }),
    prisma.trackingAlertEvent.count({ where: { organizationId } }),
  ]);

  return {
    organizationCode: DEMO_ORG_CODE,
    vehicles,
    drivers,
    serviceRoutes,
    plannedTrips,
    executedTrips: trips,
    latestPositions,
    telemetryEvents,
    maintenanceRequests,
    maintenanceWorkOrders: workOrders,
    fuelEntries,
    reportDefinitions,
    dashboardWidgets: widgets,
    trackingAlertEvents: alertEvents,
  };
}

export async function seedDemoCompany(prisma: PrismaClient) {
  const ref = getDemoReferenceDate();
  console.log(`[demo-seed] reference date ${ref.toISOString().slice(0, 10)}`);
  const organizations = await seedOrganizations(prisma);
  const tokyo = organizations.find((organization) => organization.code === DEMO_ORG_CODE);
  if (!tokyo) {
    throw new Error('Demo Tokyo organization was not created');
  }
  console.log('[demo-seed] organizations');
  await seedUsers(prisma, organizations.map((organization) => organization.id));
  console.log('[demo-seed] users and memberships');
  await seedMasterData(prisma, tokyo.id, ref);
  console.log('[demo-seed] master data');
  await seedFleetAndDrivers(prisma, tokyo.id, ref);
  console.log('[demo-seed] fleet and drivers');
  await seedRoutesTripsAndTracking(prisma, tokyo.id, ref);
  console.log('[demo-seed] operations and tracking');
  await seedMaintenanceFuelReportsAdmin(prisma, tokyo.id, ref);
  console.log('[demo-seed] maintenance, fuel, reports, admin support');
  return buildSummary(prisma, tokyo.id);
}
