import { backendFetch, readBackendJson } from "@/lib/api-server";
import { setAuthCookies } from "@/lib/auth-cookies";
import {
  isBoundedString,
  isPlainRecord,
  readSameOriginJsonWithLimit,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 8 * 1024;
const BILLING_CYCLES = new Set(["MONTHLY", "YEARLY"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validCardPayload(body: unknown) {
  if (
    !isPlainRecord(body) ||
    !isBoundedString(body.token, 1, 2048) ||
    typeof body.billingCycle !== "string" ||
    !BILLING_CYCLES.has(body.billingCycle) ||
    !isPlainRecord(body.creditCard) ||
    !isPlainRecord(body.creditCardHolderInfo)
  ) {
    return false;
  }

  const card = body.creditCard;
  const holder = body.creditCardHolderInfo;
  return (
    isBoundedString(card.holderName, 2, 200) &&
    isBoundedString(card.number, 13, 19) &&
    /^[\d\s]+$/.test(card.number) &&
    isBoundedString(card.expiryMonth, 2, 2) &&
    /^(0[1-9]|1[0-2])$/.test(card.expiryMonth) &&
    isBoundedString(card.expiryYear, 2, 4) &&
    /^\d{2}(\d{2})?$/.test(card.expiryYear) &&
    isBoundedString(card.ccv, 3, 4) &&
    /^\d+$/.test(card.ccv) &&
    isBoundedString(holder.name, 2, 200) &&
    isBoundedString(holder.email, 3, 254) &&
    EMAIL_PATTERN.test(holder.email) &&
    isBoundedString(holder.cpfCnpj, 11, 14) &&
    /^\d+$/.test(holder.cpfCnpj) &&
    isBoundedString(holder.postalCode, 8, 8) &&
    /^\d+$/.test(holder.postalCode) &&
    isBoundedString(holder.addressNumber, 1, 20) &&
    holder.addressNumber.trim().length > 0 &&
    isBoundedString(holder.phone, 10, 15) &&
    /^\d+$/.test(holder.phone)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await readSameOriginJsonWithLimit(request, MAX_BODY_BYTES);
    if (!validCardPayload(body)) {
      return NextResponse.json(
        { message: "Payload inválido" },
        { status: 400 },
      );
    }

    const typedBody = body as {
      token: string;
      billingCycle: string;
      creditCard: Record<string, string>;
      creditCardHolderInfo: Record<string, string>;
    };
    const safePayload = {
      token: typedBody.token,
      billingCycle: typedBody.billingCycle,
      creditCard: {
        holderName: typedBody.creditCard.holderName.trim(),
        number: typedBody.creditCard.number.replace(/\s/g, ""),
        expiryMonth: typedBody.creditCard.expiryMonth,
        expiryYear: typedBody.creditCard.expiryYear,
        ccv: typedBody.creditCard.ccv,
      },
      creditCardHolderInfo: {
        name: typedBody.creditCardHolderInfo.name.trim(),
        email: typedBody.creditCardHolderInfo.email.trim(),
        cpfCnpj: typedBody.creditCardHolderInfo.cpfCnpj,
        postalCode: typedBody.creditCardHolderInfo.postalCode,
        addressNumber: typedBody.creditCardHolderInfo.addressNumber.trim(),
        phone: typedBody.creditCardHolderInfo.phone,
      },
    };

    const response = await backendFetch("/custom-plan/consume/card", {
      method: "POST",
      body: JSON.stringify(safePayload),
      signal: request.signal,
    });
    const data = await readBackendJson(response);
    if (!isPlainRecord(data)) {
      return NextResponse.json(
        { message: "Resposta inválida da API" },
        { status: 502 },
      );
    }

    if (
      response.ok &&
      isPlainRecord(data.tokens) &&
      isBoundedString(data.tokens.accessToken, 1, 16_384) &&
      isBoundedString(data.tokens.refreshToken, 1, 16_384)
    ) {
      await setAuthCookies(data.tokens.accessToken, data.tokens.refreshToken);
    }

    const safeData = { ...data };
    delete safeData.tokens;
    return NextResponse.json(safeData, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = requestGuardStatus(error);
    if (status) {
      return NextResponse.json(
        { message: requestGuardMessage(error) },
        { status },
      );
    }
    console.error("[api/checkout/custom/consume-card]", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
