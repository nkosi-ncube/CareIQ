/**
 * @jest-environment node
 */

import dbConnect from '@/lib/db';
import User from '@/models/User';
import DiagnosticTest from '@/models/DiagnosticTest';
import { createDiagnosticTest, getDiagnosticTests, updateDiagnosticTest, deleteDiagnosticTest } from '@/lib/actions';
import * as actions from '@/lib/actions';

// Mock getSession
jest.mock('@/lib/actions', () => {
  const originalModule = jest.requireActual('@/lib/actions');
  return {
    ...originalModule,
    getSession: jest.fn(),
  };
});

const mockedGetSession = actions.getSession as jest.Mock;

describe('DiagnosticTest CRUD Actions', () => {
  let connection: any;
  let testUser: any;

  beforeAll(async () => {
    connection = await dbConnect();
    // Create a dummy user for testing
    testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      role: 'patient',
      paymentMethod: 'card'
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: testUser._id });
    await connection.disconnect();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await DiagnosticTest.deleteMany({ user: testUser._id });
    // Mock the session for each test
    mockedGetSession.mockResolvedValue({
      id: testUser._id.toString(),
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
    });
  });

  it('should create a new diagnostic test', async () => {
    const testData = {
      name: 'Blood Sugar',
      result: '5.0 mmol/L',
      date: new Date().toISOString(),
    };

    const response = await createDiagnosticTest(testData);
    expect(response.success).toBe(true);

    const createdTest = await DiagnosticTest.findOne({ name: 'Blood Sugar' });
    expect(createdTest).not.toBeNull();
    expect(createdTest?.result).toBe('5.0 mmol/L');
  });

  it('should retrieve all diagnostic tests for a user', async () => {
    await DiagnosticTest.create([
      { user: testUser._id, name: 'Test A', result: 'A', date: new Date() },
      { user: testUser._id, name: 'Test B', result: 'B', date: new Date() },
    ]);

    const response = await getDiagnosticTests();
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(2);
  });

  it('should update a diagnostic test', async () => {
    const test = await DiagnosticTest.create({
      user: testUser._id,
      name: 'Cholesterol',
      result: '4.8 mmol/L',
      date: new Date(),
    });

    const updatedData = {
      id: test._id.toString(),
      name: 'Cholesterol Level',
      result: '4.5 mmol/L',
      date: test.date.toISOString(),
    };

    const response = await updateDiagnosticTest(updatedData);
    expect(response.success).toBe(true);

    const updatedTest = await DiagnosticTest.findById(test._id);
    expect(updatedTest?.name).toBe('Cholesterol Level');
    expect(updatedTest?.result).toBe('4.5 mmol/L');
  });

  it('should delete a diagnostic test', async () => {
    const test = await DiagnosticTest.create({
      user: testUser._id,
      name: 'To Be Deleted',
      result: 'N/A',
      date: new Date(),
    });

    const response = await deleteDiagnosticTest(test._id.toString());
    expect(response.success).toBe(true);

    const deletedTest = await DiagnosticTest.findById(test._id);
    expect(deletedTest).toBeNull();
  });
});
