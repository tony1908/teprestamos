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
- **Onboarding flow**: Complete wallet + Palenca setup before accessing main app
- **Component hierarchy**: 
  - Root layout (`app/_layout.tsx`) configures Wagmi, AppKit, OnboardingProvider, KioskProvider, and theme providers
  - Onboarding gate controls access to main app based on completion status
  - Tab layout (`app/(tabs)/_layout.tsx`) defines tab navigation
  - Loan functionality in `components/loan/`
  - Onboarding system in `components/onboarding/`, `contexts/OnboardingContext.tsx`
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
- `react-native-webview` - Palenca integration
- `@react-native-async-storage/async-storage` - Onboarding state persistence
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
- **Modern Minimalist Design**: Clean white background with professional card layouts
- **Status Icons**: Large circular containers with semantic color coding (error/warning)
- **OVERDUE Mode**: Warning orange status icon (#F59E0B) with clock icon ⏰
- **DEFAULTED Mode**: Error red status icon (#EF4444) with blocked icon 🚫
- **Responsive Amount Display**: Dynamic font sizing based on loan amount length
- **Professional Cards**: Clean information hierarchy with proper spacing and shadows

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

## Onboarding Flow System

The app implements a comprehensive two-step onboarding flow that ensures users complete wallet connection and Palenca bank account linking before accessing the lending platform.

### Onboarding Architecture

**Core Components**:
- `contexts/OnboardingContext.tsx` - Global state management for onboarding completion status
- `components/onboarding/OnboardingFlow.tsx` - Main flow component managing two-step process
- `components/onboarding/PalencaConnect.tsx` - Palenca WebView integration component

**Flow Steps**:
1. **Step 1: Wallet Connection** - User connects crypto wallet via AppKit
2. **Step 2: Palenca Integration** - User links bank account via Palenca WebView widget

### Onboarding Implementation

**State Management** (`OnboardingContext`):
```typescript
interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}
```

**Persistence**: Uses AsyncStorage to remember completion status:
- `onboarding_completed` - Overall onboarding completion flag
- `palenca_connected` - Palenca connection status flag

**Root Layout Integration** (`app/_layout.tsx`):
- OnboardingProvider wraps entire app at root level
- OnboardingGate component controls access based on completion status
- Conditional rendering: Onboarding flow → Main app (with KioskProvider)
- **Automatic Reset**: Onboarding automatically resets when wallet disconnects (useEffect monitors `isConnected` state)

### Palenca Integration

**Configuration**:
- **Widget ID**: Configurable via props (default empty string for user-specific assignment)
- **Base URL**: `https://connect.palenca.com`
- **Primary Color**: `#ea4c89` (pink theme matching Te Prestamos branding)

**Event Handling** (based on Palenca v2 docs):
```typescript
const handleEvent = (event: any) => {
  const eventData = JSON.parse(event.nativeEvent.data);
  
  switch (eventData.signal) {
    case 'ready':              // Widget initialized
    case 'user_created':       // User creation - DON'T trigger onSuccess yet
    case 'connection_success': // Bank connection successful → onSuccess()
    case 'connection_error':   // Connection failed → onError()
  }
};
```

**Critical Event Flow Fix**:
- **Previous Issue**: `onSuccess()` was called on `user_created` event (when user just entered email/phone)
- **Current Fix**: Only `connection_success` triggers `onSuccess()` - ensures full authentication completion
- **Result**: Users must complete password/OTP verification before onboarding proceeds

**WebView Implementation**:
- Optimized height with `maxHeight: 500px` to reduce scrolling while maintaining accessibility
- Compact header design with reduced padding and font sizes
- Proper event parsing according to Palenca envelope structure
- Error handling with retry/skip options
- Console logging for debugging connection flow

### Onboarding User Experience

**Visual Design**:
- **Step 1**: Updated LoginScreen with "Step 1: Connect your wallet to continue"
- **Step 2**: Full-screen Palenca WebView with header explaining bank account linking
- **Completion**: Success screen with celebration before redirecting to main app

**Flow Logic**:
- Automatic progression from Step 1 to Step 2 when wallet connects
- State persistence prevents re-showing completed onboarding
- Comprehensive error handling with user-friendly messages
- 2-second delay on completion screen for better UX

### Development & Testing

**Automatic Reset Functionality**:
- Onboarding automatically resets when user disconnects wallet via AppKit button
- Clears both `onboarding_completed` and `palenca_connected` AsyncStorage keys immediately
- User is redirected to login screen and must complete both wallet connection and Palenca setup again
- No manual reset button needed - logout triggers automatic onboarding reset

**Error Handling**:
- Network timeout protection for Palenca widget loading
- Fallback Alert for unparseable Palenca events
- AsyncStorage error recovery with graceful degradation
- Comprehensive console logging for debugging

**Integration Notes**:
- Onboarding gate runs before KioskProvider initialization
- Maintains all existing kiosk mode functionality after onboarding
- LoginScreen updated with Te Prestamos branding and step indicators
- Profile screen simplified - removed manual reset button in favor of automatic reset on logout
- Seamless integration with wallet disconnect events for automatic onboarding reset

### Security Considerations

**Data Privacy**:
- No sensitive Palenca data stored locally beyond connection status flag
- WebView events properly validated and parsed
- AsyncStorage used only for completion tracking, not user data

**Flow Security**:
- Onboarding completion required before accessing lending features
- Proper wallet connection validation before Palenca step
- Error boundaries prevent broken states during onboarding process

## UI/UX Design System

The app features a modern, minimalist fintech design system optimized for professional lending applications.

### Design Philosophy

**Minimalist & Professional**: Clean interfaces with ample white space, subtle shadows, and professional typography that builds trust with users.

**Fintech-Oriented**: Color scheme and visual hierarchy designed specifically for financial applications, emphasizing security and reliability.

**Mobile-First**: Responsive design patterns that work seamlessly across different screen sizes and Android device variations.

### Color Palette

**Primary Colors**:
- Primary Blue: `#2563EB` (main brand color)
- Primary Blue Light: `#3B82F6` 
- Primary Blue Dark: `#1D4ED8`

**Semantic Colors**:
- Success Green: `#10B981`
- Warning Orange: `#F59E0B`
- Error Red: `#EF4444`

**Neutral Colors**:
- Text Primary: `#111827`
- Text Secondary: `#6B7280`
- Background: `#FFFFFF`
- Background Secondary: `#F9FAFB`
- Border: `#E5E7EB`
- Card: `#FFFFFF`

### Typography System

**Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Hierarchy**:
- Large Title: 32px, weight 700
- Title: 28px, weight 700
- Subtitle: 24px, weight 600
- Body Large: 18px, weight 500
- Body: 16px, weight 400
- Body Small: 14px, weight 500
- Caption: 12px, weight 500

### Component Design Patterns

**Cards**: Rounded corners (16px), subtle shadows, consistent padding (20-24px)

**Buttons**: 
- Primary: Blue background, white text, 16px border radius
- Secondary: White background, colored border, 12px border radius
- Minimum height: 48px for accessibility

**Form Elements**: Clean inputs with proper focus states and validation styling

**Status Indicators**: Color-coded badges with appropriate icons and backgrounds

### Screen-Specific Design

**Login/Onboarding**:
- Centered layouts with progressive disclosure
- Step indicators and progress bars
- Feature cards with icons and descriptions
- Professional branding elements

**Loan Management**:
- Dashboard-style stats cards
- Clean loan item cards with status badges
- Prominent action buttons
- Clear visual hierarchy for amounts and dates

**Kiosk Mode (Device Lock)**:
- Minimalist design focused on essential information
- Large, readable amount displays with responsive font sizing
- Status icons with semantic colors
- Clean card layouts with payment actions

**Dynamic Amount Display**: Font size automatically adjusts based on number length:
- Small numbers (≤4 digits): 48px
- Medium numbers (5-6 digits): 40px  
- Large numbers (7-8 digits): 32px
- Very large numbers (9+ digits): 24px

### Android-Specific Optimizations

**Safe Area Handling**: Proper use of SafeAreaProvider for status bar and navigation areas

**Tab Bar**: Enhanced styling with proper elevation, shadows, and height adjustments to prevent cut-off issues

**Status Bar**: Dark content on light backgrounds for better readability

**Touch Targets**: Minimum 48px height for all interactive elements

### Accessibility Features

**Color Contrast**: All text meets WCAG 2.1 AA standards
**Touch Targets**: Minimum 48px for all buttons and interactive elements
**Typography**: Clear hierarchy with appropriate font sizes and weights
**Status Communication**: Icons combined with text for better comprehension

### Development Guidelines

**Component Consistency**: Use the centralized Colors constant and established patterns
**Responsive Design**: Font sizes and layouts adapt to content length and screen size  
**Performance**: Optimized shadows and animations for smooth 60fps experience
**Maintainability**: Clean separation of styling concerns with StyleSheet objects