'use strict';

const {
  withdrawalRequestSchema,
  executiveBankDetailsSchema,
  loginSchema,
  idParamSchema
} = require('../utils/validators');

// ---------------------------------------------------------------------------
// withdrawalRequestSchema
// ---------------------------------------------------------------------------
describe('withdrawalRequestSchema', () => {
  const parse = (data) => withdrawalRequestSchema.safeParse(data);

  test('accepts a valid integer amount at minimum threshold', () => {
    expect(parse({ amount: 100 }).success).toBe(true);
  });

  test('accepts a large valid amount', () => {
    expect(parse({ amount: 50000 }).success).toBe(true);
  });

  test('rejects amount below minimum (99)', () => {
    const result = parse({ amount: 99 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/100/);
  });

  test('rejects zero', () => {
    expect(parse({ amount: 0 }).success).toBe(false);
  });

  test('rejects negative amount', () => {
    expect(parse({ amount: -500 }).success).toBe(false);
  });

  test('rejects float amount', () => {
    const result = parse({ amount: 150.5 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/whole number/i);
  });

  test('rejects string amount', () => {
    const result = parse({ amount: '500' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/number/i);
  });

  test('rejects missing amount', () => {
    expect(parse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// executiveBankDetailsSchema
// ---------------------------------------------------------------------------
describe('executiveBankDetailsSchema', () => {
  const validBank = {
    account_number: '123456789012',
    ifsc_code: 'SBIN0001234',
    bank_name: 'State Bank of India',
    account_holder_name: 'Ramesh Kumar'
  };

  const parse = (data) => executiveBankDetailsSchema.safeParse(data);

  test('accepts valid bank details', () => {
    expect(parse(validBank).success).toBe(true);
  });

  test('rejects account number shorter than 9 digits', () => {
    expect(parse({ ...validBank, account_number: '12345678' }).success).toBe(false);
  });

  test('rejects account number longer than 18 digits', () => {
    expect(parse({ ...validBank, account_number: '1234567890123456789' }).success).toBe(false);
  });

  test('rejects malformed IFSC code', () => {
    expect(parse({ ...validBank, ifsc_code: 'INVALID' }).success).toBe(false);
  });

  test('accepts standard IFSC format', () => {
    expect(parse({ ...validBank, ifsc_code: 'HDFC0001234' }).success).toBe(true);
  });

  test('rejects empty bank name', () => {
    expect(parse({ ...validBank, bank_name: 'A' }).success).toBe(false);
  });

  test('rejects empty account holder name', () => {
    expect(parse({ ...validBank, account_holder_name: 'A' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  const parse = (data) => loginSchema.safeParse(data);

  test('accepts valid credentials', () => {
    expect(parse({ identifier: '9876543210', password: 'secret123' }).success).toBe(true);
  });

  test('accepts optional role field', () => {
    expect(parse({ identifier: 'user@example.com', password: 'pass', role: 'partner' }).success).toBe(true);
  });

  test('rejects missing identifier', () => {
    expect(parse({ password: 'secret' }).success).toBe(false);
  });

  test('rejects empty identifier', () => {
    expect(parse({ identifier: '', password: 'secret' }).success).toBe(false);
  });

  test('rejects missing password', () => {
    expect(parse({ identifier: '9876543210' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// idParamSchema
// ---------------------------------------------------------------------------
describe('idParamSchema', () => {
  const parse = (data) => idParamSchema.safeParse(data);

  test('accepts a valid 24-char hex ObjectId', () => {
    expect(parse({ id: '507f1f77bcf86cd799439011' }).success).toBe(true);
  });

  test('rejects a 23-char id', () => {
    expect(parse({ id: '507f1f77bcf86cd79943901' }).success).toBe(false);
  });

  test('rejects id with non-hex characters', () => {
    expect(parse({ id: '507f1f77bcf86cd79943901g' }).success).toBe(false);
  });

  test('rejects empty string', () => {
    expect(parse({ id: '' }).success).toBe(false);
  });

  test('rejects missing id', () => {
    expect(parse({}).success).toBe(false);
  });
});
