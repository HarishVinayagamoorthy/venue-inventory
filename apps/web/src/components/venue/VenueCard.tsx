import React, { useState } from 'react';
import { MapPin, Users, Calendar } from 'lucide-react';
import { VenueSearchItemDTO } from 'shared-types';
import { getVenueImage, getFallbackImage } from '../../utils/imageUtils';

interface VenueProps {
  venue: VenueSearchItemDTO;
  onClick: (id: string) => void;
}

export const VenueCard: React.FC<VenueProps> = ({ venue, onClick }) => {
  const [imgSrc, setImgSrc] = useState<string>(getVenueImage(venue.venueSpaceId || `${venue.propertyName}-${venue.venueSpaceName}`));

  return (
    <div 
      onClick={() => onClick(venue.venueSpaceId)}
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-brand-charcoal/10 group-hover:bg-transparent transition-colors z-10" />
        <img 
          src={imgSrc} 
          alt={`${venue.propertyName} - ${venue.venueSpaceName}`}
          onError={() => setImgSrc(getFallbackImage())}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 z-20">
          {venue.availability === 'AVAILABLE' ? (
             <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Available</span>
          ) : venue.availability === 'HOLD' ? (
             <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">On Hold</span>
          ) : (
             <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">Unavailable</span>
          )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-brand-charcoal line-clamp-1">{venue.propertyName}</h3>
        <p className="text-sm font-medium text-gray-600 line-clamp-1 mb-2">{venue.venueSpaceName}</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{venue.area}, {venue.city}</span>
        </div>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-brand-orange" />
              Up to {venue.capacity} guests
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-brand-navy" />
              <span className="capitalize">{venue.session.replace('_', ' ').toLowerCase()}</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-lg font-bold text-brand-navy">
                ₹{Number(venue.price).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
