import type { Consultation, Patient, HCP } from './types';

export const mockConsultations: Consultation[] = [
  {
    id: '1',
    date: '2023-10-26',
    doctor: 'Dr. Evelyn Reed',
    specialty: 'Cardiology',
    symptoms: 'Experiencing occasional chest tightness and shortness of breath, especially during exercise.',
    diagnosis: 'Early signs of exertional angina. Recommended stress test and lifestyle modifications.'
  },
  {
    id: '2',
    date: '2024-01-15',
    doctor: 'Dr. Samuel Chen',
    specialty: 'Dermatology',
    symptoms: 'Persistent dry, itchy rash on elbows and knees. Worsens in cold weather.',
    diagnosis: 'Psoriasis. Prescribed topical corticosteroids and recommended moisturizing regimen.'
  },
  {
    id: '3',
    date: '2024-04-02',
    doctor: 'Dr. Maria Garcia',
    specialty: 'Gastroenterology',
    symptoms: 'Frequent bloating, gas, and abdominal discomfort after meals.',
    diagnosis: 'Suspected Irritable Bowel Syndrome (IBS). Advised dietary changes and food diary.'
  },
];

export const patientDetails = {
  name: "Alex Doe",
  age: 34,
  knownConditions: ["Psoriasis", "Seasonal Allergies"],
};

export const mockPatients: Patient[] = [
    {
      id: 'p1',
      name: 'Liam Neeson',
      age: 65,
      lastConsultation: '2024-05-10',
      riskLevel: 'Medium',
      symptoms: 'Persistent cough and fatigue',
      avatarUrl: '/avatars/01.png',
    },
    {
      id: 'p2',
      name: 'Emma Watson',
      age: 33,
      lastConsultation: '2024-05-12',
      riskLevel: 'Low',
      symptoms: 'Mild seasonal allergies',
      avatarUrl: '/avatars/02.png',
    },
    {
        id: 'p3',
        name: 'Denzel Washington',
        age: 68,
        lastConsultation: '2024-04-28',
        riskLevel: 'High',
        symptoms: 'High blood pressure readings and occasional dizziness',
        avatarUrl: '/avatars/03.png',
    },
    {
        id: 'p4',
        name: 'Scarlett Johansson',
        age: 39,
        lastConsultation: '2024-05-15',
        riskLevel: 'Low',
        symptoms: 'Follow-up for skin rash',
        avatarUrl: '/avatars/04.png',
    },
    {
        id: 'p5',
        name: 'Tom Hanks',
        age: 67,
        lastConsultation: '2024-05-01',
        riskLevel: 'Medium',
        symptoms: 'Managing Type 2 Diabetes, stable',
        avatarUrl: '/avatars/05.png',
    },
    {
        id: 'p6',
        name: 'Zendaya Coleman',
        age: 27,
        lastConsultation: '2024-05-18',
        riskLevel: 'Low',
        symptoms: 'Annual physical exam',
        avatarUrl: '/avatars/06.png',
    }
];

export const mockHCP: HCP = {
    name: 'Dr. Evelyn Reed',
    practiceNumber: 'HCP123456',
    email: 'evelyn.reed@careiq.pro'
}
