import { cn } from "@/utils/cn";
import { MessageSquare, PanelLeftClose, Plus, Search } from "lucide-react";

interface ChatSidebarProps {
  onNewChat: () => void;
  onToggle: () => void;
  className?: string;
}

export function ChatSidebar({
  onNewChat,
  onToggle,
  className,
}: ChatSidebarProps) {
  // Mock History Data
  const history = [
    {
      group: "Hoje",
      items: [
        { id: 1, title: "Resumo de Relatório Financeiro", active: true },
        { id: 2, title: "Ideias para Marketing" },
      ],
    },
    {
      group: "Ontem",
      items: [
        { id: 3, title: "Revisão de Contrato" },
        { id: 4, title: "Análise de Dados de Vendas" },
      ],
    },
    {
      group: "7 Dias Anteriores",
      items: [
        { id: 5, title: "Planejamento Semanal" },
        { id: 6, title: "Dúvidas sobre Processos" },
        { id: 7, title: "Tradução de E-mail" },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {/* New Header Row */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-800">Histórico</h2>
        <button
          onClick={onToggle}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Fechar barra lateral"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar histórico..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] hover:shadow-sky-500/30 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Nova Conversa
      </button>

      {/* History List */}
      <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6">
          {history.map((group) => (
            <div key={group.group}>
              <h3 className="mb-2 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                {group.group}
              </h3>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all",
                      item.active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.active
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600",
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4 text-center">
        <p className="min-w-max text-xs text-gray-400">
          Histórico armazenado localmente
        </p>
      </div>
    </div>
  );
}
