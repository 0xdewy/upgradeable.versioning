const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');



const Example = artifacts.require('Example')
const Example2 = artifacts.require('Example2')
const Example3 = artifacts.require('Example3')
const Proxy = artifacts.require('Proxy')
const Resolver = artifacts.require("Resolver")



contract('Upgradeable', function (accounts) {
    const owner = accounts[0]
    const personA = accounts[1]
    const personB = accounts[2]

    let exampleStorage
    let exampleStorage2
    let exampleStorage3
    let proxy
    let resolver
    let exampleProxy
    let exampleProxy2
    let exampleProxy3


    it('deploy contracts', async function () {
        exampleStorage = await Example.new()
        exampleStorage2 = await Example2.new()
        exampleStorage3 = await Example3.new()
        proxy = await Proxy.new(exampleStorage.address)
        // initialize proxy contracts
        exampleProxy = await Example.at(proxy.address)
        exampleProxy2 = await Example2.at(proxy.address)
        exampleProxy3 = await Example3.at(proxy.address)

        console.log("example 1 address ", exampleStorage.address)
        console.log("example 2 address", exampleStorage2.address)
        console.log("example 3 address", exampleStorage3.address)
    });

    it('initialize resolver and check variables set properly', async function () {
        resolver = await Resolver.at(await proxy.resolver())
        console.log("resolver is ", resolver.address)
        assert.equal(await resolver.owner(), owner)
    })


    it('Set highest hash in example 1', async function () {
        await exampleProxy.setHighestHash('test', { from: personA })
        // Nonce not available in current implementation
        await shouldFail.reverting(exampleProxy2.nonce())
    })

    it('Upgrade to example2', async function () {
        // Upgrade to implementation 2, default version for user is set to 2
        await proxy.upgrade(exampleStorage2.address)
        assert.equal(exampleStorage2.address, await resolver.getUserVersion(personA))
        assert.equal(exampleStorage2.address, await proxy.implementation())

        assert.equal(true, await exampleProxy2.isHighest('test23'))
        await exampleProxy2.setHighestHash('test23')
        //
        // // Nonce is now available
        assert.equal(await exampleProxy2.nonce(), 1)
        assert.equal(await exampleProxy2.highestHash(), web3.utils.soliditySha3('test23'));

    })

    it('set user version preference to example1', async function () {
        let thisUser = personA;
        // set version preference to the first contract
        await resolver.setUserVersion(exampleStorage.address, { from: thisUser });
        // personA user is using the original example storage
        assert.equal(exampleStorage.address, await resolver.getUserVersion(thisUser));
        // ExampleStorage2 is still the default implementation
        assert.equal(exampleStorage2.address, await proxy.implementation());

        // Set new highest hash
        assert.equal(true, await exampleProxy.isHighest('testy'));
        await exampleProxy.setHighestHash('testy', { from: thisUser });
        assert.equal(web3.utils.soliditySha3('testy'), await exampleProxy.highestHash());

        // Nonce should still be 1 since this user is still using original implementation
        assert.equal(await exampleProxy2.nonce(), 1);
    });

    it('upgrade to example3', async function () {

        await proxy.upgrade(exampleStorage3.address)

        // User is using version1, while the current implementation is version 3
        assert.equal(exampleStorage.address, await resolver.getUserVersion(personA))
        assert.equal(exampleStorage3.address, await proxy.implementation())

        // User changes to version 3
        await resolver.setUserVersion(exampleStorage3.address, { from: personA });
        // personA user is using the latest version (3)
        assert.equal(exampleStorage3.address, await resolver.getUserVersion(personA));

        // Set new highest hash + add payment for latest version requirements
        assert.equal(true, await exampleProxy3.isHighest('testy..callz'));
        await exampleProxy3.setHighestHashPay('testy..callz', { from: personA, value: await exampleProxy3.fee() });
        // assert.equal(web3.utils.soliditySha3('testy..callz'), await exampleProxy3.highestHash());


    })

})
