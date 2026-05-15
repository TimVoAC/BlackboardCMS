"use client";

import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
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
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  UsersRound,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CampusState, Course, initialCampusState } from "@/lib/demo-data";

const storageKey = "campusboard-state-v1";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Registration", icon: ClipboardList },
  { label: "Courses", icon: LibraryBig },
  { label: "Teaching", icon: BookOpenCheck },
  { label: "Learning", icon: GraduationCap },
  { label: "Messages", icon: MessageSquareText },
  { label: "Settings", icon: Settings }
] as const;

const roles = ["Registrar", "Instructor", "Student", "Advisor"] as const;
const termOptions = ["Fall 2026", "Spring 2027", "Summer 2027"];
const sessionKey = "campusboard-session-v1";

type ActiveView = (typeof navItems)[number]["label"];
type Role = (typeof roles)[number];
type Toast = { message: string; tone: "success" | "warning" };
type Permission =
  | "createSection"
  | "addCourseToPlan"
  | "approvePlan"
  | "enroll"
  | "completeTeachingTask"
  | "publishAnnouncement"
  | "editGrades"
  | "resolveApprovals"
  | "sendMessages"
  | "manageSettings";
type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

const demoUsers: DemoUser[] = [
  { id: "registrar", name: "Robin Carter", email: "registrar@northvalley.edu", password: "registrar123", role: "Registrar" },
  { id: "instructor", name: "Marcus Chen", email: "instructor@northvalley.edu", password: "instructor123", role: "Instructor" },
  { id: "student", name: "Maya Stone", email: "student@northvalley.edu", password: "student123", role: "Student" },
  { id: "advisor", name: "Avery Patel", email: "advisor@northvalley.edu", password: "advisor123", role: "Advisor" }
];

const roleAccess: Record<Role, { views: ActiveView[]; permissions: Permission[] }> = {
  Registrar: {
    views: ["Dashboard", "Registration", "Courses", "Messages", "Settings"],
    permissions: ["createSection", "approvePlan", "resolveApprovals", "sendMessages", "manageSettings"]
  },
  Instructor: {
    views: ["Dashboard", "Teaching", "Learning", "Messages", "Settings"],
    permissions: ["completeTeachingTask", "publishAnnouncement", "editGrades", "sendMessages"]
  },
  Student: {
    views: ["Dashboard", "Registration", "Courses", "Learning", "Messages", "Settings"],
    permissions: ["addCourseToPlan", "enroll"]
  },
  Advisor: {
    views: ["Dashboard", "Registration", "Courses", "Learning", "Messages", "Settings"],
    permissions: ["addCourseToPlan", "approvePlan", "sendMessages"]
  }
};

const blankCourse = {
  code: "",
  title: "",
  instructor: "",
  department: "",
  capacity: 30,
  credits: 3,
  schedule: "",
  room: "",
  status: "Open" as Course["status"]
};

