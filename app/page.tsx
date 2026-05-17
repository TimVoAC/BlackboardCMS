"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Assignment,
  CampusState,
  Course,
  CourseWeek,
  EnrollmentRequest,
  initialCampusState,
  Person,
  UserRole
} from "@/lib/demo-data";

const storageKey = "campusboard-state-v3";
const sessionKey = "campusboard-session-v3";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Courses", icon: LibraryBig },
  { label: "Enrollment", icon: ClipboardList },
  { label: "Course Content", icon: BookOpenCheck },
  { label: "Grades", icon: GraduationCap },
  { label: "Messages", icon: MessageSquareText },
  { label: "Settings", icon: Settings }
] as const;

type ActiveView = (typeof navItems)[number]["label"];
type Permission =
  | "manageCourses"
  | "manageRoster"
  | "approveEnrollment"
  | "manageContent"
  | "gradeSubmissions"
  | "requestEnrollment"
  | "submitAssignments"
  | "viewGrades"
  | "manageSettings";
type Toast = { message: string; tone: "success" | "warning" };
type DemoUser = Person & { password: string };

const demoUsers: DemoUser[] = [
  { ...initialCampusState.people[0], password: "admin123" },
  { ...initialCampusState.people[1], password: "advisor123" },
  { ...initialCampusState.people[2], password: "faculty123" },
  { ...initialCampusState.people[4], password: "student123" }
];

const roleAccess: Record<UserRole, { views: ActiveView[]; permissions: Permission[] }> = {
  Administrator: {
    views: ["Dashboard", "Courses", "Enrollment", "Messages", "Settings"],
    permissions: ["manageCourses", "manageRoster", "manageSettings"]
  },
  Advisor: {
    views: ["Dashboard", "Courses", "Enrollment", "Messages", "Settings"],
    permissions: ["approveEnrollment"]
  },
  Faculty: {
    views: ["Dashboard", "Courses", "Course Content", "Grades", "Messages", "Settings"],
    permissions: ["manageContent", "gradeSubmissions", "viewGrades"]
  },
  Student: {
    views: ["Dashboard", "Courses", "Enrollment", "Course Content", "Grades", "Messages", "Settings"],
    permissions: ["requestEnrollment", "submitAssignments", "viewGrades"]
  }
};

const blankCourse = {
  code: "",
  title: "",
  department: "",
  credits: 3,
  capacity: 30,
  schedule: "",
  room: ""
};

