import { createKeyPair, pubKeyToAddress } from '@erebos/api-bzz-base'
import Bzz from '.'

const keyPair = createKeyPair(
  'feedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed',
)
const address = pubKeyToAddress(keyPair.getPublic())
console.log('address:', address)

const run = async () => {
  const bzz = new Bzz('https://swarm-gateways.net')

  await bzz.postFeedValue(keyPair, { hello: 'world' }, { name: 'hello' })
  console.log('POST done')

  const res = await bzz.getFeedValue(address, { name: 'hello' })
  console.log('GET status', res.statusText)

  const value = await res.json()
  console.log('feed value:', value)
}

run().catch(console.error)