export default function Home() {
  const [campus, setCampus] = useState<CampusState>(initialCampusState);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "registrar@northvalley.edu", password: "registrar123" });
  const [activeView, setActiveView] = useState<ActiveView>("Dashboard");
  const [query, setQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Fall 2026");
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [newCourse, setNewCourse] = useState(blankCourse);
  const [announcementText, setAnnouncementText] = useState("");
  const [messageDraft, setMessageDraft] = useState({ to: "All students", subject: "", body: "" });
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      setCampus(JSON.parse(saved) as CampusState);
    }
    const savedSession = window.localStorage.getItem(sessionKey);
    if (savedSession) {
      const user = demoUsers.find((account) => account.id === savedSession);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(campus));
  }, [campus]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const enrolled = campus.courses.reduce((sum, course) => sum + course.enrolled, 0);
    const capacity = campus.courses.reduce((sum, course) => sum + course.capacity, 0);
    const pending = campus.approvals.reduce((sum, item) => sum + item.count, 0);
    const openSections = campus.courses.filter((course) => course.status === "Open").length;

    return [
      { label: "Active students", value: "8,426", detail: `${enrolled}/${capacity} seats filled in tracked sections` },
      { label: "Open sections", value: String(openSections), detail: `${campus.courses.length} total sections` },
      { label: "Faculty", value: "318", detail: "24 departments" },
      { label: "Pending actions", value: String(pending), detail: "Advising, holds, overrides" }
    ];
  }, [campus.approvals, campus.courses]);

  const filteredCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return campus.courses;
    return campus.courses.filter((course) =>
      [course.code, course.title, course.department, course.instructor, course.room]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [campus.courses, query]);

  const totalCredits = campus.registrationPlan
    .filter((item) => item.enrolled)
    .reduce((sum, item) => sum + item.credits, 0);
  const unreadMessages = campus.messages.filter((message) => !message.read).length;
  const role = currentUser?.role ?? "Student";
  const permissions = roleAccess[role];
  const visibleNavItems = navItems.filter((item) => permissions.views.includes(item.label));

  useEffect(() => {
    if (!permissions.views.includes(activeView)) {
      setActiveView("Dashboard");
    }
  }, [activeView, permissions.views]);

  function notify(message: string, tone: Toast["tone"] = "success") {
    setToast({ message, tone });
  }

  function can(permission: Permission) {
    return permissions.permissions.includes(permission);
  }

  function deny(action = "You do not have permission for that action") {
    notify(action, "warning");
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = demoUsers.find(
      (account) =>
        account.email.toLowerCase() === loginForm.email.trim().toLowerCase() &&
        account.password === loginForm.password
    );
    if (!user) {
      notify("Invalid email or password", "warning");
      return;
    }
    window.localStorage.setItem(sessionKey, user.id);
    setCurrentUser(user);
    setActiveView("Dashboard");
    notify(`Signed in as ${user.role}`);
  }

  function loginAs(user: DemoUser) {
    window.localStorage.setItem(sessionKey, user.id);
    setCurrentUser(user);
    setLoginForm({ email: user.email, password: user.password });
    setActiveView("Dashboard");
    notify(`Signed in as ${user.role}`);
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setCurrentUser(null);
    setLoginForm({ email: "registrar@northvalley.edu", password: "registrar123" });
  }

  function resetDemoData() {
    if (!can("manageSettings")) {
      deny("Only authorized staff can reset demo data");
      return;
    }
    setCampus(initialCampusState);
    notify("Demo data restored");
  }

  function createSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("createSection")) {
      deny("Only registrars can create course sections");
      return;
    }
    const capacity = Math.max(1, Number(newCourse.capacity));
    const course: Course = {
      ...newCourse,
      id: crypto.randomUUID(),
      code: newCourse.code.trim().toUpperCase(),
      title: newCourse.title.trim(),
      instructor: newCourse.instructor.trim(),
      department: newCourse.department.trim(),
      capacity,
      credits: Math.max(1, Number(newCourse.credits)),
      enrolled: 0,
      status: "Open"
    };

    setCampus((current) => ({
      ...current,
      courses: [course, ...current.courses],
      gradebook: [{ id: crypto.randomUUID(), course: course.code, average: 0, missing: 0 }, ...current.gradebook],
      activity: [
        { id: crypto.randomUUID(), title: `${course.code} section created`, detail: `${course.instructor} - ${selectedTerm}` },
        ...current.activity
      ]
    }));
    setNewCourse(blankCourse);
    setSectionFormOpen(false);
    notify(`${course.code} created`);
  }

  function addCourseToPlan(course: Course) {
    if (!can("addCourseToPlan")) {
      deny("Only students and advisors can add courses to a plan");
      return;
    }
    const existing = campus.registrationPlan.some((item) => item.code === course.code);
    if (existing) {
      notify(`${course.code} is already in the student plan`, "warning");
      return;
    }
    setCampus((current) => ({
      ...current,
      registrationPlan: [
        ...current.registrationPlan,
        {
          id: crypto.randomUUID(),
          code: course.code,
          title: course.title,
          credits: course.credits,
          ready: course.status === "Open",
          enrolled: false
        }
      ]
    }));
    notify(`${course.code} added to plan`);
  }

  function toggleEnrollment(planId: string) {
    if (!can("enroll")) {
      deny("Only students can enroll or drop planned courses");
      return;
    }
    const planItem = campus.registrationPlan.find((item) => item.id === planId);
    if (!planItem) return;
    if (!planItem.ready && !planItem.enrolled) {
      notify("Advisor approval is required before enrollment", "warning");
      return;
    }

    const isEnrolling = !planItem.enrolled;
    setCampus((current) => ({
      ...current,
      registrationPlan: current.registrationPlan.map((item) =>
        item.id === planId ? { ...item, enrolled: isEnrolling } : item
      ),
      courses: current.courses.map((course) =>
        course.code === planItem.code
          ? {
              ...course,
              enrolled: Math.max(0, course.enrolled + (isEnrolling ? 1 : -1)),
              status:
                isEnrolling && course.enrolled + 1 >= course.capacity
                  ? "Waitlist"
                  : course.status === "Waitlist" && course.enrolled < course.capacity
                    ? "Open"
                    : course.status
            }
          : course
      ),
      activity: [
        {
          id: crypto.randomUUID(),
          title: `${isEnrolling ? "Enrolled in" : "Dropped"} ${planItem.code}`,
          detail: `Student schedule updated - ${selectedTerm}`
        },
        ...current.activity
      ]
    }));
    notify(`${planItem.code} ${isEnrolling ? "enrolled" : "dropped"}`);
  }

  function approvePlan() {
    if (!can("approvePlan")) {
      deny("Only advisors and registrars can approve registration plans");
      return;
    }
    setCampus((current) => ({
      ...current,
      registrationPlan: current.registrationPlan.map((item) => ({ ...item, ready: true })),
      activity: [
        { id: crypto.randomUUID(), title: "Student plan approved", detail: `${currentUser?.name ?? role} approved all planned courses` },
        ...current.activity
      ]
    }));
    notify("Registration plan approved");
  }

  function completeTask(taskId: string) {
    if (!can("completeTeachingTask")) {
      deny("Only instructors can update the teaching queue");
      return;
    }
    const task = campus.teachingQueue.find((item) => item.id === taskId);
    if (!task) return;
    setCampus((current) => ({
      ...current,
      teachingQueue: current.teachingQueue.map((item) =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      ),
      activity: [
        { id: crypto.randomUUID(), title: `${task.title} updated`, detail: `${task.course} teaching queue` },
        ...current.activity
      ]
    }));
  }

  function updateGrade(id: string, average: number) {
    if (!can("editGrades")) {
      deny("Only instructors can edit grades");
      return;
    }
    setCampus((current) => ({
      ...current,
      gradebook: current.gradebook.map((item) =>
        item.id === id ? { ...item, average: Math.max(0, Math.min(100, average)) } : item
      )
    }));
  }

  function resolveApproval(id: string) {
    if (!can("resolveApprovals")) {
      deny("Only registrars can resolve administrative approvals");
      return;
    }
    const approval = campus.approvals.find((item) => item.id === id);
    if (!approval) return;
    setCampus((current) => ({
      ...current,
      approvals: current.approvals.map((item) =>
        item.id === id ? { ...item, count: Math.max(0, item.count - 1) } : item
      ),
      activity: [
        { id: crypto.randomUUID(), title: `${approval.title} resolved`, detail: `${approval.owner} queue reduced by 1` },
        ...current.activity
      ]
    }));
    notify("Approval item resolved");
  }

  function publishAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("publishAnnouncement")) {
      deny("Only instructors can publish course announcements");
      return;
    }
    if (!announcementText.trim()) return;
    setCampus((current) => ({
      ...current,
      announcements: [
        {
          id: crypto.randomUUID(),
          title: announcementText.trim(),
          course: "All Courses",
          body: "Published from the teaching workspace.",
          publishedAt: "Just now"
        },
        ...current.announcements
      ],
      activity: [
        { id: crypto.randomUUID(), title: "Announcement published", detail: announcementText.trim() },
        ...current.activity
      ]
    }));
    setAnnouncementText("");
    notify("Announcement published");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("sendMessages")) {
      deny("Your role can read messages but cannot send broadcasts");
      return;
    }
    if (!messageDraft.subject.trim() || !messageDraft.body.trim()) return;
    setCampus((current) => ({
      ...current,
      messages: [
        {
          id: crypto.randomUUID(),
          from: `You to ${messageDraft.to}`,
          subject: messageDraft.subject.trim(),
          body: messageDraft.body.trim(),
          read: true
        },
        ...current.messages
      ],
      activity: [
        { id: crypto.randomUUID(), title: "Message sent", detail: `${messageDraft.subject} - ${messageDraft.to}` },
        ...current.activity
      ]
    }));
    setMessageDraft({ to: "All students", subject: "", body: "" });
    notify("Message sent");
  }

  function markMessageRead(id: string) {
    setCampus((current) => ({
      ...current,
      messages: current.messages.map((message) => (message.id === id ? { ...message, read: true } : message))
    }));
  }

  function deleteMessage(id: string) {
    setCampus((current) => ({
      ...current,
      messages: current.messages.filter((message) => message.id !== id)
    }));
    notify("Message deleted");
  }

  const roleHelp: Record<Role, string> = {
    Registrar: "Manage catalog, sections, enrollment capacity, overrides, and institutional approvals.",
    Instructor: "Publish course content, complete teaching work, grade submissions, and contact learners.",
    Student: "Plan registration, enroll in approved sections, read announcements, and track grades.",
    Advisor: "Approve registration plans, monitor degree progress, and resolve academic requirements."
  };

  if (!currentUser) {
    return (
      <LoginScreen
        login={login}
        loginAs={loginAs}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        toast={toast}
      />
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
                {item.label === "Messages" && unreadMessages > 0 ? <em>{unreadMessages}</em> : null}
              </button>
            );
          })}
        </nav>

        <section className="systemPanel" aria-label="System status">
          <ShieldCheck size={18} />
          <div>
            <strong>PostgreSQL Ready</strong>
            <span>Signed in permissions are enforced locally. Prisma is ready for database-backed auth.</span>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Academic Operations</span>
            <h1>Registration, teaching, and learning command center</h1>
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
            <select aria-label="Select term" onChange={(event) => setSelectedTerm(event.target.value)} value={selectedTerm}>
              {termOptions.map((term) => (
                <option key={term}>{term}</option>
              ))}
            </select>
          </div>
        </header>

        <section className="roleBar" aria-label="Role selector">
          <div className="accountBadge">
            <UsersRound size={18} />
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role}</span>
            </div>
          </div>
          <div className="roleActions">
            {can("createSection") ? (
              <button className="primaryButton" onClick={() => setSectionFormOpen(true)} type="button">
                <Plus size={18} />
                Create Section
              </button>
            ) : null}
            <button className="secondaryButton" onClick={logout} type="button">
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </section>

        {toast ? <div className={`toast ${toast.tone}`}>{toast.message}</div> : null}

        <section className="statsGrid" aria-label="Institution metrics">
          {stats.map((stat) => (
            <article className="metricCard" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.detail}</small>
            </article>
          ))}
        </section>

        {activeView === "Dashboard" ? (
          <DashboardView
            activeRole={role}
            addCourseToPlan={addCourseToPlan}
            canAddCourseToPlan={can("addCourseToPlan")}
            canApprovePlan={can("approvePlan")}
            canCompleteTask={can("completeTeachingTask")}
            canEnroll={can("enroll")}
            canResolveApprovals={can("resolveApprovals")}
            approvals={campus.approvals}
            approvePlan={approvePlan}
            courses={filteredCourses}
            gradebook={campus.gradebook}
            registrationPlan={campus.registrationPlan}
            resolveApproval={resolveApproval}
            selectedTerm={selectedTerm}
            teachingQueue={campus.teachingQueue}
            toggleEnrollment={toggleEnrollment}
            totalCredits={totalCredits}
            completeTask={completeTask}
          />
        ) : null}

        {activeView === "Registration" ? (
          <RegistrationView
            approvePlan={approvePlan}
            canApprovePlan={can("approvePlan")}
            canEnroll={can("enroll")}
            plan={campus.registrationPlan}
            selectedTerm={selectedTerm}
            toggleEnrollment={toggleEnrollment}
            totalCredits={totalCredits}
          />
        ) : null}

        {activeView === "Courses" ? (
          <CoursesView
            addCourseToPlan={addCourseToPlan}
            canAddCourseToPlan={can("addCourseToPlan")}
            courses={filteredCourses}
            selectedTerm={selectedTerm}
          />
        ) : null}

        {activeView === "Teaching" ? (
          <TeachingView
            announcementText={announcementText}
            announcements={campus.announcements}
            completeTask={completeTask}
            canCompleteTask={can("completeTeachingTask")}
            canEditGrades={can("editGrades")}
            canPublishAnnouncement={can("publishAnnouncement")}
            gradebook={campus.gradebook}
            publishAnnouncement={publishAnnouncement}
            setAnnouncementText={setAnnouncementText}
            tasks={campus.teachingQueue}
            updateGrade={updateGrade}
          />
        ) : null}

        {activeView === "Learning" ? (
          <LearningView activity={campus.activity} announcements={campus.announcements} gradebook={campus.gradebook} />
        ) : null}

        {activeView === "Messages" ? (
          <MessagesView
            deleteMessage={deleteMessage}
            draft={messageDraft}
            canSendMessages={can("sendMessages")}
            markRead={markMessageRead}
            messages={campus.messages}
            sendMessage={sendMessage}
            setDraft={setMessageDraft}
          />
        ) : null}

        {activeView === "Settings" ? (
          <SettingsView
            institutionName={campus.institutionName}
            canManageSettings={can("manageSettings")}
            resetDemoData={resetDemoData}
            role={role}
            roleHelp={roleHelp[role]}
            setInstitutionName={(institutionName) => setCampus((current) => ({ ...current, institutionName }))}
          />
        ) : null}
      </section>

      {sectionFormOpen ? (
        <div className="modalBackdrop" role="presentation">
          <form className="modal" onSubmit={createSection}>
            <div className="panelHeader">
              <div>
                <span className="eyebrow">Catalog Management</span>
                <h2>Create course section</h2>
              </div>
              <button className="iconButton" onClick={() => setSectionFormOpen(false)} type="button" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="formGrid">
              <label>
                Code
                <input required value={newCourse.code} onChange={(event) => setNewCourse({ ...newCourse, code: event.target.value })} />
              </label>
              <label>
                Title
                <input required value={newCourse.title} onChange={(event) => setNewCourse({ ...newCourse, title: event.target.value })} />
              </label>
              <label>
                Instructor
                <input
                  required
                  value={newCourse.instructor}
                  onChange={(event) => setNewCourse({ ...newCourse, instructor: event.target.value })}
                />
              </label>
              <label>
                Department
                <input
                  required
                  value={newCourse.department}
                  onChange={(event) => setNewCourse({ ...newCourse, department: event.target.value })}
                />
              </label>
              <label>
                Capacity
                <input
                  min="1"
                  type="number"
                  value={newCourse.capacity}
                  onChange={(event) => setNewCourse({ ...newCourse, capacity: Number(event.target.value) })}
                />
              </label>
              <label>
                Credits
                <input
                  min="1"
                  type="number"
                  value={newCourse.credits}
                  onChange={(event) => setNewCourse({ ...newCourse, credits: Number(event.target.value) })}
                />
              </label>
              <label>
                Schedule
                <input
                  required
                  value={newCourse.schedule}
                  onChange={(event) => setNewCourse({ ...newCourse, schedule: event.target.value })}
                />
              </label>
              <label>
                Room
                <input required value={newCourse.room} onChange={(event) => setNewCourse({ ...newCourse, room: event.target.value })} />
              </label>
            </div>
            <div className="modalActions">
              <button className="secondaryButton" onClick={() => setSectionFormOpen(false)} type="button">
                Cancel
              </button>
              <button className="primaryButton" type="submit">
                <Save size={18} />
                Save Section
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
            <input
              autoComplete="username"
              value={props.loginForm.email}
              onChange={(event) => props.setLoginForm({ ...props.loginForm, email: event.target.value })}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
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

      <section className="demoAccounts" aria-label="Demo accounts">
        <div>
          <span className="eyebrow">Demo Accounts</span>
          <h2>Choose a role to test privileges</h2>
        </div>
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

function DashboardView(props: {
  activeRole: Role;
  addCourseToPlan: (course: Course) => void;
  canAddCourseToPlan: boolean;
  canApprovePlan: boolean;
  canCompleteTask: boolean;
  canEnroll: boolean;
  canResolveApprovals: boolean;
  approvals: CampusState["approvals"];
  approvePlan: () => void;
  completeTask: (taskId: string) => void;
  courses: CampusState["courses"];
  gradebook: CampusState["gradebook"];
  registrationPlan: CampusState["registrationPlan"];
  resolveApproval: (id: string) => void;
  selectedTerm: string;
  teachingQueue: CampusState["teachingQueue"];
  toggleEnrollment: (planId: string) => void;
  totalCredits: number;
}) {
  return (
    <>
      <section className="contentGrid">
        <div className="mainColumn">
          <CoursesPanel
            courses={props.courses}
            selectedTerm={props.selectedTerm}
            addCourseToPlan={props.addCourseToPlan}
            canAddCourseToPlan={props.canAddCourseToPlan}
          />
          <RegistrationPanel
            approvePlan={props.approvePlan}
            canApprovePlan={props.canApprovePlan}
            canEnroll={props.canEnroll}
            plan={props.registrationPlan}
            toggleEnrollment={props.toggleEnrollment}
            totalCredits={props.totalCredits}
          />
        </div>

        <aside className="sideColumn">
          <section className="panel compact">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">Current Role</span>
                <h2>{props.activeRole}</h2>
              </div>
              <UsersRound size={20} />
            </div>
            <p className="muted">Permissions, dashboards, and workflow queues adapt by selected role in this MVP.</p>
          </section>
          <TeachingQueuePanel canCompleteTask={props.canCompleteTask} completeTask={props.completeTask} tasks={props.teachingQueue} />
        </aside>
      </section>

      <section className="bottomGrid">
        <GradebookPanel gradebook={props.gradebook} readonly />
        <ApprovalsPanel
          approvals={props.approvals}
          canResolveApprovals={props.canResolveApprovals}
          resolveApproval={props.resolveApproval}
        />
      </section>
    </>
  );
}

function CoursesView(props: {
  addCourseToPlan: (course: Course) => void;
  canAddCourseToPlan: boolean;
  courses: CampusState["courses"];
  selectedTerm: string;
}) {
  return <CoursesPanel {...props} />;
}

function RegistrationView(props: {
  approvePlan: () => void;
  canApprovePlan: boolean;
  canEnroll: boolean;
  plan: CampusState["registrationPlan"];
  selectedTerm: string;
  toggleEnrollment: (planId: string) => void;
  totalCredits: number;
}) {
  return (
    <>
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Registration</span>
          <h2>{props.selectedTerm} student plan</h2>
        </div>
        <strong>{props.totalCredits} enrolled credits</strong>
      </div>
      <RegistrationPanel {...props} />
    </>
  );
}

function TeachingView(props: {
  announcementText: string;
  announcements: CampusState["announcements"];
  canCompleteTask: boolean;
  canEditGrades: boolean;
  canPublishAnnouncement: boolean;
  completeTask: (taskId: string) => void;
  gradebook: CampusState["gradebook"];
  publishAnnouncement: (event: FormEvent<HTMLFormElement>) => void;
  setAnnouncementText: (value: string) => void;
  tasks: CampusState["teachingQueue"];
  updateGrade: (id: string, average: number) => void;
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <TeachingQueuePanel canCompleteTask={props.canCompleteTask} completeTask={props.completeTask} tasks={props.tasks} />
        <GradebookPanel
          gradebook={props.gradebook}
          readonly={!props.canEditGrades}
          updateGrade={props.canEditGrades ? props.updateGrade : undefined}
        />
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Course Content</span>
              <h2>Publish announcement</h2>
            </div>
          </div>
          <form className="composeForm" onSubmit={props.publishAnnouncement}>
            <input
              placeholder="Example: Midterm review guide is now available"
              value={props.announcementText}
              onChange={(event) => props.setAnnouncementText(event.target.value)}
            />
            <button className="primaryButton" disabled={!props.canPublishAnnouncement} type="submit">
              <Send size={18} />
              Publish
            </button>
          </form>
        </section>
      </div>
      <aside className="sideColumn single">
        <AnnouncementsPanel announcements={props.announcements} />
      </aside>
    </section>
  );
}

function LearningView(props: {
  activity: CampusState["activity"];
  announcements: CampusState["announcements"];
  gradebook: CampusState["gradebook"];
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <GradebookPanel gradebook={props.gradebook} readonly />
        <section className="panel">
          <span className="eyebrow">Learning Activity</span>
          <div className="activityList spacious">
            {props.activity.map((item) => (
              <article key={item.id}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
      <aside className="sideColumn single">
        <AnnouncementsPanel announcements={props.announcements} />
      </aside>
    </section>
  );
}

function MessagesView(props: {
  canSendMessages: boolean;
  deleteMessage: (id: string) => void;
  draft: { to: string; subject: string; body: string };
  markRead: (id: string) => void;
  messages: CampusState["messages"];
  sendMessage: (event: FormEvent<HTMLFormElement>) => void;
  setDraft: (draft: { to: string; subject: string; body: string }) => void;
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Inbox</span>
              <h2>Messages and notifications</h2>
            </div>
          </div>
          <div className="messageList">
            {props.messages.map((message) => (
              <article className={message.read ? "" : "unread"} key={message.id}>
                <div>
                  <strong>{message.subject}</strong>
                  <small>{message.from}</small>
                  <p>{message.body}</p>
                </div>
                <div className="rowActions">
                  {!message.read ? (
                    <button className="secondaryButton" onClick={() => props.markRead(message.id)} type="button">
                      Mark Read
                    </button>
                  ) : null}
                  <button className="iconButton" onClick={() => props.deleteMessage(message.id)} type="button" aria-label="Delete message">
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <aside className="sideColumn single">
        <section className="panel">
          <span className="eyebrow">Compose</span>
          <form className="stackedForm" onSubmit={props.sendMessage}>
            <label>
              To
              <select value={props.draft.to} onChange={(event) => props.setDraft({ ...props.draft, to: event.target.value })}>
                <option>All students</option>
                <option>All instructors</option>
                <option>Advisors</option>
                <option>Registrar Office</option>
              </select>
            </label>
            <label>
              Subject
              <input
                required
                value={props.draft.subject}
                onChange={(event) => props.setDraft({ ...props.draft, subject: event.target.value })}
              />
            </label>
            <label>
              Body
              <textarea
                required
                rows={6}
                value={props.draft.body}
                onChange={(event) => props.setDraft({ ...props.draft, body: event.target.value })}
              />
            </label>
            <button className="primaryButton" disabled={!props.canSendMessages} type="submit">
              <Send size={18} />
              Send
            </button>
            {!props.canSendMessages ? <p className="muted">Your role can read messages but cannot send broadcasts.</p> : null}
          </form>
        </section>
      </aside>
    </section>
  );
}

function SettingsView(props: {
  canManageSettings: boolean;
  institutionName: string;
  resetDemoData: () => void;
  role: Role;
  roleHelp: string;
  setInstitutionName: (value: string) => void;
}) {
  return (
    <section className="contentGrid">
      <div className="mainColumn">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Institution</span>
              <h2>School settings</h2>
            </div>
          </div>
          <div className="formGrid compactGrid">
            <label>
              Institution name
              <input
                readOnly={!props.canManageSettings}
                value={props.institutionName}
                onChange={(event) => props.setInstitutionName(event.target.value)}
              />
            </label>
            <label>
              Active role
              <input readOnly value={props.role} />
            </label>
          </div>
        </section>
      </div>
      <aside className="sideColumn single">
        <section className="panel compact">
          <span className="eyebrow">Role Permissions</span>
          <p className="muted withTop">{props.roleHelp}</p>
        </section>
        <section className="panel compact">
          <span className="eyebrow">Demo State</span>
          <p className="muted withTop">Local changes are saved in this browser. Restore the seeded college data anytime.</p>
          <button className="secondaryButton wideButton" disabled={!props.canManageSettings} onClick={props.resetDemoData} type="button">
            <RotateCcw size={18} />
            Reset Demo Data
          </button>
        </section>
      </aside>
    </section>
  );
}

function CoursesPanel(props: {
  addCourseToPlan: (course: Course) => void;
  canAddCourseToPlan: boolean;
  courses: CampusState["courses"];
  selectedTerm: string;
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Course Catalog</span>
          <h2>{props.selectedTerm} sections</h2>
        </div>
        <button className="iconButton" aria-label="Open calendar" type="button">
          <CalendarDays size={18} />
        </button>
      </div>
      <div className="courseTable" role="table" aria-label="Course catalog">
        <div className="tableRow tableHead" role="row">
          <span>Course</span>
          <span>Instructor</span>
          <span>Seats</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {props.courses.map((course) => (
          <div className="tableRow" key={course.id} role="row">
            <span>
              <strong>{course.code}</strong>
              <small>{course.title}</small>
            </span>
            <span>
              <strong>{course.instructor}</strong>
              <small>{course.department}</small>
            </span>
            <span>
              <strong>
                {course.enrolled}/{course.capacity}
              </strong>
              <small>
                {course.schedule} - {course.room}
              </small>
            </span>
            <span>
              <mark className={course.status === "Open" ? "open" : course.status === "Closed" ? "closed" : "waitlist"}>
                {course.status}
              </mark>
            </span>
            <span>
              <button
                className="secondaryButton"
                disabled={!props.canAddCourseToPlan}
                onClick={() => props.addCourseToPlan(course)}
                type="button"
              >
                Add
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RegistrationPanel(props: {
  approvePlan: () => void;
  canApprovePlan: boolean;
  canEnroll: boolean;
  plan: CampusState["registrationPlan"];
  toggleEnrollment: (planId: string) => void;
  totalCredits: number;
}) {
  return (
    <section className="panel innerPanel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Registration</span>
          <h2>Student plan review</h2>
        </div>
        <button className="secondaryButton" disabled={!props.canApprovePlan} onClick={props.approvePlan} type="button">
          Approve Plan
        </button>
      </div>
      <div className="planGrid">
        {props.plan.map((item) => (
          <article className="planItem" key={item.id}>
            <div>
              <strong>{item.code}</strong>
              <span>{item.title}</span>
            </div>
            <small>{item.credits} credits</small>
            <mark className={item.enrolled ? "open" : item.ready ? "open" : "attention"}>
              {item.enrolled ? "Enrolled" : item.ready ? "Ready" : "Needs advisor"}
            </mark>
            <button
              className="secondaryButton"
              disabled={!props.canEnroll}
              onClick={() => props.toggleEnrollment(item.id)}
              type="button"
            >
              {item.enrolled ? "Drop" : "Enroll"}
            </button>
          </article>
        ))}
      </div>
      <p className="summaryLine">{props.totalCredits} enrolled credits in current plan</p>
    </section>
  );
}

function TeachingQueuePanel(props: {
  canCompleteTask: boolean;
  completeTask: (taskId: string) => void;
  tasks: CampusState["teachingQueue"];
}) {
  return (
    <section className="panel compact">
      <span className="eyebrow">Teaching Queue</span>
      <div className="taskList">
        {props.tasks.map((task) => (
          <article className={task.completed ? "done" : ""} key={task.id}>
            <button
              className="checkButton"
              disabled={!props.canCompleteTask}
              onClick={() => props.completeTask(task.id)}
              type="button"
              aria-label="Toggle task"
            >
              <CheckCircle2 size={17} />
            </button>
            <div>
              <strong>{task.title}</strong>
              <small>{task.course}</small>
            </div>
            <span>{task.completed ? "Done" : task.due}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function GradebookPanel(props: {
  gradebook: CampusState["gradebook"];
  readonly?: boolean;
  updateGrade?: (id: string, average: number) => void;
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Gradebook</span>
          <h2>Assessment health</h2>
        </div>
      </div>
      <div className="gradeBars">
        {props.gradebook.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.course}</strong>
              <span>
                {item.average}% average - {item.missing} missing
              </span>
            </div>
            <div className="barTrack">
              <span style={{ width: `${item.average}%` }} />
            </div>
            {!props.readonly && props.updateGrade ? (
              <label className="gradeInput">
                Average
                <input
                  max="100"
                  min="0"
                  type="number"
                  value={item.average}
                  onChange={(event) => props.updateGrade?.(item.id, Number(event.target.value))}
                />
              </label>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ApprovalsPanel(props: {
  approvals: CampusState["approvals"];
  canResolveApprovals: boolean;
  resolveApproval: (id: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>Approval queue</h2>
        </div>
      </div>
      <div className="approvalList">
        {props.approvals.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <small>{item.owner}</small>
            </div>
            <mark className={item.count === 0 ? "open" : "attention"}>{item.count}</mark>
            <button
              className="secondaryButton"
              disabled={item.count === 0 || !props.canResolveApprovals}
              onClick={() => props.resolveApproval(item.id)}
              type="button"
            >
              Resolve
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnnouncementsPanel(props: { announcements: CampusState["announcements"] }) {
  return (
    <section className="panel compact">
      <span className="eyebrow">Announcements</span>
      <div className="activityList withTop">
        {props.announcements.map((item) => (
          <article key={item.id}>
            <strong>{item.title}</strong>
            <small>
              {item.course} - {item.publishedAt}
            </small>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