export default function Home() {
  const [campus, setCampus] = useState<CampusState>(initialCampusState);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "admin@northvalley.edu", password: "admin123" });
  const [activeView, setActiveView] = useState<ActiveView>("Dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState(initialCampusState.courses[0].id);
  const [query, setQuery] = useState("");
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [newCourse, setNewCourse] = useState(blankCourse);
  const [newWeekTitle, setNewWeekTitle] = useState("");
  const [newAssignment, setNewAssignment] = useState({ weekId: "", title: "", prompt: "", due: "" });
  const [submissionText, setSubmissionText] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as CampusState;
      setCampus(parsed);
      setSelectedCourseId(parsed.courses[0]?.id ?? "");
    }
    const session = window.localStorage.getItem(sessionKey);
    const user = demoUsers.find((account) => account.id === session);
    if (user) setCurrentUser(user);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(campus));
  }, [campus]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const role = currentUser?.role ?? "Student";
  const access = roleAccess[role];
  const selectedCourse = campus.courses.find((course) => course.id === selectedCourseId) ?? campus.courses[0];
  const faculty = campus.people.filter((person) => person.role === "Faculty");
  const students = campus.people.filter((person) => person.role === "Student");
  const visibleNavItems = navItems.filter((item) => access.views.includes(item.label));
  const filteredCourses = campus.courses.filter((course) =>
    [course.code, course.title, course.department, peopleNames(campus.people, course.facultyIds)]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    if (!access.views.includes(activeView)) setActiveView("Dashboard");
  }, [access.views, activeView]);

  function can(permission: Permission) {
    return access.permissions.includes(permission);
  }

  function notify(message: string, tone: Toast["tone"] = "success") {
    setToast({ message, tone });
  }

  function deny(message: string) {
    notify(message, "warning");
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = demoUsers.find(
      (account) =>
        account.email.toLowerCase() === loginForm.email.trim().toLowerCase() && account.password === loginForm.password
    );
    if (!user) {
      deny("Invalid email or password");
      return;
    }
    window.localStorage.setItem(sessionKey, user.id);
    setCurrentUser(user);
    setActiveView("Dashboard");
  }

  function loginAs(user: DemoUser) {
    window.localStorage.setItem(sessionKey, user.id);
    setCurrentUser(user);
    setLoginForm({ email: user.email, password: user.password });
    setActiveView("Dashboard");
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setCurrentUser(null);
  }

  function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("manageCourses")) return deny("Only administrators can create courses");
    const course: Course = {
      id: crypto.randomUUID(),
      code: newCourse.code.trim().toUpperCase(),
      title: newCourse.title.trim(),
      department: newCourse.department.trim(),
      credits: Number(newCourse.credits),
      capacity: Number(newCourse.capacity),
      schedule: newCourse.schedule.trim(),
      room: newCourse.room.trim(),
      facultyIds: [],
      studentIds: [],
      weeks: []
    };
    setCampus((current) => ({ ...current, courses: [course, ...current.courses] }));
    setSelectedCourseId(course.id);
    setNewCourse(blankCourse);
    setCourseFormOpen(false);
    notify(`${course.code} created`);
  }

  function updateSelectedCourse(field: keyof Course, value: string | number) {
    if (!can("manageCourses")) return deny("Only administrators can modify courses");
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) => (course.id === selectedCourse.id ? { ...course, [field]: value } : course))
    }));
  }

  function assignPerson(courseId: string, personId: string, type: "faculty" | "student") {
    if (!can("manageRoster")) return deny("Only administrators can assign faculty or students");
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) => {
        if (course.id !== courseId) return course;
        const field = type === "faculty" ? "facultyIds" : "studentIds";
        return course[field].includes(personId) ? course : { ...course, [field]: [...course[field], personId] };
      })
    }));
    notify(`${type === "faculty" ? "Faculty" : "Student"} added to course`);
  }

  function requestEnrollment(courseId: string) {
    if (!currentUser || !can("requestEnrollment")) return deny("Only students can request course registration");
    const course = campus.courses.find((item) => item.id === courseId);
    if (!course) return;
    if (course.studentIds.includes(currentUser.id)) return deny("You are already enrolled in this course");
    const existing = campus.enrollmentRequests.some(
      (request) => request.courseId === courseId && request.studentId === currentUser.id && request.status === "Pending Advisor Approval"
    );
    if (existing) return deny("This enrollment request is already waiting for advisor approval");
    setCampus((current) => ({
      ...current,
      enrollmentRequests: [
        {
          id: crypto.randomUUID(),
          courseId,
          studentId: currentUser.id,
          status: "Pending Advisor Approval",
          requestedAt: "Just now"
        },
        ...current.enrollmentRequests
      ]
    }));
    notify("Enrollment request sent to advisor");
  }

  function decideEnrollment(requestId: string, decision: "Approved" | "Rejected") {
    if (!can("approveEnrollment")) return deny("Only advisors can approve enrollment requests");
    const request = campus.enrollmentRequests.find((item) => item.id === requestId);
    if (!request) return;
    setCampus((current) => ({
      ...current,
      enrollmentRequests: current.enrollmentRequests.map((item) =>
        item.id === requestId ? { ...item, status: decision } : item
      ),
      courses:
        decision === "Approved"
          ? current.courses.map((course) =>
              course.id === request.courseId && !course.studentIds.includes(request.studentId)
                ? { ...course, studentIds: [...course.studentIds, request.studentId] }
                : course
            )
          : current.courses
    }));
    notify(`Enrollment ${decision.toLowerCase()}`);
  }

  function addWeek(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("manageContent")) return deny("Only faculty can create weekly course folders");
    if (!newWeekTitle.trim()) return;
    const week: CourseWeek = {
      id: crypto.randomUUID(),
      title: newWeekTitle.trim(),
      lectureTitle: "New Lecture",
      lectureBody: "Add lecture notes for this week.",
      assignments: []
    };
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === selectedCourse.id ? { ...course, weeks: [...course.weeks, week] } : course
      )
    }));
    setNewWeekTitle("");
    notify("Weekly folder created");
  }

  function updateLecture(weekId: string, field: "lectureTitle" | "lectureBody", value: string) {
    if (!can("manageContent")) return deny("Only faculty can edit lectures");
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === selectedCourse.id
          ? { ...course, weeks: course.weeks.map((week) => (week.id === weekId ? { ...week, [field]: value } : week)) }
          : course
      )
    }));
  }

  function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("manageContent")) return deny("Only faculty can create assignments");
    const weekId = newAssignment.weekId || selectedCourse.weeks[0]?.id;
    if (!weekId || !newAssignment.title.trim()) return;
    const assignment: Assignment = {
      id: crypto.randomUUID(),
      title: newAssignment.title.trim(),
      prompt: newAssignment.prompt.trim(),
      due: newAssignment.due.trim(),
      submissions: []
    };
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === selectedCourse.id
          ? {
              ...course,
              weeks: course.weeks.map((week) =>
                week.id === weekId ? { ...week, assignments: [...week.assignments, assignment] } : week
              )
            }
          : course
      )
    }));
    setNewAssignment({ weekId, title: "", prompt: "", due: "" });
    notify("Assignment created");
  }

  function submitAssignment(assignmentId: string) {
    if (!currentUser || !can("submitAssignments")) return deny("Only students can submit assignments");
    if (!submissionText.trim()) return deny("Add your submission before turning it in");
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === selectedCourse.id
          ? {
              ...course,
              weeks: course.weeks.map((week) => ({
                ...week,
                assignments: week.assignments.map((assignment) =>
                  assignment.id === assignmentId
                    ? {
                        ...assignment,
                        submissions: [
                          ...assignment.submissions.filter((submission) => submission.studentId !== currentUser.id),
                          {
                            id: crypto.randomUUID(),
                            studentId: currentUser.id,
                            text: submissionText.trim(),
                            submittedAt: "Just now"
                          }
                        ]
                      }
                    : assignment
                )
              }))
            }
          : course
      )
    }));
    setSubmissionText("");
    notify("Assignment submitted");
  }

  function gradeSubmission(assignmentId: string, submissionId: string, grade: number) {
    if (!can("gradeSubmissions")) return deny("Only faculty can grade submissions");
    setCampus((current) => ({
      ...current,
      courses: current.courses.map((course) => ({
        ...course,
        weeks: course.weeks.map((week) => ({
          ...week,
          assignments: week.assignments.map((assignment) =>
            assignment.id === assignmentId
              ? {
                  ...assignment,
                  submissions: assignment.submissions.map((submission) =>
                    submission.id === submissionId ? { ...submission, grade: Math.max(0, Math.min(100, grade)) } : submission
                  )
                }
              : assignment
          )
        }))
      }))
    }));
  }

  function resetDemoData() {
    if (!can("manageSettings")) return deny("Only administrators can reset demo data");
    setCampus(initialCampusState);
    setSelectedCourseId(initialCampusState.courses[0].id);
    notify("Demo data restored");
  }

  if (!currentUser) {
    return (
      <LoginScreen login={login} loginAs={loginAs} loginForm={loginForm} setLoginForm={setLoginForm} toast={toast} />
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <span className="brandMark">
            <GraduationCap size={24} />
          </span>
          <div>
            <strong>CampusBoard</strong>
            <span>{campus.institutionName}</span>
          </div>
        </div>

        <nav className="navList">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.label ? "navItem active" : "navItem"}
                key={item.label}
                onClick={() => setActiveView(item.label)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="systemPanel" aria-label="System status">
          <ShieldCheck size={18} />
          <div>
            <strong>Role Based Access</strong>
            <span>{role} privileges are enforced for registration, content, rosters, and grading.</span>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Academic Operations</span>
            <h1>Registration, teaching, and learning workspace</h1>
          </div>
          <div className="toolbar">
            <div className="searchBox">
              <Search size={18} />
              <input
                aria-label="Search courses"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses, faculty, departments"
                value={query}
              />
            </div>
          </div>
        </header>

        <section className="roleBar">
          <div className="accountBadge">
            <UsersRound size={18} />
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role}</span>
            </div>
          </div>
          <div className="roleActions">
            {can("manageCourses") ? (
              <button className="primaryButton" onClick={() => setCourseFormOpen(true)} type="button">
                <Plus size={18} />
                Create Course
              </button>
            ) : null}
            <button className="secondaryButton" onClick={logout} type="button">
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </section>

        {toast ? <div className={`toast ${toast.tone}`}>{toast.message}</div> : null}

        <Stats campus={campus} />

        {activeView === "Dashboard" ? (
          <Dashboard campus={campus} role={role} currentUser={currentUser} />
        ) : null}
        {activeView === "Courses" ? (
          <CoursesView
            campus={campus}
            canManageCourses={can("manageCourses")}
            canManageRoster={can("manageRoster")}
            canRequestEnrollment={can("requestEnrollment")}
            courses={filteredCourses}
            faculty={faculty}
            students={students}
            selectedCourse={selectedCourse}
            setSelectedCourseId={setSelectedCourseId}
            updateSelectedCourse={updateSelectedCourse}
            assignPerson={assignPerson}
            requestEnrollment={requestEnrollment}
          />
        ) : null}
        {activeView === "Enrollment" ? (
          <EnrollmentView
            campus={campus}
            canApproveEnrollment={can("approveEnrollment")}
            canRequestEnrollment={can("requestEnrollment")}
            currentUser={currentUser}
            decideEnrollment={decideEnrollment}
            requestEnrollment={requestEnrollment}
          />
        ) : null}
        {activeView === "Course Content" ? (
          <ContentView
            canManageContent={can("manageContent")}
            canSubmitAssignments={can("submitAssignments")}
            course={selectedCourse}
            currentUser={currentUser}
            newAssignment={newAssignment}
            newWeekTitle={newWeekTitle}
            setNewAssignment={setNewAssignment}
            setNewWeekTitle={setNewWeekTitle}
            addAssignment={addAssignment}
            addWeek={addWeek}
            updateLecture={updateLecture}
            submissionText={submissionText}
            setSubmissionText={setSubmissionText}
            submitAssignment={submitAssignment}
          />
        ) : null}
        {activeView === "Grades" ? (
          <GradesView
            canGradeSubmissions={can("gradeSubmissions")}
            courses={campus.courses}
            currentUser={currentUser}
            people={campus.people}
            gradeSubmission={gradeSubmission}
          />
        ) : null}
        {activeView === "Messages" ? <MessagesView messages={campus.messages} /> : null}
        {activeView === "Settings" ? (
          <SettingsView
            canManageSettings={can("manageSettings")}
            institutionName={campus.institutionName}
            resetDemoData={resetDemoData}
            setInstitutionName={(institutionName) => setCampus((current) => ({ ...current, institutionName }))}
          />
        ) : null}
      </section>

      {courseFormOpen ? (
        <div className="modalBackdrop">
          <form className="modal" onSubmit={createCourse}>
            <div className="panelHeader">
              <div>
                <span className="eyebrow">Administration</span>
                <h2>Create course</h2>
              </div>
              <button className="iconButton" onClick={() => setCourseFormOpen(false)} type="button" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <CourseFields course={newCourse} setCourse={setNewCourse} />
            <div className="modalActions">
              <button className="secondaryButton" onClick={() => setCourseFormOpen(false)} type="button">
                Cancel
              </button>
              <button className="primaryButton" type="submit">
                <Save size={18} />
                Save Course
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function LoginScreen(props: {
  login: (event: FormEvent<HTMLFormElement>) => void;
  loginAs: (user: DemoUser) => void;
  loginForm: { email: string; password: string };
  setLoginForm: (form: { email: string; password: string }) => void;
  toast: Toast | null;
}) {
  return (
    <main className="loginShell">
      <section className="loginPanel">
        <div className="brand loginBrand">
          <span className="brandMark">
            <GraduationCap size={24} />
          </span>
          <div>
            <strong>CampusBoard</strong>
            <span>North Valley College</span>
          </div>
        </div>
        <div>
          <span className="eyebrow">Secure Access</span>
          <h1>Sign in to your campus workspace</h1>
        </div>
        <form className="stackedForm" onSubmit={props.login}>
          <label>
            Email
            <input value={props.loginForm.email} onChange={(event) => props.setLoginForm({ ...props.loginForm, email: event.target.value })} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={props.loginForm.password}
              onChange={(event) => props.setLoginForm({ ...props.loginForm, password: event.target.value })}
            />
          </label>
          <button className="primaryButton" type="submit">
            <LockKeyhole size={18} />
            Sign In
          </button>
        </form>
        {props.toast ? <div className={`toast ${props.toast.tone}`}>{props.toast.message}</div> : null}
      </section>
      <section className="demoAccounts">
        <span className="eyebrow">Demo Accounts</span>
        {demoUsers.map((user) => (
          <button className="accountOption" key={user.id} onClick={() => props.loginAs(user)} type="button">
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <mark className="open">{user.role}</mark>
          </button>
        ))}
      </section>
    </main>
  );
}

function Stats({ campus }: { campus: CampusState }) {
  const enrolled = campus.courses.reduce((sum, course) => sum + course.studentIds.length, 0);
  const pending = campus.enrollmentRequests.filter((request) => request.status === "Pending Advisor Approval").length;
  return (
    <section className="statsGrid">
      <Metric label="Courses" value={String(campus.courses.length)} detail="Administrator-managed catalog" />
      <Metric label="Enrollments" value={String(enrolled)} detail="Approved student-course links" />
      <Metric label="Pending approvals" value={String(pending)} detail="Advisor action queue" />
      <Metric label="Faculty" value={String(campus.people.filter((person) => person.role === "Faculty").length)} detail="Available instructors" />
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Dashboard({ campus, currentUser, role }: { campus: CampusState; currentUser: Person; role: UserRole }) {
  const myCourses =
    role === "Faculty"
      ? campus.courses.filter((course) => course.facultyIds.includes(currentUser.id))
      : role === "Student"
        ? campus.courses.filter((course) => course.studentIds.includes(currentUser.id))
        : campus.courses;
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <section className="panel">
          <span className="eyebrow">Role Workflow</span>
          <h2>{role} workspace</h2>
          <p className="muted withTop">{roleWorkflow(role)}</p>
        </section>
        <CourseCards campus={campus} courses={myCourses} />
      </div>
      <aside className="sideColumn single">
        <EnrollmentQueue campus={campus} readonly />
      </aside>
    </section>
  );
}

function CoursesView(props: {
  assignPerson: (courseId: string, personId: string, type: "faculty" | "student") => void;
  campus: CampusState;
  canManageCourses: boolean;
  canManageRoster: boolean;
  canRequestEnrollment: boolean;
  courses: Course[];
  faculty: Person[];
  requestEnrollment: (courseId: string) => void;
  selectedCourse: Course;
  setSelectedCourseId: (id: string) => void;
  students: Person[];
  updateSelectedCourse: (field: keyof Course, value: string | number) => void;
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <CourseCards campus={props.campus} courses={props.courses} onSelect={props.setSelectedCourseId} />
      </div>
      <aside className="sideColumn single">
        <section className="panel compact">
          <span className="eyebrow">Selected Course</span>
          <h2>{props.selectedCourse.code}</h2>
          {props.canManageCourses ? (
            <div className="stackedForm">
              <label>
                Title
                <input value={props.selectedCourse.title} onChange={(event) => props.updateSelectedCourse("title", event.target.value)} />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  value={props.selectedCourse.capacity}
                  onChange={(event) => props.updateSelectedCourse("capacity", Number(event.target.value))}
                />
              </label>
              <label>
                Schedule
                <input value={props.selectedCourse.schedule} onChange={(event) => props.updateSelectedCourse("schedule", event.target.value)} />
              </label>
            </div>
          ) : (
            <p className="muted withTop">{props.selectedCourse.title}</p>
          )}
        </section>
        {props.canManageRoster ? (
          <RosterManager
            assignPerson={props.assignPerson}
            course={props.selectedCourse}
            faculty={props.faculty}
            people={props.campus.people}
            students={props.students}
          />
        ) : null}
        {props.canRequestEnrollment ? (
          <button className="primaryButton wideButton" onClick={() => props.requestEnrollment(props.selectedCourse.id)} type="button">
            <UserPlus size={18} />
            Request Enrollment
          </button>
        ) : null}
      </aside>
    </section>
  );
}

function CourseCards(props: { campus: CampusState; courses: Course[]; onSelect?: (id: string) => void }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Course Catalog</span>
          <h2>Courses and rosters</h2>
        </div>
      </div>
      <div className="courseCards">
        {props.courses.map((course) => (
          <article className="courseCard" key={course.id}>
            <div>
              <strong>{course.code}</strong>
              <span>{course.title}</span>
            </div>
            <p>{course.department} - {course.credits} credits - {course.schedule}</p>
            <small>Faculty: {peopleNames(props.campus.people, course.facultyIds) || "Unassigned"}</small>
            <small>
              Students: {course.studentIds.length}/{course.capacity}
            </small>
            {props.onSelect ? (
              <button className="secondaryButton" onClick={() => props.onSelect?.(course.id)} type="button">
                Manage
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function RosterManager(props: {
  assignPerson: (courseId: string, personId: string, type: "faculty" | "student") => void;
  course: Course;
  faculty: Person[];
  people: Person[];
  students: Person[];
}) {
  return (
    <section className="panel compact">
      <span className="eyebrow">Roster Management</span>
      <div className="stackedForm">
        <label>
          Add faculty
          <select onChange={(event) => props.assignPerson(props.course.id, event.target.value, "faculty")} value="">
            <option value="" disabled>
              Select faculty
            </option>
            {props.faculty.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Add student
          <select onChange={(event) => props.assignPerson(props.course.id, event.target.value, "student")} value="">
            <option value="" disabled>
              Select student
            </option>
            {props.students.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted withTop">Faculty: {peopleNames(props.people, props.course.facultyIds) || "None"}</p>
      <p className="muted">Students: {peopleNames(props.people, props.course.studentIds) || "None"}</p>
    </section>
  );
}

function EnrollmentView(props: {
  campus: CampusState;
  canApproveEnrollment: boolean;
  canRequestEnrollment: boolean;
  currentUser: Person;
  decideEnrollment: (requestId: string, decision: "Approved" | "Rejected") => void;
  requestEnrollment: (courseId: string) => void;
}) {
  const requests =
    props.currentUser.role === "Student"
      ? props.campus.enrollmentRequests.filter((request) => request.studentId === props.currentUser.id)
      : props.campus.enrollmentRequests;
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <EnrollmentQueue
          campus={props.campus}
          canApproveEnrollment={props.canApproveEnrollment}
          decideEnrollment={props.decideEnrollment}
          requests={requests}
        />
      </div>
      {props.canRequestEnrollment ? (
        <aside className="sideColumn single">
          <section className="panel compact">
            <span className="eyebrow">Register</span>
            <div className="stackedForm">
              {props.campus.courses.map((course) => (
                <button className="secondaryButton" key={course.id} onClick={() => props.requestEnrollment(course.id)} type="button">
                  Request {course.code}
                </button>
              ))}
            </div>
          </section>
        </aside>
      ) : null}
    </section>
  );
}

function EnrollmentQueue(props: {
  campus: CampusState;
  canApproveEnrollment?: boolean;
  decideEnrollment?: (requestId: string, decision: "Approved" | "Rejected") => void;
  readonly?: boolean;
  requests?: EnrollmentRequest[];
}) {
  const requests = props.requests ?? props.campus.enrollmentRequests;
  return (
    <section className="panel">
      <span className="eyebrow">Enrollment Queue</span>
      <div className="approvalList withTop">
        {requests.map((request) => (
          <article key={request.id}>
            <div>
              <strong>{personName(props.campus.people, request.studentId)}</strong>
              <small>{courseName(props.campus.courses, request.courseId)} - {request.requestedAt}</small>
            </div>
            <mark className={request.status === "Approved" ? "open" : request.status === "Rejected" ? "closed" : "attention"}>
              {request.status}
            </mark>
            {props.canApproveEnrollment && request.status === "Pending Advisor Approval" ? (
              <div className="rowActions">
                <button className="secondaryButton" onClick={() => props.decideEnrollment?.(request.id, "Approved")} type="button">
                  Approve
                </button>
                <button className="secondaryButton" onClick={() => props.decideEnrollment?.(request.id, "Rejected")} type="button">
                  Reject
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentView(props: {
  addAssignment: (event: FormEvent<HTMLFormElement>) => void;
  addWeek: (event: FormEvent<HTMLFormElement>) => void;
  canManageContent: boolean;
  canSubmitAssignments: boolean;
  course: Course;
  currentUser: Person;
  newAssignment: { weekId: string; title: string; prompt: string; due: string };
  newWeekTitle: string;
  setNewAssignment: (value: { weekId: string; title: string; prompt: string; due: string }) => void;
  setNewWeekTitle: (value: string) => void;
  setSubmissionText: (value: string) => void;
  submissionText: string;
  submitAssignment: (assignmentId: string) => void;
  updateLecture: (weekId: string, field: "lectureTitle" | "lectureBody", value: string) => void;
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <section className="panel">
          <span className="eyebrow">Weekly Course Folders</span>
          <h2>{props.course.code} content</h2>
          <div className="weekList">
            {props.course.weeks.map((week) => (
              <article className="weekFolder" key={week.id}>
                <div className="panelHeader">
                  <div>
                    <strong>{week.title}</strong>
                    {props.canManageContent ? (
                      <input value={week.lectureTitle} onChange={(event) => props.updateLecture(week.id, "lectureTitle", event.target.value)} />
                    ) : (
                      <span>{week.lectureTitle}</span>
                    )}
                  </div>
                  <FileText size={20} />
                </div>
                {props.canManageContent ? (
                  <textarea value={week.lectureBody} onChange={(event) => props.updateLecture(week.id, "lectureBody", event.target.value)} />
                ) : (
                  <p>{week.lectureBody}</p>
                )}
                <div className="assignmentList">
                  {week.assignments.map((assignment) => {
                    const mySubmission = assignment.submissions.find((submission) => submission.studentId === props.currentUser.id);
                    return (
                      <article key={assignment.id}>
                        <strong>{assignment.title}</strong>
                        <small>Due {assignment.due}</small>
                        <p>{assignment.prompt}</p>
                        {props.canSubmitAssignments ? (
                          <>
                            <textarea
                              placeholder="Write your assignment submission"
                              value={props.submissionText}
                              onChange={(event) => props.setSubmissionText(event.target.value)}
                            />
                            <button className="secondaryButton" onClick={() => props.submitAssignment(assignment.id)} type="button">
                              Submit Assignment
                            </button>
                            {mySubmission ? <small>Submitted: {mySubmission.text}</small> : null}
                          </>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      {props.canManageContent ? (
        <aside className="sideColumn single">
          <section className="panel compact">
            <span className="eyebrow">Faculty Tools</span>
            <form className="stackedForm" onSubmit={props.addWeek}>
              <label>
                New weekly folder
                <input value={props.newWeekTitle} onChange={(event) => props.setNewWeekTitle(event.target.value)} />
              </label>
              <button className="primaryButton" type="submit">
                <Plus size={18} />
                Add Week
              </button>
            </form>
            <form className="stackedForm" onSubmit={props.addAssignment}>
              <label>
                Folder
                <select
                  value={props.newAssignment.weekId || props.course.weeks[0]?.id || ""}
                  onChange={(event) => props.setNewAssignment({ ...props.newAssignment, weekId: event.target.value })}
                >
                  {props.course.weeks.map((week) => (
                    <option key={week.id} value={week.id}>
                      {week.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assignment title
                <input value={props.newAssignment.title} onChange={(event) => props.setNewAssignment({ ...props.newAssignment, title: event.target.value })} />
              </label>
              <label>
                Prompt
                <textarea value={props.newAssignment.prompt} onChange={(event) => props.setNewAssignment({ ...props.newAssignment, prompt: event.target.value })} />
              </label>
              <label>
                Due
                <input value={props.newAssignment.due} onChange={(event) => props.setNewAssignment({ ...props.newAssignment, due: event.target.value })} />
              </label>
              <button className="primaryButton" type="submit">
                <Plus size={18} />
                Add Assignment
              </button>
            </form>
          </section>
        </aside>
      ) : null}
    </section>
  );
}

function GradesView(props: {
  canGradeSubmissions: boolean;
  courses: Course[];
  currentUser: Person;
  gradeSubmission: (assignmentId: string, submissionId: string, grade: number) => void;
  people: Person[];
}) {
  const courses =
    props.currentUser.role === "Student"
      ? props.courses.filter((course) => course.studentIds.includes(props.currentUser.id))
      : props.currentUser.role === "Faculty"
        ? props.courses.filter((course) => course.facultyIds.includes(props.currentUser.id))
        : props.courses;
  return (
    <section className="panel">
      <span className="eyebrow">Grades</span>
      <div className="gradeBars withTop">
        {courses.flatMap((course) =>
          course.weeks.flatMap((week) =>
            week.assignments.flatMap((assignment) =>
              assignment.submissions
                .filter((submission) => props.currentUser.role !== "Student" || submission.studentId === props.currentUser.id)
                .map((submission) => (
                  <article key={submission.id}>
                    <div>
                      <strong>{course.code} - {assignment.title}</strong>
                      <span>{personName(props.people, submission.studentId)}</span>
                    </div>
                    <p>{submission.text}</p>
                    {props.canGradeSubmissions ? (
                      <label className="gradeInput">
                        Grade
                        <input
                          max="100"
                          min="0"
                          type="number"
                          value={submission.grade ?? ""}
                          onChange={(event) => props.gradeSubmission(assignment.id, submission.id, Number(event.target.value))}
                        />
                      </label>
                    ) : (
                      <mark className={submission.grade === undefined ? "attention" : "open"}>
                        {submission.grade === undefined ? "Not graded" : `${submission.grade}%`}
                      </mark>
                    )}
                  </article>
                ))
            )
          )
        )}
      </div>
    </section>
  );
}

function MessagesView({ messages }: { messages: CampusState["messages"] }) {
  return (
    <section className="panel">
      <span className="eyebrow">Messages</span>
      <div className="messageList withTop">
        {messages.map((message) => (
          <article className={message.read ? "" : "unread"} key={message.id}>
            <div>
              <strong>{message.subject}</strong>
              <small>{message.from}</small>
              <p>{message.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsView(props: {
  canManageSettings: boolean;
  institutionName: string;
  resetDemoData: () => void;
  setInstitutionName: (value: string) => void;
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <section className="panel">
          <span className="eyebrow">Institution</span>
          <label className="withTop">
            Institution name
            <input
              readOnly={!props.canManageSettings}
              value={props.institutionName}
              onChange={(event) => props.setInstitutionName(event.target.value)}
            />
          </label>
        </section>
      </div>
      <aside className="sideColumn single">
        <section className="panel compact">
          <span className="eyebrow">Demo State</span>
          <button className="secondaryButton wideButton" disabled={!props.canManageSettings} onClick={props.resetDemoData} type="button">
            <RotateCcw size={18} />
            Reset Demo Data
          </button>
        </section>
      </aside>
    </section>
  );
}

function CourseFields(props: {
  course: typeof blankCourse;
  setCourse: (course: typeof blankCourse) => void;
}) {
  return (
    <div className="formGrid">
      {(["code", "title", "department", "schedule", "room"] as const).map((field) => (
        <label key={field}>
          {field[0].toUpperCase() + field.slice(1)}
          <input required value={props.course[field]} onChange={(event) => props.setCourse({ ...props.course, [field]: event.target.value })} />
        </label>
      ))}
      <label>
        Credits
        <input type="number" value={props.course.credits} onChange={(event) => props.setCourse({ ...props.course, credits: Number(event.target.value) })} />
      </label>
      <label>
        Capacity
        <input type="number" value={props.course.capacity} onChange={(event) => props.setCourse({ ...props.course, capacity: Number(event.target.value) })} />
      </label>
    </div>
  );
}

function peopleNames(people: Person[], ids: string[]) {
  return ids.map((id) => personName(people, id)).filter(Boolean).join(", ");
}

function personName(people: Person[], id: string) {
  return people.find((person) => person.id === id)?.name ?? "Unknown";
}

function courseName(courses: Course[], id: string) {
  const course = courses.find((item) => item.id === id);
  return course ? `${course.code} ${course.title}` : "Unknown course";
}

function roleWorkflow(role: UserRole) {
  const workflows: Record<UserRole, string> = {
    Administrator: "Create and modify courses, then assign faculty and students to the course roster.",
    Advisor: "Review student course registration requests and approve or reject enrollment.",
    Faculty: "Create weekly folders, publish lectures, add assignments, review submissions, and enter grades.",
    Student: "Request enrollment, enter approved courses, read lectures, submit assignments, and view grades."
  };
  return workflows[role];
}
