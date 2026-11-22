import { useMapEvents, MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SUKKUR_CENTER = [27.7052, 68.8574];
const SUKKUR_BOUNDS = [[27.5, 68.65], [27.9, 69.05]];

function LocationPicker({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
    },
  });
  return null;
}

export default function PickupLocationMap({ location, onChange }) {
  const hasLocation = location?.lat != null && location?.lng != null
    && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng));
  const center = hasLocation ? [Number(location.lat), Number(location.lng)] : SUKKUR_CENTER;

  return (
    <div className="pickup-map" aria-label="Choose a pickup location in Sukkur">
      <MapContainer
        center={center}
        zoom={12}
        minZoom={11}
        maxZoom={18}
        maxBounds={SUKKUR_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker onChange={onChange} />
        {hasLocation && (
          <CircleMarker center={center} radius={9} pathOptions={{ color: '#143b2c', fillColor: '#d3ee85', fillOpacity: 1 }}>
            <Popup>Pickup location selected</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
