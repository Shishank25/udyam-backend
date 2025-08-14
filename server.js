require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const Joi = require("joi");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
app.locals.pool = pool;

// Joi validation schema
const formValidationSchema = Joi.object({
  aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),
  aadhaarName: Joi.string().max(100).required(),
  panNumber: Joi.string().pattern(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/).required(),
  panName: Joi.string().max(100).required(),
  dobAsPerPan: Joi.string().pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/[0-9]{4}$/).allow(null, ""),
  orgType: Joi.string().required()
});

app.get('/', async (req,res) => {
  return res.json({ message: "Hello World!"});
});


// POST endpoint
app.post("/submit-form", async (req, res) => {
  console.log(req.body);
  const { error } = formValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { aadhaarNumber, aadhaarName, panNumber, panName, dobAsPerPan, orgType } = req.body;

  const [day, month, year] = dobAsPerPan.split('/');
  const formattedDob = `${year}-${month}-${day}`; 

  try {
    const query = `
      INSERT INTO "udyamFormSubmissions" (aadhaar_number, aadhaar_name, pan_number, pan_name, dob_pan, org_type)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [aadhaarNumber, aadhaarName, panNumber, panName, formattedDob || null, orgType];
    const result = await pool.query(query, values);

    res.status(201).json({ message: "Form saved successfully", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

module.exports = app;


if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
