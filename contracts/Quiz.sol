// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Quiz {
    string public question;
    bytes32 hashedAnswer;
    string salt = "ya salty brother?";

    event QuizFund(uint256 amount, address sender);
    event QuizGuessed(address sender, string answer);

    constructor(string memory _question, bytes32 _hashedAnswer) payable {
        question = _question;
        hashedAnswer = _hashedAnswer;
    }

    function guess(string memory answer) public {
        require(keccak256(abi.encodePacked(salt, answer)) == hashedAnswer, "Wrong answer");

        if (address(this).balance > 0) {
            (bool sent,) = payable(msg.sender).call{value: address(this).balance }("");
            require(sent, "Sending funds failed");
            emit QuizGuessed(msg.sender, answer);
        }

    }

    fallback() external payable {
        emit QuizFund(msg.value, msg.sender);
    }

    receive() external payable {
        emit QuizFund(msg.value, msg.sender);
    }

    function getBalance() public view returns(uint256) {
        return address(this).balance;
    }
}