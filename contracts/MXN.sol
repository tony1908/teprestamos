// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MyToken
/// @notice Standard ERC20 with owner-controlled minting and optional user burning.
contract MyToken is ERC20, ERC20Burnable, Ownable {
    /// @param name_ Token name (e.g., "Kontigo Token")
    /// @param symbol_ Token symbol (e.g., "KTG")
    /// @param initialSupply Initial supply in smallest units (decimals = 18)
    /// @param initialOwner Address that receives initialSupply and becomes owner
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }

    /// @notice Mint new tokens (owner only)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
