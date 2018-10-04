/* global fetch */

import BaseBzz, {
  getModeProtocol,
  HTTPError,
  resOrError,
  resJSON,
  resText,
} from '../packages/api-bzz-base'

describe('bzz-base', () => {
  const TEST_URL = 'https://example.com/swarm-gateways/'
  const bzz = new BaseBzz(TEST_URL)
  bzz._fetch = fetch // Injected by extending class

  beforeEach(() => {
    fetch.resetMocks()
  })

  it('exports getModeProtocol() utility function', () => {
    expect(getModeProtocol('default')).toBe('bzz:/')
    expect(getModeProtocol('immutable')).toBe('bzz-immutable:/')
    expect(getModeProtocol('raw')).toBe('bzz-raw:/')
    // Default to `bzz:/` when not provided or existing
    expect(getModeProtocol()).toBe('bzz:/')
    expect(getModeProtocol('test')).toBe('bzz:/')
  })

  it('exports HTTPError class extending Error', () => {
    const error = new HTTPError(404, 'Not found')
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
  })

  it('exports resOrError() utility function', async () => {
    const resOK = { ok: true }
    expect(await resOrError(resOK)).toBe(resOK)

    try {
      await resOrError({
        ok: false,
        status: 400,
        statusText: 'Bad request',
      })
    } catch (error) {
      expect(error instanceof HTTPError).toBe(true)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Bad request')
    }
  })

  it('exports resJSON() utility function', async () => {
    const data = await resJSON({
      ok: true,
      json: () => Promise.resolve({ test: true }),
    })
    expect(data).toEqual({ test: true })

    try {
      await resJSON({
        ok: false,
        status: 400,
        statusText: 'Bad request',
      })
    } catch (error) {
      expect(error instanceof HTTPError).toBe(true)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Bad request')
    }
  })

  it('exports resText() utility function', async () => {
    const data = await resText({
      ok: true,
      text: () => Promise.resolve('OK'),
    })
    expect(data).toBe('OK')

    try {
      await resText({
        ok: false,
        status: 400,
        statusText: 'Bad request',
      })
    } catch (error) {
      expect(error instanceof HTTPError).toBe(true)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Bad request')
    }
  })

  describe('Bzz class', () => {
    it('_getDownloadURL() creates the request URL for downloads', () => {
      // Default behavior
      expect(bzz._getDownloadURL('test', {})).toBe(`${TEST_URL}bzz:/test`)
      // Force raw
      expect(bzz._getDownloadURL('test', {}, true)).toBe(
        `${TEST_URL}bzz-raw:/test`,
      )
      // Handle `mode` option
      expect(bzz._getDownloadURL('test', { mode: 'immutable' })).toBe(
        `${TEST_URL}bzz-immutable:/test`,
      )
      expect(bzz._getDownloadURL('test', { mode: 'raw' })).toBe(
        `${TEST_URL}bzz-raw:/test`,
      )
      // Handle `path` option
      expect(bzz._getDownloadURL('test', { path: 'hello' })).toBe(
        `${TEST_URL}bzz:/test/hello`,
      )
      // Handle `contentType` option
      expect(
        bzz._getDownloadURL('test', { mode: 'raw', contentType: 'text/plain' }),
      ).toBe(`${TEST_URL}bzz-raw:/test?content_type=text/plain`)
      // Only set content type in raw mode
      expect(bzz._getDownloadURL('test', { contentType: 'text/plain' })).toBe(
        `${TEST_URL}bzz:/test`,
      )
    })

    it('_getUploadURL() creates the request URL for uploads', () => {
      // Default behavior
      expect(bzz._getUploadURL({})).toBe(`${TEST_URL}bzz:/`)
      // Force raw
      expect(bzz._getUploadURL({}, true)).toBe(`${TEST_URL}bzz-raw:/`)
      // Handle `manifestHash` option
      expect(bzz._getUploadURL({ manifestHash: '1234' })).toBe(
        `${TEST_URL}bzz:/1234/`,
      )
      // Handle `path` option
      expect(bzz._getUploadURL({ manifestHash: '1234', path: 'test' })).toBe(
        `${TEST_URL}bzz:/1234/test`,
      )
      // `path` option is ignored if `manifestHash` is not provided
      expect(bzz._getUploadURL({ path: 'test' })).toBe(`${TEST_URL}bzz:/`)
    })

    it('hash() returns the correct hash for a given URL', async () => {
      const expectedHash =
        '7a90587bfc04ac4c64aeb1a96bc84f053d3d84cefc79012c9a07dd5230dc1fa4'
      fetch.mockResponseOnce(expectedHash)
      const bzzUrl = 'theswarm.test'
      const response = await bzz.hash(bzzUrl)
      expect(response).toBe(expectedHash)
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz-hash:/${bzzUrl}`)
    })

    it('list() returns the metadata for a given manifest and path', async () => {
      const expectedData = { entries: [] }
      const mockData = JSON.stringify(expectedData)

      fetch.mockResponseOnce(mockData)
      const res = await bzz.list('test')
      expect(res).toEqual(expectedData)
      expect(fetch.mock.calls).toHaveLength(1)
      expect(fetch.mock.calls[0][0]).toBe(`${TEST_URL}bzz-list:/test`)

      fetch.mockResponseOnce(mockData)
      const resPath = await bzz.list('test', { path: 'a' })
      expect(resPath).toEqual(expectedData)
      expect(fetch.mock.calls).toHaveLength(2)
      expect(fetch.mock.calls[1][0]).toBe(`${TEST_URL}bzz-list:/test/a`)
    })

    it('_download() performs the request based on the given parameters and returns the response or error', async () => {
      fetch.mockResponseOnce('OK')
      const res = await bzz._download(
        'test',
        { mode: 'raw' },
        { accept: 'application/json' },
      )
      expect(res.body).toBe('OK')
      const [fetchUrl, { headers }] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz-raw:/test`)
      expect(headers).toEqual({ accept: 'application/json' })

      const expectedError = new HTTPError(404, 'Not found')
      fetch.mockRejectOnce(expectedError)
      try {
        await bzz._download('no', {})
      } catch (err) {
        expect(err).toBe(expectedError)
      }
    })

    it('download() calls _download() and returns the response', async () => {
      fetch.mockResponseOnce('OK')
      const res = await bzz.download('test')
      expect(res.body).toBe('OK')
      expect(fetch.mock.calls[0][0]).toBe(`${TEST_URL}bzz:/test`)
    })

    it('_upload() performs the request based on the given parameters and returns the response or error', async () => {
      fetch.mockResponseOnce('5678')
      const hash = await bzz._upload(
        'test',
        { manifestHash: '1234' },
        { 'content-length': 4 },
        true,
      )
      expect(hash).toBe('5678')
      const [fetchUrl, { headers }] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz-raw:/1234/`)
      expect(headers).toEqual({ 'content-length': 4 })

      const expectedError = new HTTPError(400, 'Bad request')
      fetch.mockRejectOnce(expectedError)
      try {
        await bzz._upload('test', {})
      } catch (err) {
        expect(err).toBe(expectedError)
      }
    })

    it('uploadFile() uploads a single file provided as string or Buffer', async () => {
      // Upload a string without content type
      fetch.mockResponseOnce('1234')
      const hash1 = await bzz.uploadFile('test')
      expect(hash1).toBe('1234')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl1, params1] = fetch.mock.calls[0]
      expect(fetchUrl1).toBe(`${TEST_URL}bzz-raw:/`)
      expect(params1.headers).toEqual({ 'content-length': 4 })

      // Upload a Buffer with content type
      fetch.mockResponseOnce('5678')
      const hash2 = await bzz.uploadFile(Buffer.from('hello'), {
        contentType: 'text/plain',
      })
      expect(hash2).toBe('5678')
      expect(fetch.mock.calls).toHaveLength(2)
      const [fetchUrl2, params2] = fetch.mock.calls[1]
      expect(fetchUrl2).toBe(`${TEST_URL}bzz:/`)
      expect(params2.headers).toEqual({
        'content-length': 5,
        'content-type': 'text/plain',
      })
    })

    it('uploadDirectory() rejects an error it must be implemented in extending class', () => {
      expect(bzz.uploadDirectory({})).rejects.toThrow(
        'Must be implemented in extending class',
      )
    })

    it('upload() calls uploadFile() or uploadDirectory() depending on the provided data', async () => {
      // Upload a string without content type
      fetch.mockResponseOnce('1234')
      const hash1 = await bzz.upload('test')
      expect(hash1).toBe('1234')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl1, params1] = fetch.mock.calls[0]
      expect(fetchUrl1).toBe(`${TEST_URL}bzz-raw:/`)
      expect(params1.headers).toEqual({ 'content-length': 4 })

      // Upload a Buffer with content type
      fetch.mockResponseOnce('5678')
      const hash2 = await bzz.upload(Buffer.from('hello'), {
        contentType: 'text/plain',
      })
      expect(hash2).toBe('5678')
      expect(fetch.mock.calls).toHaveLength(2)
      const [fetchUrl2, params2] = fetch.mock.calls[1]
      expect(fetchUrl2).toBe(`${TEST_URL}bzz:/`)
      expect(params2.headers).toEqual({
        'content-length': 5,
        'content-type': 'text/plain',
      })

      // Upload a directory
      expect(bzz.upload({})).rejects.toThrow(
        'Must be implemented in extending class',
      )
    })

    it('deleteResource() deletes the file in the given manifest and path and returns the new manifest hash', async () => {
      fetch.mockResponseOnce('5678')
      const hash = await bzz.deleteResource('1234', 'test')
      expect(hash).toBe('5678')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl, { method }] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz:/1234/test`)
      expect(method).toBe('DELETE')
    })
  })
})
