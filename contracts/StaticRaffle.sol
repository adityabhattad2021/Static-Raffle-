// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


contract StaticRaffle is VRFConsumerBaseV2 ,Ownable{

    //Error
    error StaticRaffle__RaffleCanOnlyBeRanOnce();

    // Events
    event RequestRandomWords(uint256 indexed requestId);
    event WinnerSelected(bytes32 indexed winner);
    event RaffleEnded(uint256 indexed requestId);

    // Note: Bytes32 is the data type for keccek hashes(Information we are going to have about the participants).
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Variables
    EnumerableSet.Bytes32Set internal s_participants;
    EnumerableSet.Bytes32Set internal s_winners;
    bool internal s_isRaffleStarted;  // This will be false by default.


    // Variables for the Chainlink VRF
    VRFCoordinatorV2Interface internal immutable i_vrfCoordinator;
    bytes32 internal immutable i_keyHash;
    uint64 internal immutable i_subscriptionId;
    uint32 internal immutable i_callBackGasLimit;
    uint16 internal immutable i_requestConfirmations;
    uint32 internal s_numWords;


    modifier onlyOnce{
        if(s_isRaffleStarted){
            revert StaticRaffle__RaffleCanOnlyBeRanOnce();
        }
        _;
    }


    constructor(
        bytes32[] memory participants,
        uint64 subscriptionId,
        address VRFCoordinator,
        bytes32 keyHash,
        uint32 callBackGasLimit,
        uint16 requestConfirmations,
        uint32 numWords
    ) VRFConsumerBaseV2(VRFCoordinator){
        i_subscriptionId=subscriptionId;
        i_keyHash=keyHash;
        i_callBackGasLimit=callBackGasLimit;
        i_requestConfirmations=requestConfirmations;
        s_numWords=numWords;
        i_vrfCoordinator=VRFCoordinatorV2Interface(VRFCoordinator);

        // looping through the participants and adding them to the contracts s_participants set.
        uint256 length=participants.length;
        for(uint256 i=0; i<length;){
            s_participants.add(participants[i]);
            unchecked {
                i++;
            }
        }

    }


    function requestRandomWords() internal  {
        // Requesting s_numWords from the VRF
        uint256 requestId=i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            i_requestConfirmations,
            i_callBackGasLimit,
            s_numWords
        );

        // Emitting the requestId
        emit RequestRandomWords(requestId);
    }




    function fulfillRandomWords(uint256 requestId,uint256[] memory randomWords)internal virtual override {
        uint256 length=s_numWords;
        for(uint256 i=0; i<length;){
            bytes32 raffleWinner = s_participants.at(randomWords[i]%s_participants.length());
            // console.log("Random number was %s",randomWords[i]);
            s_winners.add(raffleWinner);
            s_participants.remove(raffleWinner);
            unchecked {
                i++;
            }
            emit WinnerSelected(raffleWinner);
        }
        emit RaffleEnded(requestId);
    }

    function startRaffle() external onlyOnce onlyOwner{
        s_isRaffleStarted=true;
        requestRandomWords();
    }

    function getWinners() external view returns(bytes32[] memory){
        return s_winners.values();
    }

}