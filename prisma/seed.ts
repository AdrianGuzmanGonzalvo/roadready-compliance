// Generates prisma/seed.db: a small SQLite file pre-loaded with synthetic
// (fictional, non-PII) demo drivers, bundled into the deployment so the
// live demo has content to show without needing real data.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { fileURLToPath } from "node:url";

// Run against a freshly migrated, empty seed.db:
//   DATABASE_URL="file:./prisma/seed.db" npx prisma migrate deploy
//   npx tsx prisma/seed.ts
const DB_PATH = fileURLToPath(new URL("./seed.db", import.meta.url));

const adapter = new PrismaLibSql({ url: `file:${DB_PATH}` });
const prisma = new PrismaClient({ adapter });

const day = 86400000;
const today = new Date();
const daysFromNow = (n: number) => new Date(today.getTime() + n * day);

const drivers = [
  {
    lastName: "Johnson",
    firstName: "Alex",
    status: "ACTIVE" as const,
    position: "DRIVER",
    phone: "555-010-1001",
    driversLicense: "D1002233",
    licenseClass: "Class B",
    endorsements: "PS",
    form: {
      mcsa5876: daysFromNow(280),
      ds703: daysFromNow(300),
      ds704: daysFromNow(310),
      licenseExp: daysFromNow(400),
      ds870: daysFromNow(500),
      ds872: daysFromNow(250),
      ds873: daysFromNow(600),
      ds875: daysFromNow(600),
      ds875y: daysFromNow(600),
    },
  },
  {
    lastName: "Lee",
    firstName: "Morgan",
    status: "ACTIVE" as const,
    position: "ON CALL DRIVER",
    phone: "555-010-1002",
    driversLicense: "D1002234",
    licenseClass: "Class B",
    endorsements: "P",
    form: {
      mcsa5876: daysFromNow(-12),
      ds703: daysFromNow(200),
      ds704: daysFromNow(200),
      licenseExp: daysFromNow(365),
      ds870: daysFromNow(300),
      ds872: daysFromNow(180),
      ds873: daysFromNow(400),
      ds875: daysFromNow(400),
      ds875y: daysFromNow(400),
    },
  },
  {
    lastName: "Smith",
    firstName: "Jordan",
    status: "ACTIVE" as const,
    position: "DRIVER",
    phone: "555-010-1003",
    driversLicense: "D1002235",
    licenseClass: "Class A",
    endorsements: "PS",
    form: {
      mcsa5876: daysFromNow(15),
      ds703: daysFromNow(200),
      ds704: daysFromNow(200),
      licenseExp: daysFromNow(15),
      ds870: daysFromNow(300),
      ds872: daysFromNow(200),
      ds873: daysFromNow(400),
      ds875: daysFromNow(400),
      ds875y: daysFromNow(400),
    },
  },
  {
    lastName: "Brown",
    firstName: "Taylor",
    status: "ACTIVE" as const,
    position: "DRIVER",
    phone: "555-010-1004",
    driversLicense: "D1002236",
    licenseClass: "Class B",
    endorsements: "P",
    form: {
      mcsa5876: daysFromNow(45),
      ds703: daysFromNow(200),
      ds704: daysFromNow(200),
      licenseExp: daysFromNow(365),
      ds870: daysFromNow(300),
      ds872: daysFromNow(45),
      ds873: daysFromNow(400),
      ds875: daysFromNow(400),
      ds875y: daysFromNow(400),
    },
  },
  {
    lastName: "Davis",
    firstName: "Casey",
    status: "ACTIVE" as const,
    position: "DRIVER",
    phone: "555-010-1005",
    driversLicense: "D1002237",
    licenseClass: "Class B",
    endorsements: "PS",
    form: {
      mcsa5876: daysFromNow(300),
      ds703: daysFromNow(300),
      ds704: daysFromNow(300),
      licenseExp: daysFromNow(500),
      ds870: daysFromNow(500),
      ds872: daysFromNow(300),
      ds873: daysFromNow(600),
      ds875: daysFromNow(600),
      ds875y: daysFromNow(600),
    },
  },
  {
    lastName: "Martinez",
    firstName: "Riley",
    status: "ACTIVE" as const,
    position: "DRIVER",
    phone: "555-010-1006",
    driversLicense: "D1002238",
    licenseClass: "Class A",
    endorsements: "PS",
    form: {
      mcsa5876: daysFromNow(-40),
      ds703: daysFromNow(-5),
      ds704: daysFromNow(200),
      licenseExp: daysFromNow(-2),
      ds870: daysFromNow(300),
      ds872: daysFromNow(200),
      ds873: daysFromNow(400),
      ds875: daysFromNow(400),
      ds875y: daysFromNow(400),
    },
  },
  {
    lastName: "Wilson",
    firstName: "Sam",
    status: "ACTIVE" as const,
    position: "DRIVER",
    phone: "555-010-1007",
    driversLicense: "D1002239",
    licenseClass: "Class B",
    endorsements: null,
    form: {
      mcsa5876: null,
      ds703: null,
      ds704: null,
      licenseExp: daysFromNow(200),
      ds870: null,
      ds872: null,
      ds873: null,
      ds875: null,
      ds875y: null,
    },
  },
  {
    lastName: "Clark",
    firstName: "Jamie",
    status: "TERMINATED" as const,
    position: "DRIVER",
    phone: "555-010-1008",
    driversLicense: "D1002240",
    licenseClass: "Class B",
    endorsements: "P",
    form: {
      mcsa5876: daysFromNow(-200),
      ds703: daysFromNow(-190),
      ds704: daysFromNow(-190),
      licenseExp: daysFromNow(-100),
      ds870: daysFromNow(-300),
      ds872: daysFromNow(-200),
      ds873: daysFromNow(-100),
      ds875: daysFromNow(-100),
      ds875y: daysFromNow(-100),
    },
  },
  {
    lastName: "Anderson",
    firstName: "Drew",
    status: "TERMINATED" as const,
    position: "DRIVER",
    phone: "555-010-1009",
    driversLicense: "D1002241",
    licenseClass: "Class A",
    endorsements: "PS",
    form: {
      mcsa5876: daysFromNow(-400),
      ds703: daysFromNow(-380),
      ds704: daysFromNow(-380),
      licenseExp: daysFromNow(-250),
      ds870: daysFromNow(-500),
      ds872: daysFromNow(-400),
      ds873: daysFromNow(-250),
      ds875: daysFromNow(-250),
      ds875y: daysFromNow(-250),
    },
  },
  {
    lastName: "Thompson",
    firstName: "Pat",
    status: "OUT_OF_WORK" as const,
    position: "ON CALL DRIVER",
    phone: "555-010-1010",
    driversLicense: "D1002242",
    licenseClass: "Class B",
    endorsements: "P",
    form: {
      mcsa5876: daysFromNow(50),
      ds703: daysFromNow(120),
      ds704: daysFromNow(120),
      licenseExp: daysFromNow(365),
      ds870: daysFromNow(200),
      ds872: daysFromNow(55),
      ds873: daysFromNow(300),
      ds875: daysFromNow(300),
      ds875y: daysFromNow(300),
    },
  },
];

async function main() {
  for (const d of drivers) {
    const { form, ...driver } = d;
    await prisma.driver.create({
      data: {
        ...driver,
        updateResult: "DEMO DATA",
        complianceForm: { create: form },
      },
    });
  }

  console.log(`Seeded ${drivers.length} synthetic demo drivers into ${DB_PATH}`);
  await prisma.$disconnect();
}

main();
