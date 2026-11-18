import ApiError from '../utils/apiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      return next(new ApiError(400, 'Validation Failed', errorMessages));
    }
    req.body = parsed.data;
    next();
  } catch (error) {
    next(new ApiError(400, 'Invalid request payload structure'));
  }
};

export default validate;
