"use client";

import { Check, Copy, Loader2, QrCode } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { maskCpf, maskPhone } from "@/utils/masks";

/**
 * Contratação logo depois do cadastro.
 *
 * Conta recém-criada não tem sessão nesta API — sem acesso liberado não há
 * token — então a contratação é feita com o e-mail e a senha que a pessoa
 * acabou de digitar, conferidos no Hub a cada chamada. É por isso que esta
 * tela recebe as credenciais em memória em vez de cookie.
 *
 * CPF e telefone são pedidos AQUI, e não no cadastro: só quem vai pagar
 * precisa deles, e é o gateway que exige.
 */
type Preco = {
  id: string;
  amountCents: number;
  currency: string;
  frequency: string;
  paymentMethod: string;
};

type Plano = {
  id: string;
  name: string;
  description: string | null;
  dailyRecordSeconds: number | null;
  prices: Preco[];
};

type Pagamento = {
  pixCopyPaste?: string | null;
  pixQrCodeBase64?: string | null;
  expiresAt?: string | null;
};

const dinheiro = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const periodo = (frequency: string) =>
  ({ MONTHLY: "por mês", QUARTERLY: "por trimestre", YEARLY: "por ano" })[
    frequency
  ] ?? frequency.toLowerCase();

export default function CheckoutStep({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const router = useRouter();
  const [planos, setPlanos] = useState<Plano[] | null>(null);
  const [precoId, setPrecoId] = useState<string | null>(null);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [liberado, setLiberado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ativo = true;
    fetch("/api-backend/hub/checkout/plans")
      .then((resposta) => (resposta.ok ? resposta.json() : []))
      .then((lista: Plano[]) => {
        if (!ativo) return;
        const disponiveis = lista.filter((plano) =>
          plano.prices?.some((preco) => preco.paymentMethod === "PIX"),
        );
        setPlanos(disponiveis);
        const primeiro = disponiveis[0]?.prices.find(
          (preco) => preco.paymentMethod === "PIX",
        );
        if (primeiro) setPrecoId(primeiro.id);
      })
      .catch(() => {
        if (ativo) setPlanos([]);
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Enquanto o PIX não compensa, a tela pergunta ao Hub de tempos em tempos.
  // O acesso é liberado pelo webhook do gateway, não por esta consulta.
  const acompanhar = useCallback(
    async (id: string) => {
      try {
        const resposta = await fetch("/api-backend/auth/hub/checkout/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, checkoutId: id }),
        });
        if (!resposta.ok) return;
        const dados = await resposta.json();
        if (
          dados?.accessStatus === "ACTIVE" ||
          dados?.checkout?.status === "PAID"
        ) {
          setLiberado(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* Rede instável não precisa virar erro na tela: a próxima tentativa resolve. */
      }
    },
    [email, password],
  );

  useEffect(() => {
    if (!checkoutId || liberado) return;
    pollRef.current = setInterval(() => void acompanhar(checkoutId), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkoutId, liberado, acompanhar]);

  const contratar = async () => {
    if (!precoId || enviando) return;
    const documento = cpf.replace(/\D/g, "");
    if (documento.length !== 11 && documento.length !== 14) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um telefone com DDD.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch("/api-backend/auth/hub/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          priceId: precoId,
          cpf,
          mobilePhone: telefone,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        if (dados?.code === "ACCESS_ALREADY_ACTIVE") {
          toast.success("Sua conta já está liberada. Faça login.");
          router.push("/login");
          return;
        }
        toast.error(
          dados?.message || "Não foi possível iniciar a contratação.",
        );
        return;
      }
      setCheckoutId(dados.checkout?.id ?? null);
      setPagamento(dados.checkout?.payment ?? null);
    } catch {
      toast.error("Sem conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const copiar = async () => {
    if (!pagamento?.pixCopyPaste) return;
    await navigator.clipboard.writeText(pagamento.pixCopyPaste);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  if (liberado) {
    return (
      <div
        className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-5 text-left"
        role="status"
      >
        <div className="flex items-center gap-2">
          <Check className="text-green-600" size={22} aria-hidden />
          <h2 className="text-base font-semibold text-green-900">
            Pagamento confirmado.
          </h2>
        </div>
        <p className="text-sm text-green-900">
          Seu acesso foi liberado. Entre com o e-mail e a senha que você acabou
          de criar.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  if (pagamento) {
    return (
      <div
        className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-left"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <QrCode className="text-blue-500" size={22} aria-hidden />
          <h2 className="text-base font-semibold text-blue-900">
            Pague com PIX para liberar o acesso.
          </h2>
        </div>
        {pagamento.pixQrCodeBase64 ? (
          <Image
            src={`data:image/png;base64,${pagamento.pixQrCodeBase64}`}
            alt="QR Code do PIX"
            width={220}
            height={220}
            unoptimized
            className="mx-auto rounded-lg bg-white p-2"
          />
        ) : null}
        {pagamento.pixCopyPaste ? (
          <button
            type="button"
            onClick={copiar}
            className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? "Código copiado" : "Copiar código PIX"}
          </button>
        ) : null}
        <p className="text-sm text-blue-900">
          Assim que o pagamento for compensado, o acesso é liberado
          automaticamente — esta tela avisa você. Pode levar alguns instantes.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm font-medium text-blue-700 underline"
        >
          Prefiro entrar depois
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Conta criada. Escolha seu plano.
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          O acesso é liberado assim que o pagamento for confirmado.
        </p>
      </div>

      {planos === null ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="animate-spin" size={16} /> Carregando planos…
        </div>
      ) : planos.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nenhum plano disponível para contratação online no momento. Sua conta
          já está criada — fale com a equipe Health Voice para liberar o acesso.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {planos.map((plano) =>
            plano.prices
              .filter((preco) => preco.paymentMethod === "PIX")
              .map((preco) => (
                <label
                  key={preco.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                    precoId === preco.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {plano.name}
                    </span>
                    {plano.dailyRecordSeconds ? (
                      <span className="text-xs text-gray-500">
                        {Math.round(plano.dailyRecordSeconds / 60)} minutos de
                        gravação por dia
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {dinheiro(preco.amountCents)}{" "}
                      <span className="font-normal text-gray-500">
                        {periodo(preco.frequency)}
                      </span>
                    </span>
                    <input
                      type="radio"
                      name="preco"
                      value={preco.id}
                      checked={precoId === preco.id}
                      onChange={() => setPrecoId(preco.id)}
                      className="size-4 accent-blue-500"
                    />
                  </span>
                </label>
              )),
          )}
        </div>
      )}

      {planos && planos.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-700">
                CPF ou CNPJ
              </span>
              <input
                value={maskCpf(cpf)}
                onChange={(evento) => setCpf(evento.target.value)}
                inputMode="numeric"
                placeholder="000.000.000-00"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-700">
                Telefone com DDD
              </span>
              <input
                value={maskPhone(telefone)}
                onChange={(evento) => setTelefone(evento.target.value)}
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <p className="text-xs text-gray-500">
              Exigidos pelo meio de pagamento para emitir a cobrança no seu
              nome.
            </p>
          </div>
          <button
            type="button"
            onClick={contratar}
            disabled={enviando || !precoId}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {enviando ? <Loader2 className="animate-spin" size={16} /> : null}
            {enviando ? "Gerando pagamento…" : "Gerar PIX"}
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="text-sm font-medium text-gray-500 underline"
      >
        Contratar depois
      </button>
    </div>
  );
}
