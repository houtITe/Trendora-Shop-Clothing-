class ApiResponse {
  constructor(success, message, data) {
    this.success = success;
    this.message = message;
    if (data !== undefined) this.data = data;
  }

  static success(res, { message = 'Success', data = {}, statusCode = 200 } = {}) {
    return res.status(statusCode).json(new ApiResponse(true, message, data));
  }

  static created(res, { message = 'Created', data = {} } = {}) {
    return ApiResponse.success(res, { message, data, statusCode: 201 });
  }
}

module.exports = ApiResponse;
