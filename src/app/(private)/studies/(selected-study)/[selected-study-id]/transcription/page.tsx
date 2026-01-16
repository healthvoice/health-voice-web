import { ScrollToTop } from "../components/scroll-to-top";
import { Transcription } from "../components/transcription";

export default function SelectedAppointment() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transcrição</h1>
          <p className="text-sm text-gray-500">
            Visualize a transcrição completa da gravação
          </p>
        </div>
      </div>
      <Transcription />
      <ScrollToTop />
    </div>
  );
}
