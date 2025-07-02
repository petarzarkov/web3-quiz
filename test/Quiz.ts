import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { parseGwei } from "viem";

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

  describe("Getters", function () {
    it("Should get the right question", async function () {
      const { quiz, question } = await loadFixture(deployQuizFixture);

      expect(await quiz.read.question()).to.equal(question);
    });

    it("Should get the balance", async function () {
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
      it("Should emit an event on successfull guess", async function () {
        const { quiz, publicClient, answer, hashedAnswer } = await loadFixture(
          deployQuizFixture
        );

        const hash = await quiz.write.guess([answer]);
        await publicClient.waitForTransactionReceipt({ hash });

        const withdrawalEvents = await quiz.getEvents.QuizGuessed();
        expect(withdrawalEvents).to.have.lengthOf(1);
        expect(withdrawalEvents[0].args.answer).to.equal(answer);
      });
    });
  });
});
