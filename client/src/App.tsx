import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { GuestRestrictionDialog } from "./components/GuestRestrictionDialog";
import { BottomNavigation } from "./components/BottomNavigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GuestProvider } from "./contexts/GuestContext";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import { Notifications } from "./pages/Notifications";
import Profile from "./pages/profile/Profile";
import Wallet from "./pages/wallet/Wallet";
import Transactions from "./pages/transactions/Transactions";
import Levels from "./pages/levels/Levels";
import Tasks from "./pages/tasks/Tasks";
import Settings from "./pages/settings/Settings";
import Referrals from "./pages/referrals/Referrals";
import Invite from "./pages/referrals/Invite";
import SecurityStatus from "./pages/referrals/SecurityStatus";
import Withdraw from "./pages/wallet/Withdraw";
import KYC from "./pages/profile/KYC";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminTasks } from "./pages/admin/AdminTasks";
import AdminWithdrawals from "./pages/dashboard/AdminWithdrawals";

import { AdminFraud } from "./pages/admin/AdminFraud";
import { AdminFinance } from "./pages/admin/AdminFinance";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminAdLogs } from "./pages/admin/AdminAdLogs";
import { AdminCrashes } from "./pages/admin/AdminCrashes";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />

      {/* User Protected Routes */}
      <Route path={"/dashboard"}>
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/notifications"}>
        {() => (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/profile"}>
        {() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/wallet"}>
        {() => (
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/transactions"}>
        {() => (
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/levels"}>
        {() => (
          <ProtectedRoute>
            <Levels />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/tasks"}>
        {() => (
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/settings"}>
        {() => (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/referrals"}>
        {() => (
          <ProtectedRoute>
            <Referrals />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/invite"}>
        {() => (
          <ProtectedRoute>
            <Invite />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/security"}>
        {() => (
          <ProtectedRoute>
            <SecurityStatus />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/withdraw"}>
        {() => (
          <ProtectedRoute>
            <Withdraw />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/kyc"}>
        {() => (
          <ProtectedRoute>
            <KYC />
          </ProtectedRoute>
        )}
      </Route>

      {/* Admin Protected Routes */}
      <Route path={"/admin"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/users"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/tasks"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminTasks />
          </ProtectedRoute>
        )}
      </Route>

      <Route path={"/admin/withdrawals"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminWithdrawals />
          </ProtectedRoute>
        )}
      </Route>

      <Route path={"/admin/fraud"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminFraud />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/finance"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminFinance />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/settings"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminSettings />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/logs"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminLogs />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/analytics"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminAnalytics />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/ad-logs"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminAdLogs />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin/crashes"}>
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminCrashes />
          </ProtectedRoute>
        )}
      </Route>

      {/* Legal Pages */}
      <Route path={"/about"} component={About} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <TooltipProvider>
      <Toaster />
      <GuestRestrictionDialog />
      <Router />
      <BottomNavigation />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <GuestProvider>
          <AppContent />
        </GuestProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
