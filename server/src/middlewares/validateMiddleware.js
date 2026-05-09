const { ZodError } = require('zod');

/**
 * Validates req.body, req.query, or req.params against a Zod schema.
 * Defaults to validating req.body.
 * 
 * @param {import('zod').ZodSchema} schema The Zod schema to validate against
 * @param {'body' | 'query' | 'params'} property The request property to validate
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      // Parse the data. If it fails, an error is thrown.
      // If it succeeds, replace the req property with the validated/parsed data
      // (which handles type coercion and default values if defined in the schema)
      req[property] = schema.parse(req[property]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the Zod errors into a readable structure
        // error.issues is the standard way to get the error list in Zod
        const issues = error.issues || error.errors || [];
        const formattedErrors = issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: formattedErrors
        });
      }

      // If it's not a ZodError, it's an unexpected error, pass to global handler
      next(error);
    }
  };
};

module.exports = validate;
