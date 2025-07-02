// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Quiz.sol";

contract QuizFactory {
    Quiz[] public quizzes;

    event QuizCreated(Quiz indexed quiz);

    constructor() payable {}

    function createQuiz(string memory question, bytes32 hashedAnswer) public payable {
        Quiz quiz = new Quiz{value: msg.value}(question, hashedAnswer);
        quizzes.push(quiz);
        emit QuizCreated(quiz);
    }

    function getQuizzes() public view returns(Quiz[] memory) {
        return quizzes;
    }
}