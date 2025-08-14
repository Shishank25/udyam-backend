const request = require('supertest');
const {pool} = require('pg');
const app = require('../server'); // adjust path to your Express app

describe('POST /submit-form', () => {
  const validPayload = {
    aadhaarNumber: '123456789012',
    aadhaarName: 'John Doe',
    panNumber: 'ABCDE1234F',
    panName: 'John Doe',
    dobAsPerPan: '01/01/2000',
    orgType: '5'
  };

  test('returns 400 if Aadhaar Number is invalid', async () => {
    const res = await request(app)
      .post('/submit-form')
      .send({ ...validPayload, aadhaarNumber: 'abc' }); // invalid

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/aadhaar/i);
  });

  test('returns 400 if PAN Number is invalid', async () => {
    const res = await request(app)
      .post('/submit-form')
      .send({ ...validPayload, panNumber: '1234' }); // invalid

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/pan/i);
  });

  test('returns 400 if date format is wrong', async () => {
    const res = await request(app)
      .post('/submit-form')
      .send({ ...validPayload, dobAsPerPan: '2000-01-01' }); // wrong format

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/dob/i);
  });

  test('returns 400 if orgType is missing', async () => {
    const res = await request(app)
      .post('/submit-form')
      .send({ ...validPayload, orgType: undefined });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/orgType/i);
  });

  test('returns 201 and saves to DB if all data is valid', async () => {
    const res = await request(app)
      .post('/submit-form')
      .send(validPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/saved successfully/i);
    expect(res.body.data).toHaveProperty('aadhaar_number', validPayload.aadhaarNumber);
  });

  afterAll(async () => {
    // Close PostgreSQL pool to prevent open handle
    await app.locals.pool.end(); // if you attach pool to app
  });
});
