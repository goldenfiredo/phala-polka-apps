import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

export interface GetInfoResp {
  initialized: boolean;
  blocknum: number;
  publicKey: string;
  ecdhPublicKey: string;
}

export interface TestReq {
  testBlockParse?: boolean;
  testBridge?: boolean;
  testEcdh?: TestEcdhParam;
}
export interface TestEcdhParam {
  pubkeyHex?: string;
  messageB64?: string;
}
export interface TestResp {}

export interface Payload {
  Plain?: string;
  Cipher?: AeadCipher;
}

export interface AeadCipher {
  ivB64: String;
  cipherB64: String;
  pubkeyB64: String;
}

export interface SignedQuery {
  query: string;
  origin?: Origin;
}

export interface Origin {
  origin: string;
  sig_b64: string;
  sig_type: 'ed25519' | 'sr25519' | 'ecdsa';
}

export interface Query<T> {
  contract_id: number;
  nonce: number;
  request: T;
}

const kRegexpEnumName = /^[A-Z][A-Za-z0-9]*$/;

// Loads the model and covnerts the snake case keys to camel case.
export function fromApi<T>(obj: {[key: string]: any}): T {
  return camelcaseKeys(obj, {deep: true, exclude: [kRegexpEnumName]}) as unknown as T;
}

export function toApi<T>(obj: T): any {
  return snakecaseKeys(obj, {deep: true, exclude: [kRegexpEnumName]});
}
