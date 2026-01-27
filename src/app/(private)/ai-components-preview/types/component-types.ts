// Tipos base para componentes gerados pela IA

export type Variant =
  | "emerald"
  | "blue"
  | "violet"
  | "amber"
  | "teal"
  | "gray"
  | "rose"
  | "red"
  | "indigo"
  | "orange"
  | "purple"
  | "neutral";

export type ComponentType =
  | "prescription_card"
  | "exams_card"
  | "referrals_card"
  | "certificates_card"
  | "orientations_card"
  | "clinical_notes_card"
  | "next_appointments_card"
  | "biometrics_card"
  | "allergies_card"
  | "chronic_conditions_card"
  | "medications_card"
  | "social_history_card"
  | "family_history_card"
  | "medical_history_timeline_card"
  | "main_diagnosis_card"
  | "symptoms_card"
  | "risk_factors_card"
  | "treatment_plan_card"
  | "differential_diagnosis_card"
  | "suggested_exams_card"
  | "observations_card";

// Estrutura base de um componente
export interface AIComponent {
  type: ComponentType;
  title: string;
  variant?: Variant;
  data: ComponentData;
}

// Estrutura de uma seção (agrupa componentes relacionados)
export interface AISection {
  title: string;              // Título da seção (ex: "Receituários", "Exames")
  description?: string;       // Descrição opcional da seção
  variant?: Variant;          // Variante de cor para a seção (opcional)
  components: AIComponent[];  // Array de componentes dentro da seção
}

// Resposta completa da IA
export interface AIComponentResponse {
  pageTitle: string;
  sections: AISection[];      // Array de seções (ao invés de components diretos)
}

// Estruturas genéricas para dados flexíveis

// Campo configurável para key-value cards
export interface FieldConfig {
  label: string;        // Label definido pela IA (ex: "Fit Cultural", "Tipo Sanguíneo")
  value: string;        // Valor do campo
  variant?: "badge" | "text" | "highlight";  // Como exibir
  priority?: number;    // Ordem de exibição
}

// Item genérico para listas
export interface GenericListItem {
  id?: string | number;
  primary: string;           // Texto principal
  secondary?: string;         // Texto secundário
  metadata?: Array<{          // Metadados com labels dinâmicos
    label: string;
    value: string;
  }>;
  tags?: string[];           // Tags/badges
  status?: string;            // Status (qualquer string, não enum)
}

// Tipos de dados específicos para cada componente (mantidos para compatibilidade)

// Prescription Card - Suporta formato legado e genérico
export interface PrescriptionCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  prescriptions?: Array<{
    id: number;
    date: string;
    type: string;
    items: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
  }>;
}

// Exams Card - Suporta formato legado e genérico
export interface ExamsCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  exams?: Array<{
    id: number;
    date: string;
    category: string;
    items: Array<{
      name: string;
      priority: string;  // Qualquer string, não mais enum
    }>;
  }>;
  totalCount?: number;
}

// Referrals Card - Suporta formato genérico e legado
export interface ReferralsCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  referrals?: Array<{
    id: number;
    date: string;
    specialty: string;
    professional: string;
    reason: string;
    urgency?: string;  // Qualquer string, não mais enum
  }>;
}

// Certificates Card
export interface CertificatesCardData {
  certificates: Array<{
    id: number;
    date: string;
    type: string;
    description: string;
    period: string;
  }>;
}

// Orientations Card
export interface OrientationsCardData {
  orientations: string[];
}

// Clinical Notes Card - Suporta formato genérico e legado
export interface ClinicalNotesCardData {
  // Formato genérico (recomendado)
  content?: string;
  sections?: Array<{
    title?: string;
    content: string;
  }>;
  // Formato legado (compatibilidade)
  notes?: string;
}

// Next Appointments Card - Suporta formato genérico e legado
export interface NextAppointmentsCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  appointments?: Array<{
    id: number;
    date: string;
    time?: string;
    type?: string;
    doctor?: string;
    notes?: string;
  }>;
}

