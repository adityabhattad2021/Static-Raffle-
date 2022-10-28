import { ethers } from "hardhat";
import { StaticRaffle } from "../typechain-types";
import { BytesLike } from "ethers";

import { ContractTransaction, ContractReceipt } from "ethers";
import { assert, expect } from "chai";
import { MockVRFCoordinator } from "../typechain-types/contracts/tests/VRFCoordinatorV2Mock.sol";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Static Raffle test scenario with seven winners", async function () {
	async function deployStaticRaffleFixture() {
		const [deployer] = await ethers.getSigners();

		// Mock VRF Coordinator Prameters
		const BASE_FEE = "100000000000000000";
		const GAS_PRICE_LINK = "1000000000";

		const vrfCoordinatorFactory = await ethers.getContractFactory(
			"VRFCoordinatorV2Mock"
		);

		const mockVRFCoordinator: MockVRFCoordinator =
			await vrfCoordinatorFactory.deploy(BASE_FEE, GAS_PRICE_LINK);

		const tx: ContractTransaction =
			await mockVRFCoordinator.createSubscription();
		const txRecipt: ContractReceipt = await tx.wait(1);
		if (!txRecipt.events) return;

		const subscriptionId = ethers.BigNumber.from(
			txRecipt.events[0].topics[1]
		);

		const keyHash =
			"0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";

		const callBackGasLimit = 2500000;
		const requestConfirmations = 5;
		const numWords = 7;

		const mockParticipants: BytesLike[] = [
			"0x3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
			"0xb5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
			"0x0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
			"0xf1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
			"0x4b4ecedb4964a40fe416b16c7bd8b46092040ec42ef0aa69e59f09872f105cf3",
			"0x53a63b3ee437e1aa804722ac8f2f57053ac47e1bb887f095340cf5990e7faad3",
			"0x7521d1cadbcfa91eec65aa16715b94ffc1c9654ba57ea2ef1a2127bca1127a83",
			"0xea00237ef11bd9615a3b6d2629f2c6259d67b19bb94947a1bd739bae3415141c",
			"0xcac1bb71f0a97c8ac94ca9546b43178a9ad254c7b757ac07433aa6df35cd8089",
			"0x6a0d259bd4fb907339fd7c65a133083c1e9554f2ca6325b806612c8df6d7df22",
			"0xc0f0bf021930d6d00e5b1e7c7396b1d036f7b395008e39694c23548a99a3db93",
		];

		const staticRaffleFactory = await ethers.getContractFactory(
			"StaticRaffle"
		);
		const staticRaffle: StaticRaffle = await staticRaffleFactory.deploy(
			mockParticipants,
			subscriptionId,
			mockVRFCoordinator.address,
			keyHash,
			callBackGasLimit,
			requestConfirmations,
			numWords
		);

		mockVRFCoordinator.fundSubscription(
			subscriptionId,
			ethers.utils.parseEther("1")
		);
		mockVRFCoordinator.addConsumer(subscriptionId, staticRaffle.address);

		return {
			staticRaffle,
			deployer,
			mockVRFCoordinator,
			numWords,
		};
	}

	describe("Running Raffle Scenario", async function () {
		it("Should run the raffle and determine seven winners only once", async function () {
			const fixture = await loadFixture(deployStaticRaffleFixture);

			if (!fixture) return;

			const tx: ContractTransaction = await fixture.staticRaffle
				.connect(fixture.deployer)
				.startRaffle();
			const txRecipt: ContractReceipt = await tx.wait(1);
			if (!txRecipt.events) return;
			if (!txRecipt.events[1].args) return;
			const requestId = txRecipt.events[1].args[0];

			await fixture.mockVRFCoordinator.fulfillRandomWords(
				requestId,
				fixture.staticRaffle.address
			);

			const winners = await fixture.staticRaffle.getWinners();

			assert(
				winners.length === fixture.numWords,
				"Winners array length is not equal to the number of words"
			);
		});

		it("Should be reverted if tried to run twice", async function () {
			const fixture = await loadFixture(deployStaticRaffleFixture);

			if (!fixture) return;

			const tx: ContractTransaction = await fixture.staticRaffle
				.connect(fixture.deployer)
				.startRaffle();
			const txRecipt: ContractReceipt = await tx.wait(1);
			if (!txRecipt.events) return;
			if (!txRecipt.events[1].args) return;
			const requestId = txRecipt.events[1].args[0];

			await fixture.mockVRFCoordinator.fulfillRandomWords(
				requestId,
				fixture.staticRaffle.address
			);

			await expect(fixture.staticRaffle.startRaffle()).to.be.revertedWithCustomError(fixture.staticRaffle,'StaticRaffle__RaffleCanOnlyBeRanOnce');
		});
	});
});
