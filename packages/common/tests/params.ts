import * as tape from 'tape'
import Common from '../src/'

tape('[Common]: Parameter access for param(), paramByHardfork()', function (t: tape.Test) {
  t.test('Basic usage', function (st: tape.Test) {
    const c = new Common({ chain: 'mainnet', eips: ['EIP2537'] })
    let msg = 'Should return correct value when HF directly provided'
    st.equal(c.paramByHardfork('gasPrices', 'ecAdd', 'byzantium'), 500, msg)

    c.setHardfork('byzantium')
    msg = 'Should return correct value for HF set in class'
    st.equal(c.param('gasPrices', 'ecAdd'), 500, msg)

    msg = 'Should return null for non-existing value'
    st.equal(c.param('gasPrices', 'notexistingvalue'), null, msg)
    st.equal(c.paramByHardfork('gasPrices', 'notexistingvalue', 'byzantium'), null, msg)

    /*
    // Manual test since no test triggering EIP config available
    // TODO: recheck on addition of new EIP configs
    // To run please manually add an "ecAdd" entry with value 12345 to EIP2537 config
    // and uncomment the test
    msg = 'EIP config should take precedence over HF config'
    st.equal(c.param('gasPrices', 'ecAdd'), 12345, msg)
    */

    st.end()
  })

  t.test('Error cases for param(), paramByHardfork()', function (st: tape.Test) {
    let c = new Common({ chain: 'mainnet' })

    let f = function () {
      c.paramByHardfork('gasPrizes', 'ecAdd', 'byzantium')
    }
    let msg = 'Should throw when called with non-existing topic'
    st.throws(f, /Topic gasPrizes not defined$/, msg)

    c.setHardfork('byzantium')
    st.equal(c.param('gasPrices', 'ecAdd'), 500, 'Should return correct value for HF set in class')

    c = new Common({
      chain: 'mainnet',
      hardfork: 'byzantium',
      supportedHardforks: ['byzantium', 'constantinople'],
    })
    f = function () {
      c.paramByHardfork('gasPrices', 'expByte', 'spuriousDragon')
    }
    msg = 'Should throw when calling param() with an unsupported hardfork'
    st.throws(f, /supportedHardforks$/, msg)

    f = function () {
      c.paramByBlock('gasPrices', 'expByte', 0)
    }
    msg = 'Should throw when calling paramByBlock() with an unsupported hardfork'
    st.throws(f, /supportedHardforks$/, msg)

    st.end()
  })

  t.test('Parameter updates', function (st: tape.Test) {
    const c = new Common({ chain: 'mainnet' })

    let msg = 'Should return correct value for chain start'
    st.equal(c.paramByHardfork('pow', 'minerReward', 'chainstart'), '5000000000000000000', msg)

    msg = 'Should reflect HF update changes'
    st.equal(c.paramByHardfork('pow', 'minerReward', 'byzantium'), '3000000000000000000', msg)

    msg = 'Should return updated sstore gas prices for constantinople'
    st.equal(c.paramByHardfork('gasPrices', 'netSstoreNoopGas', 'constantinople'), 200, msg)

    msg = 'Should nullify SSTORE related values for petersburg'
    st.equal(c.paramByHardfork('gasPrices', 'netSstoreNoopGas', 'petersburg'), null, msg)

    st.end()
  })

  t.test('Access by block number, paramByBlock()', function (st: tape.Test) {
    const c = new Common({ chain: 'mainnet', hardfork: 'byzantium' })
    let msg = 'Should correctly translate block numbers into HF states (updated value)'
    st.equal(c.paramByBlock('pow', 'minerReward', 4370000), '3000000000000000000', msg)

    msg = 'Should correctly translate block numbers into HF states (original value)'
    st.equal(c.paramByBlock('pow', 'minerReward', 4369999), '5000000000000000000', msg)

    st.comment('-----------------------------------------------------------------')
    st.end()
  })

  t.test('EIP param access, paramByEIP()', function (st: tape.Test) {
    const c = new Common({ chain: 'mainnet' })

    let msg = 'Should return null for non-existing value'
    st.equal(c.paramByEIP('gasPrices', 'notexistingvalue', 'EIP2537'), null, msg)

    let f = function () {
      c.paramByEIP('gasPrices', 'Bls12381G1AddGas', 'NOT_SUPPORTED_EIP')
    }
    msg = 'Should throw for using paramByEIP() with a not supported EIP'
    st.throws(f, /not supported$/, msg)

    f = function () {
      c.paramByEIP('notExistingTopic', 'Bls12381G1AddGas', 'EIP2537')
    }
    msg = 'Should throw for using paramByEIP() with a not existing topic'
    st.throws(f, /not defined$/, msg)

    msg = 'Should return Bls12381G1AddGas gas price for EIP2537'
    st.equal(c.paramByEIP('gasPrices', 'Bls12381G1AddGas', 'EIP2537'), 600, msg)
    st.end()
  })

  t.test('Custom chain usage', function (st: tape.Test) {
    const mainnetCommon = new Common({ chain: 'mainnet' })

    const customChainParams = { name: 'custom', chainId: 123, networkId: 678 }
    const customChainCommon = Common.forCustomChain('mainnet', customChainParams, 'byzantium')

    // From custom chain params
    st.equal(customChainCommon.chainName(), customChainParams.name)
    st.equal(customChainCommon.chainId(), customChainParams.chainId)
    st.equal(customChainCommon.networkId(), customChainParams.networkId)

    // Fallback params from mainnet
    st.equal(customChainCommon.genesis(), mainnetCommon.genesis())
    st.equal(customChainCommon.bootstrapNodes(), mainnetCommon.bootstrapNodes())
    st.equal(customChainCommon.hardforks(), mainnetCommon.hardforks())

    // Set only to this Common
    st.equal(customChainCommon.hardfork(), 'byzantium')

    st.end()
  })
})
