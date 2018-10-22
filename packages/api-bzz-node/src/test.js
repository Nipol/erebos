import { randomBytes } from 'crypto'
import fetch from 'node-fetch'
import createKeccakHash from 'keccak'
import secp256k1 from 'secp256k1'
import { bufferFromHex, createFeedDigest } from '@erebos/api-bzz-base'

// let privateKey
// do {
//   privateKey = randomBytes(32)
// } while (!secp256k1.privateKeyVerify(privateKey))
//
// console.log('privateKey', privateKey.toString('hex'))

const sha3 = input => {
  return createKeccakHash('keccak256')
    .update(input)
    .digest()
}

const privateKey = Buffer.from(
  '92b4fbb92b0ad82d1af358b26798e714fdb516c8fa3b06b91680d33547c76176',
  'hex',
)
const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1)
console.log('publicKey length', publicKey.length)
const address =
  '0x' +
  sha3(publicKey)
    .slice(-20)
    .toString('hex')

console.log('address:', address)

const run = async () => {
  const data = Buffer.from('hello world')
  const feedReq = await fetch(
    `http://localhost:8500/bzz-feed:/?user=${address}&meta=1`,
  )
  const feedRequest = await feedReq.json()
  const digest = createFeedDigest(feedRequest, data)
  console.log('digest:', digest)
  const signed = secp256k1.sign(bufferFromHex(digest), privateKey)
  const signature = signed.signature.toString('hex')
  console.log('signature:', signature)

  const url = `http://localhost:8500/bzz-feed:/?user=${address}&topic=${
    feedRequest.feed.topic
  }&level=${feedRequest.epoch.level}&time=${
    feedRequest.epoch.time
  }&signature=${signature}`
  console.log('post to:', url)

  const updateReq = await fetch(url, { method: 'POST', body: data })
  console.log('updated?', updateReq.statusText)

  const readReq = await fetch(
    `http://localhost:8500/bzz-feed:/?user=${address}&topic=${
      feedRequest.feed.topic
    }`,
  )
  console.log('read?', readReq.statusText)
}

run().catch(console.error)
