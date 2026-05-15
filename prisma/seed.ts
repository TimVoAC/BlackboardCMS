import { PrismaClient, UserRole, SectionModality, EnrollmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cs = await prisma.department.upsert({
    where: { code: "CSC" },
    update: {},
    create: { code: "CSC", name: "Computer Science" }
  });

  const program = await prisma.program.upsert({
    where: { code: "BS-CS" },
    update: {},
    create: {
      code: "BS-CS",
      name: "Computer Science",
      degreeType: "BS",
      departmentId: cs.id
    }
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "marcus.chen@campusboard.edu" },
    update: {},
    create: {
      email: "marcus.chen@campusboard.edu",
      firstName: "Marcus",
      lastName: "Chen",
      role: UserRole.INSTRUCTOR
    }
  });

  const instructor = await prisma.instructorProfile.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      employeeCode: "FAC-1001",
      departmentId: cs.id
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "maya.stone@student.campusboard.edu" },
    update: {},
    create: {
      email: "maya.stone@student.campusboard.edu",
      firstName: "Maya",
      lastName: "Stone",
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          studentNumber: "S-2026-0001",
          programId: program.id,
          catalogYear: 2026,
          expectedGradTerm: "Spring 2030"
        }
      }
    }
  });

  const term = await prisma.term.upsert({
    where: { name: "Fall 2026" },
    update: {},
    create: {
      name: "Fall 2026",
      startsOn: new Date("2026-08-24T00:00:00.000Z"),
      endsOn: new Date("2026-12-12T00:00:00.000Z")
    }
  });

  const course = await prisma.course.upsert({
    where: { code: "CSC 310" },
    update: {},
    create: {
      code: "CSC 310",
      title: "Database Systems",
      description: "Relational design, SQL, transactions, indexing, and application data modeling.",
      credits: 3,
      departmentId: cs.id
    }
  });

  const section = await prisma.section.upsert({
    where: {
      courseId_termId_sectionNumber: {
        courseId: course.id,
        termId: term.id,
        sectionNumber: "01"
      }
    },
    update: {},
    create: {
      courseId: course.id,
      termId: term.id,
      sectionNumber: "01",
      instructorId: instructor.id,
      capacity: 32,
      modality: SectionModality.HYBRID,
      meetingPattern: "TR 1:30 PM",
      room: "Tech Hall 204"
    }
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_sectionId: {
        studentId: student.id,
        sectionId: section.id
      }
    },
    update: { status: EnrollmentStatus.ENROLLED },
    create: {
      studentId: student.id,
      sectionId: section.id,
      status: EnrollmentStatus.ENROLLED
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