// Biometrics Card - Suporta formato genérico e legado
export interface BiometricsCardData {
  // Formato genérico (recomendado) - labels definidos pela IA
  fields?: FieldConfig[];
  // Formato legado (compatibilidade)
  personal?: {
    bloodType?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    age?: string;
    [key: string]: string | undefined;  // Permite campos extras
  };
}

// Allergies Card - Suporta formato genérico e legado
export interface AllergiesCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  allergies?: Array<{
    name: string;
    reaction?: string;
    severity?: string;  // Qualquer string, não mais enum
  }>;
}

// Chronic Conditions Card
export interface ChronicConditionsCardData {
  chronicConditions: Array<{
    name: string;
    since: string;
    status: string;
  }>;
}

// Medications Card - Suporta formato genérico e legado
export interface MedicationsCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  medications?: Array<{
    name: string;
    frequency?: string;
    type?: string;  // Qualquer string, não mais enum
  }>;
}

// Social History Card - Suporta formato genérico e legado
export interface SocialHistoryCardData {
  // Formato genérico (recomendado)
  fields?: FieldConfig[];
  // Formato legado (compatibilidade)
  socialHistory?: {
    smoking?: string;
    alcohol?: string;
    activity?: string;
    diet?: string;
    [key: string]: string | undefined;  // Permite campos extras
  };
}

// Family History Card
export interface FamilyHistoryCardData {
  familyHistory: Array<{
    relation: string;
    condition: string;
    age: string;
  }>;
}

// Medical History Timeline Card
export interface MedicalHistoryTimelineCardData {
  history: Array<{
    date: string;
    type: string;
    doctor: string;
    specialty: string;
    note: string;
    attachments?: string[];
  }>;
}

// Main Diagnosis Card - Suporta formato genérico e legado
export interface MainDiagnosisCardData {
  // Formato genérico (recomendado)
  fields?: FieldConfig[];
  content?: string;  // Para justificativa/descrição
  // Formato legado (compatibilidade)
  mainCondition?: string;
  cid?: string;
  confidence?: string;  // Qualquer string, não mais enum
  severity?: string;  // Qualquer string, não mais enum
  evolution?: string;  // Qualquer string, não mais enum
  justification?: string;
}

// Symptoms Card - Suporta formato genérico e legado
export interface SymptomsCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  symptoms?: Array<{
    name: string;
    frequency?: string;  // Qualquer string, não mais enum
    severity?: string;  // Qualquer string, não mais enum
  }>;
}

// Risk Factors Card
export interface RiskFactorsCardData {
  riskFactors: string[];
}

// Treatment Plan Card
export interface TreatmentPlanCardData {
  treatment: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    lifestyle: string[];
  };
}

// Differential Diagnosis Card - Suporta formato genérico e legado
export interface DifferentialDiagnosisCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  differentials?: Array<{
    name: string;
    probability?: string;  // Qualquer string, não mais enum
    excluded?: boolean;
  }>;
}

// Suggested Exams Card - Suporta formato genérico e legado
export interface SuggestedExamsCardData {
  // Formato genérico (recomendado)
  items?: GenericListItem[];
  // Formato legado (compatibilidade)
  suggestedExams?: Array<{
    name: string;
    priority?: string;  // Qualquer string, não mais enum
  }>;
}

// Observations Card
export interface ObservationsCardData {
  observations: string;
}

// Union type para todos os tipos de dados
export type ComponentData =
  | PrescriptionCardData
  | ExamsCardData
  | ReferralsCardData
  | CertificatesCardData
  | OrientationsCardData
  | ClinicalNotesCardData
  | NextAppointmentsCardData
  | BiometricsCardData
  | AllergiesCardData
  | ChronicConditionsCardData
  | MedicationsCardData
  | SocialHistoryCardData
  | FamilyHistoryCardData
  | MedicalHistoryTimelineCardData
  | MainDiagnosisCardData
  | SymptomsCardData
  | RiskFactorsCardData
  | TreatmentPlanCardData
  | DifferentialDiagnosisCardData
  | SuggestedExamsCardData
  | ObservationsCardData;
