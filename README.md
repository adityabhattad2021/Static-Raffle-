# Static Raffle with custom number of winner.

The participant's unique transection hashes along with the number of winners are to be passed while deploying the raffle.
It the raffle can only be triggered by the raffle admin, once triggered it requests random number from chainlink VRF and the winners are added to the new array hence the raffle is concluded.

Build using: Hardhat, Solidity, Chainlink VRF

To run locally:
```shell
git clone https://github.com/adityabhattad2021/Static-Raffle-.git
cd Static-Raffle-
npm install
```


Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
```
