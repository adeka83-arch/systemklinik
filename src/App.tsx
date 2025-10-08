import { useState, useEffect, useRef } from "react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Auth } from "./components/Auth";
import { UniformSidebar } from "./components/UniformSidebarFiltered";
import { Dashboard } from "./components/Dashboard";
import {
  CentralizedSecurityProvider,
  clearAllSecuritySessions,
} from "./components/CentralizedSecurityManager";
import { CentralizedPasswordGuard } from "./components/CentralizedPasswordGuard";
import { SuperUserConfigPanel } from "./components/SuperUserConfigPanel";
import { AuthStabilizer } from "./components/AuthStabilizer";
import { SystemConfigurationManager } from "./components/SystemConfigurationManager";

import {
  LazyAttendance,
  LazySalaries,
  LazySittingFees,
  LazyTreatmentSystem,
  LazySales,
  LazyExpenses,
  LazyReports,
  LazyPatients,
  LazyForms,
  LazyProductList,
  LazyProductFieldTrip,
  LazyFieldTripSales,
  LazyStockOpname,
  LazyPromoManager,
  LazyMedicalRecordSummary,
  LazyDoctorStatusManager,
  LazyPasswordGuardSettings,
  LazyBackupManager,
} from "./components/LazyComponentLoader";

import { supabase, serverUrl } from "./utils/supabase/client";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ThemeCustomizerButton } from "./components/ThemeCustomizer";
import { Menu, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { useIsMobile } from "./components/ui/use-mobile";
import clinicLogo from "figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
    position?: string;
    userType?: string;
  };
}

interface ClinicSettings {
  name: string;
  logo: string | null;
  logoPath?: string;
  adminFee?: number;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [clinicSettings, setClinicSettings] =
    useState<ClinicSettings>({
      name: "Falasifah Dental Clinic",
      logo: clinicLogo,
      logoPath: undefined,
      adminFee: 20000,
      address: "Sawangan, Depok City, West Java, Indonesia",
      city: "Depok City",
      province: "West Java",
      country: "Indonesia",
    });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const initRef = useRef(false);

