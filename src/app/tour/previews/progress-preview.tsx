import ProgressCharts from "@/app/(app)/progress/progress-charts";
import { TOUR_EF_TREND, TOUR_FINISH_SERIES, TOUR_GOAL, TOUR_WEEKLY_MILEAGE } from "@/app/tour/fake-data";

export default function ProgressPreview() {
  return (
    <ProgressCharts
      finishSeries={TOUR_FINISH_SERIES}
      goalTimeSec={TOUR_GOAL.goalTimeSec}
      weeklyMileage={TOUR_WEEKLY_MILEAGE}
      efTrend={TOUR_EF_TREND}
      units="mi"
    />
  );
}
