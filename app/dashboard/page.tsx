// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import RecommendationCard, { Recommendation } from '@/components/RecommendationCard';
import FieldChat from '@/components/FieldChat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// În client-side Next.js folosim Anon Key pentru a citi securizat datele
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Field {
  id: string;
  name: string;
  crop_type: string;
  planting_date: string;
  acreage: number;
}

export default function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [processingRules, setProcessingRules] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Încărcăm câmpurile fermierului la pornire
  useEffect(() => {
    async function loadFields() {
      try {
        const { data, error } = await supabase
          .from('fields')
          .select('id, name, crop_type, planting_date, acreage')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setFields(data || []);
        if (data && data.length > 0) {
          setSelectedField(data[0]); // Selectăm primul câmp automat
        }
      } catch (err: any) {
        console.error("Eroare la încărcarea câmpurilor:", err.message);
      } finally {
        setLoadingFields(false);
      }
    }
    loadFields();
  }, []);

  // 2. Încărcăm recomandările când se schimbă câmpul selectat
  useEffect(() => {
    if (!selectedField) return;

    async function loadRecommendations() {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('field_id', selectedField?.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRecommendations(data as Recommendation[]);
      }
    }
    loadRecommendations();
    setStatusMessage('');
  }, [selectedField]);

  // 3. Declanșăm motorul de reguli (interogare meteo + rulare reguli)
  const handleRecalculate = async () => {
    if (!selectedField) return;

    setProcessingRules(true);
    setStatusMessage('⌛ Se descarcă prognoza meteo live pe coordonatele GPS și se rulează motorul de reguli...');

    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: selectedField.id })
      });

      const data = await res.json();

      if (data.success) {
        setStatusMessage('✅ Recomandări actualizate cu succes!');
        // Reîncărcăm recomandările proaspăt generate din DB
        const { data: updatedRecs } = await supabase
          .from('recommendations')
          .select('*')
          .eq('field_id', selectedField.id);
        
        setRecommendations(updatedRecs || []);
      } else {
        setStatusMessage(`❌ Eroare: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Eroare de rețea: ${err.message}`);
    } finally {
      setProcessingRules(false);
    }
  };

  if (loadingFields) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <span className="text-3xl animate-spin mb-3">🌾</span>
        <p className="text-sm text-gray-600 font-bold">Se încarcă dashboard-ul tău...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Navbar */}
      <nav className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌽</span>
            <span className="font-extrabold text-lg tracking-tight">AI Farm Copilot MVP</span>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard/add-field'}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md transition"
          >
            ➕ Câmp Nou
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {fields.length === 0 ? (
          /* Stare fără câmpuri */
          <div className="text-center py-16 bg-white rounded-xl border border-dashed p-8 shadow-sm">
            <span className="text-5xl block mb-4">🚜</span>
            <h2 className="text-xl font-bold text-gray-900">Nu ai adăugat niciun câmp încă!</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Pentru a porni monitorizarea meteo și asistentul AI, trebuie să desenezi prima ta parcelă pe hartă.</p>
            <button 
              onClick={() => window.location.href = '/dashboard/add-field'}
              className="mt-6 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg shadow-md transition"
            >
              Desenează Primul Câmp
            </button>
          </div>
        ) : (
          /* Dashboard Activ */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coloana Stânga: Selector Câmpuri & Informații Curent */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Alege Parcela</label>
                <select
                  value={selectedField?.id || ''}
                  onChange={(e) => {
                    const found = fields.find(f => f.id === e.target.value);
                    if (found) setSelectedField(found);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                {selectedField && (
                  <div className="pt-3 border-t text-xs text-gray-600 space-y-2">
                    <p>🌾 Cultură active: <strong className="text-gray-900 uppercase">{selectedField.crop_type}</strong></p>
                    <p>📅 Data plantării: <strong className="text-gray-900">{selectedField.planting_date}</strong></p>
                    <p>📐 Suprafață: <strong className="text-gray-900">{selectedField.acreage} acri</strong></p>
                  </div>
                )}

                <button
                  onClick={handleRecalculate}
                  disabled={processingRules}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingRules ? 'Procesare...' : '🔄 Actualizează Recomandări'}
                </button>
              </div>

              {/* Caseta cu Mesaje Status */}
              {statusMessage && (
                <div className={`p-4 rounded-xl text-xs font-semibold border ${
                  statusMessage.startsWith('❌') ? 'bg-red-50 text-red-900 border-red-200' : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                }`}>
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Coloana Dreapta (Conținut Principal): Recomandări & AI Copilot */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Secțiune Recomandări */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📋</span> Recomandări Agronomice Active
                </h2>

                {recommendations.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border text-gray-500 text-sm">
                    Nu există recomandări active calculate pentru ziua de astăzi. Apasă pe butonul <strong className="text-emerald-800">"Actualizează Recomandări"</strong> din stânga pentru a descărca datele meteo live.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recommendations.map(rec => (
                      <RecommendationCard key={rec.id} rec={rec} />
                    ))}
                  </div>
                )}
              </div>

              {/* Secțiune Copilot Chat */}
              {selectedField && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>💬</span> Discută cu AI Farm Copilot
                  </h2>
                  <FieldChat fieldId={selectedField.id} />
                </div>
              )}

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
