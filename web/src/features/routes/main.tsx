import { ROUTES } from "@/shared/constants";

const appRoutes = [
  { name: "Home", path: ROUTES.HOME },
  { name: "Museums", path: ROUTES.MUSEUMS },
  { name: "Map", path: ROUTES.MAP },
  { name: "Events", path: ROUTES.EVENTS },
  { name: "Routes", path: ROUTES.ROUTES },
  { name: "Admin", path: ROUTES.ADMIN },
  { name: "Authentication", path: ROUTES.AUTH },
];

const Main = () => (
  <main className="flex min-h-full items-center justify-center p-6">
    <div className="w-full max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Routes</h1>
      <p className="text-sm text-muted-foreground">
        City paths for places you want to visit.
      </p>
      <div className="rounded-lg border bg-background text-left">
        {appRoutes.map((route) => (
          <div
            key={route.path}
            className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
          >
            <span className="font-medium">{route.name}</span>
            <span className="text-sm text-muted-foreground">{route.path}</span>
          </div>
        ))}
      </div>
    </div>
  </main>
);

export default Main;
