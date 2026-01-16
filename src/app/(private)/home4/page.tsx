"use client";
import { KPICards } from "./components/kpi-cards";
import { LastRecordingsSlider } from "./components/last-recordings-slider";
import { MeetScheduleTable } from "./components/meet-schedule-table";
import { RecentRemindersCard } from "./components/recent-reminders-card";
import { UsageChart } from "./components/usage-chart";

export default function Home() {
  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-2">
      <KPICards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid h-full grid-cols-1 flex-col gap-6 lg:col-span-2 lg:grid-cols-3">
          <div className="col-span-2">
            <UsageChart />
          </div>
          <div className="col-span-1">
            <MeetScheduleTable />
          </div>
        </div>
        <div className="col-span-1 grid grid-cols-1 gap-6 lg:col-span-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LastRecordingsSlider />
          </div>
          <div className="lg:col-span-1">
            <RecentRemindersCard />
          </div>
        </div>
      </div>
    </div>
  );
}
