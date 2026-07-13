// components/RecommendationCard.tsx
import React from 'react';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  urgency: 'CRITICAL' | 'IMPORTANT' | 'INFORMATIONAL';
  confidence_score: number;
  evidence: {
    windSpeed?: number;
    precipitation?: number;
    temperature?: number;
    tempMin?: number;
    tempMax?: number;
  };
}

interface CardProps {
  rec: Recommendation;
}

export default function RecommendationCard({ rec }: CardProps) {
  // Culori dinamice în funcție de gravitate
  const urgencyStyles = {
    CRITICAL: {
      border: 'border-red-500 bg-red-50 text-red-900',
      badge: 'bg-red-600 text-white',
      dot: 'bg-red-600'
    },
    IMPORTANT: {
      border: 'border-amber-500 bg-amber-50 text-amber-900',
      badge: 'bg-amber-500 text-black',
      dot: 'bg-amber-500'
    },
    INFORMATIONAL: {
      border: 'border-blue-500 bg-blue-50 text-blue-900',
      badge: 'bg-blue-500 text-white',
      dot: 'bg-blue-500'
    }
  };

  const style = urgencyStyles[rec.urgency] || urgencyStyles.INFORMATIONAL;

  return (
    <div className={`p-5 rounded-xl border-2 shadow-sm transition-all hover:shadow-md ${style.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${style.dot}`} />
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${style.badge}`}>
            {rec.urgency}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-semibold bg-white px-2 py-1 rounded border">
          Scor de încredere: {rec.confidence_score}%
        </span>
      </div>

      <h3 className="mt-3 text-lg font-bold tracking-tight">{rec.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{rec.description}</p>

      {/* Secțiunea de Dovezi (Evidence Section) */}
      <div className="mt-4 pt-3 border-t border-gray-200/60">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date justificative:</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {rec.evidence.temperature !== undefined && (
            <span className="bg-white/80 border px-2.5 py-1 rounded-md text-gray-700">
              🌡️ Temp: <strong>{rec.evidence.temperature}°C</strong>
            </span>
          )}
          {rec.evidence.tempMin !== undefined && (
            <span className="bg-white/80 border px-2.5 py-1 rounded-md text-gray-700">
              ❄️ Minima: <strong>{rec.evidence.tempMin}°C</strong>
            </span>
          )}
          {rec.evidence.tempMax !== undefined && (
            <span className="bg-white/80 border px-2.5 py-1 rounded-md text-gray-700">
              🔥 Maxima: <strong>{rec.evidence.tempMax}°C</strong>
            </span>
          )}
          {rec.evidence.windSpeed !== undefined && (
            <span className="bg-white/80 border px-2.5 py-1 rounded-md text-gray-700">
              💨 Vânt: <strong>{rec.evidence.windSpeed} km/h</strong>
            </span>
          )}
          {rec.evidence.precipitation !== undefined && (
            <span className="bg-white/80 border px-2.5 py-1 rounded-md text-gray-700">
              🌧️ Șanse ploaie: <strong>{rec.evidence.precipitation}%</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
