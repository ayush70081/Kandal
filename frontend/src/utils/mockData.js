// Mock data for testing the mangrove monitoring system

export const mockReports = [
  {
    _id: '1',
    title: 'Illegal Mangrove Cutting in Coastal Area',
    incidentType: 'illegal_cutting',
    description: 'Observed several mangrove trees being cut down illegally in the protected coastal area. Heavy machinery was present and multiple trees have been removed.',
    severity: 'high',
    status: 'pending',
    location: {
      latitude: 1.3521,
      longitude: 103.8198
    },
    address: {
      street: 'Coastal Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '123456'
    },
    reporter: {
      name: 'John Doe',
      _id: 'user1'
    },
    photos: ['photo1.jpg', 'photo2.jpg'],
    tags: 'urgent, illegal-cutting, coastal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Waste Dumping Near Mangrove Forest',
    incidentType: 'dumping',
    description: 'Large amounts of industrial waste dumped near the mangrove forest. The waste appears to be chemical in nature and is affecting the water quality.',
    severity: 'critical',
    status: 'reviewing',
    location: {
      latitude: 1.3421,
      longitude: 103.8298
    },
    address: {
      street: 'Industrial Park Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '234567'
    },
    reporter: {
      name: 'Marine Conservation Society',
      _id: 'user2'
    },
    photos: ['photo3.jpg'],
    tags: 'pollution, waste, chemical',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: '3',
    title: 'Coastal Erosion Affecting Mangroves',
    incidentType: 'erosion',
    description: 'Significant coastal erosion observed affecting the mangrove root systems. Several mature trees are at risk of falling due to soil erosion.',
    severity: 'medium',
    status: 'verified',
    location: {
      latitude: 1.3621,
      longitude: 103.8098
    },
    address: {
      street: 'Beach Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '345678'
    },
    reporter: {
      name: 'Environmental Research Team',
      _id: 'user3'
    },
    photos: ['photo4.jpg', 'photo5.jpg', 'photo6.jpg'],
    tags: 'erosion, natural, monitoring',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: '4',
    title: 'Oil Spill Impact Assessment',
    incidentType: 'oil_spill',
    description: 'Small oil spill detected near mangrove area. Immediate cleanup required to prevent further environmental damage.',
    severity: 'high',
    status: 'investigating',
    location: {
      latitude: 1.3721,
      longitude: 103.7998
    },
    address: {
      street: 'Harbor Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '456789'
    },
    reporter: {
      name: 'Coast Guard',
      _id: 'user4'
    },
    photos: ['photo7.jpg'],
    tags: 'oil-spill, emergency, cleanup',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: '5',
    title: 'Wildlife Disturbance in Protected Area',
    incidentType: 'wildlife_disturbance',
    description: 'Tourist activities disturbing nesting birds in the mangrove area. Boats getting too close to sensitive wildlife habitats.',
    severity: 'low',
    status: 'resolved',
    location: {
      latitude: 1.3321,
      longitude: 103.8398
    },
    address: {
      street: 'Nature Reserve Path',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '567890'
    },
    reporter: {
      name: 'Wildlife Protection Group',
      _id: 'user5'
    },
    photos: ['photo8.jpg', 'photo9.jpg'],
    tags: 'wildlife, tourism, protection',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const mockUser = {
  _id: 'current_user',
  name: 'Conservation Officer',
  email: 'officer@mangrove.org',
  points: 150,
  stats: {
    reportsSubmitted: 3,
    reportsValidated: 5,
    contributionLevel: 'Silver'
  },
  badges: ['first_report', 'validator', 'conservationist'],
  location: {
    city: 'Singapore',
    state: 'Singapore',
    country: 'Singapore'
  },
  createdAt: new Date(Date.now() - 2592000000).toISOString() // 30 days ago
};

export const mockBadges = [
  {
    _id: 'first_report',
    name: 'First Reporter',
    description: 'Submitted your first incident report',
    icon: 'AWARD',
    category: 'achievement',
    criteria: {
      type: 'report_count',
      threshold: 1
    },
    points: 10
  },
  {
    _id: 'validator',
    name: 'Report Validator',
    description: 'Validated 5 incident reports',
    icon: 'CHECK',
    category: 'validation',
    criteria: {
      type: 'validation_count',
      threshold: 5
    },
    points: 25
  },
  {
    _id: 'conservationist',
    name: 'Conservation Hero',
    description: 'Made significant contributions to mangrove protection',
    icon: 'LEAF',
    category: 'expertise',
    criteria: {
      type: 'points',
      threshold: 100
    },
    points: 50
  }
];

// Mock API responses
export const mockApiResponses = {
  '/auth/profile': {
    success: true,
    user: mockUser
  },
  '/reports': {
    success: true,
    reports: mockReports,
    total: mockReports.length,
    page: 1,
    limit: 10
  },
  '/reports/stats': {
    success: true,
    stats: {
      totalReports: mockReports.length,
      pendingReports: mockReports.filter(r => r.status === 'pending').length,
      verifiedReports: mockReports.filter(r => r.status === 'verified').length,
      criticalReports: mockReports.filter(r => r.severity === 'critical').length
    }
  }
};