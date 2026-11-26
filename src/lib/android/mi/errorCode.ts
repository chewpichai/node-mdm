export interface ErrorCodeInfo {
  code: number;
  desc: string;
  needRetry: boolean;
  serviceName: string;
}

const SERVICE_NAME = 'mifi-loan-market';

function createError(code: number, desc: string, needRetry = false): ErrorCodeInfo {
  return {
    code,
    desc,
    needRetry,
    serviceName: SERVICE_NAME
  };
}

export const ErrorCode = {
  SUCCESS: createError(0, '成功'),
  ERROR_UNKNOWN: createError(90000, 'General errors'),
  ERROR_UNKNOWN_RETRY: createError(90001, 'General errors need retry', true),
  ERROR_UNKNOWN_NOT_RETRY: createError(90002, 'General errors not need retry'),
  REQUEST_FAILED: createError(70001, '请求失败', true),
  ERROR_DECRYPT: createError(10000, '解密失败'),
  ERROR_VERIFY_SIGN: createError(10001, '签名验证失败'),
  ERROR_INVALID_PARAMS: createError(10002, '参数错误'),
  ERROR_REQUEST_EXPIRE: createError(10003, '请求过期'),
  ERROR_ENCRYPT: createError(10004, '加密失败'),
  ERROR_SIGN: createError(10005, '签名失败'),
  ERROR_GET_INSTRUCTION: createError(10006, '获取流水号'),
  CARD_PASSWORD_INVALID: createError(11002, '密码错误'),
  ILLEGAL_PROVIDER: createError(20000, '非法provider'),
  GET_ID_IMAGE_ERROR: createError(20001, '获取身份证照片失败', true),
  GET_FACE_COMPARE_IMAGE_ERROR: createError(20002, '获取扫脸照片失败', true),
  RESET_ACCESS_LIMIT_FAILED: createError(20003, '重置次数失败'),
  UPDATE_USER_PROFILE_FAILED: createError(20004, '更新userProfile失败'),
  ILLEGAL_CERT: createError(21004, '更新userProfile失败'),
  ANTI_FRAUD_FAILED: createError(21005, '用户反欺诈失败'),
  MESSAGE_VERIFY_INVALID_PARAMS: createError(30000, '短验参数错误'),
  MESSAGE_VERIFY_CODE_ERROR: createError(30001, '验证码错误'),
  MESSAGE_VERIFY_BIND_CARD_ERROR: createError(30002, '绑卡错误'),
  TICKET_NOT_USABLE: createError(40001, '优惠券不可用'),
  PAY_GENERIC_ERROR: createError(50000, '支用失败'),
  AMOUNT_NOT_USABLE: createError(50001, '当前额度不可用'),
  AMOUNT_NOT_REGULAR: createError(50002, '不支持当前支用金额'),
  AMOUNT_NOT_ENOUGH: createError(50003, '可用额度不足'),
  PAY_PROCESSING: createError(50004, '您有一笔借款正在放款中，稍后再试吧'),
  PAYMENT_NOT_FOUND: createError(51000, '未找到对应的借款记录'),
  BILLS_NOT_FOUND: createError(51001, '获取账单失败'),
  REPAY_GENERIC_ERROR: createError(53000, '还款失败'),
  USER_NOT_CREDITED_WITH_PRODUCT: createError(80000, '用户未注册或未授信'),
  THIRD_PARTY_OUT_OF_SERVICE: createError(80001, '第三方服务维护中，稍后再试'),
  USER_IS_CREDITING: createError(80002, '用户授信中，请等待授信结果'),
  CERT_INFO_NOT_SATISFIED: createError(80003, '用户认证信息不完善，不能申请认证'),
  PRODUCT_NOT_FOUND: createError(80004, '产品找不到'),
  USER_STATUS_ERROR: createError(80005, '用户状态异常'),
  CERT_PARAMS_INVALID: createError(80006, '用户信息有误'),
  ILLEGAL_TOKEN: createError(80007, 'token失效或有误'),
  PRODUCT_MAINTENANCE: createError(80008, '产品维护中'),
  MI_LOAN_INVALID: createError(80009, '小贷作废'),
  METHOD_NOT_SUPPORTED: createError(80010, '不支持的方法'),
  REQUEST_TIMES_LIMIT: createError(80011, '短时间内请求过多，请过段时间再重试')
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;
