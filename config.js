module.exports = {
  THTNode: {
    chain: 'THT',
    host: 'localhost',
    protocol: 'http',
    rpcPort: '10617',
    rpcUser: 'username',
    rpcPass: 'password',
  },
  ETHNode: {
    chain: 'ETH',
    host: 'localhost',
    rpcPort: '8545',
    protocol: 'http',
    tokens: {
      WTHT: {
        tokenContractAddress: '0x800BdCE6CaA3fE2bfDB738383321278536e258f8',
        type: 'ERC20'
      }
    }
  }
};
