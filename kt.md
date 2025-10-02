[1 tool called]

Here’s a concise, copy-paste friendly guide you can share.

### What’s already deployed (devnet)
- Program ID: 98U5Pv3wKPQ4hYYoL4tFoY3EEjUojHkG34emgv3ucTHZ
- Group: 8J5KHaXN6doGvWEqXw7ujNHnUiq771ycDzRGZESb1eWW
- Banks:
  - SOL bank: AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF (mint: So11111111111111111111111111111111111111112, oracle: 7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE)
  - USDC bank: H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 (mint: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr, oracle: Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX)
- Demo accounts:
  - Liquidator: FAU3yMaue9NDJqKs2ULMuFdA4DXnsYXN1J9fLdn6xVMX
  - Liquidatee: B2dxTPkmRvqJd7N4oasaiaufs1JNpBadB5chgu9mdRrx

### One-time setup
```bash
solana config set --url devnet
solana address                    # verify your pubkey
cargo build                       # build CLI (bin: mfi)
```

### Use the CLI against the deployed program
```bash
# Create and select a profile pointing at the deployed program
mfi profile create --cluster devnet --name dev-profile \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url https://api.devnet.solana.com \
  --program-id 98U5Pv3wKPQ4hYYoL4tFoY3EEjUojHkG34emgv3ucTHZ
mfi profile set dev-profile
```

### If you want to redeploy (optional)
- Update `programs/marginfi/src/lib.rs` `declare_id!` (feature `devnet`) to your new program ID.
- Build and deploy:
```bash
anchor build                              # or your existing build script
solana program deploy target/deploy/marginfi.so --url devnet
# (Optional) upload IDL if needed using anchor idl commands
```

### Initialize a fresh setup (optional, if you’re not reusing ours)
```bash
# Create group
mfi group create -y

# Add USDC bank
mfi group add-bank \
  --mint Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
  --asset-weight-init 0.85 --asset-weight-maint 0.9 \
  --liability-weight-init 1.15 --liability-weight-maint 1.1 \
  --deposit-limit 1000000000000000 --borrow-limit 1000000000000000 \
  --pyth-oracle Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX \
  --optimal-utilization-rate 0.9 --plateau-interest-rate 1 --max-interest-rate 10 \
  --insurance-fee-fixed-apr 0.01 --insurance-ir-fee 0.1 \
  --protocol-fixed-fee-apr 0.01 --protocol-ir-fee 0.1 \
  --risk-tier collateral -y

# Add SOL bank
mfi group add-bank \
  --mint So11111111111111111111111111111111111111112 \
  --asset-weight-init 0.75 --asset-weight-maint 0.8 \
  --liability-weight-init 1.25 --liability-weight-maint 1.2 \
  --deposit-limit 1000000000000000 --borrow-limit 1000000000000000 \
  --pyth-oracle 7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE \
  --optimal-utilization-rate 0.8 --plateau-interest-rate 1 --max-interest-rate 20 \
  --insurance-fee-fixed-apr 0.01 --insurance-ir-fee 0.1 \
  --protocol-fixed-fee-apr 0.01 --protocol-ir-fee 0.1 \
  --risk-tier collateral -y

# Increase oracle expiration window (avoid stale price errors)
mfi bank update <SOL_BANK>  --oracle-max-age 43200 -y   # 12h
mfi bank update <USDC_BANK> --oracle-max-age 43200 -y
```

### Demo: deposit, borrow, repay/withdraw
```bash
# Liquidator: deposit USDC to provide borrowable liquidity
mfi account use FAU3yMaue9NDJqKs2ULMuFdA4DXnsYXN1J9fLdn6xVMX -y
mfi account deposit H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 50 -y

# Liquidatee: deposit SOL, then borrow USDC
mfi account use B2dxTPkmRvqJd7N4oasaiaufs1JNpBadB5chgu9mdRrx -y
mfi account deposit AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF 1 -y
mfi account borrow  H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 15 -y
mfi account borrow  H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 10 -y
mfi account borrow  H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 20 -y

# Repay flow is just depositing the borrowed asset back into the bank
mfi account deposit H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 5 -y
mfi account withdraw AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF 0.1 -y
```

