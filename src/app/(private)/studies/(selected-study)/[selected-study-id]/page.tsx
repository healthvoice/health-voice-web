import { General } from "./components/general";

export default function SelectedStudy() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes</h1>
          <p className="text-sm text-gray-500">
            Visualize os detalhes da gravação
          </p>
        </div>
      </div>
      <General />
    </div>
  );
}
