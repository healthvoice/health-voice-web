import { ScrollToTop } from "../components/scroll-to-top";
import { Transcription } from "../components/transcription";

export default function SelectedAppointment() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Transcription />
      <ScrollToTop />
    </div>
  );
}
