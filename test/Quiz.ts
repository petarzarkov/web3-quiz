import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";

describe("Quiz", function () {
  async function deployQuizFixture() {
    const amount = parseGwei("1");

    const question = "What is the meaning of life?";
    const salt = "ya salty brother?";
    const answer = "42";
    const hashedAnswer = ethers.keccak256(
      ethers.solidityPacked(["string", "string"], [salt, answer])
    );

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const quiz = await hre.viem.deployContract(
      "Quiz",
      [question, hashedAnswer],
      {
        value: amount,
      }
    );

    const publicClient = await hre.viem.getPublicClient();

    return {
      quiz,
      amount,
      owner,
      otherAccount,
      publicClient,
      question,
      hashedAnswer,
      answer,
      salt,
    };
  }

  describe("Deploy & State", function () {
    it("Should be deployed", async function () {
      const { quiz } = await loadFixture(deployQuizFixture);

      expect(quiz.address).not.to.equal(ethers.ZeroAddress);
    });

    it("Should get the right question", async function () {
      const { quiz, question } = await loadFixture(deployQuizFixture);

      expect(await quiz.read.question()).to.equal(question);
    });

    it("Should get the balance with the deployed amount", async function () {
      const { quiz, amount } = await loadFixture(deployQuizFixture);

      expect(await quiz.read.getBalance()).to.equal(amount);
    });
  });

  describe("Gameplay", function () {
    describe("Validations", function () {
      it("Should revert when wrong answer", async function () {
        const { quiz } = await loadFixture(deployQuizFixture);

        await expect(
          quiz.write.guess(["Some wrong hashed answer"])
        ).to.be.rejectedWith("Wrong answer");
      });
    });

    describe("Events", function () {
      it("Should emit an event on successful guess", async function () {
        const { quiz, publicClient, answer } = await loadFixture(
          deployQuizFixture
        );

        const hash = await quiz.write.guess([answer]);
        await publicClient.waitForTransactionReceipt({ hash });

        const quizEvents = await quiz.getEvents.QuizGuessed();
        expect(quizEvents).to.have.lengthOf(1);
        expect(quizEvents[0].args.answer).to.equal(answer);
      });

      it("Should emit an event on receive", async function () {
        const { quiz, owner, publicClient } = await loadFixture(
          deployQuizFixture
        );

        const newAmount = parseGwei("2");
        const hash = await owner.sendTransaction({
          to: quiz.address,
          value: newAmount,
        });
        await publicClient.waitForTransactionReceipt({ hash });

        const quizEvents = await quiz.getEvents.QuizFund();
        expect(quizEvents).to.have.lengthOf(1);
        expect(quizEvents[0].args.amount).to.equal(newAmount);
        expect(quizEvents[0].args.sender).to.equal(
          getAddress(owner.account.address)
        );
      });
    });
  });
});
