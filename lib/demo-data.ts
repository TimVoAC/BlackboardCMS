export type CourseStatus = "Open" | "Waitlist" | "Closed";

export type Course = {
  id: string;
  code: string;
  title: string;
  instructor: string;
  department: string;
  enrolled: number;
  capacity: number;
  credits: number;
  schedule: string;
  room: string;
  status: CourseStatus;
};

export type PlanItem = {
  id: string;
  code: string;
  title: string;
  credits: number;
  ready: boolean;
  enrolled: boolean;
};

export type TeachingTask = {
  id: string;
  title: string;
  course: string;
  due: string;
  completed: boolean;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
};

export type GradeItem = {
  id: string;
  course: string;
  average: number;
  missing: number;
};

export type ApprovalItem = {
  id: string;
  title: string;
  owner: string;
  count: number;
};

export type MessageItem = {
  id: string;
  from: string;
  subject: string;
  body: string;
  read: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  course: string;
  body: string;
  publishedAt: string;
};

export type CampusState = {
  institutionName: string;
  courses: Course[];
  registrationPlan: PlanItem[];
  teachingQueue: TeachingTask[];
  activity: ActivityItem[];
  gradebook: GradeItem[];
  approvals: ApprovalItem[];
  messages: MessageItem[];
  announcements: Announcement[];
};

export const initialCampusState: CampusState = {
  institutionName: "North Valley College",
  courses: [
    {
      id: "bio-241-01",
      code: "BIO 241",
      title: "Human Anatomy and Physiology",
      instructor: "Dr. Elena Rivera",
      department: "Life Sciences",
      enrolled: 38,
      capacity: 42,
      credits: 4,
      schedule: "MWF 9:00 AM",
      room: "Science 118",
      status: "Open"
    },
    {
      id: "csc-310-01",
      code: "CSC 310",
      title: "Database Systems",
      instructor: "Prof. Marcus Chen",
      department: "Computer Science",
      enrolled: 32,
      capacity: 32,
      credits: 3,
      schedule: "TR 1:30 PM",
      room: "Tech Hall 204",
      status: "Waitlist"
    },
    {
      id: "eng-205-01",
      code: "ENG 205",
      title: "Technical Writing",
      instructor: "Dr. Priya Nair",
      department: "English",
      enrolled: 24,
      capacity: 30,
      credits: 3,
      schedule: "Online",
      room: "Virtual",
      status: "Open"
    },
    {
      id: "mat-220-01",
      code: "MAT 220",
      title: "Applied Statistics",
      instructor: "Dr. Noah Brooks",
      department: "Mathematics",
      enrolled: 28,
      capacity: 35,
      credits: 4,
      schedule: "MW 2:00 PM",
      room: "Main 310",
      status: "Open"
    }
  ],
  registrationPlan: [
    { id: "plan-csc-310", code: "CSC 310", title: "Database Systems", credits: 3, ready: true, enrolled: false },
    { id: "plan-mat-220", code: "MAT 220", title: "Applied Statistics", credits: 4, ready: true, enrolled: false },
    { id: "plan-bio-241", code: "BIO 241", title: "Human Anatomy and Physiology", credits: 4, ready: false, enrolled: false },
    { id: "plan-eng-205", code: "ENG 205", title: "Technical Writing", credits: 3, ready: true, enrolled: false }
  ],
  teachingQueue: [
    { id: "task-grade-lab", title: "Grade lab submissions", course: "CSC 310", due: "Today", completed: false },
    { id: "task-module", title: "Publish week 6 module", course: "BIO 241", due: "Fri", completed: false },
    { id: "task-discussion", title: "Respond to discussion", course: "ENG 205", due: "2d", completed: false }
  ],
  activity: [
    { id: "activity-1", title: "Maya submitted Project Proposal", detail: "ENG 205 - 9 minutes ago" },
    { id: "activity-2", title: "Attendance synced", detail: "MAT 220 - 31 students present" },
    { id: "activity-3", title: "New announcement posted", detail: "CSC 310 - Midterm review guide" }
  ],
  gradebook: [
    { id: "grade-csc-310", course: "CSC 310", average: 86, missing: 7 },
    { id: "grade-bio-241", course: "BIO 241", average: 79, missing: 12 },
    { id: "grade-eng-205", course: "ENG 205", average: 91, missing: 3 },
    { id: "grade-mat-220", course: "MAT 220", average: 83, missing: 5 }
  ],
  approvals: [
    { id: "approval-prereq", title: "Prerequisite overrides", owner: "Registrar Office", count: 27 },
    { id: "approval-holds", title: "Financial holds", owner: "Student Accounts", count: 54 },
    { id: "approval-audits", title: "Degree audits", owner: "Academic Advising", count: 19 }
  ],
  messages: [
    {
      id: "msg-1",
      from: "Registrar Office",
      subject: "Registration window opens Monday",
      body: "Priority registration begins at 8:00 AM. Advisors can approve plans through CampusBoard.",
      read: false
    },
    {
      id: "msg-2",
      from: "Dr. Elena Rivera",
      subject: "BIO 241 lab capacity",
      body: "Two additional seats may be available if the lab room change is approved.",
      read: true
    }
  ],
  announcements: [
    {
      id: "announce-1",
      title: "Midterm review guide posted",
      course: "CSC 310",
      body: "The review guide and practice SQL set are available in the learning module.",
      publishedAt: "Today"
    }
  ]
};
