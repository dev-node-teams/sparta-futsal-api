import { StatusCodes } from 'http-status-codes';

/**
 * 에러 핸들러
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export default function (err, req, res, next) {
  // JOI
  if (err.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: `${err.message}`,
    });
  } else if (err.name === 'PrismaClientValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: `요청 데이터값을 확인해주세요.`,
    });
  }

  return res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: err.statusCode ? err.message : `서버에서 오류가 발생했습니다. ${err.name}`,
  });
}