  // Stable auth initialization
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        // Simple session check
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && session?.access_token) {
          console.log(
            "🔐 Found existing session for:",
            session.user.email,
          );
          setUser(session.user as User);
          setAccessToken(session.access_token);
        } else {
          console.log("🔓 No existing session found");
        }

        // Load clinic settings in background
        fetchClinicSettings().catch(() => {});
      } catch (error) {
        console.log("Init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Protected auth state listener - prevent unwanted logouts
  useEffect(() => {
    let signOutTimeout: NodeJS.Timeout | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "🔄 Auth state change:",
        event,
        session?.user?.email,
      );

      // Only handle explicit sign out events with protection against rapid changes
      if (event === "SIGNED_OUT") {
        console.log("👋 User signed out event detected");

        // Clear any existing timeout
        if (signOutTimeout) {
          clearTimeout(signOutTimeout);
        }

        // Add small delay to prevent race conditions
        signOutTimeout = setTimeout(() => {
          console.log("🏃‍♂️ Processing sign out...");
          setUser(null);
          setAccessToken("");
          setActiveTab("dashboard");
        }, 100);
      }

      // Don't interfere with SIGNED_IN events - let manual auth success handle it
    });

    return () => {
      subscription.unsubscribe();
      if (signOutTimeout) {
        clearTimeout(signOutTimeout);
      }
    };
  }, []);

  const fetchClinicSettings = async () => {
    try {
      const response = await fetch(
        `${serverUrl}/clinic-settings`,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setClinicSettings({
            name:
              data.settings.name || "Falasifah Dental Clinic",
            logo: data.settings.logo || clinicLogo,
            logoPath: data.settings.logoPath || undefined,
            adminFee:
              typeof data.settings.adminFee === "number"
                ? data.settings.adminFee
                : 20000,
            address:
              data.settings.address ||
              "Sawangan, Depok City, West Java, Indonesia",
            city: data.settings.city || "Depok City",
            province: data.settings.province || "West Java",
            country: data.settings.country || "Indonesia",
          });
        }
      }
    } catch (error) {
      // Fail silently - use defaults
    }
  };

  // Stable auth success handler
  const handleAuthSuccess = (userData: User) => {
    console.log("✅ Auth success for:", userData.email);
    setUser(userData);

    // Get token from current session with retry
    const getSessionToken = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            console.log("🔑 Token retrieved successfully");
            setAccessToken(session.access_token);
            return;
          }
        } catch (error) {
          console.log(
            `🔄 Token retrieval attempt ${i + 1} failed:`,
            error,
          );
        }

        // Wait before retry
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500),
          );
        }
      }

      console.log(
        "⚠️ Could not retrieve token, but user is logged in",
      );
    };

    getSessionToken();
    toast.success("Login berhasil!");
  };

  const handleLogout = async () => {
    try {
      console.log("🚪 Manual logout initiated");
      clearAllSecuritySessions();
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken("");
      setActiveTab("dashboard");
      setSidebarOpen(false);
      toast.success("Logout berhasil");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleUnexpectedUserLoss = () => {
    console.log(
      "💔 Unexpected user loss detected by AuthStabilizer",
    );
    toast.error(
      "Sesi berakhir tidak terduga. Silakan login kembali.",
    );
    setUser(null);
    setAccessToken("");
    setActiveTab("dashboard");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () =>
      document.removeEventListener("keydown", handleEscape);
  }, [isMobile, sidebarOpen]);

  const handleSettingsUpdate = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await fetchClinicSettings();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.log(
        "Settings update failed, continuing with current settings",
      );
    }
  };

  const renderActiveComponent = () => {
    if (!user || !accessToken) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-3"></div>
            <p className="text-pink-600 text-sm">
              Menunggu autentikasi...
            </p>
          </div>
        </div>
      );
    }

    try {
      switch (activeTab) {
        case "dashboard":
          return (
            <Dashboard
              accessToken={accessToken}
              onNavigate={setActiveTab}
              clinicSettings={clinicSettings}
            />
          );
        case "doctor-status":
          return (
            <CentralizedPasswordGuard pageName="doctor-status">
              <LazyDoctorStatusManager
                accessToken={accessToken}
              />
            </CentralizedPasswordGuard>
          );
        case "attendance":
          return <LazyAttendance accessToken={accessToken} />;
        case "salaries":
          return (
            <CentralizedPasswordGuard pageName="salaries">
              <LazySalaries accessToken={accessToken} />
            </CentralizedPasswordGuard>
          );
        case "sitting-fees":
          return <LazySittingFees accessToken={accessToken} />;
        case "treatments":
          return (
            <LazyTreatmentSystem
              accessToken={accessToken}
              refreshTrigger={refreshTrigger}
              adminFee={clinicSettings.adminFee || 20000}
              clinicSettings={clinicSettings}
              onRefreshNeeded={() =>
                setRefreshTrigger((prev) => prev + 1)
              }
              key={`treatments-${clinicSettings.adminFee}-${refreshTrigger}`}
            />
          );
        case "sales":
          return (
            <LazySales
              accessToken={accessToken}
              clinicSettings={clinicSettings}
            />
          );
        case "expenses":
          return <LazyExpenses accessToken={accessToken} />;
        case "reports":
          return (
            <CentralizedPasswordGuard pageName="reports">
              <LazyReports accessToken={accessToken} />
            </CentralizedPasswordGuard>
          );
        case "patients":
          return <LazyPatients accessToken={accessToken} />;
        case "forms":
          return <LazyForms accessToken={accessToken} />;
        case "products":
          return <LazyProductList accessToken={accessToken} />;
        case "product-field-trip":
          return (
            <LazyProductFieldTrip accessToken={accessToken} />
          );
        case "field-trip-sales":
          return (
            <LazyFieldTripSales
              accessToken={accessToken}
              clinicSettings={clinicSettings}
            />
          );
        case "stock-opname":
          return <LazyStockOpname accessToken={accessToken} />;
        case "promo":
          return (
            <LazyPromoManager
              accessToken={accessToken}
              refreshTrigger={refreshTrigger}
              key={`promo-${refreshTrigger}`}
            />
          );
        case "medical-record-summary":
          return (
            <LazyMedicalRecordSummary
              accessToken={accessToken}
            />
          );
        case "security-settings":
          return (
            <CentralizedPasswordGuard pageName="security-settings">
              <SuperUserConfigPanel />
            </CentralizedPasswordGuard>
          );
        case "system-configuration":
          return (
            <CentralizedPasswordGuard pageName="system-configuration">
              <SystemConfigurationManager
                accessToken={accessToken}
                clinicSettings={clinicSettings}
                onSettingsUpdate={handleSettingsUpdate}
              />
            </CentralizedPasswordGuard>
          );
        case "backup-manager":
          return (
            <CentralizedPasswordGuard pageName="backup-manager">
              <LazyBackupManager accessToken={accessToken} />
            </CentralizedPasswordGuard>
          );

        default:
          return (
            <Dashboard
              accessToken={accessToken}
              onNavigate={setActiveTab}
              clinicSettings={clinicSettings}
            />
          );
      }
    } catch (error) {
      console.error("Error rendering component:", error);
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Terjadi kesalahan
            </p>
            <div className="space-x-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4 relative">
        <AnimatedBackground
          particleCount={20}
          colors={["#fce7f3", "#f3e8ff"]}
          speed={0.1}
          className="opacity-30"
        />
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-600 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-pink-300 opacity-20 mx-auto"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-pink-600 text-lg font-medium animate-pulse-soft">
              Memuat aplikasi...
            </p>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <CentralizedSecurityProvider userId={undefined}>
          <div>
            <Auth
              onAuthSuccess={handleAuthSuccess}
              clinicSettings={clinicSettings}
            />
            <Toaster position="top-right" />
          </div>
        </CentralizedSecurityProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <CentralizedSecurityProvider userId={user.id}>
        {/* Auth Session Stabilizer */}
        <AuthStabilizer
          user={user}
          onUserLost={handleUnexpectedUserLoss}
        />

        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex relative">
          {/* Animated Background */}
          <AnimatedBackground
            particleCount={25}
            colors={["#fce7f3", "#f3e8ff", "#e0f2fe"]}
            speed={0.2}
            className="opacity-20"
          />
          <UniformSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
            clinicSettings={clinicSettings}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            isMobile={isMobile}
          />

          <main className="flex-1 overflow-hidden w-full lg:w-auto">
            <div className="h-full overflow-y-auto">
              {/* Header */}
              <div className="bg-white border-b border-pink-200 px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between min-h-[60px]">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Mobile Menu Button */}
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSidebar}
                        className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 lg:hidden flex-shrink-0"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}

                    {/* Logo with Logout - Hidden on mobile when sidebar button is present */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`p-1 hover:bg-pink-50 rounded-md flex-shrink-0 ${isMobile ? "hidden sm:block" : ""}`}
                          title="Klik untuk logout"
                        >
                          <ImageWithFallback
                            src={clinicSettings.logo}
                            alt="Logo Klinik"
                            className="h-10 lg:h-12 w-auto object-contain"
                            key={`${clinicSettings.logo}-${clinicSettings.logoPath}-${Date.now()}`}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-48"
                      >
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg lg:text-2xl text-pink-800 truncate">
                        {activeTab === "dashboard" &&
                          "Dashboard"}
                        {activeTab === "patients" &&
                          "Manajemen Pasien"}
                        {activeTab === "forms" &&
                          "Formulir Medis"}
                        {activeTab === "doctor-status" &&
                          "Manajemen Karyawan & Dokter"}
                        {activeTab === "products" &&
                          "Daftar Produk"}
                        {activeTab === "product-field-trip" &&
                          "Produk Field Trip"}
                        {activeTab === "field-trip-sales" &&
                          "Penjualan Field Trip"}
                        {activeTab === "stock-opname" &&
                          "Stock Opname"}
                        {activeTab === "promo" &&
                          "Manajemen Promo"}
                        {activeTab ===
                          "medical-record-summary" &&
                          "Rekapan Rekam Medis"}
                        {activeTab === "security-settings" &&
                          "Pengaturan Keamanan"}
                        {activeTab === "system-configuration" &&
                          "Konfigurasi Sistem"}
                        {activeTab === "backup-manager" &&
                          "Backup Database"}
                        {activeTab === "attendance" &&
                          "Data Absensi"}
                        {activeTab === "salaries" &&
                          "Manajemen Gaji"}
                        {activeTab === "sitting-fees" &&
                          "Uang Duduk Dokter"}
                        {activeTab === "treatments" &&
                          "Tindakan"}
                        {activeTab === "sales" &&
                          "Manajemen Penjualan"}
                        {activeTab === "expenses" &&
                          "Pengeluaran Klinik"}
                        {activeTab === "reports" &&
                          "Laporan & Export"}
                      </h1>
                      <p className="text-pink-600 text-xs lg:text-sm hidden sm:block">
                        {clinicSettings.name} -{" "}
                        {new Date().toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* User Info */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-pink-800 truncate">
                        Selamat datang,{" "}
                        {user.user_metadata?.name || user.email}
                      </p>
                      <p className="text-xs text-pink-600 hidden lg:block">
                        {user.user_metadata?.role ||
                          "Administrator"}
                        {user.user_metadata?.position &&
                          ` - ${user.user_metadata.position}`}
                      </p>
                    </div>

                    {/* Avatar */}
                    <div className="h-8 w-8 lg:h-10 lg:w-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600 text-xs lg:text-sm font-medium">
                        {(
                          user.user_metadata?.name || user.email
                        )
                          ?.charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 lg:p-6">
                {renderActiveComponent()}
              </div>
            </div>
          </main>

          <Toaster position="top-right" />

          {/* Theme Customizer Button */}
          <ThemeCustomizerButton
            userId={user?.id}
            accessToken={accessToken}
          />
        </div>
      </CentralizedSecurityProvider>
    </ErrorBoundary>
  );
}