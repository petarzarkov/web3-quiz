import { Contract, JsonRpcProvider } from "ethers";
import Quiz from "../artifacts/contracts/Quiz.sol/Quiz.json";

async function main() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");

  const testAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const testContract = new Contract(testAddress, Quiz.abi, provider);

  const quiz = await testContract.question();

  console.log({ quizQuestion: quiz });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
