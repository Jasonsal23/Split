import { sortGoalsByRaceDate } from "@/lib/goals";
import type { DistanceUnit } from "@/lib/units";
import type { Goal } from "@/lib/types";
import GoalCard from "./goal-card";
import AddGoalForm from "./add-goal-form";

export default function GoalsSection({
  goals,
  units,
  accentBorderClass,
}: {
  goals: Goal[];
  units: DistanceUnit;
  accentBorderClass?: string;
}) {
  const sorted = sortGoalsByRaceDate(goals);

  return (
    <div className="space-y-3">
      {sorted.length > 1 && (
        <p className="text-xs text-zinc-500">
          Training always targets your soonest race. The coach knows about
          the rest and plans the transition after each one.
        </p>
      )}
      {sorted.map((goal, i) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          isPrimary={i === 0}
          accentBorderClass={accentBorderClass}
          units={units}
        />
      ))}
      <AddGoalForm units={units} />
    </div>
  );
}
