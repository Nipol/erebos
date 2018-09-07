// @flow

import { keccak256 } from 'js-sha3'

const BZZ_KEY_LENGTH = 32
const MRU_META_HASH_LENGTH = BZZ_KEY_LENGTH
const MRU_ROOT_ADDR_LENGTH = BZZ_KEY_LENGTH
const MRU_UPDATE_VERSION_LENGTH = 4
const MRU_UPDATE_PERIOD_LENGTH = 4
const MRU_UPDATE_FLAG_LENGTH = 1
const MRU_UPDATE_DATA_LENGTH_LENGTH = 2
const MRU_UPDATE_HEADER_LENGTH_LENGTH = 2
const MRU_UPDATE_HEADER_LENGTH =
  MRU_META_HASH_LENGTH +
  MRU_ROOT_ADDR_LENGTH +
  MRU_UPDATE_VERSION_LENGTH +
  MRU_UPDATE_PERIOD_LENGTH +
  MRU_UPDATE_FLAG_LENGTH

const BUFFER_WRITE_SIZE = {
  1: 'writeUInt8',
  2: 'writeUInt16LE',
  4: 'writeUInt32LE',
}

export type DirectoryData = {
  [path: string]: { data: string | Buffer, contentType: string, size?: number },
}

export type FileEntry = {
  data: string | Buffer,
  path: string,
  size?: number,
}

export type ListEntry = {
  hash: string,
  path: string,
  contentType: string,
  size: number,
  mod_time: string,
}

export type ListResult = {
  common_prefixes?: Array<string>,
  entries?: Array<ListEntry>,
}

export type ResourceDigestParams = {
  period: number,
  version: number,
  multihash: boolean,
  data: Buffer | string,
  metaHash: string,
  rootAddr: string,
}

export const bufferFromHex = (value: string): Buffer => {
  return Buffer.from(value.substr(2), 'hex')
}

export const createBuffer = (size: 1 | 2 | 4, value: number): Buffer => {
  const writeFunc = BUFFER_WRITE_SIZE[size]
  if (writeFunc == null) {
    throw new Error('Invalid size')
  }
  const buffer = Buffer.allocUnsafe(size)
  buffer[writeFunc](value, 0)
  return buffer
}

const getBuffer = (size: number, value: string): Buffer => {
  const buffer = bufferFromHex(value)
  if (buffer.length !== size) {
    throw new Error('Invalid input')
  }
  return buffer
}

const HEADER_LENGTH_BUFFER = createBuffer(
  MRU_UPDATE_HEADER_LENGTH_LENGTH,
  MRU_UPDATE_HEADER_LENGTH,
)

export const createResourceDigest = (params: ResourceDigestParams): string => {
  const data = Buffer.isBuffer(params.data)
    ? params.data
    : bufferFromHex(params.data)
  const payload = Buffer.concat([
    HEADER_LENGTH_BUFFER,
    createBuffer(MRU_UPDATE_DATA_LENGTH_LENGTH, data.length),
    createBuffer(MRU_UPDATE_PERIOD_LENGTH, params.period),
    createBuffer(MRU_UPDATE_VERSION_LENGTH, params.version),
    getBuffer(MRU_ROOT_ADDR_LENGTH, params.rootAddr),
    getBuffer(MRU_META_HASH_LENGTH, params.metaHash),
    createBuffer(MRU_UPDATE_FLAG_LENGTH, params.multihash ? 1 : 0),
    data,
  ])
  return '0x' + keccak256(payload)
}

export const resOrError = (res: *) => {
  return res.ok
    ? Promise.resolve(res)
    : Promise.reject(new Error(res.statusText))
}

export const parseJSON = (res: *) => resOrError(res).then(r => r.json())
export const parseText = (res: *) => resOrError(res).then(r => r.text())

export type BzzParams = {
  fetch: *,
  FormData: *,
  url: string,
}

export default class BaseBzz {
  _fetch: *
  _FormData: *
  _url: string

  constructor(url: string) {
    this._url = new URL(url).toString()
  }

  upload(
    data: string | Buffer | DirectoryData,
    headers?: Object = {},
  ): Promise<string> {
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
      return this.uploadFile(data, headers)
    } else {
      return this.uploadDirectory(data)
    }
  }

  uploadDirectory(_directory: Object): Promise<string> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  downloadDirectory(_hash: string): Promise<string> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  uploadFile(data: string | Buffer, headers?: Object = {}): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    headers['content-length'] = body.length
    return this._fetch(`${this._url}bzz:/`, {
      body: body,
      headers: headers,
      method: 'POST',
    }).then(parseText)
  }

  uploadRaw(data: string | Buffer, headers?: Object = {}): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    headers['content-length'] = body.length
    return this._fetch(`${this._url}bzz-raw:/`, {
      body: body,
      headers: headers,
      method: 'POST',
    }).then(parseText)
  }

  download(hash: string, path?: string = ''): Promise<*> {
    const contentPath = path === '' ? '' : `/${path}`
    return this._fetch(`${this._url}bzz:/${hash}${contentPath}`)
  }

  downloadText(hash: string, path?: string = ''): Promise<string> {
    return this.download(hash, path).then(parseText)
  }

  downloadRaw(hash: string): Promise<*> {
    return this._fetch(`${this._url}bzz-raw:/${hash}`)
  }

  downloadRawText(hash: string): Promise<string> {
    return this.downloadRaw(hash).then(parseText)
  }

  listDirectory(hash: string): Promise<ListResult> {
    return this._fetch(`${this._url}bzz-list:/${hash}`).then(parseJSON)
  }

  getHash(url: string): Promise<string> {
    return this._fetch(`${this._url}bzz-hash:/${url}`).then(parseText)
  }
}
