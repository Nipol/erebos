/**
 * @jest-environment node
 */

import { PssAPI, createRPC } from '../packages/swarm-node'

describe('pss', () => {
  it('PSS test', async () => {
    const alice = new PssAPI(createRPC('ws://127.0.0.1:8540'))
    const [key, topic] = await Promise.all([
      alice.getPublicKey(),
      alice.stringToTopic('PSS rocks'),
    ])
  })
})
