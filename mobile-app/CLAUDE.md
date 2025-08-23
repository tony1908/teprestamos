# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo app called "Monad Todo" - a stake-to-commit todo application built for the Monad blockchain testnet. Users stake MON tokens when creating todos and get their stake back upon completion.

**Key Technologies:**
- **Frontend**: React Native with Expo Router (file-based routing)
- **Blockchain**: Wagmi + Viem for Web3 interactions, Ethers.js for contract calls
- **Wallet**: Reown AppKit (formerly WalletConnect) for wallet connectivity with embedded wallets support
- **Network**: Monad Testnet (Chain ID: 10143)

## Development Commands

```bash
# Start development server
npm start
# or
expo start

# Platform-specific builds
npm run android    # Android development build
npm run ios        # iOS development build
npm run web        # Web development

# Code quality
npm run lint       # ESLint with Expo configuration
npx tsc --noEmit   # TypeScript type checking
```

## Architecture Overview

### App Structure
- **File-based routing** with Expo Router in `/app` directory
- **Two-tab layout**: Home, Todos
- **Component hierarchy**: 
  - Root layout (`app/_layout.tsx`) configures Wagmi, AppKit, and theme providers
  - Tab layout (`app/(tabs)/_layout.tsx`) defines tab navigation
  - Todo functionality isolated in `components/todo/`

### Web3 Integration Architecture

The app uses a **dual Web3 stack approach**:
- **Wagmi/Viem** for wallet connection and account management
- **Ethers.js** for smart contract interactions (required for compatibility with existing contract ABI)

**Key Configuration** (`app/_layout.tsx`):
- Wagmi config with Mainnet + Monad Testnet
- AppKit setup for wallet connectivity with embedded wallets support via `authConnector`
- Custom metadata for "Monad Todo" branding
- Deep linking scheme: `appkitexpowagmi://`

### Smart Contract Integration

**Contract Details**:
- **Address**: `0xd880112AeC1307eBE2886e4fB0daec82564f3a65`
- **ABI**: Defined in `utils/stakingTodoListABI.ts`
- **Network**: Monad Testnet (Chain ID: 10143)

**Core Functions**:
- `createTodo(string description) payable` - Create todo with MON stake
- `completeTodo(uint256 todoId)` - Complete todo and retrieve stake
- `getUserTodoDetails(address user)` - Get user's todos with full details
- `minimumStake()` - Get minimum required stake amount

### Todo Component Architecture

**Component Hierarchy**:
```
TodoList (main view)
├── CreateTodo (todo creation form)
├── TodoItem[] (individual todo items)
└── RequestModal (transaction feedback)
```

**State Management Pattern**:
Each component manages its own transaction state:
- Loading states for blockchain interactions
- Error handling with user-friendly messages
- Modal-based transaction feedback
- Automatic refresh after successful transactions

### Web3 Integration Pattern

**Wallet Connection Flow**:
1. User connects via AppKit button (supports both external wallets and embedded wallets)
2. Embedded wallet option allows users to create accounts using email/social logins
3. Wagmi manages account state and network switching
4. Components access wallet via `useAccount()` and `useWalletClient()`
5. Ethers.js BrowserProvider wraps walletClient for contract calls

**Transaction Pattern**:
```typescript
// Convert wagmi walletClient to ethers provider
const ethersProvider = new BrowserProvider(walletClient!);
const signer = await ethersProvider.getSigner();
const contract = new Contract(ADDRESS, ABI, signer);

// Execute contract method
const tx = await contract.methodName(params, { value: ethAmount });
```

## Important Configuration

**Android Package**: `com.toony1908.myappmonad`
**Deep Link Scheme**: `appkitexpowagmi://`
**Target Networks**: Mainnet (1), Monad Testnet (10143)

**Critical Dependencies**:
- `@reown/appkit-wagmi-react-native` - Wallet connectivity
- `@reown/appkit-auth-wagmi-react-native` - Embedded wallets support
- `wagmi` + `viem` - Web3 React hooks
- `ethers` - Smart contract interactions
- `react-native-modal` - Transaction modals

## Development Notes

**Network Validation**: All contract interactions verify connection to Monad Testnet (Chain ID: 10143)

**Error Handling**: Components implement comprehensive error handling for:
- Network mismatches
- Insufficient funds
- Contract call failures
- User transaction rejections

**TypeScript**: Strict typing with proper ethers.js and wagmi type integration. Use `walletClient!` assertion after null checks for ethers BrowserProvider compatibility.

**Styling**: Components use StyleSheet with consistent design patterns - white cards with shadows, blue/green color scheme matching Monad branding.

## Contract Interaction Patterns

**Read Operations**: Use contract view functions for fetching user todos, stats, and minimum stake amounts.

**Write Operations**: All state-changing operations use the RequestModal pattern for user feedback and include proper gas estimation.

**State Synchronization**: After successful transactions, components trigger refresh of both local todo list and contract statistics.