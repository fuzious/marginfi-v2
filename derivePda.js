const { PublicKey } = require("@solana/web3.js");

const PROGRAM_ID = new PublicKey("9tJtFzEyqrnXwdCJrmnqoL3XveRm1uhNjM81uhRjq6jh");
const FEE_STATE_SEED = "feestate";

async function deriveFeeStatePda() {
  const [feeStatePda, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(FEE_STATE_SEED, "utf-8")],
    PROGRAM_ID
  );

  console.log("Fee State PDA:", feeStatePda.toBase58());
  console.log("Bump:", bump);
}

deriveFeeStatePda();
