import { PageShell } from "@/components/chrome";
import { HeadManager } from "@/components/head-manager";
import { matchPath, RouterProvider, useRouter } from "@/lib/router";
import { StoreProvider } from "@/lib/store";
import { HomePage } from "@/pages/home";
import { GalleryPage } from "@/pages/gallery";
import { ServicesPage } from "@/pages/services";
import { AboutPage } from "@/pages/about";
import { BookingPage } from "@/pages/booking";
import { LoginPage, RegisterPage, ResetPage } from "@/pages/auth";
import { AccountPage } from "@/pages/account";
import { AdminBookingsPage } from "@/pages/admin";
import { NotFoundPage } from "@/pages/not-found";

function Routes() {
  const { path } = useRouter();
  const match = matchPath(path);

  switch (match.name) {
    case "home":
      return <HomePage />;
    case "gallery":
      return <GalleryPage />;
    case "services":
      return <ServicesPage />;
    case "about":
      return <AboutPage />;
    case "booking":
      return <BookingPage />;
    case "login":
      return <LoginPage />;
    case "register":
      return <RegisterPage />;
    case "reset":
      return <ResetPage />;
    case "account":
      return <AccountPage />;
    case "admin-bookings":
      return <AdminBookingsPage />;
    default:
      return <NotFoundPage />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      {/* Head ownership sits inside the RouterProvider so every route
          change (push/replace/popstate) re-runs the head contract. */}
      <HeadManager />
      <StoreProvider>
        <PageShell>
          <Routes />
        </PageShell>
      </StoreProvider>
    </RouterProvider>
  );
}
