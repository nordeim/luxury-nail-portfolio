import { PageShell } from "@/components/chrome";
import { HeadManager } from "@/components/head-manager";
import { matchPath, RouterProvider, useRouter } from "@/lib/router";
import { StoreProvider } from "@/lib/store";
import { HomePage } from "@/pages/home";
import { NotFoundPage, ProductPage, ProductsPage } from "@/pages/shop";
import { CartPage, CheckoutPage, OrderSuccessPage } from "@/pages/checkout-flow";
import {
  AccountOrderPage,
  AccountPage,
  LoginPage,
  RegisterPage,
  TrackOrderPage,
} from "@/pages/account-pages";
import {
  AboutPage,
  ContactPage,
  CookiePage,
  DisclaimerPage,
  PrivacyPage,
  RefundPage,
  TermsPage,
} from "@/pages/content-pages";
import {
  AdminAnalytics,
  AdminCarousel,
  AdminCategories,
  AdminDashboard,
  AdminOrderDetail,
  AdminOrders,
  AdminProducts,
  AdminSettings,
} from "@/pages/admin-pages";

function Routes() {
  const { path } = useRouter();
  const match = matchPath(path);

  switch (match.name) {
    case "home":
      return <HomePage />;
    case "products":
      return <ProductsPage />;
    case "product":
      return <ProductPage slug={match.params.slug ?? ""} />;
    case "cart":
      return <CartPage />;
    case "checkout":
      return <CheckoutPage />;
    case "order-success":
      return <OrderSuccessPage />;
    case "account":
      return <AccountPage />;
    case "account-order":
      return <AccountOrderPage id={match.params.id ?? ""} />;
    case "login":
      return <LoginPage />;
    case "register":
      return <RegisterPage />;
    case "about":
      return <AboutPage />;
    case "contact":
      return <ContactPage />;
    case "track-order":
      return <TrackOrderPage />;
    case "privacy-policy":
      return <PrivacyPage />;
    case "terms-of-service":
      return <TermsPage />;
    case "refund-policy":
      return <RefundPage />;
    case "cookie-policy":
      return <CookiePage />;
    case "disclaimer":
      return <DisclaimerPage />;
    case "admin-dashboard":
      return <AdminDashboard />;
    case "admin-products":
      return <AdminProducts />;
    case "admin-orders":
      return <AdminOrders />;
    case "admin-order":
      return <AdminOrderDetail id={match.params.id ?? ""} />;
    case "admin-analytics":
      return <AdminAnalytics />;
    case "admin-categories":
      return <AdminCategories />;
    case "admin-carousel":
      return <AdminCarousel />;
    case "admin-settings":
      return <AdminSettings />;
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
