// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract ERC20LoanContract {
    
    enum LoanStatus { ACTIVE, OVERDUE, PAID, DEFAULTED }
    
    struct Loan {
        uint256 amount;
        uint256 maxPaymentDate;
        LoanStatus status;
        uint256 createdAt;
        bool exists;
    }
    
    address public owner;
    IERC20 public loanToken; // The ERC20 token used for loans
    mapping(address => Loan) public loans;
    
    event LoanRequested(address indexed borrower, uint256 amount, uint256 maxPaymentDate);
    event LoanApproved(address indexed borrower, uint256 amount);
    event LoanStatusUpdated(address indexed borrower, LoanStatus newStatus);
    event LoanRepaid(address indexed borrower, uint256 amount, uint256 remainingBalance);
    event TokensWithdrawn(address indexed owner, uint256 amount);
    event TokenContractUpdated(address indexed newToken);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier hasNoActiveLoan(address borrower) {
        require(!loans[borrower].exists || 
                loans[borrower].status == LoanStatus.PAID || 
                loans[borrower].status == LoanStatus.DEFAULTED, 
                "User has an active loan");
        _;
    }
    
    modifier hasActiveLoan(address borrower) {
        require(loans[borrower].exists && 
                (loans[borrower].status == LoanStatus.ACTIVE || 
                 loans[borrower].status == LoanStatus.OVERDUE), 
                "No active loan found");
        _;
    }
    
    constructor(address _tokenAddress) {
        owner = msg.sender;
        loanToken = IERC20(_tokenAddress);
    }
    
    // Function to request a loan
    function requestLoan(uint256 _amount, uint256 _maxPaymentDate) 
        external 
        hasNoActiveLoan(msg.sender) 
    {
        require(_amount > 0, "Loan amount must be greater than 0");
        require(_maxPaymentDate > block.timestamp, "Payment date must be in the future");
        require(loanToken.balanceOf(address(this)) >= _amount, "Insufficient contract balance");
        
        // Create new loan
        loans[msg.sender] = Loan({
            amount: _amount,
            maxPaymentDate: _maxPaymentDate,
            status: LoanStatus.ACTIVE,
            createdAt: block.timestamp,
            exists: true
        });
        
        // Transfer ERC20 tokens to borrower
        require(loanToken.transfer(msg.sender, _amount), "Token transfer failed");
        
        emit LoanRequested(msg.sender, _amount, _maxPaymentDate);
        emit LoanApproved(msg.sender, _amount);
    }
    
    // Function to get active loan details for a user
    function getActiveLoan(address _borrower) 
        external 
        view 
        returns (
            uint256 amount,
            uint256 maxPaymentDate,
            LoanStatus status,
            uint256 createdAt,
            bool isOverdue
        ) 
    {
        require(loans[_borrower].exists, "No loan found for this address");
        
        Loan memory loan = loans[_borrower];
        bool overdue = (loan.status == LoanStatus.ACTIVE && block.timestamp > loan.maxPaymentDate);
        
        return (
            loan.amount,
            loan.maxPaymentDate,
            loan.status,
            loan.createdAt,
            overdue
        );
    }
    
    // Owner-only function to update loan status
    function updateLoanStatus(address _borrower, LoanStatus _newStatus) 
        external 
        onlyOwner 
    {
        require(loans[_borrower].exists, "No loan found for this address");
        require(_newStatus != loans[_borrower].status, "Status is already set to this value");
        
        loans[_borrower].status = _newStatus;
        
        emit LoanStatusUpdated(_borrower, _newStatus);
    }
    
    // Function for users to pay back their loan
    function payBackLoan(uint256 _amount) 
        external 
        hasActiveLoan(msg.sender) 
    {
        require(_amount > 0, "Payment amount must be greater than 0");
        
        Loan storage loan = loans[msg.sender];
        require(_amount <= loan.amount, "Payment exceeds loan amount");
        
        // Transfer tokens from borrower to contract
        require(loanToken.transferFrom(msg.sender, address(this), _amount), 
                "Token transfer failed - check allowance");
        
        // Update loan amount
        loan.amount -= _amount;
        
        // If loan is fully paid, mark as PAID
        if (loan.amount == 0) {
            loan.status = LoanStatus.PAID;
        }
        
        emit LoanRepaid(msg.sender, _amount, loan.amount);
    }
    
    // Owner function to deposit tokens to the contract
    function fundContract(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Funding amount must be greater than 0");
        require(loanToken.transferFrom(msg.sender, address(this), _amount), 
                "Token transfer failed - check allowance");
    }
    
    // Owner function to withdraw tokens from contract
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(_amount <= loanToken.balanceOf(address(this)), "Insufficient contract balance");
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        
        require(loanToken.transfer(owner, _amount), "Token transfer failed");
        
        emit TokensWithdrawn(owner, _amount);
    }
    
    // Function to check contract token balance
    function getContractBalance() external view returns (uint256) {
        return loanToken.balanceOf(address(this));
    }
    
    // Function to get the token contract address
    function getTokenAddress() external view returns (address) {
        return address(loanToken);
    }
    
    // Function to get token allowance for a user
    function getUserAllowance(address _user) external view returns (uint256) {
        return loanToken.allowance(_user, address(this));
    }
    
    // Function to get user's token balance
    function getUserTokenBalance(address _user) external view returns (uint256) {
        return loanToken.balanceOf(_user);
    }
    
    // Function to check if user has active loan
    function hasActiveLoanStatus(address _borrower) external view returns (bool) {
        return loans[_borrower].exists && 
               (loans[_borrower].status == LoanStatus.ACTIVE || 
                loans[_borrower].status == LoanStatus.OVERDUE);
    }
    
    // Function to check if loan is overdue
    function isLoanOverdue(address _borrower) external view returns (bool) {
        if (!loans[_borrower].exists) return false;
        
        Loan memory loan = loans[_borrower];
        return (loan.status == LoanStatus.ACTIVE && block.timestamp > loan.maxPaymentDate);
    }
    
    // Owner function to change the loan token (if needed)
    function updateTokenContract(address _newTokenAddress) external onlyOwner {
        require(_newTokenAddress != address(0), "Token address cannot be zero");
        loanToken = IERC20(_newTokenAddress);
        emit TokenContractUpdated(_newTokenAddress);
    }
    
    // Emergency function to change owner
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    // Function to approve tokens for loan repayment (helper function)
    function getApprovalCalldata(uint256 _amount) external view returns (bytes memory) {
        return abi.encodeWithSignature("approve(address,uint256)", address(this), _amount);
    }
}