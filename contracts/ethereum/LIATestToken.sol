// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LIATestToken
 * @dev Test token pour valider intégration build v2.9.3-trinity (Sepolia / local).
 * Ne pas utiliser en mainnet prod.
 */
contract LIATestToken is ERC20, Ownable {
    constructor() ERC20("LIA Test Token", "LIA_TEST") Ownable(msg.sender) {
        _mint(msg.sender, 10000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
