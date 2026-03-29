import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import CoordinatorApplications from "@/components/dashboards/CoordinatorApplications";
import SupervisorDashboard from "@/components/dashboards/SupervisorDashboard";

const Dashboard = () => {
  const { role } = useAuth();

  const renderContent = () => {
    switch (role) {
      case "student":
        return <StudentDashboard />;
      case "coordinator":
      case "admin":
        return <CoordinatorApplications />;
      case "supervisor":
        return <SupervisorDashboard />;
      default:
        return <p>Loading...</p>;
    }
  };

  return <AppLayout>{renderContent()}</AppLayout>;
};

export default Dashboard;
