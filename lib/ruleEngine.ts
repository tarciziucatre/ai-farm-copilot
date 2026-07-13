// lib/ruleEngine.ts

export interface WeatherData {
  tempMax: number;                 // Celsius
  tempMin: number;                 // Celsius
  windSpeed: number;               // km/h
  precipitationProbability: number; // procentaj (0 - 100%)
  humidityAvg: number;             // procentaj (0 - 100%)
}

export interface CropData {
  cropType: string;               // Ex: "corn"
  plantingDate: string;           // Format "YYYY-MM-DD"
}

export interface RuleResult {
  shouldTrigger: boolean;
  title: string;
  description: string;
  urgency: 'CRITICAL' | 'IMPORTANT' | 'INFORMATIONAL';
  confidenceScore: number;
  evidence: Record<string, any>;
}

export function evaluateSprayingWindow(weather: WeatherData): RuleResult {
  const maxWindSpeed = 15;        // km/h
  const maxRainProbability = 30;  // %
  const maxTemp = 30;             // Celsius

  let triggers: string[] = [];
  let confidenceScore = 100;

  if (weather.windSpeed > maxWindSpeed) {
    triggers.push(`vânt prea puternic (${weather.windSpeed} km/h)`);
    confidenceScore -= 40;
  }
  if (weather.precipitationProbability > maxRainProbability) {
    triggers.push(`probabilitate mare de ploaie (${weather.precipitationProbability}%)`);
    confidenceScore -= 40;
  }
  if (weather.tempMax > maxTemp) {
    triggers.push(`temperatură prea ridicată (${weather.tempMax}°C)`);
    confidenceScore -= 20;
  }

  if (triggers.length > 0) {
    return {
      shouldTrigger: true,
      title: "Fereastra de stropire este închisă",
      description: `Nu se recomandă aplicarea tratamentelor astăzi din cauza următoarelor condiții restrictive: ${triggers.join(', ')}. Amânarea previne pierderea substanțelor prin derivă sau spălare.`,
      urgency: 'CRITICAL',
      confidenceScore: Math.max(10, confidenceScore),
      evidence: {
        windSpeed: weather.windSpeed,
        precipitation: weather.precipitationProbability,
        temperature: weather.tempMax
      }
    };
  }

  return {
    shouldTrigger: true,
    title: "Condiții ideale pentru stropire",
    description: "Viteza vântului, temperatura și probabilitatea de precipitații sunt în parametri optimi. Fereastra de lucru este complet deschisă pentru tratamente eficiente.",
    urgency: 'INFORMATIONAL',
    confidenceScore: 95,
    evidence: {
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitationProbability,
      temperature: weather.tempMax
    }
  };
}

export function evaluateFrostRisk(weather: WeatherData, crop: CropData): RuleResult {
  const frostThreshold = 0; // Celsius

  if (weather.tempMin <= frostThreshold) {
    return {
      shouldTrigger: true,
      title: "Alertă critică de îngheț nocturn",
      description: `Prognoza indică temperaturi minime de până la ${weather.tempMin}°C. Există risc major de afectare a țesuturilor tinere ale culturii de ${crop.cropType}. Monitorizați gradul de afectare la 24-48 de ore după eveniment.`,
      urgency: 'CRITICAL',
      confidenceScore: 98,
      evidence: {
        tempMin: weather.tempMin,
        threshold: frostThreshold
      }
    };
  }

  if (weather.tempMin > 0 && weather.tempMin <= 3) {
    return {
      shouldTrigger: true,
      title: "Atenție: Risc de brumă la sol",
      description: `Temperaturile minime vor coborî la ${weather.tempMin}°C. La nivelul solului se poate forma brumă, ceea ce poate stresa temporar plantele tinere.`,
      urgency: 'IMPORTANT',
      confidenceScore: 85,
      evidence: {
        tempMin: weather.tempMin
      }
    };
  }

  return {
    shouldTrigger: false,
    title: "Fără risc de îngheț",
    description: "Temperaturile minime rămân în limite sigure pentru dezvoltarea culturii.",
    urgency: 'INFORMATIONAL',
    confidenceScore: 100,
    evidence: { tempMin: weather.tempMin }
  };
}

export function evaluateHeatStress(weather: WeatherData): RuleResult {
  const heatStressThreshold = 35; // Celsius

  if (weather.tempMax >= heatStressThreshold) {
    return {
      shouldTrigger: true,
      title: "Stres termic extrem detectat",
      description: `Temperatura maximă va atinge ${weather.tempMax}°C, depășind pragul critic de ${heatStressThreshold}°C. Planta își va închide stomatele pentru a conserva apa, limitând creșterea. Asigurați irigarea preventivă dacă este posibil.`,
      urgency: 'IMPORTANT',
      confidenceScore: 90,
      evidence: {
        tempMax: weather.tempMax,
        threshold: heatStressThreshold,
        humidity: weather.humidityAvg
      }
    };
  }

  return {
    shouldTrigger: false,
    title: "Temperaturi în limite normale",
    description: "Temperaturile maxime nu pun în pericol dezvoltarea vegetativă.",
    urgency: 'INFORMATIONAL',
    confidenceScore: 100,
    evidence: { tempMax: weather.tempMax }
  };
}

export function generateRecommendations(weather: WeatherData, crop: CropData): RuleResult[] {
  const recommendations: RuleResult[] = [];

  const sprayResult = evaluateSprayingWindow(weather);
  const frostResult = evaluateFrostRisk(weather, crop);
  const heatResult = evaluateHeatStress(weather);

  if (sprayResult.shouldTrigger) recommendations.push(sprayResult);
  if (frostResult.shouldTrigger) recommendations.push(frostResult);
  if (heatResult.shouldTrigger) recommendations.push(heatResult);

  const urgencyWeight = { 'CRITICAL': 3, 'IMPORTANT': 2, 'INFORMATIONAL': 1 };
  return recommendations.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);
}
