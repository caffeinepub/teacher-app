import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  PlayCircle,
  Plus,
  Radio,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { Profile } from "../backend.d";
import type { Subject } from "../backend.d";
import { ClassStatus } from "../backend.d";
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
  useEnrollInClass,
  useRecordings,
} from "../hooks/useQueries";

interface DashboardProps {
  profile: Profile;
  onJoinClass: (classId: string) => void;
  onNavigate: (page: Page) => void;
}

function subjectLabel(s: Subject | undefined): string {
  if (!s) return "General";
  if (s.__kind__ === "math") return "Mathematics";
  if (s.__kind__ === "science") return "Science";
  if (s.__kind__ === "english") return "English";
  if (s.__kind__ === "history") return "History";
  if (s.__kind__ === "other") return s.other;
  return "General";
}

function statusBadge(status: ClassStatus) {
  if (status === ClassStatus.live)
    return (
      <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
        LIVE
      </Badge>
    );
  if (status === ClassStatus.scheduled)
    return (
      <Badge variant="outline" className="text-xs">
        Scheduled
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs">
      Ended
    </Badge>
  );
}

function formatTime(ts: bigint): string {
  try {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function DashboardPage({
  profile,
  onJoinClass,
  onNavigate,
}: DashboardProps) {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: recordings } = useRecordings();
  const { mutate: createClass, isPending: creating } = useCreateClass();
  const { mutate: deleteClass } = useDeleteClass();
  const { mutate: enroll } = useEnrollInClass();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSubject, setNewSubject] = useState("math");
  const [newDate, setNewDate] = useState("");

  function getSubject(): Subject {
    if (newSubject === "math") return { __kind__: "math", math: null };
    if (newSubject === "history") return { __kind__: "history", history: null };
    if (newSubject === "english") return { __kind__: "english", english: null };
    if (newSubject === "science") return { __kind__: "science", science: null };
    return { __kind__: "other", other: newSubject };
  }

  function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const scheduledTime = newDate
      ? BigInt(new Date(newDate).getTime() * 1_000_000)
      : BigInt(Date.now() * 1_000_000);
    createClass(
      {
        title: newTitle.trim(),
        description: newDesc.trim(),
        subject: getSubject(),
        scheduledTime,
      },
      {
        onSuccess: () => {
          toast.success("Class created!");
          setCreateOpen(false);
          setNewTitle("");
          setNewDesc("");
          setNewDate("");
        },
        onError: () => toast.error("Failed to create class."),
      },
    );
  }

  function handleDelete(classId: string) {
    deleteClass(classId, {
      onSuccess: () => toast.success("Class deleted."),
      onError: () => toast.error("Failed to delete class."),
    });
  }

  function handleEnroll(classId: string) {
    enroll(classId, {
      onSuccess: () => toast.success("Enrolled!"),
      onError: () => toast.error("Enrollment failed."),
    });
  }

  const liveClasses =
    classes?.filter((c) => c.status === ClassStatus.live) ?? [];
  const scheduledClasses =
    classes?.filter((c) => c.status === ClassStatus.scheduled) ?? [];
  const endedClasses =
    classes?.filter((c) => c.status === ClassStatus.ended) ?? [];

  // Sample teacher profiles for display
  const sampleTeachers = [
    {
      name: "Dr. Sarah Chen",
      subject: "Mathematics",
      bio: "PhD in Applied Mathematics. 8 years teaching experience.",
      lessons: 142,
      students: 2840,
    },
    {
      name: "Prof. James Walker",
      subject: "Science",
      bio: "BSc Physics, MSc Education. Passionate about experiments.",
      lessons: 98,
      students: 1960,
    },
    {
      name: "Ms. Aisha Patel",
      subject: "English",
      bio: "MA English Literature. Specializes in creative writing.",
      lessons: 76,
      students: 1520,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 mb-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.28 0.09 255), oklch(0.34 0.11 250))",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {profile.name} 👋</h1>
            <p className="text-white/70 text-sm mt-1">
              {profile.isTeacher ? "Teacher Dashboard" : "Student Dashboard"} •{" "}
              {subjectLabel(profile.subject)}
            </p>
          </div>
          <div className="flex gap-3">
            {profile.isTeacher && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="dashboard.create_class.open_modal_button"
                    className="bg-white text-navy-700 hover:bg-white/90 font-semibold"
                    style={{ color: "oklch(0.28 0.09 255)" }}
                  >
                    <Plus size={16} className="mr-2" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="dashboard.create_class.dialog">
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClass} className="space-y-4">
                    <div>
                      <Label htmlFor="class-title">Class Title</Label>
                      <Input
                        id="class-title"
                        data-ocid="dashboard.class_title.input"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Algebra Fundamentals"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="class-desc">Description</Label>
                      <Textarea
                        id="class-desc"
                        data-ocid="dashboard.class_desc.textarea"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="What will students learn?"
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Select value={newSubject} onValueChange={setNewSubject}>
                        <SelectTrigger data-ocid="dashboard.class_subject.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="math">Mathematics</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="class-date">Scheduled Time</Label>
                      <Input
                        id="class-date"
                        data-ocid="dashboard.class_date.input"
                        type="datetime-local"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        data-ocid="dashboard.create_class.cancel_button"
                        onClick={() => setCreateOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        data-ocid="dashboard.create_class.submit_button"
                        disabled={creating}
                        style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
                        className="text-white"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Class"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={() => onNavigate("recordings")}
              variant="outline"
              data-ocid="dashboard.recordings.link"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
            >
              <PlayCircle size={16} className="mr-2" />
              View Recordings
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            {
              label: "Total Classes",
              value: classes?.length ?? 0,
              icon: Video,
            },
            { label: "Live Now", value: liveClasses.length, icon: Radio },
            {
              label: "Recordings",
              value: recordings?.length ?? 0,
              icon: PlayCircle,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className="text-white/70" />
                <span className="text-white/70 text-xs font-medium">
                  {label}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Live Classes */}
      {liveClasses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {liveClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-ocid={`dashboard.live_class.item.${i + 1}`}
                >
                  <Card className="border-red-200 shadow-card hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          {statusBadge(cls.status)}
                          <CardTitle className="text-base mt-2">
                            {cls.title}
                          </CardTitle>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {subjectLabel(cls.subject)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => onJoinClass(cls.id)}
                        data-ocid={`dashboard.join_class.button.${i + 1}`}
                        className="w-full text-white"
                        style={{ backgroundColor: "oklch(0.63 0.24 25)" }}
                      >
                        <Video size={16} className="mr-2" />
                        Join Live
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Classes</h2>
          </div>

          {classesLoading ? (
            <div
              className="space-y-3"
              data-ocid="dashboard.classes.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : classes && classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  data-ocid={`dashboard.class.item.${i + 1}`}
                >
                  <Card className="shadow-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {statusBadge(cls.status)}
                            <span className="text-xs text-muted-foreground">
                              {subjectLabel(cls.subject)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground truncate">
                            {cls.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock size={11} />
                            {formatTime(cls.scheduledTime)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(cls.status === ClassStatus.live ||
                            cls.status === ClassStatus.scheduled) &&
                            (profile.isTeacher ? (
                              <Button
                                size="sm"
                                onClick={() => onJoinClass(cls.id)}
                                data-ocid={`dashboard.class.join.button.${i + 1}`}
                                style={{
                                  backgroundColor: "oklch(0.28 0.09 255)",
                                }}
                                className="text-white"
                              >
                                <Video size={14} className="mr-1" />
                                {cls.status === ClassStatus.live
                                  ? "Manage"
                                  : "Start"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  cls.status === ClassStatus.live
                                    ? onJoinClass(cls.id)
                                    : handleEnroll(cls.id)
                                }
                                data-ocid={`dashboard.class.enroll.button.${i + 1}`}
                                style={{
                                  backgroundColor:
                                    cls.status === ClassStatus.live
                                      ? "oklch(0.63 0.24 25)"
                                      : "oklch(0.28 0.09 255)",
                                }}
                                className="text-white"
                              >
                                {cls.status === ClassStatus.live
                                  ? "Join"
                                  : "Enroll"}
                              </Button>
                            ))}
                          {profile.isTeacher && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(cls.id)}
                              data-ocid={`dashboard.class.delete_button.${i + 1}`}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card
              data-ocid="dashboard.classes.empty_state"
              className="shadow-card"
            >
              <CardContent className="p-8 text-center">
                <BookOpen
                  size={32}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="font-medium text-muted-foreground">
                  {profile.isTeacher
                    ? "No classes yet. Create your first class!"
                    : "No classes available yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Student Progress + Calendar OR Teacher stats */}
        <div className="space-y-6">
          {/* Upcoming */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={16} />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledClasses.length > 0 ? (
                <div className="space-y-3">
                  {scheduledClasses.slice(0, 4).map((cls, i) => (
                    <div
                      key={cls.id}
                      data-ocid={`dashboard.upcoming.item.${i + 1}`}
                      className="flex items-start gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "oklch(0.93 0.02 245)" }}
                      >
                        <BookOpen
                          size={14}
                          style={{ color: "oklch(0.28 0.09 255)" }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cls.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(cls.scheduledTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming classes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Progress Card (student only) */}
          {!profile.isTeacher && (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users size={16} />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Classes attended
                    </span>
                    <span className="font-semibold">{endedClasses.length}</span>
                  </div>
                  <Progress
                    value={Math.min(
                      (endedClasses.length /
                        Math.max(classes?.length ?? 1, 1)) *
                        100,
                      100,
                    )}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Recordings watched
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teacher Profiles */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Featured Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleTeachers.map((t, i) => (
                  <div
                    key={t.name}
                    data-ocid={`dashboard.teacher.item.${i + 1}`}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                      style={{
                        backgroundColor: `oklch(${0.45 + i * 0.1} 0.15 ${220 + i * 30})`,
                      }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.lessons} lessons • {t.students.toLocaleString()}{" "}
                        students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
