pragma solidity >=0.5.0;


contract Example {
    
    bytes32 public highestHash;   // The current highest hash

    // @notice if the sha3() hash of the string is higher than highest hash, replace highestHash with 'a'
    function setHighestHash(string memory a)
    public {
        bytes32 newHash = keccak256(abi.encodePacked(a));
        require(isHighest(a), "NOT HIGHEST HASH");
        highestHash = newHash;
    }

    // @dev checks if 'a' higher than the current highest hash
    function isHighest(string memory a)
    public
    view
    returns (bool) {
        return keccak256(abi.encodePacked(a)) > highestHash;
    }

}

// This upgrade adds an array, storing the previous hashes as well
contract Example2 is Example {
    // bytes32 public highestHash;
    uint256 public nonce;

    // @notice adds the nonce variable to the storage hierarchy
    function setHighestHash(string memory a)
    public {
        bytes32 newHash = keccak256(abi.encodePacked(a));
        require(isHighest(a), "NOT HIGHEST HASH");
        nonce++;
        highestHash = newHash;
    }
}

// This upgrade adds a function that requires a fee....users dont have to use this
contract Example3 is Example2 {
    // bytes32 public highestHash;
    // bytes32[] public previousHashes;
    uint public fee = 10;

    function setHighestHashPay(string memory a)
    public
    payable {
        require(msg.value == fee, "FEE REQUIRED");
        setHighestHash(a);
    }

}
