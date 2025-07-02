import { Contract, JsonRpcProvider } from "ethers";
import Rocket from "../artifacts/contracts/Rocket.sol/Rocket.json";

async function main() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");

  const testAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const testContract = new Contract(testAddress, Rocket.abi, provider);

  const rocketName = await testContract.name();

  console.log({ rocketName });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
