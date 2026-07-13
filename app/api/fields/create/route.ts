// app/api/fields/create/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { name, cropType, plantingDate, boundary, acreage } = await request.json();

    if (!name || !cropType || !plantingDate || !boundary) {
      return NextResponse.json({ error: "Lipsesc date obligatorii pentru salvarea câmpului." }, { status: 400 });
    }

    // Pentru MVP, deoarece nu avem încă modulul de autentificare activ în interfață,
    // vom crea sau folosi o fermă "default" asociată unui profil dummy (sau primului profil existent)
    // pentru a ne asigura că baza de date acceptă cheile străine (Foreign Keys).
    
    // 1. Obținem primul profil disponibil sau creăm unul de test
    let { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    
    if (!profile) {
      // Dacă nu există profile, creăm temporar unul anonim pentru demo
      const dummyId = "00000000-0000-0000-0000-000000000000";
      const { data: newProfile, error: profError } = await supabase
        .from('profiles')
        .insert([{ id: dummyId, full_name: "Fermier Demo" }])
        .select('id')
        .single();
      
      if (profError && profError.code !== '23505') { // 23505 este Unique Violation, în caz că există deja
        throw new Error(`Eroare profil dummy: ${profError.message}`);
      }
      profile = newProfile || { id: dummyId };
    }

    // 2. Obținem prima fermă sau creăm una pentru acest profil
    let { data: farm } = await supabase.from('farms').select('id').eq('user_id', profile.id).limit(1).maybeSingle();

    if (!farm) {
      const { data: newFarm, error: farmError } = await supabase
        .from('farms')
        .insert([{ user_id: profile.id, name: "Ferma Mea Demo", state: "IA" }])
        .select('id')
        .single();

      if (farmError) throw new Error(`Eroare fermă dummy: ${farmError.message}`);
      farm = newFarm;
    }

    // 3. Convertim obiectul GeoJSON primit într-un format text pe care PostGIS îl înțelege direct (WKT - Well-Known Text)
    // Pentru poligoane simple din Leaflet, crearea unui format valid este facilă:
    const coordinates = boundary.coordinates[0];
    const wktCoordinates = coordinates.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(',');
    const wktPolygon = `SRID=4326;POLYGON((${wktCoordinates}))`;

    // 4. Inserăm câmpul în baza de date cu poligonul spatial formatat
    const { data: newField, error: fieldError } = await supabase
      .from('fields')
      .insert([
        {
          farm_id: farm.id,
          name: name,
          crop_type: cropType,
          planting_date: plantingDate,
          boundary: wktPolygon,
          acreage: acreage
        }
      ])
      .select()
      .single();

    if (fieldError) {
      throw new Error(`Eroare salvare parcelă în Supabase: ${fieldError.message}`);
    }

    return NextResponse.json({ success: true, field: newField });

  } catch (error: any) {
    console.error("Eroare salvare câmp:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
