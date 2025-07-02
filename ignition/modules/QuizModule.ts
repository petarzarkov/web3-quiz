import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("QuizModule", (m) => {
  const quiz = m.contract("Quiz", ["Question?", "HashedAnswer!?!?"]);
  return { quiz };
});
