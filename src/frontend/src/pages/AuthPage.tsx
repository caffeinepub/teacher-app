import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, PlayCircle, Users, Video } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen header-navy flex flex-col">
      {/* Header bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white text-xl font-bold">T</span>
        </div>
        <span className="text-white font-semibold text-lg">Teacher App</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Live Learning,
              <br />
              <span className="text-blue-300">Anywhere.</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-md">
              Stream live classes to up to 100 students, record sessions, and
              manage your teaching all in one place.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Video,
                  label: "Live Streaming",
                  desc: "HD audio & video",
                },
                {
                  icon: PlayCircle,
                  label: "Recordings",
                  desc: "Save & replay classes",
                },
                {
                  icon: Users,
                  label: "100 Students",
                  desc: "Real-time classroom",
                },
                {
                  icon: BookOpen,
                  label: "Multi-subject",
                  desc: "Math, Science & more",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={18} className="text-blue-300" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{label}</p>
                    <p className="text-white/50 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Login card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl header-navy flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">T</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome Back
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Sign in to access your classroom
                </p>
              </div>

              <Button
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="auth.primary_button"
                className="w-full h-12 bg-navy-700 hover:bg-navy-800 text-white font-semibold text-base rounded-xl"
                style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Sign in with Internet Identity"
                )}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Secure, decentralized authentication — no password needed.
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500">
                  New here? You'll set up your profile after signing in.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
