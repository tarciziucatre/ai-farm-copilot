// components/MapComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Încărcăm dinamic componentele din React-Leaflet doar pe client (browser)
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const FeatureGroup = dynamic(() => import('react-leaflet').then((m) => m.FeatureGroup), { ssr: false });

// Încărcăm dinamic componenta de editare / desenare poligoane
const EditControl = dynamic(
  () => import('react-leaflet-draw').then((m) => m.EditControl),
  { ssr: false }
);

interface MapComponentProps {
  onPolygonCreated: (geoJson: any, acreage: number) => void;
}

export default function MapComponent({ onPolygonCreated }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setLeaflet] = useState<any>(null);

  useEffect(() => {
   

    // Încărcăm biblioteca Leaflet nativă pe client pentru calculele de arie
    import('leaflet').then((leafletInstance) => {
      setLeaflet(leafletInstance.default);
      
      // Fix clasic pentru erorile de încărcare a iconițelor Leaflet în Next.js
      delete (leafletInstance.default.Icon.Default.prototype as any)._getIconUrl;
      leafletInstance.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      
      setMounted(true);
    });
  }, []);

  const _onCreate = (e: any) => {
    if (!L) return;
    
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const geoJson = layer.toGeoJSON();
      
      // Calculăm suprafața poligonului (în metri pătrați) cu utilitarele geografice Leaflet
      const latlngs = layer.getLatLngs()[0];
      const areaInSquareMeters = L.GeometryUtil.geodesicArea(latlngs);
      
      // Conversie în acri (acre) - unitatea de măsură obligatorie pentru SUA din specificații
      const areaInAcres = areaInSquareMeters * 0.000247105; 

      // Returnăm poligonul (GeoJSON) și suprafața calculată în form-ul Next.js
      onPolygonCreated(geoJson.geometry, parseFloat(areaInAcres.toFixed(2)));
    }
  };

  if (!mounted || !L) {
    return (
      <div className="h-[400px] bg-gray-100 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300">
        <span className="text-2xl animate-spin mb-2">🔄</span>
        <p className="text-sm text-gray-500 font-medium">Se încarcă harta satelit...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border shadow-inner relative z-0">
      <MapContainer
        center={[41.5, -93.6]} // Centrat implicit pe statul Iowa (inima agriculturii americane)
        zoom={7}
        scrollWheelZoom={true}
        className="h-[400px] w-full"
      >
        {/* Hărți satelit de înaltă rezoluție de la Esri (opțiune excelentă pentru a recunoaște hotarele parcelei) */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={_onCreate}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              polyline: false,
              marker: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e15709',
                  message: '<strong>Eroare:</strong> Liniile hotarului nu se pot intersecta!'
                },
                shapeOptions: {
                  color: '#10b981', // Verde smarald pentru brand-ul nostru
                  fillOpacity: 0.35,
                  weight: 3
                }
              }
            }}
          />
        </FeatureGroup>
      </MapContainer>
      <div className="absolute bottom-2 left-2 bg-white/95 text-[10px] px-2.5 py-1 rounded-md shadow z-[1000] text-gray-600 font-medium border">
        🗺️ Folosește unealta de poligon din dreapta-sus pentru a desena conturul câmpului.
      </div>
    </div>
  );
}
