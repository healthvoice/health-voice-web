"use client";

import { AIComponent } from "../types/component-types";
import { AllergiesCard } from "./cards/AllergiesCard";
import { BiometricsCard } from "./cards/BiometricsCard";
import { CertificatesCard } from "./cards/CertificatesCard";
import { ChronicConditionsCard } from "./cards/ChronicConditionsCard";
import { ClinicalNotesCard } from "./cards/ClinicalNotesCard";
import { DifferentialDiagnosisCard } from "./cards/DifferentialDiagnosisCard";
import { ExamsCard } from "./cards/ExamsCard";
import { FamilyHistoryCard } from "./cards/FamilyHistoryCard";
import { MainDiagnosisCard } from "./cards/MainDiagnosisCard";
import { MedicalHistoryTimelineCard } from "./cards/MedicalHistoryTimelineCard";
import { MedicationsCard } from "./cards/MedicationsCard";
import { NextAppointmentsCard } from "./cards/NextAppointmentsCard";
import { ObservationsCard } from "./cards/ObservationsCard";
import { OrientationsCard } from "./cards/OrientationsCard";
import { PrescriptionCard } from "./cards/PrescriptionCard";
import { ReferralsCard } from "./cards/ReferralsCard";
import { RiskFactorsCard } from "./cards/RiskFactorsCard";
import { SocialHistoryCard } from "./cards/SocialHistoryCard";
import { SuggestedExamsCard } from "./cards/SuggestedExamsCard";
import { SymptomsCard } from "./cards/SymptomsCard";
import { TreatmentPlanCard } from "./cards/TreatmentPlanCard";

interface ComponentRendererProps {
  component: AIComponent;
}

// Componente que renderiza um único componente baseado no tipo
export function ComponentRenderer({ component }: ComponentRendererProps) {
  console.log('[ComponentRenderer] Rendering component:', component.type);
  console.log('[ComponentRenderer] Component data:', component.data);
  console.log('[ComponentRenderer] Component full:', JSON.stringify(component, null, 2));
  
  // Normalizar dados para garantir que sempre seja um objeto válido
  const normalizedData = component.data && typeof component.data === 'object' 
    ? component.data 
    : {};
  
  // Garantir que component.title existe
  const normalizedTitle = component.title || 'Componente';
  
  // Garantir que component.type existe
  if (!component.type) {
    console.error('[ComponentRenderer] Component missing type:', component);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm font-semibold">
          Componente inválido: tipo não especificado
        </p>
      </div>
    );
  }
  
  try {
    switch (component.type) {
    case "prescription_card":
      return (
        <PrescriptionCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "exams_card":
      return (
        <ExamsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "referrals_card":
      return (
        <ReferralsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "certificates_card":
      return (
        <CertificatesCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "orientations_card":
      return (
        <OrientationsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "clinical_notes_card":
      return (
        <ClinicalNotesCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "next_appointments_card":
      return (
        <NextAppointmentsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "biometrics_card":
      return (
        <BiometricsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "allergies_card":
      return (
        <AllergiesCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "chronic_conditions_card":
      return (
        <ChronicConditionsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "medications_card":
      return (
        <MedicationsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "social_history_card":
      return (
        <SocialHistoryCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "family_history_card":
      return (
        <FamilyHistoryCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "medical_history_timeline_card":
      return (
        <MedicalHistoryTimelineCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "main_diagnosis_card":
      return (
        <MainDiagnosisCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "symptoms_card":
      return (
        <SymptomsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "risk_factors_card":
      return (
        <RiskFactorsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "treatment_plan_card":
      return (
        <TreatmentPlanCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "differential_diagnosis_card":
      return (
        <DifferentialDiagnosisCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "suggested_exams_card":
      return (
        <SuggestedExamsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    case "observations_card":
      return (
        <ObservationsCard
          title={normalizedTitle}
          variant={component.variant as any}
          data={normalizedData as any}
        />
      );
    default:
      console.warn('[ComponentRenderer] Unknown component type:', (component as any).type);
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Tipo de componente desconhecido: {(component as any).type}
          </p>
        </div>
      );
    }
  } catch (error: any) {
    console.error('[ComponentRenderer] Error rendering component:', component.type, error);
    console.error('[ComponentRenderer] Error message:', error.message);
    console.error('[ComponentRenderer] Error stack:', error.stack);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm font-semibold">
          Erro ao renderizar componente: {component.type}
        </p>
        <p className="text-red-600 text-xs mt-1">
          {error.message}
        </p>
      </div>
    );
  }
}
