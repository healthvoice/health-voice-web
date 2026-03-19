# Correção: Banner de upgrade e modal de personalização

Documento para replicar as alterações em outros forks (ex.: Jurid Voice) que derivam do Health Voice.

---

## Problema

1. **Banner de upgrade** aparecia às vezes mesmo para usuários com assinatura ativa (ex.: conta de teste com expiração em 5 anos).
2. **Modal de personalização** (Insights) abria para todos na primeira visita, sem considerar trial/assinatura expirada.

**Causa:** O estado inicial do contexto de sessão é `availableRecording = 0`, `totalRecording = 0`, `isTrial = false`. Enquanto a API `/signature/available-recording` não respondia, a condição `!isTrial && availableRecording === 0 && totalRecording === 0` era verdadeira, então o banner era exibido como se o plano estivesse expirado.

---

## Solução

- Introduzir um flag **`availabilityLoaded`** que só fica `true` depois que a resposta de disponibilidade (available/total/isTrial) for recebida.
- Só considerar **trial** ou **expirado** quando `availabilityLoaded === true`.
- Na modal de personalização: abrir automaticamente (uma vez por sessão) apenas para usuários em **trial** ou com **assinatura expirada**, usando a mesma regra do banner.

---

## Alterações por arquivo

### 1. Contexto de autenticação (`src/context/auth.tsx`)

- **Interface** `SessionContextValue`: adicionar  
  `availabilityLoaded: boolean`
- **Estado:**  
  `const [availabilityLoaded, setAvailabilityLoaded] = useState(false);`
- **`forceSignOut`:** ao limpar sessão, incluir  
  `setAvailabilityLoaded(false);`
- **`handleGetAvailableRecording`:** após tratar a resposta (status 200, outro status ou `catch`), chamar  
  `setAvailabilityLoaded(true);`  
  (assim o “carregado” fica verdadeiro mesmo em erro, para não travar a UI.)
- **Provider value:** incluir `availabilityLoaded` no objeto passado ao contexto.

### 2. Banner de upgrade (`(home)/components/upgrade-plan-banner.tsx`)

- Obter `availabilityLoaded` de `useSession()`.
- Trocar a condição de exibição de  
  `profile && (isTrial || isExpired)`  
  para  
  `profile && availabilityLoaded && (isTrial || isExpired)`.
- Remover `console.log` de debug (isTrial, availableRecording, totalRecording), se existirem.

### 3. Página Overview / Modal de personalização (`clients/.../overview/page.tsx`)

- Importar `useSession` do contexto de auth.
- Obter: `isTrial`, `availableRecording`, `totalRecording`, `availabilityLoaded`.
- Calcular:
  - `isExpired = !isTrial && availableRecording === 0 && totalRecording === 0`
  - `shouldShowPersonalizationPrompt = availabilityLoaded && (isTrial || isExpired)`
- **Abertura automática da modal (uma vez por sessão):** no `useEffect` que lê `hasSeenPersonalizationModal-resumo`, só abrir a modal se `shouldShowPersonalizationPrompt` for verdadeiro; usar `shouldShowPersonalizationPrompt` nas dependências do `useEffect`.
- **Botão “Personalizar Insights”:** renderizar o botão apenas quando `shouldShowPersonalizationPrompt` for verdadeiro (condicional `{shouldShowPersonalizationPrompt && (...)}` ).

---

## Resumo da regra de negócio

- **Banner:** exibir só quando `profile`, `availabilityLoaded` e (`isTrial` ou `isExpired`) forem verdadeiros.
- **Modal (abertura automática):** mesma regra (trial ou expirado) e apenas quando a disponibilidade já foi carregada; manter o “só uma vez” com `sessionStorage`.
- **Botão de personalização:** visível apenas para trial ou expirado (mesma condição `shouldShowPersonalizationPrompt`).

Com isso, o banner e a modal deixam de depender do estado inicial e passam a refletir corretamente trial/assinatura expirada após a resposta da API.
