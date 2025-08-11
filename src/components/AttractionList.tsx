
'use client';

import * as React from 'react';
import { AttractionCard } from './AttractionCard';
import { useLocation } from '@/context/LocationTrackingContext';

type Places = (google.maps.places.PlaceResult & { distance?: number })[];

interface AttractionListProps {
  places: Places;
}

export const AttractionList: React.FC<AttractionListProps> = ({ places }) => {
  const { addXp, currentArea } = useLocation();

  return (
    <div className="space-y-3 p-4">
      {places.map((place) => (
        <AttractionCard 
            key={place.place_id} 
            place={place} 
            onQuizComplete={addXp}
            county={currentArea?.county || ''}
            district={currentArea?.district || ''}
        />
      ))}
    </div>
  );
};
