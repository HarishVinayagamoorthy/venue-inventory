import fetch from 'node-fetch';

const getVenueImage = (identifier: string): string => {
  if (!identifier) return '/images/venues/fallback.jpg';
  
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const imageIndex = (Math.abs(hash) % 6) + 1;
  return `/images/venues/venue-${imageIndex}.jpg`;
};

async function verifyImages() {
  console.log('Fetching venues from API...');
  try {
    const res = await fetch('http://localhost:4000/api/venues'); // Adjust URL if necessary
    const data = await res.json();
    
    if (!data.success || !data.data || !data.data.items) {
      console.error('Failed to parse API response');
      return;
    }

    const venues = data.data.items;
    const totalVenueSpaces = venues.length;
    
    const imageToVenues: Record<string, string[]> = {};
    let uniqueImagesAssigned = new Set<string>();

    venues.forEach((venue: any) => {
      const spaceId = venue.venueSpaceId;
      const spaceName = venue.venueSpaceName;
      const propertyName = venue.propertyName;
      
      const imagePath = getVenueImage(spaceId);
      uniqueImagesAssigned.add(imagePath);

      if (!imageToVenues[imagePath]) {
        imageToVenues[imagePath] = [];
      }
      imageToVenues[imagePath].push(`${propertyName} - ${spaceName} (${spaceId})`);
    });

    console.log(`\n============================`);
    console.log(`UNIQUE VENUE IMAGE REPORT`);
    console.log(`============================\n`);
    
    console.log(`TOTAL VENUE SPACES: ${totalVenueSpaces}`);
    console.log(`UNIQUE IMAGE ASSETS IN POOL: 6 (Quota limited)`);
    console.log(`UNIQUE IMAGES ASSIGNED: ${uniqueImagesAssigned.size} / ${totalVenueSpaces}\n`);
    
    let collisionCount = 0;
    
    for (const [img, spaces] of Object.entries(imageToVenues)) {
      if (spaces.length > 1) {
        collisionCount += spaces.length - 1;
      }
    }
    
    console.log(`IMAGE COLLISIONS (Shared Images): ${collisionCount}`);
    console.log(`\nNote: As the image pool is constrained to 6 due to quota limitations, multiple spaces will inevitably share images.`);
    
  } catch (err) {
    console.error('Error verifying images:', err);
  }
}

verifyImages();
