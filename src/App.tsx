import { useRoute } from "./lib/router";
import { ColonnadeNav, PlinthNav, ToastProvider } from "./components/ui";
import { Home } from "./screens/Home";
import { Circuit } from "./screens/Circuit";
import { Site } from "./screens/Site";
import { lazy, Suspense } from "react";

const MapScreen = lazy(() => import("./screens/MapScreen").then((m) => ({ default: m.MapScreen })));
import { Journal } from "./screens/Journal";
import { Settings } from "./screens/Settings";

export function App() {
  const route = useRoute();
  const key = JSON.stringify(route);
  let screen;
  switch (route.name) {
    case "circuit":
      screen = <Circuit id={route.id} />;
      break;
    case "site":
      screen = <Site id={route.id} />;
      break;
    case "map":
      screen = (
        <Suspense fallback={<p className="pt-10 text-center text-[var(--ink-soft)]">Opening the map…</p>}>
          <MapScreen site={route.site} circuit={route.circuit} />
        </Suspense>
      );
      break;
    case "journal":
      screen = <Journal />;
      break;
    case "settings":
      screen = <Settings />;
      break;
    default:
      screen = <Home />;
  }
  return (
    <ToastProvider>
      <ColonnadeNav route={route} />
      <div className="lg:pl-[254px]">
        <main className="mx-auto w-full max-w-[920px] px-4 pb-[calc(120px+env(safe-area-inset-bottom))] sm:px-6 lg:pb-16">
          <div key={key}>{screen}</div>
        </main>
      </div>
      <PlinthNav route={route} />
    </ToastProvider>
  );
}
