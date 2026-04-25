// Custom teal map style for the Live Broadcast Area card (no labels, artistic look)
export const BROADCAST_MAP_STYLE = [
  { elementType: 'geometry',                    stylers: [{ color: '#5eaaa8' }] },
  { elementType: 'labels',                      stylers: [{ visibility: 'off' }] },
  { featureType: 'road',         elementType: 'geometry', stylers: [{ color: '#4a9e9c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d9290' }] },
  { featureType: 'water',        elementType: 'geometry', stylers: [{ color: '#2d7a78' }] },
  { featureType: 'poi',          elementType: 'geometry', stylers: [{ color: '#67b5b3' }] },
  { featureType: 'administrative', elementType: 'all',    stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',      elementType: 'all',      stylers: [{ visibility: 'off' }] },
];

export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];
