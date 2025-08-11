
'use client';

import * as React from 'react';
import { PoiCard } from './PoiCard';

type Places = (google.maps.places.PlaceResult & { distance?: number })[];

interface PoiListProps {
  places: Places;
}

export const PoiList: React.FC<PoiListProps> = ({ places }) => {
  return (
    <div className="space-y-3">
      {places.map((place) => (
        <PoiCard key={place.place_id} place={place} />
      ))}
    </div>
  );
};
