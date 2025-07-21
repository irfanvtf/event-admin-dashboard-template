import { uploadEventLocations } from '../services/eventLocationService';

// Event location data to upload
const eventLocationsData = [
  {
    location: 'Taiping',
    date: '18 / 05 / 2025',
    time: '9:00 AM',
    venue: 'Hotel Grand Baron',
    status: 'closed' as const
  },
  {
    location: 'Kuala Terengganu',
    date: 'To Be Confirmed',
    time: 'To Be Confirmed',
    venue: 'To Be Confirmed',
    status: 'upcoming' as const
  },
  {
    location: 'Kluang',
    date: 'To Be Confirmed',
    time: 'To Be Confirmed',
    venue: 'To Be Confirmed',
    status: 'upcoming' as const
  },
  {
    location: 'Kuching',
    date: 'To Be Confirmed',
    time: 'To Be Confirmed',
    venue: 'To Be Confirmed',
    status: 'upcoming' as const
  },
  {
    location: 'Melaka',
    date: 'To Be Confirmed',
    time: 'To Be Confirmed',
    venue: 'To Be Confirmed', 
    status: 'upcoming' as const
  }
];

// Function to upload the data
const uploadData = async () => {
  console.log('Starting to upload event locations...');
  
  try {
    const result = await uploadEventLocations(eventLocationsData);
    console.log(result.message);
  } catch (error) {
    console.error('Error in upload script:', error);
  }
};

// Execute the upload
uploadData();
