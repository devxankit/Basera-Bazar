'use strict';

jest.mock('../../models/System', () => ({
  Notification: {
    create: jest.fn(),
  },
}));
jest.mock('../../models/Partner', () => ({
  Partner: { findById: jest.fn() },
}));
jest.mock('../../models/User', () => ({
  User: { findById: jest.fn() },
}));
jest.mock('../../models/Staff', () => ({
  TeamLeader: { findById: jest.fn() },
  OfficeStaff: { findById: jest.fn() },
}));
jest.mock('../../services/firebaseAdmin', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const { Notification } = require('../../models/System');
const { Partner } = require('../../models/Partner');
const { TeamLeader, OfficeStaff } = require('../../models/Staff');
const { createNotification } = require('../../utils/notificationHelper');

const FAKE_NOTIF = { _id: 'notif_id_1', title: 'Test', body: 'Hello' };

// The helper does `Partner.findById(id).select(...)`, so the mock must return a
// query-like object whose .select() resolves to the recipient (or null).
const asQuery = (val) => ({ select: jest.fn().mockResolvedValue(val) });

beforeEach(() => {
  jest.clearAllMocks();
  Notification.create.mockResolvedValue(FAKE_NOTIF);
});

describe('createNotification', () => {
  test('creates a Notification document and returns it', async () => {
    Partner.findById.mockReturnValue(asQuery(null));
    const result = await createNotification('partner', 'partner123', 'Hello', 'World');
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_type: 'partner',
        recipient_id: 'partner123',
        title: 'Hello',
        body: 'World',
      })
    );
    expect(result).toEqual(FAKE_NOTIF);
  });

  test('sends push notification when recipient has FCM tokens', async () => {
    const { sendPushNotification } = require('../../services/firebaseAdmin');
    Partner.findById.mockReturnValue(asQuery({ fcmTokens: ['token1'], fcmTokenMobile: [] }));

    await createNotification('partner', 'p1', 'Title', 'Body');
    expect(sendPushNotification).toHaveBeenCalledWith(
      ['token1'],
      expect.objectContaining({ title: 'Title', body: 'Body' })
    );
  });

  test('skips push notification when no FCM tokens', async () => {
    const { sendPushNotification } = require('../../services/firebaseAdmin');
    Partner.findById.mockReturnValue(asQuery({ fcmTokens: [], fcmTokenMobile: [] }));

    await createNotification('partner', 'p1', 'T', 'B');
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  test('returns null and swallows error when Notification.create throws', async () => {
    Notification.create.mockRejectedValue(new Error('DB error'));
    const result = await createNotification('partner', 'p1', 'T', 'B');
    expect(result).toBeNull();
  });

  test('de-duplicates FCM tokens before sending', async () => {
    const { sendPushNotification } = require('../../services/firebaseAdmin');
    Partner.findById.mockReturnValue(asQuery({ fcmTokens: ['tok1', 'tok1'], fcmTokenMobile: ['tok1'] }));

    await createNotification('partner', 'p1', 'T', 'B');
    const tokens = sendPushNotification.mock.calls[0][0];
    expect(tokens).toEqual(['tok1']);
  });

  test('sends push notification to team_leader using TeamLeader model', async () => {
    const { sendPushNotification } = require('../../services/firebaseAdmin');
    TeamLeader.findById.mockReturnValue(asQuery({ fcmTokens: ['tl_token'] }));

    await createNotification('team_leader', 'tl1', 'TL Title', 'TL Body');
    expect(TeamLeader.findById).toHaveBeenCalledWith('tl1');
    expect(sendPushNotification).toHaveBeenCalledWith(
      ['tl_token'],
      expect.objectContaining({ title: 'TL Title', body: 'TL Body' })
    );
  });

  test('sends push notification to office_staff using OfficeStaff model', async () => {
    const { sendPushNotification } = require('../../services/firebaseAdmin');
    OfficeStaff.findById.mockReturnValue(asQuery({ fcmTokens: ['os_token'] }));

    await createNotification('office_staff', 'os1', 'OS Title', 'OS Body');
    expect(OfficeStaff.findById).toHaveBeenCalledWith('os1');
    expect(sendPushNotification).toHaveBeenCalledWith(
      ['os_token'],
      expect.objectContaining({ title: 'OS Title', body: 'OS Body' })
    );
  });
});
