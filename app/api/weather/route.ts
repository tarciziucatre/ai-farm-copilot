// app/api/weather/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRecommendations } from '@/lib/ruleEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { fieldId } = await request.json();

    if (!fieldId) {
      return NextResponse.json({ error: "Lipsește parametrul fieldId" }, { status: 400 });
    }

    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select(`
        id,
        name,
        crop_type,
        planting_date
      `)
      .eq('id', fieldId)
      .single();

    const { data: coords, error: coordsError } = await supabase
      .rpc('get_field_centroid', { field_uuid: fieldId });

    if (fieldError || coordsError || !field) {
      return NextResponse.json({ 
        error: "Nu am putut găsi câmpul sau coordonatele acestuia în baza de date.",
        details: fieldError || coordsError 
      }, { status: 404 });
    }

    const { latitude, longitude } = coords as { latitude: number; longitude: number };

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=1`;
    
    const weatherResponse = await fetch(openMeteoUrl);
    if (!weatherResponse.ok) {
      throw new Error("Eroare la obținerea datelor de la Open-Meteo");
    }

    const weatherData = await weatherResponse.json();
    const daily = weatherData.daily;

    const currentWeatherData = {
      tempMax: daily.temperature_2m_max[0],
      tempMin: daily.temperature_2m_min[0],
      windSpeed: daily.wind_speed_10m_max[0],
      precipitationProbability: daily.precipitation_probability_max[0],
      humidityAvg: daily.relative_humidity_2m_max[0]
    };

    const cropData = {
      cropType: field.crop_type,
      plantingDate: field.planting_date
    };

    const newRecommendations = generateRecommendations(currentWeatherData, cropData);

    await supabase
      .from('recommendations')
      .delete()
      .eq('field_id', fieldId);

    if (newRecommendations.length > 0) {
      const dbPayload = newRecommendations.map(rec => ({
        field_id: fieldId,
        title: rec.title,
        description: rec.description,
        urgency: rec.urgency,
        confidence_score: rec.confidenceScore,
        evidence: rec.evidence
      }));

      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(dbPayload);

      if (insertError) {
        throw new Error(`Eroare la salvarea recomandărilor în DB: ${insertError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Am procesat vremea și am generat ${newRecommendations.length} recomandări pentru câmpul ${field.name}.`,
      recommendations: newRecommendations
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
