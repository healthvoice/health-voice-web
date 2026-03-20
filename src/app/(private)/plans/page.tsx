"use client";

import { useApiContext } from "@/context/ApiContext";
import { useSession } from "@/context/auth";
import { useActionTracking } from "@/hooks/useActionTracking";
import { useButtonTracking } from "@/hooks/useButtonTracking";
import { usePageView } from "@/hooks/usePageView";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckoutFooter } from "./components/checkout-footer";
import { CheckoutSection } from "./components/checkout-section";
import { PlansPageLayout } from "./components/plans-page-layout";
import { PlansSection } from "./components/plans-section";
import { SuccessView } from "./components/sub-components";
import type { BillingCycle, PaymentMethod, Plan, ViewState } from "./components/types";
import {
  fmtBRL,
  getPlanCreditPrice,
  getPlanPixPrice,
  onlyDigits,
  parseExpiry,
} from "./components/utils";

export default function PlansPage() {
  const { GetAPI, PostAPI, PutAPI } = useApiContext();
  const { profile, setProfile, isTrial, handleGetAvailableRecording } =
    useSession();
  const router = useRouter();
  const trackAction = useActionTracking();

  // ── Tracking de visualização de página
  usePageView("plans-page");
  
  // ── Tracking de botões (incluindo "Fale conosco")
  useButtonTracking();

  // ── View / navigation state
  const [viewState, setViewState] = useState<ViewState>("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // ── Refs para tracking de abandono
  const hasTrackedAbandonment = useRef(false);
  const checkoutStartTime = useRef<number | null>(null);

  // ── Payment method (PIX como padrão)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");

  // ── PIX state
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPayload, setPixPayload] = useState<string>("");
  const [pixEncodedImage, setPixEncodedImage] = useState<string | null>(null);
  const [pixSignatureId, setPixSignatureId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Form fields
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [house, setHouse] = useState("");
  const [holder, setHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [exp, setExp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");

  // ── Loading / coupon state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Fetch plans
  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await GetAPI("/signature-plan/channel/WEB", true);
      if (res.status === 200 && res.body?.plans) {
        const list = res.body.plans as Plan[];
        setPlans(list);
        if (list.length > 0)
          setSelectedPlan(list[Math.min(1, list.length - 1)].id);
      }
    } catch {
      console.error("Erro ao buscar planos");
    } finally {
      setLoadingPlans(false);
    }
  }, [GetAPI]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Tracking: CHECKOUT_OPENED quando acessa a página
  useEffect(() => {
    trackAction({
      actionType: "CHECKOUT_OPENED",
      metadata: {},
    });
  }, [trackAction]);

  // ── Pre-fill form from profile
  useEffect(() => {
    if (profile) {
      if (!cpf) setCpf(profile.cpfCnpj ?? "");
      if (!cep) setCep(profile.postalCode ?? "");
      if (!address) setAddress(profile.address ?? "");
      if (!house) setHouse(profile.addressNumber ?? "");
      if (!holder) setHolder(profile.name ?? "");
      if (!email) setEmail(profile.email ?? "");
      if (!phone) setPhone(profile.mobilePhone ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // ── CEP auto-fill
  useEffect(() => {
    const cleaned = onlyDigits(cep);
    if (cleaned.length === 8) {
      fetch(`https://brasilapi.com.br/api/cep/v2/${cleaned}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.cep) {
            setAddress(
              [data.street, data.neighborhood, data.city]
                .filter(Boolean)
                .join(", ") + (data.state ? ` - ${data.state}` : ""),
            );
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  // ── Tracking de abandono (beforeunload, visibilitychange)
  useEffect(() => {
    if (viewState !== "checkout") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasTrackedAbandonment.current) {
        hasTrackedAbandonment.current = true;
        const timeSpent = checkoutStartTime.current
          ? Math.floor((Date.now() - checkoutStartTime.current) / 1000)
          : 0;
        
        // Usar sendBeacon para garantir que o tracking seja enviado mesmo ao fechar a aba
        trackAction({
          actionType: "CHECKOUT_FORM_ABANDONED",
          metadata: {
            reason: "page_unload",
            planId: selectedPlan,
            billingCycle,
            paymentMethod,
            timeSpent,
          },
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !hasTrackedAbandonment.current) {
        // Usuário mudou de aba - não rastrear como abandono ainda
        // Mas podemos rastrear se ficar muito tempo
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [viewState, selectedPlan, billingCycle, paymentMethod, trackAction]);

  // ── PIX polling
  useEffect(() => {
    if (!pixGenerated || !pixSignatureId || isFree) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkStatus = async () => {
      try {
        const res = await GetAPI(`/signature/${pixSignatureId}/status`, true);
        if (!mounted) return;
        if ([200, 201].includes(res.status) && res.body?.isPaid) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          await handleGetAvailableRecording();
          setViewState("success");
          
          // ── Tracking: CHECKOUT_PAYMENT_SUCCESS (PIX)
          trackAction({
            actionType: "CHECKOUT_PAYMENT_SUCCESS",
            metadata: {
              planId: selectedPlan,
              billingCycle,
              paymentMethod: "pix",
              amount: finalPrice,
              couponCode: coupon.trim() || undefined,
            },
          });
          return;
        }
      } catch {
        /* continua tentando */
      }
    };

    checkStatus();
    pollingIntervalRef.current = setInterval(checkStatus, 5000);

    timeoutId = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 900000);

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixGenerated, pixSignatureId]);

  // ── Computed
  const selectedPlanData = plans.find((p) => p.id === selectedPlan) ?? null;

  const basePrice = selectedPlanData
    ? paymentMethod === "card"
      ? getPlanCreditPrice(selectedPlanData, billingCycle)
      : getPlanPixPrice(selectedPlanData, billingCycle)
    : 0;

  const discountedPrice = basePrice * (1 - discountPercent / 100);
  const isFree = discountPercent === 100;
  const finalPrice = isFree
    ? 0
    : discountPercent > 0
      ? discountedPrice
      : basePrice;

  const canSubmit = useMemo(() => {
    if (!selectedPlan) return false;
    const cpfOk = onlyDigits(cpf).length >= 11;
    const holderOk = holder.trim().length >= 3;
    const emailOk = email.trim().length > 3 && email.includes("@");
    const phoneOk = onlyDigits(phone).length >= 10;
    const cepOk = onlyDigits(cep).length >= 8;
    const addressOk = address.trim().length > 0;
    const houseOk = house.trim().length > 0;
    const addressSectionOk = cepOk && addressOk && houseOk;

    if (isFree) return cpfOk && holderOk && emailOk && phoneOk;
    if (paymentMethod === "pix")
      return cpfOk && holderOk && emailOk && phoneOk && addressSectionOk;

    const cardOk = onlyDigits(cardNumber).length >= 12;
    const cvvOk = onlyDigits(cvv).length >= 3;
    const expOk = !!parseExpiry(exp);
    return (
      cpfOk &&
      holderOk &&
      emailOk &&
      phoneOk &&
      addressSectionOk &&
      cardOk &&
      cvvOk &&
      expOk
    );
  }, [
    cpf,
    holder,
    email,
    phone,
    cep,
    address,
    house,
    cardNumber,
    cvv,
    exp,
    isFree,
    selectedPlan,
    paymentMethod,
  ]);

  // ── Helpers
  async function updateProfileFromForm(): Promise<boolean> {
    const payload: Record<string, string> = {
      name: holder,
      email: email.trim(),
      cpfCnpj: onlyDigits(cpf),
      mobilePhone: onlyDigits(phone),
    };
    if (!isFree) {
      payload.postalCode = onlyDigits(cep);
      payload.address = address.trim();
      payload.addressNumber = house.trim();
    }
    const result = await PutAPI("/user", payload, true);
    if (result.status === 200 && profile) {
      setProfile({
        ...profile,
        name: payload.name,
        email: payload.email,
        cpfCnpj: payload.cpfCnpj ?? null,
        mobilePhone: payload.mobilePhone ?? null,
        postalCode: payload.postalCode ?? null,
        address: payload.address ?? null,
        addressNumber: payload.addressNumber ?? null,
      });
      return true;
    }
    return false;
  }

  async function handleCard() {
    if (!selectedPlan) throw new Error("Plano não selecionado.");
    const finalCoupon = coupon.trim();

    if (isFree) {
      const body: Record<string, unknown> = { billingCycle };
      if (finalCoupon) body.code = finalCoupon;
      const resp = await PostAPI(`/signature/pix/${selectedPlan}`, body, true);
      if ([200, 201].includes(resp.status)) {
        await handleGetAvailableRecording();
        setViewState("success");
        
        // ── Tracking: CHECKOUT_PAYMENT_SUCCESS (plano gratuito)
        trackAction({
          actionType: "CHECKOUT_PAYMENT_SUCCESS",
          metadata: {
            planId: selectedPlan,
            billingCycle,
            paymentMethod: "free",
            amount: 0,
            couponCode: finalCoupon || undefined,
          },
        });
      }
      return resp;
    }

    const expParsed = parseExpiry(exp);
    if (!expParsed) throw new Error("Data de expiração inválida.");

    const body = {
      planId: selectedPlan,
      billingCycle,
      code: finalCoupon || undefined,
      creditCard: {
        holderName: holder.toUpperCase(),
        number: onlyDigits(cardNumber),
        expiryMonth: expParsed.month,
        expiryYear: expParsed.year,
        ccv: onlyDigits(cvv),
      },
      creditCardHolderInfo: {
        name: holder,
        email: email.trim(),
        cpfCnpj: onlyDigits(cpf),
        postalCode: onlyDigits(cep),
        addressNumber: house.trim(),
        phone: onlyDigits(phone),
      },
      billingInfo: {
        name: holder,
        email: email.trim(),
        cpfCnpj: onlyDigits(cpf),
        mobilePhone: onlyDigits(phone),
        postalCode: onlyDigits(cep),
        address: address.trim(),
        addressNumber: house.trim(),
      },
    };

    const resp = await PostAPI("/signature/credit/new", body, true);
    if ([200, 201].includes(resp.status)) {
      await handleGetAvailableRecording();
      setViewState("success");
      
      // ── Tracking: CHECKOUT_PAYMENT_SUCCESS (cartão)
      trackAction({
        actionType: "CHECKOUT_PAYMENT_SUCCESS",
        metadata: {
          planId: selectedPlan,
          billingCycle,
          paymentMethod: "card",
          amount: finalPrice,
          couponCode: finalCoupon || undefined,
        },
      });
    } else {
      // ── Tracking: CHECKOUT_PAYMENT_FAILED
      trackAction({
        actionType: "CHECKOUT_PAYMENT_FAILED",
        metadata: {
          planId: selectedPlan,
          billingCycle,
          paymentMethod: "card",
          amount: finalPrice,
          error: resp.body?.message || "Erro desconhecido",
        },
      });
    }
    return resp;
  }

  async function handleGeneratePix(): Promise<{ status: number; body?: any }> {
    if (!selectedPlan) return { status: 400 };
    const finalCoupon = coupon.trim();
    const body = {
      billingCycle,
      code: finalCoupon || undefined,
      billingInfo: {
        name: holder,
        email: email.trim(),
        cpfCnpj: onlyDigits(cpf),
        mobilePhone: onlyDigits(phone),
        postalCode: onlyDigits(cep),
        address: address.trim(),
        addressNumber: house.trim(),
      },
    };
    const resp = await PostAPI(`/signature/pix/${selectedPlan}`, body, true);
    if ([200, 201].includes(resp.status) && resp.body?.payment) {
      setPixPayload(resp.body.payment.payload || "");
      setPixEncodedImage(resp.body.payment.encodedImage || null);
      setPixSignatureId(resp.body.signatureId || null);
      setPixGenerated(true);
      
      // ── Tracking: CHECKOUT_PIX_GENERATED
      trackAction({
        actionType: "CHECKOUT_PIX_GENERATED",
        metadata: {
          planId: selectedPlan,
          billingCycle,
          amount: finalPrice,
          couponCode: finalCoupon || undefined,
        },
      });
    }
    return resp;
  }

  async function onSubmit() {
    if (!canSubmit) {
      toast.error(
        paymentMethod === "pix" || isFree
          ? "Verifique seus dados pessoais."
          : "Verifique os dados do cartão e endereço.",
      );
      return;
    }

    setSubmitLoading(true);
    try {
      await updateProfileFromForm();

      // ── Tracking: CHECKOUT_PAYMENT_ATTEMPTED
      trackAction({
        actionType: "CHECKOUT_PAYMENT_ATTEMPTED",
        metadata: {
          planId: selectedPlan,
          billingCycle,
          paymentMethod,
          amount: finalPrice,
          couponCode: coupon.trim() || undefined,
        },
      });

      if (paymentMethod === "pix" && !isFree) {
        const resp = await handleGeneratePix();
        if (![200, 201].includes(resp.status)) {
          const msg =
            resp.body?.message ||
            resp.body?.errors?.[0]?.description ||
            "Não foi possível gerar o PIX. Tente novamente.";
          toast.error(msg);
          
          // ── Tracking: CHECKOUT_PAYMENT_FAILED
          trackAction({
            actionType: "CHECKOUT_PAYMENT_FAILED",
            metadata: {
              planId: selectedPlan,
              billingCycle,
              paymentMethod: "pix",
              amount: finalPrice,
              error: msg,
            },
          });
        }
        return;
      }

      const resp = await handleCard();
      if (resp && ![200, 201].includes(resp.status)) {
        const msg =
          resp.body?.message ||
          resp.body?.errors?.[0]?.description ||
          "Não foi possível processar o pagamento.";
        toast.error(msg);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleCopyPixCode() {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
      
      // ── Tracking: CHECKOUT_PIX_COPIED
      trackAction({
        actionType: "CHECKOUT_PIX_COPIED",
        metadata: {
          planId: selectedPlan,
          billingCycle,
        },
      });
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function handleCheckCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setIsValidatingCoupon(true);
    try {
      const resp = await GetAPI(`/coupon/${code}`, false);
      if (resp.status === 200 && resp.body?.discount !== undefined) {
        const discount = Number(resp.body.discount);
        setDiscountPercent(discount);
        toast.success(
          discount === 100
            ? "100% de desconto concedido!"
            : `${discount}% de desconto concedido!`,
        );
        
        // ── Tracking: CHECKOUT_COUPON_APPLIED
        trackAction({
          actionType: "CHECKOUT_COUPON_APPLIED",
          metadata: {
            couponCode: code,
            discountPercent: discount,
            planId: selectedPlan,
            billingCycle,
          },
        });
      } else {
        setDiscountPercent(0);
        toast.error(
          String(resp.body?.message || resp.body || "Cupom não encontrado."),
        );
        
        // ── Tracking: CHECKOUT_COUPON_FAILED
        trackAction({
          actionType: "CHECKOUT_COUPON_FAILED",
          metadata: {
            couponCode: code,
            planId: selectedPlan,
            billingCycle,
          },
        });
      }
    } catch {
      setDiscountPercent(0);
      toast.error("Erro ao validar cupom. Tente novamente.");
      
      // ── Tracking: CHECKOUT_COUPON_FAILED
      trackAction({
        actionType: "CHECKOUT_COUPON_FAILED",
        metadata: {
          couponCode: code,
          planId: selectedPlan,
          billingCycle,
        },
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleChangePaymentMethod(m: PaymentMethod) {
    setPaymentMethod(m);
    setPixGenerated(false);
    setPixCopied(false);
    setPixPayload("");
    setPixEncodedImage(null);
    setPixSignatureId(null);
    
    // ── Tracking: CHECKOUT_PAYMENT_TAB_CHANGED
    trackAction({
      actionType: "CHECKOUT_PAYMENT_TAB_CHANGED",
      metadata: {
        paymentMethod: m,
        planId: selectedPlan,
        billingCycle,
      },
    });
  }

  function handleBack() {
    if (viewState === "success") return;
    
    // ── Tracking: CHECKOUT_FORM_ABANDONED quando volta
    if (viewState === "checkout" && !hasTrackedAbandonment.current) {
      hasTrackedAbandonment.current = true;
      const timeSpent = checkoutStartTime.current
        ? Math.floor((Date.now() - checkoutStartTime.current) / 1000)
        : 0;
      trackAction({
        actionType: "CHECKOUT_FORM_ABANDONED",
        metadata: {
          reason: "back_button",
          planId: selectedPlan,
          billingCycle,
          paymentMethod,
          timeSpent,
        },
      });
    }
    
    if (pixGenerated) {
      setPixGenerated(false);
    } else if (viewState === "checkout") {
      setViewState("plans");
    } else {
      router.push("/");
    }
  }

  const isCheckout = viewState === "checkout";
  const isSuccess = viewState === "success";

  // ── Price label helpers
  const priceLabel = () => {
    if (isFree) return "";
    if (paymentMethod === "card" && billingCycle === "YEARLY")
      return "Cobrança em 12x (anual)";
    if (paymentMethod === "card") return "Cobrança mensal";
    return billingCycle === "YEARLY"
      ? "Valor total anual via PIX"
      : "Pagamento via PIX";
  };

  const submitLabel = () => {
    if (submitLoading) return "Processando...";
    if (isFree) return "Confirmar Inscrição Gratuita";
    if (paymentMethod === "pix") return "Gerar PIX";
    return "Finalizar Pagamento";
  };

  return (
    <PlansPageLayout
      viewState={viewState}
      isTrial={isTrial}
      selectedPlan={selectedPlanData}
      billingCycle={billingCycle}
      paymentMethod={paymentMethod}
      discountPercent={discountPercent}
      finalPrice={finalPrice}
      isFree={isFree}
      onBack={handleBack}
      submitLoading={submitLoading}
    >
      <AnimatePresence mode="wait">
        {/* ═══ PLANS ═══ */}
        {viewState === "plans" && (
          <PlansSection
            key="plans"
            plans={plans}
            loadingPlans={loadingPlans}
            billingCycle={billingCycle}
            selectedPlan={selectedPlan}
            onBillingCycleChange={(cycle) => {
              setBillingCycle(cycle);
              // ── Tracking: CHECKOUT_BILLING_CYCLE_CHANGED
              trackAction({
                actionType: "CHECKOUT_BILLING_CYCLE_CHANGED",
                metadata: {
                  billingCycle: cycle,
                  planId: selectedPlan,
                },
              });
            }}
            onPlanSelect={(planId) => {
              setSelectedPlan(planId);
              // ── Tracking: CHECKOUT_PLAN_SELECTED
              const plan = plans.find((p) => p.id === planId);
              trackAction({
                actionType: "CHECKOUT_PLAN_SELECTED",
                metadata: {
                  planId,
                  planName: plan?.name,
                  billingCycle,
                },
              });
            }}
            onContinue={() => {
              if (selectedPlan) {
                // ── Tracking: CHECKOUT_CONTINUED_TO_PAYMENT
                trackAction({
                  actionType: "CHECKOUT_CONTINUED_TO_PAYMENT",
                  metadata: {
                    planId: selectedPlan,
                    billingCycle,
                  },
                });
                checkoutStartTime.current = Date.now();
                hasTrackedAbandonment.current = false;
                setViewState("checkout");
              }
            }}
          />
        )}

        {/* ═══ CHECKOUT ═══ */}
        {viewState === "checkout" && selectedPlanData && (
          <CheckoutSection
            key="checkout"
            selectedPlan={selectedPlanData}
            billingCycle={billingCycle}
            paymentMethod={paymentMethod}
            isFree={isFree}
            discountPercent={discountPercent}
            finalPrice={finalPrice}
            cpf={cpf}
            holder={holder}
            email={email}
            phone={phone}
            cep={cep}
            address={address}
            house={house}
            cardNumber={cardNumber}
            cvv={cvv}
            exp={exp}
            coupon={coupon}
            pixGenerated={pixGenerated}
            pixCopied={pixCopied}
            pixPayload={pixPayload}
            pixEncodedImage={pixEncodedImage}
            isValidatingCoupon={isValidatingCoupon}
            onPaymentMethodChange={handleChangePaymentMethod}
            onCpfChange={setCpf}
            onCpfBlur={() => {
              if (cpf.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "cpf",
                    hasValue: true,
                  },
                });
              }
            }}
            onHolderChange={setHolder}
            onHolderBlur={() => {
              if (holder.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "holder",
                    hasValue: true,
                  },
                });
              }
            }}
            onEmailChange={setEmail}
            onEmailBlur={() => {
              if (email.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "email",
                    hasValue: true,
                  },
                });
              }
            }}
            onPhoneChange={setPhone}
            onPhoneBlur={() => {
              if (phone.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "phone",
                    hasValue: true,
                  },
                });
              }
            }}
            onCepChange={setCep}
            onCepBlur={() => {
              if (cep.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "cep",
                    hasValue: true,
                  },
                });
              }
            }}
            onAddressChange={setAddress}
            onAddressBlur={() => {
              if (address.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "address",
                    hasValue: true,
                  },
                });
              }
            }}
            onHouseChange={setHouse}
            onHouseBlur={() => {
              if (house.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "house",
                    hasValue: true,
                  },
                });
              }
            }}
            onCardNumberChange={setCardNumber}
            onCardNumberBlur={() => {
              if (cardNumber.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "cardNumber",
                    hasValue: true,
                  },
                });
              }
            }}
            onCvvChange={setCvv}
            onCvvBlur={() => {
              if (cvv.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "cvv",
                    hasValue: true,
                  },
                });
              }
            }}
            onExpChange={setExp}
            onExpBlur={() => {
              if (exp.trim()) {
                trackAction({
                  actionType: "FORM_FIELD_DEBOUNCED",
                  metadata: {
                    field: "exp",
                    hasValue: true,
                  },
                });
              }
            }}
            onCouponChange={setCoupon}
            onCheckCoupon={handleCheckCoupon}
            onCopyPixCode={handleCopyPixCode}
            onAlreadyPaid={() => setViewState("success")}
          />
        )}

        {/* ═══ SUCCESS ═══ */}
        {viewState === "success" && (
          <SuccessView key="success" onGoHome={() => router.push("/")} />
        )}
      </AnimatePresence>

      {/* ═══ Footer fixo (checkout) — portal ═══ */}
      <CheckoutFooter
        show={isCheckout && !(pixGenerated && paymentMethod === "pix")}
        priceLabel={priceLabel()}
        basePrice={basePrice}
        discountPercent={discountPercent}
        finalPrice={finalPrice}
        isFree={isFree}
        billingCycle={billingCycle}
        paymentMethod={paymentMethod}
        submitLoading={submitLoading}
        canSubmit={canSubmit}
        submitLabel={submitLabel()}
        onSubmit={onSubmit}
      />
    </PlansPageLayout>
  );
}
