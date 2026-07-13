// app/dashboard/add-field/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'navigation'; // Next.js navigation pentru redirectionare
import MapComponent from '@/components/MapComponent';

export default function AddFieldPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('corn');
  const [plantingDate, setPlantingDate] = useState('');
  const [boundary, setBoundary] = useState<any>(null);
  const [acreage, setAcreage] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePolygonCreated = (geoJsonGeometry: any, calculatedAcreage: number) => {
    setBoundary(geoJsonGeometry);
    setAcreage(calculatedAcreage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boundary) {
      alert("Te rugăm să desenezi conturul câmpului pe hartă înainte de salvare!");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fields/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cropType,
          plantingDate,
          boundary,
          acreage
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('🎉 Câmpul a fost salvat cu succes! Te redirecționăm către Dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setMessage(`❌ Eroare: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ Eroare de rețea: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adaugă o Parcelă Nouă</h1>
            <p className="text-sm text-gray-500">Desenează hotarele și completează detaliile culturii.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="text-sm text-gray-600 hover:text-gray-900 font-semibold bg-white border px-4 py-2 rounded-lg shadow-sm"
          >
            Înapoi la Dashboard
          </button>
        </div>

        {/* Formular și Hartă */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nume Câmp</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Parcela de lângă siloz"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tip Cultură</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none bg-white"
              >
                <option value="corn">🌽 Porumb (Corn)</option>
                <option value="soybeans">🌱 Soia (Soybeans)</option>
                <option value="wheat">🌾 Grâu (Wheat)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data Plantării</label>
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Harta pentru desenat */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Desenează conturul parcelei</label>
            <MapComponent onPolygonCreated={handlePolygonCreated} />
            {acreage > 0 && (
              <p className="text-sm text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-200">
                📐 Suprafață calculată: {acreage} acri
              </p>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm font-semibold ${message.startsWith('❌') ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'}`}>
              {message}
            </div>
          )}

          {/* Buton Salvare */}
          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow transition disabled:opacity-50"
            >
              {loading ? 'Se salvează...' : 'Salvează Câmpul'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
