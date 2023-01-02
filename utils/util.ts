import process from 'node:process';

import 'dotenv/config';
import { AES, enc } from 'crypto-js';
import { sign, verify, decode } from 'jsonwebtoken';

import type { classic } from '@pulumi/awsx';

const signingKey = process.env.SIGNING_KEY!;
const secretKey = process.env.SECRET_KEY!;
let INCREMENT = BigInt(0);

/**
 * Encrypts a key using AES encryption with a secret key
 * @param key - The key to encrypt
 * @returns The encrypted key
 */
export const cryptoEncrypt = (key: string) => {
  const token = key;
  // the length of the secret key determines the length of the sha
  return AES.encrypt(token, secretKey).toString();
};

/**
 * Decrypts a key using AES decryption with a secret key
 * @param key - The key to decrypt
 * @returns The decrypted key
 */
export const cryptoDecrypt = (key: string) => {
  const bytes = AES.decrypt(key, secretKey);
  return bytes.toString(enc.Utf8);
};

/**
 * Signs a JWT token with a signing key.
 * Expires in 30 days
 * @param id - The id of the user
 * @param email - The email of the user
 * @returns The signed JWT token
 */
export const jwtSign = (id: string, email: string) =>
  sign({ id, email }, signingKey, {
    expiresIn: '30d',
  });

/**
 * Decodes a JWT token
 * @param token - The JWT token to decode
 * @returns The decoded JWT token
 */
export const decodeJWT = (token: string) => {
  const decoded = decode(token) as { email: string; exp: number; iat: number; id: string } | null;
  return {
    data: decoded,
    success: Boolean(decoded),
  };
};

export const jwtVerify = (token: string) => {
  try {
    return {
      data: verify(token, signingKey),
      success: true,
    };
  } catch {
    return { data: null, success: false };
  }
};

export const generateFlake = (timestamp: Date | number, EPOCH: number) => {
  if (timestamp instanceof Date) timestamp = timestamp.getTime();
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    throw new TypeError(
      `"timestamp" argument must be a number (received ${Number.isNaN(timestamp) ? 'NaN' : typeof timestamp})`,
    );
  }

  if (INCREMENT >= 4_095n) INCREMENT = BigInt(0);

  // Assign WorkerId as 1 and ProcessId as 0:
  return ((BigInt(timestamp - EPOCH) << 22n) | (1n << 17n) | INCREMENT++).toString();
};

export const deconstruct = (snowflake: string, EPOCH: number) => {
  const bigIntSnowflake = BigInt(snowflake);
  return {
    timestamp: Number(bigIntSnowflake >> 22n) + EPOCH,
    get date() {
      return new Date(this.timestamp);
    },
    workerId: Number((bigIntSnowflake >> 17n) & 0b11111n),
    processId: Number((bigIntSnowflake >> 12n) & 0b11111n),
    increment: Number(bigIntSnowflake & 0b111111111111n),
    binary: bigIntSnowflake.toString(2).padStart(64, '0'),
  };
};

export const updateObject = (patchObject: object) => {
  let UpdateExpression = '';
  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, string> = {};

  for (const [key, value] of Object.entries(patchObject)) {
    // dynamically build the update expression based on the keys in the patch object
    UpdateExpression += `${UpdateExpression.length > 0 ? `, #${key} = :${key}` : `SET #${key} = :${key}`}`;
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = value;
  }

  return {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
};

/**
 * @param statusCode - HTTP status code
 * @param body - Response body
 */
export const populateResponse = (statusCode: STATUS_CODES, body: object | string) => ({
  statusCode,
  body: JSON.stringify(typeof body === 'string' ? { message: body } : body),
});

export enum STATUS_CODES {
  OK = 200,
  CREATED,
  ACCEPTED,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED,
  FORBIDDEN = 403,
  NOT_FOUND,
  METHOD_NOT_ALLOWED,
  NOT_ACCEPTABLE,
  CONFLICT = 409,
  PRECONDITION_FAILED = 412,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT,
}

export enum CUSTOM_ERROR_CODES {
  USER_NOT_FOUND = 1_000,
  USER_ALREADY_EXISTS,
  USER_NOT_AUTHORIZED,
  BODY_NOT_VALID,
  RESOURCE_NOT_FOUND,

  COMMENT_ERROR = 2_000,
  POST_ERROR,
  USER_ERROR,
}

export const makeCustomError = (message: string, code: CUSTOM_ERROR_CODES) => {
  const error = new Error(message);
  error.name = message;
  (error as any).code = code;
  return error;
};

export const pascalCase = (str: string) => {
  const words = str.split(' ');
  return words.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export type lambdaEvent = Omit<
  classic.apigateway.AuthorizerEvent,
  'apiId' | 'authorizationToken' | 'domainName' | 'methodArn' | 'type'
>;

export const postEpoch = 1_609_459_200_000;
export const userEpoch = 1_609_459_200_000;
export const commentEpoch = 1_609_459_200_000;

export const currentEndpoint =
  process.env.NODE_ENV === 'production'
    ? undefined
    : {
        endpoint: 'http://78.46.102.232:8000',
        region: 'ap-south-1',
        credentials: {
          accessKeyId: 'fakekeyid',
          secretAccessKey: 'fakekey,',
        },
      };
