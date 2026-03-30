import { Button } from "@/components/ui/button";
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
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Subject } from "../backend.d";
import { useSaveProfile } from "../hooks/useQueries";

export default function SetupPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [subject, setSubject] = useState<string>("math");
  const { mutate: saveProfile, isPending } = useSaveProfile();

  function getSubject(): Subject {
    if (subject === "math") return { __kind__: "math", math: null };
    if (subject === "history") return { __kind__: "history", history: null };
    if (subject === "english") return { __kind__: "english", english: null };
    if (subject === "science") return { __kind__: "science", science: null };
    return { __kind__: "other", other: subject };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      toast.error("Please select your role");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    saveProfile(
      {
        name: name.trim(),
        bio: bio.trim(),
        isTeacher: role === "teacher",
        subject: getSubject(),
      },
      {
        onError: () => toast.error("Failed to save profile, please try again."),
      },
    );
  }

  return (
    <div className="min-h-screen header-navy flex flex-col">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white text-lg font-bold">T</span>
        </div>
        <span className="text-white font-semibold">Teacher App</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl header-navy flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">T</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Set Up Your Profile
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Tell us a bit about yourself
              </p>
            </div>

            {/* Role selection */}
            <div className="mb-6">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                I am a...
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "teacher" as const,
                    label: "Teacher",
                    icon: BookOpen,
                    desc: "I teach classes",
                  },
                  {
                    value: "student" as const,
                    label: "Student",
                    icon: GraduationCap,
                    desc: "I take classes",
                  },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    data-ocid={`setup.${value}.toggle`}
                    onClick={() => setRole(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === value
                        ? "border-navy-700 bg-navy-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={
                      role === value
                        ? {
                            borderColor: "oklch(0.28 0.09 255)",
                            backgroundColor: "oklch(0.96 0.02 250)",
                          }
                        : {}
                    }
                  >
                    <Icon
                      size={24}
                      className={
                        role === value ? "text-navy-700" : "text-gray-400"
                      }
                      style={
                        role === value ? { color: "oklch(0.28 0.09 255)" } : {}
                      }
                    />
                    <span
                      className={`text-sm font-semibold ${
                        role === value ? "text-navy-700" : "text-gray-700"
                      }`}
                      style={
                        role === value ? { color: "oklch(0.28 0.09 255)" } : {}
                      }
                    >
                      {label}
                    </span>
                    <span className="text-xs text-gray-400">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="setup-name"
                  className="text-sm font-semibold text-gray-700"
                >
                  Full Name
                </Label>
                <Input
                  id="setup-name"
                  data-ocid="setup.name.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="setup-bio"
                  className="text-sm font-semibold text-gray-700"
                >
                  Bio
                </Label>
                <Textarea
                  id="setup-bio"
                  data-ocid="setup.bio.textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A brief introduction about yourself..."
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>

              {role === "teacher" && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Subject
                  </Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger
                      data-ocid="setup.subject.select"
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
              )}

              <Button
                type="submit"
                disabled={isPending || !role}
                data-ocid="setup.submit_button"
                className="w-full h-11 font-semibold"
                style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue to Teacher App"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
