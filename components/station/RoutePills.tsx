const COLORS: Record<string, string> = {
  "1": "#ee352e", "2": "#ee352e", "3": "#ee352e", "4": "#00933c", "5": "#00933c", "6": "#00933c", "7": "#b933ad",
  A: "#2850ad", C: "#2850ad", E: "#2850ad", B: "#ff6319", D: "#ff6319", F: "#ff6319", M: "#ff6319", G: "#6cbe45",
  J: "#996633", Z: "#996633", L: "#a7a9ac", N: "#fccc0a", Q: "#fccc0a", R: "#fccc0a", W: "#fccc0a", S: "#6d6e71",
};

export function RoutePills({ routes, compact = false }: { routes: string[]; compact?: boolean }) {
  return <div className="flex flex-wrap gap-1.5" aria-label={`Routes ${routes.join(", ")}`}>{routes.map((route) => <span key={route} className={`${compact ? "h-5 min-w-5 text-[11px]" : "h-7 min-w-7 text-sm"} inline-grid place-items-center rounded-full px-1 font-black text-white shadow-sm`} style={{ backgroundColor: COLORS[route] ?? "#445" }}>{route}</span>)}</div>;
}

