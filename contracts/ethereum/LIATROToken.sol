// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title LIATROToken
 * @dev Référence ETH — 500k cap, 18 decimals. MVX ESDT reste TRO-94c925 (6 decimals).
 */
contract LIATROToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant MAX_SUPPLY = 500_000 * 10 ** 18;

    event SupplyCapReached(uint256 totalReached);

    constructor() ERC20("LIA Token", "TRO") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "LIA: Supply Cap Reached");
        _mint(to, amount);
        if (totalSupply() == MAX_SUPPLY) {
            emit SupplyCapReached(totalSupply());
        }
    }
}