### Demo: force liquidation (for testing)
- Temporarily devalue SOL collateral (for demo only), then liquidate a tiny amount to avoid utilization errors:
```bash
# Make SOL collateral count as zero (init+maint) — revert after demo
mfi bank update AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF \
  --asset-weight-init 0 --asset-weight-maint 0 -y

# Liquidate a small seize amount
mfi account use FAU3yMaue9NDJqKs2ULMuFdA4DXnsYXN1J9fLdn6xVMX -y
mfi account liquidate \
  --liquidatee-marginfi-account B2dxTPkmRvqJd7N4oasaiaufs1JNpBadB5chgu9mdRrx \
  --asset-bank AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF \
  --liability-bank H4Fs1yieHMAn5nFcCbEGtN2gWBVvwKaU69Qpqv4aDKY6 \
  --ui-asset-amount 0.0001 -y

# Withdraw seized SOL to wallet (to see wSOL movement)
mfi account withdraw AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF 0.0001 -y

# Revert SOL weights to normal after demo
mfi bank update AhRY3BmHFmd95iydWPiW6fhPF3CAEFFNLjNxcC6toaEF \
  --asset-weight-init 0.75 --asset-weight-maint 0.8 -y
```

### Notable transaction hashes (from our run)
- Set oracle max age (SOL): 5L6axgyRKxiDAoVEJB5TcF8V5ctiwD4sX3WUWQNYzGxThr5AXa3RATxiKLnBpVh5AJc8msxVX8iPKvQT9tSsm1xx
- Set oracle max age (USDC): 2Ah7u47Kb3bwHQ23LNiz9RARFwogWsGL5nEf96Mw6ceBqzfe5E29g14LX8HVqzJJxP514mfwGA7JyTkPjdda8hHV
- Deposit 50 USDC (liquidator): 2RrpwNxxizmzPE4ofKd65YVx3hSbfKXVd71G7NdF5qVopmjRzgWuz4s5iUxVFSn9bmYtPYWKuEXcXm2HXgS2nzod
- Borrows (liquidatee): 10 USDC FZNSyU2Jx..., 15 USDC 3zeq3Acz..., 10 USDC 4dw7xqX7..., 20 USDC 5wabGGho...
- Set SOL weights to 0: 2zmqiewKmDyf8Jb3Jo3uxvJXMU4ruTagfQuJyJEhS9os2YDvVBuKY37te5NZ6KWWkD1TJbCyv5Cg7DC2BNkt5bQQ
- Liquidations: 677ZNA52wYRa7J... (first), H5PgERYKyuQgn9kE... (second)
- Withdraw seized 0.0001 SOL: 4i1g18bps7KkdWVg...

### CLI → on-chain instruction map (IX)
- Group
  - `mfi group create` → `MarginfiGroupInitialize` (lib: `marginfi_group_initialize`)
  - `mfi group update` → `MarginfiGroupConfigure` (lib: `marginfi_group_configure`)
  - `mfi group init-fee-state` → `InitGlobalFeeState`
  - `mfi group config-fee` → `ConfigGroupFee`
  - `mfi group propagate-fee` → `PropagateFeeState`

- Banks
  - `mfi group add-bank` → `LendingPoolAddBank` (or `LendingPoolAddBankWithSeed` when `--seed`)
  - `mfi bank update` → `LendingPoolConfigureBank` (BankConfigOpt: weights/limits/flags/IR/limits)
  - `mfi bank update-oracle` → `LendingPoolConfigureBankOracle`
  - `mfi bank setup-emissions` → `LendingPoolSetupEmissions`
  - `mfi bank update-emissions` → `LendingPoolUpdateEmissionsParameters`
  - `mfi bank handle-bankruptcy` → `LendingPoolHandleBankruptcy`

- Marginfi accounts
  - `mfi account create` → `MarginfiAccountInitialize`
  - `mfi account deposit` → `LendingAccountDeposit`
  - `mfi account withdraw` → `LendingAccountWithdraw`
  - `mfi account borrow` → `LendingAccountBorrow`
  - `mfi account liquidate` → `LendingAccountLiquidate`
  - `mfi account close` → `MarginfiAccountClose`

Notes
- Repay: the program exposes `LendingAccountRepay`, but the CLI does not currently provide a dedicated `repay` subcommand; repaying is effected during liquidation or by using flows that increase liabilities/assets per program rules.
- All IX names above refer to `programs/marginfi/src/lib.rs` public handlers and their per-module implementations under `programs/marginfi/src/instructions/`.
