import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { SamplingSite, VirusType, WastewaterReading, OutbreakSite, PublicHealthResource } from '@/types/database';

interface SiteWithReadings extends SamplingSite {
  readings?: WastewaterReading[];
}

interface WebMapViewProps {
  sites: SiteWithReadings[];
  userLocation: { latitude: number; longitude: number } | null;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onSitePress: (site: SiteWithReadings) => void;
  getMarkerColor: (site: SiteWithReadings) => string;
  outbreaks?: OutbreakSite[];
  resources?: PublicHealthResource[];
  onOutbreakPress?: (outbreak: OutbreakSite) => void;
  onResourcePress?: (resource: PublicHealthResource) => void;
}

function MapController({ region }: { region: WebMapViewProps['region'] }) {
  const map = useMap();
  const prevRegionRef = useRef(region);

  useEffect(() => {
    const zoom = region.latitudeDelta > 20 ? 4 : region.latitudeDelta > 5 ? 7 : region.latitudeDelta > 2 ? 9 : 11;

    if (
      prevRegionRef.current.latitude !== region.latitude ||
      prevRegionRef.current.longitude !== region.longitude ||
      prevRegionRef.current.latitudeDelta !== region.latitudeDelta
    ) {
      map.setView([region.latitude, region.longitude], zoom, {
        animate: true,
        duration: 0.5
      });
      prevRegionRef.current = region;
    }
  }, [region.latitude, region.longitude, region.latitudeDelta, map]);

  return null;
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background-color: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2), 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const outbreakIcon = L.divIcon({
  className: 'outbreak-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background-color: #dc2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
    ">⚠</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const resourceIcon = L.divIcon({
  className: 'resource-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background-color: #10b981;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">+</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function WebMapView({
  sites,
  userLocation,
  region,
  onSitePress,
  getMarkerColor,
  outbreaks = [],
  resources = [],
  onOutbreakPress,
  onResourcePress,
}: WebMapViewProps) {
  return (
    <MapContainer
      center={[region.latitude, region.longitude]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      minZoom={5}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController region={region} />

      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userLocationIcon}>
          <Popup>
            <div style={{ textAlign: 'center', fontWeight: '600' }}>
              Your Location
            </div>
          </Popup>
        </Marker>
      )}

      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[Number(site.latitude), Number(site.longitude)]}
          icon={createCustomIcon(getMarkerColor(site))}
          eventHandlers={{
            click: () => onSitePress(site),
          }}>
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                {site.name}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {site.county} County
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Click marker for details
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {outbreaks.map((outbreak) => (
        <Marker
          key={outbreak.id}
          position={[Number(outbreak.latitude), Number(outbreak.longitude)]}
          icon={outbreakIcon}
          eventHandlers={{
            click: () => onOutbreakPress?.(outbreak),
          }}>
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px', color: '#dc2626' }}>
                Outbreak Alert
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                {outbreak.name}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Click for details
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {resources.map((resource) => (
        <Marker
          key={resource.id}
          position={[Number(resource.latitude), Number(resource.longitude)]}
          icon={resourceIcon}
          eventHandlers={{
            click: () => onResourcePress?.(resource),
          }}>
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px', color: '#10b981' }}>
                {resource.name}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {resource.resource_type}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Click for details
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
