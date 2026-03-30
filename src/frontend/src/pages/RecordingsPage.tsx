import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Download,
  Film,
  PlayCircle,
  Search,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Recording } from "../backend.d";
import { useRecordings } from "../hooks/useQueries";

export default function RecordingsPage() {
  const { data: recordings, isLoading } = useRecordings();
  const [search, setSearch] = useState("");
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");

  const filtered = (recordings ?? []).filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  // Sample recordings for demo
  const sampleRecordings = [
    {
      id: "s1",
      title: "Algebra Fundamentals - Session 1",
      teacher: "Dr. Sarah Chen",
      duration: "45 min",
      date: "Mar 28, 2026",
      subject: "Mathematics",
    },
    {
      id: "s2",
      title: "Newton's Laws of Motion",
      teacher: "Prof. James Walker",
      duration: "52 min",
      date: "Mar 27, 2026",
      subject: "Science",
    },
    {
      id: "s3",
      title: "Essay Writing Workshop",
      teacher: "Ms. Aisha Patel",
      duration: "38 min",
      date: "Mar 26, 2026",
      subject: "English",
    },
    {
      id: "s4",
      title: "Quadratic Equations Deep Dive",
      teacher: "Dr. Sarah Chen",
      duration: "61 min",
      date: "Mar 25, 2026",
      subject: "Mathematics",
    },
    {
      id: "s5",
      title: "World War II: Causes and Effects",
      teacher: "Mr. Carlos Diaz",
      duration: "44 min",
      date: "Mar 24, 2026",
      subject: "History",
    },
    {
      id: "s6",
      title: "Chemical Reactions Lab",
      teacher: "Prof. James Walker",
      duration: "57 min",
      date: "Mar 23, 2026",
      subject: "Science",
    },
  ];

  function formatDuration(seconds: bigint): string {
    const s = Number(seconds);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  }

  function handlePlay(rec: Recording) {
    try {
      const url = rec.blob.getDirectURL();
      setPlayingUrl(url);
      setPlayingTitle(rec.title);
    } catch {
      setPlayingUrl(null);
    }
  }

  const subjectColors: Record<string, string> = {
    Mathematics: "oklch(0.70 0.15 250)",
    Science: "oklch(0.69 0.21 142)",
    English: "oklch(0.75 0.18 60)",
    History: "oklch(0.70 0.18 30)",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Class Recordings
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Replay past classes anytime
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="recordings.search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recordings..."
              className="pl-9 w-56"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="recordings.loading_state"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Actual recordings from backend */}
          {filtered.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                Your Recordings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-ocid={`recordings.item.${i + 1}`}
                  >
                    <Card
                      className="shadow-card hover:shadow-md transition-all group cursor-pointer"
                      onClick={() => handlePlay(rec)}
                    >
                      <CardContent className="p-0">
                        <div
                          className="h-32 rounded-t-xl flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.28 0.09 255), oklch(0.40 0.12 250))",
                          }}
                        >
                          <PlayCircle
                            size={40}
                            className="text-white/60 group-hover:text-white group-hover:scale-110 transition-all"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                            {rec.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatDuration(rec.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(
                                Number(rec.uploadedAt) / 1_000_000,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Sample recordings for demo */}
          <div>
            {filtered.length === 0 && recordings?.length === 0 && (
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                Featured Class Recordings
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleRecordings
                .filter(
                  (r) =>
                    !search ||
                    r.title.toLowerCase().includes(search.toLowerCase()),
                )
                .map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-ocid={`recordings.sample.item.${i + 1}`}
                  >
                    <Card className="shadow-card hover:shadow-md transition-all group cursor-pointer">
                      <CardContent className="p-0">
                        <div
                          className="h-36 rounded-t-xl relative flex items-center justify-center overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, oklch(0.22 0.08 255), oklch(0.35 0.12 ${230 + i * 20}))`,
                          }}
                        >
                          <Film
                            size={36}
                            className="text-white/40 group-hover:text-white/60 transition-colors"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge
                              className="text-white text-xs"
                              style={{
                                backgroundColor:
                                  subjectColors[rec.subject] ??
                                  "oklch(0.28 0.09 255)",
                              }}
                            >
                              {rec.subject}
                            </Badge>
                          </div>
                          <div className="absolute bottom-3 right-3">
                            <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock size={10} />
                              {rec.duration}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                            {rec.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            {rec.teacher}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar size={11} />
                              {rec.date}
                            </span>
                            <button
                              type="button"
                              className="text-xs flex items-center gap-1 hover:underline"
                              style={{ color: "oklch(0.28 0.09 255)" }}
                            >
                              <Download size={11} />
                              Save
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>

          {filtered.length === 0 &&
            sampleRecordings.filter((r) =>
              r.title.toLowerCase().includes(search.toLowerCase()),
            ).length === 0 && (
              <div
                data-ocid="recordings.empty_state"
                className="text-center py-16"
              >
                <Film
                  size={40}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-muted-foreground">No recordings found</p>
              </div>
            )}
        </>
      )}

      {/* Video player dialog */}
      <Dialog open={!!playingUrl} onOpenChange={() => setPlayingUrl(null)}>
        <DialogContent
          className="max-w-3xl"
          data-ocid="recordings.player.dialog"
        >
          <DialogHeader>
            <DialogTitle>{playingTitle}</DialogTitle>
          </DialogHeader>
          {playingUrl && (
            <video
              src={playingUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
            >
              <track kind="captions" />
            </video>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
