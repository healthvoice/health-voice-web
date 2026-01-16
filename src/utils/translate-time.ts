export function translateDuration(duration: string): string {
  if (!duration) return "00:00";

  // Check if it matches "X [unit] ago" pattern
  const timeAgoRegex = /(\d+)\s+(minute|minutes|hour|hours|day|days)\s+ago/i;
  const match = duration.match(timeAgoRegex);

  if (match) {
    const value = match[1];
    const unit = match[2].toLowerCase();

    let translatedUnit = "";
    switch (unit) {
      case "minute":
        translatedUnit = "minuto";
        break;
      case "minutes":
        translatedUnit = "minutos";
        break;
      case "hour":
        translatedUnit = "hora";
        break;
      case "hours":
        translatedUnit = "horas";
        break;
      case "day":
        translatedUnit = "dia";
        break;
      case "days":
        translatedUnit = "dias";
        break;
      default:
        return duration;
    }

    return `${value} ${translatedUnit} atrás`;
  }

  // If it's just a raw duration string (e.g. "5 minutes") without "ago", we could translate that too if needed.
  // But strictly following "5 minutes ago" -> "5 minutos atrás".

  return duration;
}
