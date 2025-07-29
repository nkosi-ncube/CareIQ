import type { Consultation } from './types';

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
