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

  async function deployMockFixture() {
    const question = "What is the meaning of life?";
    const answer = "42";

    const mock = await hre.viem.deployContract("MockContract");

    return {
      mock,
      question,
      answer,
    };
  }

  describe("Deploy & State", function () {
    it("should be deployed", async function () {
      const { quiz } = await loadFixture(deployQuizFixture);

      expect(quiz.address).not.to.equal(ethers.ZeroAddress);
    });

    it("should get the right question", async function () {
      const { quiz, question } = await loadFixture(deployQuizFixture);

      expect(await quiz.read.question()).to.equal(question);
    });

    it("should get the balance with the deployed amount", async function () {
      const { quiz, amount } = await loadFixture(deployQuizFixture);

      expect(await quiz.read.getBalance()).to.equal(amount);
    });
  });

  describe("Gameplay", function () {
    describe("Validations", function () {
      it("should revert when wrong guess", async function () {
        const { quiz } = await loadFixture(deployQuizFixture);

        await expect(
          quiz.write.guess(["Some wrong hashed answer"])
        ).to.be.rejectedWith("Wrong answer");
      });

      it("should revert when sending ether with call", async function () {
        const { quiz, owner } = await loadFixture(deployQuizFixture);
        const newAmount = parseGwei("2");
        await owner.sendTransaction({
          to: quiz.address,
          value: newAmount,
        });
        const { answer, mock } = await loadFixture(deployMockFixture);

        await expect(
          mock.write.callOtherContract([quiz.address, answer])
        ).to.be.rejectedWith("Sending funds failed");

        const quizEvents = await quiz.getEvents.QuizGuessed();
        expect(quizEvents).to.have.lengthOf(0);
      });
    });

    describe("Events", function () {
      it("should emit an event on successful guess", async function () {
        const { quiz, publicClient, answer } = await loadFixture(
          deployQuizFixture
        );

        const hash = await quiz.write.guess([answer]);
        await publicClient.waitForTransactionReceipt({ hash });

        const quizEvents = await quiz.getEvents.QuizGuessed();
        expect(quizEvents).to.have.lengthOf(1);
        expect(quizEvents[0].args.answer).to.equal(answer);
        expect(await quiz.read.getBalance()).to.equal(0n);
      });

      it("should guess right answer but not receive funds", async function () {
        const { quiz, publicClient, answer } = await loadFixture(
          deployQuizFixture
        );

        const hash = await quiz.write.guess([answer]);
        await publicClient.waitForTransactionReceipt({ hash });

        const quizEvents = await quiz.getEvents.QuizGuessed();
        expect(quizEvents).to.have.lengthOf(1);

        const hash2 = await quiz.write.guess([answer]);
        await publicClient.waitForTransactionReceipt({ hash: hash2 });
        const quizEvents2 = await quiz.getEvents.QuizGuessed();
        expect(quizEvents2).to.have.lengthOf(0);
        expect(await quiz.read.getBalance()).to.equal(0n);
      });

      it("should emit an event on receive", async function () {
        const { quiz, owner } = await loadFixture(deployQuizFixture);

        const newAmount = parseGwei("2");
        await owner.sendTransaction({
          to: quiz.address,
          value: newAmount,
        });

        const quizEvents = await quiz.getEvents.QuizFund();
        expect(quizEvents).to.have.lengthOf(1);
        expect(quizEvents[0].args.eventName).to.equal("receive");
        expect(quizEvents[0].args.amount).to.equal(newAmount);
        expect(quizEvents[0].args.sender).to.equal(
          getAddress(owner.account.address)
        );
      });

      it("should emit an event on fallback", async function () {
        const { quiz, owner } = await loadFixture(deployQuizFixture);

        const newAmount = parseGwei("2");
        await owner.sendTransaction({
          data: "0x1337",
          to: quiz.address,
          value: newAmount,
        });

        const quizEvents = await quiz.getEvents.QuizFund();
        expect(quizEvents).to.have.lengthOf(1);
        expect(quizEvents[0].args.eventName).to.equal("fallback");
        expect(quizEvents[0].args.amount).to.equal(newAmount);
        expect(quizEvents[0].args.sender).to.equal(
          getAddress(owner.account.address)
        );
      });
    });
  });
});
