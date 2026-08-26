export const getVenueImage = (identifier: string): string => {
  if (!identifier) return '/images/venues/fallback.jpg';
  
  // Simple deterministic hash function for strings
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // We have 6 venue images (venue-1.jpg to venue-6.jpg)
  const imageIndex = (Math.abs(hash) % 6) + 1;
  return `/images/venues/venue-${imageIndex}.jpg`;
};

export const getFallbackImage = (): string => {
  return '/images/venues/fallback.jpg';
};
