import { backendFetch, readBackendJson } from "@/lib/api-server";
import {
  isBoundedString,
  isPlainRecord,
  readSameOriginJsonWithLimit,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 4 * 1024;
const BILLING_CYCLES = new Set(["MONTHLY", "YEARLY"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validBillingInfo(value: unknown) {
  if (value === undefined) return true;
  if (!isPlainRecord(value)) return false;
  return (
    isBoundedString(value.name, 2, 200) &&
    isBoundedString(value.email, 3, 254) &&
    EMAIL_PATTERN.test(value.email) &&
    isBoundedString(value.cpfCnpj, 11, 14) &&
    /^\d+$/.test(value.cpfCnpj) &&
    isBoundedString(value.mobilePhone, 10, 15) &&
    /^\d+$/.test(value.mobilePhone) &&
    (value.postalCode === undefined ||
      (isBoundedString(value.postalCode, 8, 8) &&
        /^\d+$/.test(value.postalCode))) &&
    (value.addressNumber === undefined ||
      isBoundedString(value.addressNumber, 1, 20))
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await readSameOriginJsonWithLimit(request, MAX_BODY_BYTES);
    if (
      !isPlainRecord(body) ||
      !isBoundedString(body.token, 1, 2048) ||
      typeof body.billingCycle !== "string" ||
      !BILLING_CYCLES.has(body.billingCycle) ||
      !validBillingInfo(body.billingInfo)
    ) {
      return NextResponse.json(
        { message: "Payload inválido" },
        { status: 400 },
      );
    }

    const safePayload = {
      token: body.token,
      billingCycle: body.billingCycle,
      ...(isPlainRecord(body.billingInfo)
        ? {
            billingInfo: {
              name: (body.billingInfo.name as string).trim(),
              email: (body.billingInfo.email as string).trim(),
              cpfCnpj: body.billingInfo.cpfCnpj,
              mobilePhone: body.billingInfo.mobilePhone,
              ...(typeof body.billingInfo.postalCode === "string"
                ? { postalCode: body.billingInfo.postalCode }
                : {}),
              ...(typeof body.billingInfo.addressNumber === "string"
                ? { addressNumber: body.billingInfo.addressNumber.trim() }
                : {}),
            },
          }
        : {}),
    };

    const response = await backendFetch("/custom-plan/consume/pix", {
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

    return NextResponse.json(data, {
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
    console.error("[api/checkout/custom/consume-pix]", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
