import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";

describe("QuizFactory", function () {
  async function deployQuizFactoryFixture() {
    const amount = parseGwei("1");

    const question = "What is the meaning of life?";
    const salt = "ya salty brother?";
    const answer = "42";
    const hashedAnswer = ethers.keccak256(
      ethers.solidityPacked(["string", "string"], [salt, answer])
    );

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const quizFactory = await hre.viem.deployContract("QuizFactory", [], {
      value: amount,
    });

    const publicClient = await hre.viem.getPublicClient();

    return {
      quizFactory,
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

  it("should be deployed", async function () {
    const { quizFactory } = await loadFixture(deployQuizFactoryFixture);

    expect(quizFactory.address).not.to.equal(ethers.ZeroAddress);

    const quizzes = await quizFactory.read.getQuizzes();

    expect(quizzes.length).to.equal(0);
  });

  it("should create and get all quizzes", async function () {
    const { quizFactory, question, hashedAnswer, amount } = await loadFixture(
      deployQuizFactoryFixture
    );

    await quizFactory.write.createQuiz([question, hashedAnswer], {
      value: amount,
    });

    const quizFactoryEvents = await quizFactory.getEvents.QuizCreated();
    expect(quizFactoryEvents).to.have.lengthOf(1);

    const quizzes = await quizFactory.read.getQuizzes();
    expect(quizzes.length).to.equal(1);
  });
});
