import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, GraduationCap, Loader2, LogOut, Save } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../backend.d";
import type { Subject } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile } from "../hooks/useQueries";

function subjectKey(s: Subject | undefined): string {
  if (!s) return "other";
  if (s.__kind__ === "math") return "math";
  if (s.__kind__ === "science") return "science";
  if (s.__kind__ === "english") return "english";
  if (s.__kind__ === "history") return "history";
  return "other";
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

export default function ProfilePage({ profile }: { profile: Profile }) {
  const { identity, clear } = useInternetIdentity();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [subject, setSubject] = useState(subjectKey(profile.subject));
  const { mutate: saveProfile, isPending } = useSaveProfile();

  useEffect(() => {
    setName(profile.name);
    setBio(profile.bio);
    setSubject(subjectKey(profile.subject));
  }, [profile]);

  function getSubject(): Subject {
    if (subject === "math") return { __kind__: "math", math: null };
    if (subject === "history") return { __kind__: "history", history: null };
    if (subject === "english") return { __kind__: "english", english: null };
    if (subject === "science") return { __kind__: "science", science: null };
    return { __kind__: "other", other: subject };
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    saveProfile(
      {
        name: name.trim(),
        bio: bio.trim(),
        isTeacher: profile.isTeacher,
        subject: getSubject(),
      },
      {
        onSuccess: () => toast.success("Profile updated!"),
        onError: () => toast.error("Failed to update profile."),
      },
    );
  }

  const stats = [
    { label: "Role", value: profile.isTeacher ? "Teacher" : "Student" },
    { label: "Subject", value: subjectLabel(profile.subject) },
    { label: "Account", value: "Active" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback
                    className="text-2xl font-bold text-white"
                    style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
                >
                  {profile.isTeacher ? (
                    <BookOpen size={12} className="text-white" />
                  ) : (
                    <GraduationCap size={12} className="text-white" />
                  )}
                </div>
              </div>

              <h2 className="text-lg font-bold text-foreground">
                {profile.name}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {subjectLabel(profile.subject)}
              </p>

              <Badge
                className="mt-2 text-white"
                style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
              >
                {profile.isTeacher ? "Teacher" : "Student"}
              </Badge>

              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-4 text-left">
                  {profile.bio}
                </p>
              )}

              <div className="mt-6 space-y-2">
                {stats.map((s) => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium text-foreground">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {identity && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {identity.getPrincipal().toString().slice(0, 16)}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Principal ID
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    data-ocid="profile.name.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="profile-bio">Bio</Label>
                  <Textarea
                    id="profile-bio"
                    data-ocid="profile.bio.textarea"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell students (or teachers) about yourself..."
                    className="mt-1 resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Subject Focus</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger
                      data-ocid="profile.subject.select"
                      className="mt-1"
                    >
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

                <div className="pt-2 flex gap-3">
                  <Button
                    type="submit"
                    disabled={isPending}
                    data-ocid="profile.save.submit_button"
                    className="flex-1 text-white"
                    style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    data-ocid="profile.logout.button"
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
