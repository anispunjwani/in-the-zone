import type { RedevelopmentScenario } from "@/types/domain";

export function BuildingSchematic({ scenario }: { scenario: RedevelopmentScenario }) {
  const residentialFloors = Math.min(8, Math.max(2, scenario.estimatedStories - 1));
  return (
    <div className="grid grid-cols-[0.7fr_1fr] items-end gap-5 rounded-2xl bg-[#f0f5f4] p-4" aria-label="Schematic comparison of current and potential building scale">
      <div className="text-center">
        <div className="mx-auto h-9 w-4/5 rounded-t-md border border-slate-500 bg-slate-300" />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Today</p>
      </div>
      <div className="text-center">
        <div className="mx-auto flex w-4/5 flex-col-reverse overflow-hidden rounded-t-md border-2 border-[#155f50] transition-all duration-500" style={{ height: `${88 + residentialFloors * 13}px` }}>
          <div className="grid h-8 place-items-center bg-[#f4b83f] text-[10px] font-bold text-[#573b00]">Community / retail</div>
          {Array.from({ length: residentialFloors }).map((_, index) => <div key={index} className="grid flex-1 place-items-center border-b border-[#155f50]/20 bg-[#8ed6c3] text-[9px] font-bold text-[#124b40]">Homes</div>)}
        </div>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#155f50]">Scenario</p>
      </div>
    </div>
  );
}

