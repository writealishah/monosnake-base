# MonoSnake Base

Retro monochrome Snake mini app with:

- instant guest play
- wallet mode (wagmi + viem)
- onchain best-score contract
- leaderboard indexed from onchain events
- lightweight retro sound effects with mute toggle

## What Already Exists

- Core Snake gameplay loop (grid movement, growth, collisions, speed-up)
- Mobile controls + desktop keyboard controls
- Wallet connect + username + score submit flow
- Leaderboard API and UI states
- Solidity score contract + Hardhat deploy scripts

## Mainnet-First Network Mode

The app now supports environment-based target chain mode:

- `mainnet` mode: Base Mainnet is target (recommended for production)
- `sepolia` mode: Base Sepolia is target (recommended for local testing)

By default:

- production => `mainnet`
- development => `sepolia`

You can override with:

- `NEXT_PUBLIC_APP_NETWORK_MODE=mainnet` or `sepolia`

## Sound System

Sound is implemented with Web Audio API (no heavy audio library, no large files).

- Hook: `lib/sound/useRetroSounds.ts`
- Sound presets map: `soundMap` in that same file
- Mute storage key: `SOUND_MUTE_STORAGE_KEY` in `config/sound.ts`

Implemented sounds:

- game start
- food collected
- score increase
- button click
- game over
- wallet connect success
- score submit success/error
- leaderboard refresh success/error

### Mute / Unmute

- Use the `Sound On / Sound Off` toggle in the game header.
- Mute state is saved in `localStorage`.
- Audio waits for user interaction before playing (browser-safe behavior for desktop/mobile).

## Environment Variables

Create `.env.local` from `.env.example` and fill:

### Frontend

- `NEXT_PUBLIC_APP_NETWORK_MODE` (`mainnet` or `sepolia`)
- `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_SCORE_CONTRACT_ADDRESS_BASE_MAINNET`
- `NEXT_PUBLIC_SCORE_CONTRACT_ADDRESS_BASE_SEPOLIA`
- `SCORE_EVENTS_FROM_BLOCK_BASE_MAINNET` (optional but recommended on mainnet)
- `SCORE_EVENTS_FROM_BLOCK_BASE_SEPOLIA` (optional)
- `SCORE_EVENTS_LOOKBACK_BLOCKS` (optional fallback, default `200000`)

### Hardhat / Deploy

- `BASE_MAINNET_RPC_URL`
- `BASE_SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `BASESCAN_API_KEY` (optional for explorer verification flow later)

## Local Run

```bash
npm install
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start:

```bash
npm run dev
```

Checks:

```bash
npm run lint
npm run build
```

## Base Mainnet Deployment Flow

1. Set mainnet deploy env values:

- `BASE_MAINNET_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`

2. Compile contract:

```bash
npm run compile:contracts
```

3. Deploy:

```bash
npm run deploy:base-mainnet
```

4. Copy deployed address into:

- `NEXT_PUBLIC_SCORE_CONTRACT_ADDRESS_BASE_MAINNET`

5. Set app mode to mainnet:

- `NEXT_PUBLIC_APP_NETWORK_MODE=mainnet`

6. Restart app.

## Base Sepolia Dev/Test Flow

1. Set:

- `NEXT_PUBLIC_APP_NETWORK_MODE=sepolia`
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_SCORE_CONTRACT_ADDRESS_BASE_SEPOLIA`

2. Optional deploy on Sepolia:

```bash
npm run deploy:base-sepolia
```

3. Restart app and test wallet + leaderboard safely on testnet.

## Guest vs Wallet

Guest mode:

- play instantly
- local best score only

Wallet mode:

- connect wallet
- save username
- submit best score onchain
- appear in leaderboard

## Contract + Leaderboard Notes

- Contract keeps only each address best score.
- Global leaderboard is built from `ScoreUpdated` events (top 20 sorted by score desc, earliest timestamp tie-breaker).
- If target-network contract address is missing, UI now shows setup guidance instead of broken behavior.
- Mainnet RPC endpoints often limit log ranges; API now scans in 10k block chunks.
- For best performance and full history, set `SCORE_EVENTS_FROM_BLOCK_BASE_MAINNET` to your deployment block.

## Where To Modify Sounds Later

- Add/edit sound patterns in:
  - `lib/sound/useRetroSounds.ts` (`soundMap`)
- Add new sound IDs in:
  - `config/sound.ts`

## Key Files

- App UI: `components/game/SnakeApp.tsx`
- Sound hook: `lib/sound/useRetroSounds.ts`
- Sound toggle: `components/game/SoundToggle.tsx`
- Network mode config: `config/networks.ts`
- Wallet config: `lib/wallet/wagmiConfig.ts`
- Leaderboard client/server chain resolution:
  - `lib/contracts/clients.ts`
  - `app/api/leaderboard/route.ts`
