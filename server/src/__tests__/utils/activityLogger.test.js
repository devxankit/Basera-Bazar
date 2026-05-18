'use strict';

// Need mongo connection for model registration — use the in-memory DB
const { connectTestDB, disconnectTestDB } = require('../setup/testHelpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

describe('logActivity', () => {
  let ActivityLog, logActivity;

  beforeAll(() => {
    ({ ActivityLog, logActivity } = require('../../utils/activityLogger'));
  });

  beforeEach(async () => {
    await ActivityLog.deleteMany({});
  });

  test('creates an ActivityLog document with required fields', async () => {
    await logActivity({
      action: 'created',
      entity_type: 'partner',
      entity_name: 'Test Partner',
      description: 'Partner was created',
    });

    const doc = await ActivityLog.findOne({ entity_type: 'partner' });
    expect(doc).not.toBeNull();
    expect(doc.action).toBe('created');
    expect(doc.description).toBe('Partner was created');
    expect(doc.actor_name).toBe('System');
  });

  test('uses provided actor_name and status', async () => {
    await logActivity({
      actor_name: 'Admin',
      action: 'approved',
      entity_type: 'subscription',
      description: 'Subscription approved',
      status: 'COMPLETED',
    });

    const doc = await ActivityLog.findOne({ entity_type: 'subscription' });
    expect(doc.actor_name).toBe('Admin');
    expect(doc.status).toBe('COMPLETED');
  });

  test('does not throw when invalid enum value is passed (swallows error)', async () => {
    await expect(
      logActivity({
        action: 'invalid_action_not_in_enum',
        entity_type: 'partner',
        description: 'test',
      })
    ).resolves.toBeUndefined();
  });
});
