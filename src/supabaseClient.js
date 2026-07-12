// Mock data store to simulate a database for development
export const mockDataStore = {
  participants: [
    {
      id: '1',
      name: 'Max Mustermann',
      startort: 'München',
      transport: 'auto',
      hasSpace: true,
      anreise: '2026-08-10',
      abreise: '2026-08-15',
      arrival_date: '2026-08-10',
      departure_date: '2026-08-15',
      schlafplatz: 'Reggae Hut',
      status: 'approved'
    },
    {
      id: '2',
      name: 'Lisa Schmidt',
      startort: 'Berlin',
      transport: 'zug',
      hasSpace: false,
      anreise: '2026-08-11',
      abreise: 'offen',
      arrival_date: '2026-08-11',
      departure_date: 'offen',
      schlafplatz: 'Haus',
      status: 'pending'
    },
    {
      id: '3',
      name: 'Tim Taylor',
      startort: 'Hamburg',
      transport: 'motorrad',
      hasSpace: false,
      anreise: '2026-08-10',
      abreise: '2026-08-17',
      arrival_date: '2026-08-10',
      departure_date: '2026-08-17',
      schlafplatz: 'Eigenes Zelt',
      status: 'rejected'
    },
    {
      id: '4',
      name: 'Vergangener Gast (Test)',
      startort: 'Stuttgart',
      transport: 'auto',
      hasSpace: false,
      arrival_date: '2026-01-10',
      departure_date: '2026-01-15',
      schlafplatz: 'Reggae Hut',
      status: 'approved',
      notes: 'Sollte nur für Admins sichtbar sein'
    }
  ]
}

// Simulated API calls for future real integration
export const fetchParticipants = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDataStore.participants])
    }, 400)
  })
}
