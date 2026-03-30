import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import LiveRoomPage from "./pages/LiveRoomPage";
import ProfilePage from "./pages/ProfilePage";
import RecordingsPage from "./pages/RecordingsPage";
import SetupPage from "./pages/SetupPage";

export type Page = "dashboard" | "live" | "recordings" | "profile";

export default function App() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);

  const isLoggedIn = !!identity && loginStatus === "success";
  const isInitialLoad = isInitializing || (isLoggedIn && profileLoading);

  function navigateToLive(classId: string) {
    setCurrentClassId(classId);
    setCurrentPage("live");
  }

  function navigateTo(page: Page) {
    if (page !== "live") setCurrentClassId(null);
    setCurrentPage(page);
  }

  useEffect(() => {
    if (currentPage !== "live") setCurrentClassId(null);
  }, [currentPage]);

  if (isInitialLoad) {
    return (
      <div className="min-h-screen header-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <p className="text-white/70 text-sm mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SetupPage />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        currentPage={currentPage}
        onNavigate={navigateTo}
        profile={profile}
      />
      <main className="flex-1">
        {currentPage === "dashboard" && (
          <DashboardPage
            profile={profile}
            onJoinClass={navigateToLive}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === "live" && currentClassId && (
          <LiveRoomPage
            classId={currentClassId}
            isTeacher={profile.isTeacher}
            onLeave={() => navigateTo("dashboard")}
          />
        )}
        {currentPage === "recordings" && <RecordingsPage />}
        {currentPage === "profile" && <ProfilePage profile={profile} />}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
