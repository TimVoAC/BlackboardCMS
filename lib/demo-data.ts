export type UserRole = "Administrator" | "Advisor" | "Faculty" | "Student";

export type Person = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  major?: string;
};

export type EnrollmentStatus = "Pending Advisor Approval" | "Approved" | "Rejected";

export type EnrollmentRequest = {
  id: string;
  courseId: string;
  studentId: string;
  status: EnrollmentStatus;
  requestedAt: string;
};

export type Submission = {
  id: string;
  studentId: string;
  text: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
};

export type Assignment = {
  id: string;
  title: string;
  prompt: string;
  due: string;
  submissions: Submission[];
};

export type CourseWeek = {
  id: string;
  title: string;
  lectureTitle: string;
  lectureBody: string;
  assignments: Assignment[];
};

export type Course = {
  id: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  capacity: number;
  schedule: string;
  room: string;
  facultyIds: string[];
  studentIds: string[];
  weeks: CourseWeek[];
};

export type MessageItem = {
  id: string;
  from: string;
  subject: string;
  body: string;
  read: boolean;
};

export type CampusState = {
  institutionName: string;
  people: Person[];
  courses: Course[];
  enrollmentRequests: EnrollmentRequest[];
  messages: MessageItem[];
};

export const initialCampusState: CampusState = {
  institutionName: "North Valley College",
  people: [
    {
      id: "admin-robin",
      name: "Robin Carter",
      email: "admin@northvalley.edu",
      role: "Administrator",
      department: "Academic Operations"
    },
    {
      id: "advisor-avery",
      name: "Avery Patel",
      email: "advisor@northvalley.edu",
      role: "Advisor",
      department: "Student Success"
    },
    {
      id: "faculty-marcus",
      name: "Marcus Chen",
      email: "faculty@northvalley.edu",
      role: "Faculty",
      department: "Computer Science"
    },
    {
      id: "faculty-elena",
      name: "Elena Rivera",
      email: "elena.rivera@northvalley.edu",
      role: "Faculty",
      department: "Life Sciences"
    },
    {
      id: "student-maya",
      name: "Maya Stone",
      email: "student@northvalley.edu",
      role: "Student",
      major: "Computer Science"
    },
    {
      id: "student-jordan",
      name: "Jordan Lee",
      email: "jordan.lee@northvalley.edu",
      role: "Student",
      major: "Biology"
    }
  ],
  courses: [
    {
      id: "csc-310",
      code: "CSC 310",
      title: "Database Systems",
      department: "Computer Science",
      credits: 3,
      capacity: 32,
      schedule: "TR 1:30 PM",
      room: "Tech Hall 204",
      facultyIds: ["faculty-marcus"],
      studentIds: ["student-maya"],
      weeks: [
        {
          id: "csc-310-week-1",
          title: "Week 1 Folder",
          lectureTitle: "Relational Models and Keys",
          lectureBody:
            "This lecture introduces tables, primary keys, foreign keys, and why relational integrity matters for academic systems.",
          assignments: [
            {
              id: "csc-310-a1",
              title: "Schema Design Exercise",
              prompt: "Design a normalized schema for a college registration workflow.",
              due: "Sep 4",
              submissions: [
                {
                  id: "sub-csc-310-a1-maya",
                  studentId: "student-maya",
                  text: "Submitted ERD with Student, Course, Section, Enrollment, and Grade entities.",
                  submittedAt: "Sep 3",
                  grade: 92,
                  feedback: "Strong normalization and clear relationships."
                }
              ]
            }
          ]
        },
        {
          id: "csc-310-week-2",
          title: "Week 2 Folder",
          lectureTitle: "SQL Queries and Joins",
          lectureBody: "Use joins to combine course, section, instructor, and enrollment records into useful academic reports.",
          assignments: []
        }
      ]
    },
    {
      id: "bio-241",
      code: "BIO 241",
      title: "Human Anatomy and Physiology",
      department: "Life Sciences",
      credits: 4,
      capacity: 42,
      schedule: "MWF 9:00 AM",
      room: "Science 118",
      facultyIds: ["faculty-elena"],
      studentIds: [],
      weeks: [
        {
          id: "bio-241-week-1",
          title: "Week 1 Folder",
          lectureTitle: "Cellular Organization",
          lectureBody: "Students review tissue types, cellular transport, and lab safety expectations.",
          assignments: []
        }
      ]
    }
  ],
  enrollmentRequests: [
    {
      id: "request-jordan-csc",
      courseId: "csc-310",
      studentId: "student-jordan",
      status: "Pending Advisor Approval",
      requestedAt: "Today"
    }
  ],
  messages: [
    {
      id: "msg-1",
      from: "Advisor Office",
      subject: "Registration approvals pending",
      body: "Review pending enrollment requests before the add/drop deadline.",
      read: false
    }
  ]
};
