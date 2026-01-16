import { General } from "./components/general";

export default function SelectedAppointment() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalhes do Agendamento
          </h1>
          <p className="text-sm text-gray-500">
            Visualize as informações gerais desta consulta.
          </p>
        </div>
      </div>
      <div>
        <General />
      </div>
    </div>
  );
}
