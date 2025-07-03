// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface CallInterface {
    function guess(string memory answer) external;
}

contract MockContract {
    function callOtherContract(address _target, string memory _answer) public {
        CallInterface(_target).guess(_answer);
    }

    fallback() external payable {
        revert("fallback revert");
    }

    receive() external payable {
        revert("receive revert");
    }
}