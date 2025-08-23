# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo app called "Te Prestamos" - a decentralized lending platform built for the Monad blockchain testnet. Users can request instant MON token loans with flexible repayment terms.

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
- **Two-tab layout**: Loans, Profile
- **Component hierarchy**: 
  - Root layout (`app/_layout.tsx`) configures Wagmi, AppKit, KioskProvider, and theme providers
  - Tab layout (`app/(tabs)/_layout.tsx`) defines tab navigation
  - Loan functionality in `components/loan/`
  - Kiosk mode system in `components/KioskModeScreen.tsx`, `contexts/KioskContext.tsx`, `hooks/useKioskMode.ts`

### Web3 Integration Architecture

The app uses a **dual Web3 stack approach**:
- **Wagmi/Viem** for wallet connection and account management
- **Ethers.js** for smart contract interactions (required for compatibility with existing contract ABI)

**Key Configuration** (`app/_layout.tsx`):
- Wagmi config with Mainnet + Monad Testnet
- AppKit setup for wallet connectivity with embedded wallets support via `authConnector`
- Custom metadata for "Te Prestamos" branding
- Deep linking scheme: `appkitexpowagmi://`

### Smart Contract Integration

**Contract Details**:
- **Address**: `0x56aeB0d91ED01C1cfED201f252E16C90720F1961`
- **ABI**: Defined in `utils/loanContractABI.ts`
- **Network**: Monad Testnet (Chain ID: 10143)

**Core Functions**:
- `requestLoan(uint256 amount, uint256 maxPaymentDate)` - Request and receive instant loan
- `payBackLoan() payable` - Repay the loan amount
- `getActiveLoan(address borrower)` - Get user's active loan details
- `getContractBalance()` - Get available contract funds

**Loan Status Enum**:
```solidity
enum LoanStatus { ACTIVE, OVERDUE, PAID, DEFAULTED }
```
- **0 (ACTIVE)**: Loan approved and funded, can be repaid
- **1 (OVERDUE)**: Loan past due date, can still be repaid
- **2 (PAID)**: Loan successfully repaid
- **3 (DEFAULTED)**: Loan defaulted (read-only)

### Loan Component Architecture

**Component Hierarchy**:
```
LoanList (main view)
├── CreateLoan (loan request form)
├── LoanItem (individual loan display)
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
- `expo-kiosk-control` - Android kiosk mode functionality

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

**Read Operations**: Use contract view functions for fetching user loan details, contract balance, and loan status.

**Write Operations**: All state-changing operations use the RequestModal pattern for user feedback and include proper gas estimation.

**State Synchronization**: After successful transactions, components trigger refresh of both loan data and contract statistics.

## Loan App Specific Features

**Instant Loan Approval**:
- `requestLoan()` method immediately approves and transfers funds to borrower
- No waiting period or manual approval process
- Users receive MON tokens instantly upon transaction confirmation

**Single Active Loan Policy**:
- Users can only have one active loan at a time
- Must repay current loan before requesting a new one
- Contract enforces this via `hasNoActiveLoan` modifier

**Loan Management**:
- Automatic overdue detection based on `maxPaymentDate`
- Visual indicators for loan status (Active, Overdue, Paid, Defaulted)
- Flexible repayment terms (1-30 days, up to 10 MON)

**UI/UX Patterns**:
- Instant feedback for all loan operations
- Status-based conditional rendering
- Overdue warnings with countdown timers
- Disabled states for invalid operations

## Kiosk Mode Security System

The app implements a comprehensive kiosk mode system that locks the device when loans become overdue or defaulted, ensuring payment compliance and device security.

### Kiosk Mode Architecture

**Core Components**:
- `contexts/KioskContext.tsx` - Global state management for kiosk mode
- `hooks/useKioskMode.ts` - Android kiosk control hook using expo-kiosk-control
- `components/KioskModeScreen.tsx` - Full-screen locked interface

**Activation Triggers**:
- **Status 1 (OVERDUE)** - Loan payment is past due date
- **Status 3 (DEFAULTED)** - Loan has been marked as defaulted

**Deactivation Conditions**:
- **Status 0 (ACTIVE)** - Loan is current and in good standing
- **Status 2 (PAID)** - Loan has been successfully repaid

### Kiosk Mode Implementation

**Android Configuration** (`app.json`):
```json
{
  "android": {
    "permissions": [
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.BIND_DEVICE_ADMIN"
    ]
  }
}
```

**Monitoring System**:
- Continuous loan status monitoring every 30 seconds
- Automatic kiosk mode activation when loan becomes overdue/defaulted
- Real-time blockchain state synchronization

**Security Features**:
- Hardware button blocking (back, recent, home buttons)
- Automatic re-activation if user attempts to exit kiosk mode
- App state listeners to maintain lock state
- Platform-specific implementation (Android only, iOS shows appropriate messaging)

### Kiosk Mode User Experience

**Visual Design**:
- **OVERDUE Mode**: Orange theme (#ff9800) with clock icon ⏰
- **DEFAULTED Mode**: Dark red theme (#d32f2f) with blocked icon 🚫
- **Locked Screen**: Full-screen overlay with payment instructions

**Payment Flow from Kiosk Mode**:
1. User attempts payment from locked screen
2. Multiple payment strategies attempted:
   - Direct payment to contract
   - Status update to overdue → payment (for defaulted loans)
3. Comprehensive error handling with user-friendly messages
4. Automatic unlock after successful payment confirmation

**Auto-Unlock System**:
- Multi-layer unlock mechanism after successful payment
- Immediate status checking (every 1 second for 15 seconds)
- Force disable kiosk mode after 3 seconds regardless of blockchain confirmation
- Context-level auto-disable when loan status changes to PAID (2)
- Fallback mechanisms ensure device unlocks even if one system fails

### Kiosk Mode State Management

**Context Pattern** (`KioskContext`):
```typescript
interface KioskContextType {
  isKioskModeActive: boolean;
  defaultedLoan: LoanData | null;
  checkLoanStatus: () => Promise<void>;
  handlePaymentAttempt: () => void;
}
```

**Hook Pattern** (`useKioskMode`):
```typescript
const useKioskMode = () => {
  const { isKioskEnabled, enableKioskMode, disableKioskMode, isLoading } = useKioskMode();
  // Returns kiosk control functions and state
}
```

### Integration with Main App

**Root Layout Integration** (`app/_layout.tsx`):
- KioskProvider wraps the entire app
- Conditional rendering: KioskModeScreen vs normal app interface
- Automatic detection and switching between modes

**Loan System Integration**:
- LoanItem components show appropriate status indicators
- Payment functions handle both normal and kiosk mode scenarios
- Comprehensive error handling for payment failures

### Development & Testing

**Production Configuration**:
- All admin/testing tools removed from production build
- Clean user interface without debug controls
- Professional loan management experience

**Error Handling**:
- Network timeout protection (15-second timeout on blockchain calls)
- Insufficient funds detection and user messaging
- Contract interaction failure recovery
- Transaction rejection handling

### Security Considerations

**Payment Security**:
- All contract interactions verify Monad Testnet (Chain ID: 10143)
- Proper gas estimation and fee handling
- Transaction confirmation before kiosk mode disable

**Kiosk Mode Security**:
- Automatic re-activation if unpinned
- Hardware button interception
- Emergency contact functionality
- Platform-specific permissions and controls